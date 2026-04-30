import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GovBidBot — AI Government Bid Preparation Assistant",
  description:
    "Analyze government bid solicitations instantly. Get timelines, required documents, action items, and win strategies powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
