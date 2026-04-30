"use client";

import { useState } from "react";
import InputForm from "@/components/InputForm";
import BidSummary from "@/components/BidSummary";
import Timeline from "@/components/Timeline";
import ActionItems from "@/components/ActionItems";
import DocumentChecklist from "@/components/DocumentChecklist";
import BidStrategy from "@/components/BidStrategy";
import { BidAnalysis, AnalyzeResponse } from "@/types/bid";
import { AlertCircle, AlertTriangle, Bot, ArrowLeft, Download } from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<BidAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [truncationInfo, setTruncationInfo] = useState<{
    pagesAnalyzed?: number;
    totalPages?: number;
  } | null>(null);

  const handleAnalyze = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setTruncationInfo(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data: AnalyzeResponse = await response.json();

      if (!data.success || !data.analysis) {
        setError(data.error || "Analysis failed. Please try again.");
      } else {
        setAnalysis(data.analysis);
        if (data.contentTruncated) {
          setTruncationInfo({
            pagesAnalyzed: data.pagesAnalyzed,
            totalPages: data.totalPages,
          });
        }
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
    setTruncationInfo(null);
  };

  const handleExport = () => {
    if (!analysis) return;
    const content = generateMarkdown(analysis);
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Use the title as fallback when the solicitation number is a placeholder
    const PLACEHOLDER_VALUES = ["See document", "Not specified", "N/A"];
    const fileId = PLACEHOLDER_VALUES.includes(analysis.solicitationNumber)
      ? analysis.title
      : analysis.solicitationNumber;
    a.download = `bid-analysis-${fileId.replace(/[^a-zA-Z0-9]/g, "-")}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">GovBidBot</h1>
              <p className="text-xs text-gray-500 leading-none mt-0.5">AI-powered bid preparation assistant</p>
            </div>
          </div>

          {analysis && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={14} />
                Export
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <ArrowLeft size={14} />
                New Analysis
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!analysis ? (
          /* Input State */
          <div className="max-w-2xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Bot size={12} />
                AI-Powered Government Bid Analyzer
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
                Win Government Contracts
                <span className="text-blue-600 block">Faster & Smarter</span>
              </h2>
              <p className="text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
                Paste a bid solicitation URL or upload a PDF — we&apos;ll instantly generate a 
                complete bid preparation guide with timelines, required documents, and action items.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {[
                "📅 Key Dates & Deadlines",
                "✅ Document Checklist",
                "🎯 Action Items",
                "💡 Win Strategy",
                "🔍 Bid Analysis",
              ].map((feature) => (
                <span
                  key={feature}
                  className="text-xs text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Input Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              {error && (
                <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <InputForm onAnalyze={handleAnalyze} isLoading={isLoading} />
            </div>

            {/* Supported sites */}
            <p className="text-center text-xs text-gray-400 mt-5">
              Works with Florida Marketplace, SAM.gov, USASpending.gov, FedBizOpps, and more
            </p>
          </div>
        ) : (
          /* Results State */
          <div>
            {/* Truncation warning banner */}
            {truncationInfo && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Large document — partial analysis.</span>{" "}
                  {truncationInfo.totalPages && truncationInfo.pagesAnalyzed ? (
                    <>
                      This PDF is {truncationInfo.totalPages} pages; only the first{" "}
                      {truncationInfo.pagesAnalyzed} pages were analyzed. Key information in
                      later sections (such as attachments or detailed specifications) may not
                      be reflected in the results below.
                    </>
                  ) : (
                    <>
                      This document is too large to analyze in full. Key information in later
                      sections may not be reflected in the results below.
                    </>
                  )}{" "}
                  Consider uploading the most relevant section of the solicitation separately
                  for a more complete analysis.
                </p>
              </div>
            )}
            {/* Summary banner */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Bid Analysis Complete</p>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">{analysis.title}</h2>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-6">
                <BidSummary analysis={analysis} />
                <ActionItems actionItems={analysis.actionItems} />
                <BidStrategy analysis={analysis} />
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <Timeline keyDates={analysis.keyDates} />
                <DocumentChecklist documents={analysis.requiredDocuments} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 pb-8 text-center">
        <p className="text-xs text-gray-400">
          GovBidBot — AI-powered government bid preparation assistant
        </p>
      </footer>
    </div>
  );
}

function generateMarkdown(analysis: BidAnalysis): string {
  const lines: string[] = [
    `# ${analysis.title}`,
    ``,
    `**Solicitation #:** ${analysis.solicitationNumber}`,
    `**Agency:** ${analysis.agency}`,
    `**Type:** ${analysis.bidType}`,
    `**Status:** ${analysis.status}`,
    analysis.estimatedValue ? `**Estimated Value:** ${analysis.estimatedValue}` : "",
    ``,
    `## Description`,
    analysis.description,
    ``,
    `## Scope of Work`,
    analysis.scopeOfWork,
    ``,
    `## Key Dates`,
    ...analysis.keyDates.map((d) => `- **${d.label}:** ${d.date}`),
    ``,
    `## Action Items`,
    ...analysis.actionItems.map((a, i) => `${i + 1}. **[${a.priority.toUpperCase()}]** ${a.title}${a.deadline ? ` *(${a.deadline})*` : ""}\n   ${a.description}`),
    ``,
    `## Required Documents`,
    ...analysis.requiredDocuments.map((d) => `- [${d.required ? "x" : " "}] ${d.name}${d.description ? ` — ${d.description}` : ""}`),
    ``,
    `## Evaluation Criteria`,
    ...analysis.evaluationCriteria.map((c, i) => `${i + 1}. ${c}`),
    ``,
    `## Recommended Approach`,
    analysis.recommendedApproach,
    ``,
    `---`,
    `*Generated by GovBidBot*`,
  ];

  return lines.filter((l) => l != null && l.length > 0).join("\n");
}
