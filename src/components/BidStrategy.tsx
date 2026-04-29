"use client";

import { BidAnalysis } from "@/types/bid";
import { Lightbulb, Target, Star } from "lucide-react";

interface BidStrategyProps {
  analysis: BidAnalysis;
}

export default function BidStrategy({ analysis }: BidStrategyProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <Lightbulb size={18} className="text-blue-600" />
          Bid Strategy & Analysis
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Expert recommendations for winning this bid</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Evaluation Criteria */}
        {analysis.evaluationCriteria && analysis.evaluationCriteria.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Target size={13} />
              Evaluation Criteria
            </h3>
            <div className="space-y-2">
              {analysis.evaluationCriteria.map((criterion, index) => (
                <div key={index} className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-snug">{criterion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Approach */}
        {analysis.recommendedApproach && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Star size={13} />
              Recommended Approach
            </h3>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {analysis.recommendedApproach}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
