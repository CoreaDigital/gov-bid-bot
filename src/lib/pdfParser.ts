import path from "path";
import { pathToFileURL } from "url";

export interface ParsedPdfData {
  text: string;
  numPages: number;
  info?: Record<string, unknown>;
}

export async function parsePdf(buffer: Buffer): Promise<ParsedPdfData> {
  // Dynamically import pdfjs-dist in a way compatible with Next.js server components
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // pdfjs-dist v4+ throws when workerSrc is empty. Point it at the bundled worker
  // file. pathToFileURL handles Windows backslash separators correctly.
  const workerPath = path.join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

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
