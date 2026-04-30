import { pathToFileURL } from "url";

// Extracting more than this many pages wastes time and memory: the AI prompt
// window is 15k characters (~5-7 dense pages).  75 pages covers virtually all
// standard bid solicitation bodies while keeping parse time reasonable.
const MAX_PAGES_TO_EXTRACT = 75;

export interface ParsedPdfData {
  text: string;
  /** Total number of pages in the PDF document. */
  numPages: number;
  /** Number of pages that were actually extracted (≤ numPages). */
  extractedPages: number;
  /** True when the document has more pages than MAX_PAGES_TO_EXTRACT. */
  truncated: boolean;
  info?: Record<string, unknown>;
}

// Cache the imported module so subsequent calls within the same process skip
// the dynamic-import resolution overhead.
let pdfjsCache: typeof import("pdfjs-dist/legacy/build/pdf.mjs") | null = null;

async function getPdfjsLib() {
  if (pdfjsCache) return pdfjsCache;

  const lib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // pdfjs-dist v4+ throws when workerSrc is empty. Resolve the worker path via
  // require.resolve so it works in any deployment regardless of process.cwd().
  const workerPath: string = require.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  lib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  pdfjsCache = lib;
  return lib;
}

export async function parsePdf(buffer: Buffer): Promise<ParsedPdfData> {
  const pdfjsLib = await getPdfjsLib();

  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true });
  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;
  const extractedPages = Math.min(numPages, MAX_PAGES_TO_EXTRACT);
  const truncated = extractedPages < numPages;

  if (truncated) {
    console.warn(
      `[pdfParser] PDF has ${numPages} pages; extracting first ${extractedPages} to stay within limits`
    );
  }

  const textParts: string[] = [];

  for (let i = 1; i <= extractedPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str)
      .join(" ");
    textParts.push(pageText);
  }

  const text = textParts.join("\n").replace(/\s+/g, " ").trim();

  return { text, numPages, extractedPages, truncated };
}
