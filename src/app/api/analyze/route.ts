import { NextRequest, NextResponse } from "next/server";
import { scrapeBidUrl } from "@/lib/scraper";
import { parsePdf } from "@/lib/pdfParser";
import { analyzeBidContent, analyzeBidContentFallback, getAIProvider } from "@/lib/aiAnalyzer";
import { AnalyzeResponse } from "@/types/bid";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const url = formData.get("url") as string | null;
    const pdfFile = formData.get("pdf") as File | null;

    if (!url && !pdfFile) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: "Please provide a bid URL or upload a PDF document." },
        { status: 400 }
      );
    }

    let combinedContent = "";

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
        console.error("Scraping error:", scrapeError);
        combinedContent += `Note: Could not fully scrape the URL. URL: ${url}\n\n`;
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

    return NextResponse.json<AnalyzeResponse>({ success: true, analysis });
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
