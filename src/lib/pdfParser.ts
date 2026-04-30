import { pathToFileURL } from "url";

export interface ParsedPdfData {
  text: string;
  numPages: number;
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
  const textParts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str)
      .join(" ");
    textParts.push(pageText);
  }

  const text = textParts.join("\n").replace(/\s+/g, " ").trim();

  return { text, numPages };
}
