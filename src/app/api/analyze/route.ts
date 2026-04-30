import { NextRequest, NextResponse } from "next/server";
import { scrapeBidUrl } from "@/lib/scraper";
import { parsePdf } from "@/lib/pdfParser";
import { analyzeBidContent, analyzeBidContentFallback, getAIProvider, CONTENT_TRUNCATION_LIMIT } from "@/lib/aiAnalyzer";
import { AnalyzeResponse } from "@/types/bid";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (10 requests per IP per minute).
// Not suitable for multi-instance deployments but provides a basic safeguard.
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const url = formData.get("url") as string | null;
    const pdfFile = formData.get("pdf") as File | null;

    if (!url && !pdfFile) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: "Please provide a bid URL or upload a PDF document." },
        { status: 400 }
      );
    }

    // PDF size guard
    if (pdfFile && pdfFile.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: "PDF file is too large. Maximum allowed size is 20 MB." },
        { status: 413 }
      );
    }

    let combinedContent = "";
    let contentTruncated = false;
    let pagesAnalyzed: number | undefined;
    let totalPages: number | undefined;

    // Scrape URL if provided
    if (url) {
      try {
        const scraped = await scrapeBidUrl(url);
        combinedContent += `=== BID SOLICITATION FROM URL: ${url} ===\n\n`;
        if (scraped.title) combinedContent += `Title: ${scraped.title}\n`;
        if (scraped.solicitationNumber) combinedContent += `Solicitation Number: ${scraped.solicitationNumber}\n`;
        if (scraped.agency) combinedContent += `Agency: ${scraped.agency}\n`;
        if (scraped.status) combinedContent += `Status: ${scraped.status}\n`;
        if (scraped.description) combinedContent += `Description: ${scraped.description}\n`;
        if (scraped.dates) {
          combinedContent += `\nDates:\n`;
          for (const [key, value] of Object.entries(scraped.dates)) {
            combinedContent += `  ${key}: ${value}\n`;
          }
        }
        if (scraped.contact) {
          combinedContent += `\nContact:\n`;
          for (const [key, value] of Object.entries(scraped.contact)) {
            combinedContent += `  ${key}: ${value}\n`;
          }
        }
        combinedContent += `\nFull Content:\n${scraped.rawText}\n\n`;
      } catch (scrapeError) {
        if (scrapeError instanceof Error && scrapeError.message === "URL_IS_PDF") {
          // The URL points directly to a PDF file — download and parse it
          try {
            const pdfResponse = await fetch(url, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            });
            if (!pdfResponse.ok) {
              throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
            }
            const arrayBuffer = await pdfResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const parsed = await parsePdf(buffer);
            combinedContent += `=== BID DOCUMENT FROM URL: ${url} ===\n\n`;
            combinedContent += `Pages: ${parsed.numPages}\n\n`;
            combinedContent += parsed.text;
            combinedContent += "\n\n";
            if (parsed.truncated) {
              contentTruncated = true;
              pagesAnalyzed = parsed.extractedPages;
              totalPages = parsed.numPages;
            }
          } catch (pdfError) {
            console.error("PDF URL parsing error:", pdfError);
            combinedContent += `Note: Could not parse PDF from URL: ${url}\n\n`;
          }
        } else {
          console.error("Scraping error:", scrapeError);
          combinedContent += `Note: Could not fully scrape the URL. URL: ${url}\n\n`;
        }
      }
    }

    // Parse PDF if provided
    if (pdfFile) {
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parsed = await parsePdf(buffer);
        combinedContent += `=== BID DOCUMENT FROM PDF: ${pdfFile.name} ===\n\n`;
        combinedContent += `Pages: ${parsed.numPages}\n\n`;
        combinedContent += parsed.text;
        combinedContent += "\n\n";
        if (parsed.truncated) {
          contentTruncated = true;
          pagesAnalyzed = parsed.extractedPages;
          totalPages = parsed.numPages;
        }
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        combinedContent += `Note: Could not parse PDF file: ${pdfFile.name}\n\n`;
      }
    }

    if (!combinedContent.trim()) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: "Could not extract any content from the provided URL or PDF." },
        { status: 422 }
      );
    }

    // Run AI analysis
    let analysis;
    const provider = getAIProvider();
    if (provider !== "fallback") {
      try {
        analysis = await analyzeBidContent(combinedContent);
      } catch (aiError) {
        console.error(`AI analysis error (${provider}):`, aiError);
        // Fall back to basic analysis if AI provider fails
        analysis = await analyzeBidContentFallback(combinedContent);
      }
    } else {
      // No AI key configured — use regex-based fallback
      analysis = await analyzeBidContentFallback(combinedContent);
    }

    analysis.rawContent = url || undefined;

    // Also flag truncation when the AI prompt window clips content that fit
    // within the page limit (e.g. very dense pages)
    if (!contentTruncated && combinedContent.length > CONTENT_TRUNCATION_LIMIT) {
      contentTruncated = true;
    }

    return NextResponse.json<AnalyzeResponse>({
      success: true,
      analysis,
      ...(contentTruncated && {
        contentTruncated: true,
        ...(pagesAnalyzed !== undefined && { pagesAnalyzed }),
        ...(totalPages !== undefined && { totalPages }),
      }),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json<AnalyzeResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
