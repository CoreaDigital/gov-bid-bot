import * as cheerio from "cheerio";

const RAW_TEXT_LIMIT = 50000;

// PDF magic bytes: %PDF-
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d];

export interface ScrapedBidData {
  title?: string;
  solicitationNumber?: string;
  agency?: string;
  status?: string;
  bidType?: string;
  description?: string;
  dates?: Record<string, string>;
  contact?: Record<string, string>;
  rawText: string;
}

// ---------------------------------------------------------------------------
// SSRF protection – validate that the URL is a safe public endpoint
// ---------------------------------------------------------------------------
function validateUrl(rawUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block well-known internal hostnames
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname)) {
    throw new Error("Access to internal resources is not allowed");
  }

  // Block AWS/GCP/Azure metadata endpoints and link-local addresses
  if (hostname === "169.254.169.254" || hostname.startsWith("169.254.")) {
    throw new Error("Access to internal resources is not allowed");
  }

  // Block private IPv4 ranges
  const privateRanges = [
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
    /^192\.168\.\d{1,3}\.\d{1,3}$/,
  ];
  if (privateRanges.some((re) => re.test(hostname))) {
    throw new Error("Access to internal resources is not allowed");
  }
}

export async function scrapeBidUrl(url: string): Promise<ScrapedBidData> {
  validateUrl(url);

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  // Buffer the body once so we can inspect both bytes and text
  const bodyBuffer = await response.arrayBuffer();
  const bodyBytes = new Uint8Array(bodyBuffer);

  // Detect PDF by Content-Type header OR by magic bytes (%PDF-)
  const contentType = response.headers.get("content-type") || "";
  const hasPdfContentType = contentType.includes("application/pdf");
  const hasPdfMagic =
    bodyBytes.length >= PDF_MAGIC.length &&
    PDF_MAGIC.every((byte, i) => bodyBytes[i] === byte);

  if (hasPdfContentType || hasPdfMagic) {
    throw new Error("URL_IS_PDF");
  }

  const html = new TextDecoder().decode(bodyBuffer);
  const $ = cheerio.load(html);

  // Remove script and style tags for cleaner text
  $("script, style, nav, footer, header").remove();

  // Cap rawText to avoid unbounded memory usage
  const fullRawText = $("body").text().replace(/\s+/g, " ").trim();
  if (fullRawText.length > RAW_TEXT_LIMIT) {
    console.warn(
      `[scraper] rawText truncated from ${fullRawText.length} to ${RAW_TEXT_LIMIT} characters`
    );
  }
  const rawText = fullRawText.substring(0, RAW_TEXT_LIMIT);

  // Try to extract structured data from common government bid site patterns
  const result: ScrapedBidData = { rawText };

  // Florida Marketplace specific patterns
  const titleEl =
    $("h1").first().text().trim() ||
    $('[class*="title"]').first().text().trim() ||
    $("title").text().trim();

  if (titleEl) result.title = titleEl;

  // Look for solicitation/bid number patterns
  const solNumMatch = rawText.match(
    /(?:solicitation|bid|rfp|rfq|itb|iti)\s*(?:number|no\.?|#)?\s*:?\s*([A-Z0-9-]{3,30})/i
  );
  if (solNumMatch) result.solicitationNumber = solNumMatch[1];

  // Look for agency/organization
  const agencyMatch = rawText.match(
    /(?:agency|organization|department|bureau|office)\s*:?\s*([^\n.]{5,80})/i
  );
  if (agencyMatch) result.agency = agencyMatch[1].trim();

  // Try to find dates in various formats
  const dates: Record<string, string> = {};
  const datePatterns = [
    /(?:due\s*date|submission\s*deadline|closing\s*date)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/gi,
    /(?:questions?\s*due|inquir(?:y|ies)\s*deadline)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/gi,
    /(?:pre-bid\s*(?:conference|meeting)|mandatory\s*meeting)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/gi,
  ];

  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(rawText)) !== null) {
      const label = match[0].split(/\s*:?\s*\d/)[0].trim();
      dates[label] = match[1];
    }
  }

  if (Object.keys(dates).length > 0) result.dates = dates;

  // Look for contact information
  const emailMatch = rawText.match(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  );
  const phoneMatch = rawText.match(
    /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/
  );

  if (emailMatch || phoneMatch) {
    result.contact = {};
    if (emailMatch) result.contact.email = emailMatch[1];
    if (phoneMatch) result.contact.phone = phoneMatch[1];
  }

  // Extract description from meta tags or first substantial paragraph
  const metaDesc = $('meta[name="description"]').attr("content");
  if (metaDesc) {
    result.description = metaDesc;
  } else {
    const firstPara = $("p")
      .filter((_, el) => {
        const text = $(el).text().trim();
        return text.length > 100;
      })
      .first()
      .text()
      .trim();
    if (firstPara) result.description = firstPara;
  }

  return result;
}
