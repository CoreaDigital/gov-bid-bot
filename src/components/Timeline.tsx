"use client";

import { BidDate } from "@/types/bid";
import { Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";

interface TimelineProps {
  keyDates: BidDate[];
}

function formatDateLabel(date: string): { date: string; time?: string } {
  // Try to split date and time
  const parts = date.split(/\s+at\s+/i);
  if (parts.length === 2) {
    return { date: parts[0], time: parts[1] };
  }
  // Try to match time patterns
  const timeMatch = date.match(/^(.*?)(?:\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s+\w+)?))$/i);
  if (timeMatch) {
    return { date: timeMatch[1], time: timeMatch[2] };
  }
  return { date };
}

export default function Timeline({ keyDates }: TimelineProps) {
  if (!keyDates || keyDates.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" />
          Key Dates & Timeline
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Critical deadlines and milestones</p>
      </div>

      <div className="p-6">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200" />

          <div className="space-y-6">
            {keyDates.map((item, index) => {
              const { date, time } = formatDateLabel(item.date);
              const isLast = index === keyDates.length - 1;

              let dotColor = "bg-blue-500 border-blue-200";
              let labelColor = "text-gray-800";
              let badge = null;

              if (item.isPast) {
                dotColor = "bg-gray-400 border-gray-200";
                labelColor = "text-gray-500";
                badge = (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={10} />
                    Passed
                  </span>
                );
              } else if (item.isUrgent) {
                dotColor = "bg-red-500 border-red-200 animate-pulse";
                labelColor = "text-red-800";
                badge = (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={10} />
                    Urgent
                  </span>
                );
              } else if (isLast) {
                dotColor = "bg-green-500 border-green-200";
              }

              return (
                <div key={`${item.label}-${index}`} className="flex gap-4 relative">
                  <div className={`w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center z-10 bg-white ${dotColor}`}>
                    {item.isPast ? (
                      <CheckCircle2 size={16} className="text-white" style={{ background: "transparent" }} />
                    ) : item.isUrgent ? (
                      <AlertTriangle size={16} className="text-white" style={{ background: "transparent" }} />
                    ) : (
                      <ChevronRight size={14} className="text-white" style={{ background: "transparent" }} />
                    )}
                  </div>

                  <div className="flex-1 pb-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className={`text-sm font-semibold leading-tight ${labelColor}`}>
                        {item.label}
                      </p>
                      {badge}
                    </div>
                    <div className="mt-1 flex items-center gap-3 flex-wrap">
                      <span className={`text-sm ${item.isPast ? "text-gray-400 line-through" : "text-gray-600"}`}>
                        {date}
                      </span>
                      {time && (
                        <span className={`flex items-center gap-1 text-xs ${item.isPast ? "text-gray-400" : "text-gray-500"}`}>
                          <Clock size={11} />
                          {time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
