# GovBidBot

AI-powered government bid preparation assistant. Paste a bid solicitation URL or upload a PDF to instantly generate a complete bid preparation guide with timelines, required documents, action items, and win strategies.

## Features

- 🔗 **URL Scraping** — Paste any government bid solicitation URL (Florida Marketplace, SAM.gov, etc.)
- 📄 **PDF Parsing** — Upload bid solicitation documents for analysis
- 📅 **Key Dates & Timeline** — All critical deadlines extracted and organized
- ✅ **Document Checklist** — Complete list of required and optional documents
- 🎯 **Action Items** — Step-by-step checklist to prepare your bid
- 💡 **Win Strategy** — AI-generated evaluation criteria breakdown and recommended approach
- 📤 **Export** — Download the full analysis as a Markdown file

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key (optional — app works without it using a basic fallback analyzer)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Add your AI API key(s) to `.env.local`:
   ```
   # Use Groq (recommended — fast, free tier):
   GROQ_API_KEY=your-groq-api-key-here

   # Or use OpenAI (used if GROQ_API_KEY is not set):
   OPENAI_API_KEY=your-openai-api-key-here
   ```
   > If neither key is set the app still works using a regex-based fallback analyzer.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Usage

1. Paste a bid solicitation URL (e.g., `https://vendor.myfloridamarketplace.com/search/bids/detail/15827`)
2. Optionally upload a PDF of the solicitation document
3. Click **Analyze Bid Solicitation**
4. Review the generated analysis and use the interactive checklists
5. Export the analysis as Markdown for offline use

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o-mini **or** Groq llama-3.3-70b-versatile
- **Web Scraping**: Cheerio
- **PDF Parsing**: pdfjs-dist (Mozilla PDF.js)
- **Icons**: Lucide React

## Deployment

Deploy to Vercel with one click — just add `OPENAI_API_KEY` as an environment variable.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
