import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  // Ensure the pdfjs worker files are included in Vercel serverless deployments.
  // The dynamic import inside getPdfjsLib() may be missed by static tracing (nft).
  outputFileTracingIncludes: {
    "/api/analyze": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ],
  },
};

export default nextConfig;
