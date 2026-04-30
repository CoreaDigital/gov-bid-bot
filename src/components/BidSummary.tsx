"use client";

import { BidAnalysis } from "@/types/bid";
import { Building2, Hash, Tag, User, DollarSign, Code, ExternalLink } from "lucide-react";

interface BidSummaryProps {
  analysis: BidAnalysis;
}

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
  awarded: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {status}
    </span>
  );
}

export default function BidSummary({ analysis }: BidSummaryProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">{analysis.title}</h2>
            {analysis.bidType && (
              <span className="mt-1.5 inline-block bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {analysis.bidType}
              </span>
            )}
          </div>
          <StatusBadge status={analysis.status} />
        </div>
      </div>

      <div className="p-6">
        {/* Key Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 p-1.5 bg-blue-50 rounded-lg">
              <Hash size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Solicitation #</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{analysis.solicitationNumber}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 p-1.5 bg-blue-50 rounded-lg">
              <Building2 size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Agency</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{analysis.agency}</p>
            </div>
          </div>

          {analysis.estimatedValue && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 p-1.5 bg-green-50 rounded-lg">
                <DollarSign size={14} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Estimated Value</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{analysis.estimatedValue}</p>
              </div>
            </div>
          )}

          {analysis.naicsCode && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 p-1.5 bg-purple-50 rounded-lg">
                <Code size={14} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">NAICS Code</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{analysis.naicsCode}</p>
              </div>
            </div>
          )}

          {analysis.setAsideType && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 p-1.5 bg-orange-50 rounded-lg">
                <Tag size={14} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Set-Aside</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{analysis.setAsideType}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{analysis.description}</p>
        </div>

        {/* Scope of Work */}
        {analysis.scopeOfWork && analysis.scopeOfWork !== analysis.description && (
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Scope of Work</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{analysis.scopeOfWork}</p>
          </div>
        )}

        {/* Contact Info */}
        {analysis.contactInfo && (analysis.contactInfo.name || analysis.contactInfo.email || analysis.contactInfo.phone) && (
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <span className="flex items-center gap-1.5">
                <User size={12} />
                Point of Contact
              </span>
            </h3>
            <div className="space-y-1">
              {analysis.contactInfo.name && (
                <p className="text-sm text-gray-700">{analysis.contactInfo.name}</p>
              )}
              {analysis.contactInfo.email && (
                <a
                  href={`mailto:${analysis.contactInfo.email}`}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {analysis.contactInfo.email}
                  <ExternalLink size={12} />
                </a>
              )}
              {analysis.contactInfo.phone && (
                <p className="text-sm text-gray-700">{analysis.contactInfo.phone}</p>
              )}
            </div>
          </div>
        )}

        {/* Source URL */}
        {analysis.rawContent && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href={analysis.rawContent}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} />
              View Original Solicitation
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
