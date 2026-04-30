import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  // Ensure the pdfjs worker file is included in Vercel serverless deployments.
  // Static analysis (nft) misses it because the path is constructed at runtime.
  outputFileTracingIncludes: {
    "/api/analyze": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ],
  },
};

export default nextConfig;
