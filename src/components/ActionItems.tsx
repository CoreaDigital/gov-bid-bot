"use client";

import { useState } from "react";
import { ActionItem } from "@/types/bid";
import { CheckSquare, Square, AlertCircle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

interface ActionItemsProps {
  actionItems: ActionItem[];
}

const priorityConfig = {
  high: { label: "High", color: "text-red-600 bg-red-50 border-red-200", dot: "bg-red-500" },
  medium: { label: "Medium", color: "text-yellow-600 bg-yellow-50 border-yellow-200", dot: "bg-yellow-500" },
  low: { label: "Low", color: "text-green-600 bg-green-50 border-green-200", dot: "bg-green-500" },
};

const categoryIcons: Record<string, string> = {
  Registration: "📋",
  Preparation: "📝",
  Compliance: "✅",
  Submission: "📤",
  Research: "🔍",
  Financial: "💰",
  Legal: "⚖️",
  Technical: "🔧",
  Administrative: "🗂️",
};

export default function ActionItems({ actionItems }: ActionItemsProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group by category
  const categories = Array.from(new Set(actionItems.map((a) => a.category)));
  const highPriority = actionItems.filter((a) => a.priority === "high" && !checked.has(a.id));
  const completedCount = checked.size;
  const totalCount = actionItems.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <CheckSquare size={18} className="text-blue-600" />
              Action Items
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Step-by-step bid preparation checklist</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{completedCount}/{totalCount} completed</p>
            <div className="mt-1 w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* High priority alert */}
        {highPriority.length > 0 && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-700">
                {highPriority.length} high-priority action{highPriority.length > 1 ? "s" : ""} remaining
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {highPriority.slice(0, 2).map((a) => a.title).join(", ")}
                {highPriority.length > 2 ? ` and ${highPriority.length - 2} more` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Action items by category */}
        <div className="space-y-6">
          {categories.map((category) => {
            const items = actionItems.filter((a) => a.category === category);
            const icon = categoryIcons[category] || "📌";
            return (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <span>{icon}</span>
                  {category}
                  <span className="ml-1 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full text-xs">
                    {items.filter((a) => checked.has(a.id)).length}/{items.length}
                  </span>
                </h3>

                <div className="space-y-2">
                  {items.map((item) => {
                    const isChecked = checked.has(item.id);
                    const isExpanded = expanded.has(item.id);
                    const priority = priorityConfig[item.priority];

                    return (
                      <div
                        key={item.id}
                        className={`border rounded-lg transition-all duration-200 ${
                          isChecked
                            ? "border-gray-200 bg-gray-50 opacity-60"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-3 p-3.5">
                          <button
                            onClick={() => toggleCheck(item.id)}
                            className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            {isChecked ? (
                              <CheckSquare size={18} className="text-blue-500" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <p className={`text-sm font-semibold leading-snug ${isChecked ? "line-through text-gray-400" : "text-gray-800"}`}>
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priority.color}`}>
                                  {priority.label}
                                </span>
                                <button
                                  onClick={() => toggleExpand(item.id)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              </div>
                            </div>

                            {item.deadline && (
                              <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                <ArrowRight size={10} />
                                Deadline: {item.deadline}
                              </p>
                            )}

                            {isExpanded && (
                              <p className="text-xs text-gray-600 mt-2 leading-relaxed border-t border-gray-100 pt-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
