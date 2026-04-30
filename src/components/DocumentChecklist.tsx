"use client";

import { useState } from "react";
import { DocumentItem } from "@/types/bid";
import { FileText, CheckCircle2, Circle, Info, AlertCircle } from "lucide-react";

interface DocumentChecklistProps {
  documents: DocumentItem[];
}

export default function DocumentChecklist({ documents }: DocumentChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const required = documents.filter((d) => d.required);
  const optional = documents.filter((d) => !d.required);
  const requiredChecked = required.filter((d) => checked.has(d.id)).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Required Documents
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Checklist for your bid package</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Required: {requiredChecked}/{required.length}</p>
            <div className="mt-1 w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: required.length > 0 ? `${(requiredChecked / required.length) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Required Documents */}
        {required.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={14} className="text-red-500" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Required Documents
              </h3>
            </div>
            <div className="space-y-2">
              {required.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  isChecked={checked.has(doc.id)}
                  onToggle={() => toggleCheck(doc.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Optional Documents */}
        {optional.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-blue-500" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Optional / Supplemental
              </h3>
            </div>
            <div className="space-y-2">
              {optional.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  isChecked={checked.has(doc.id)}
                  onToggle={() => toggleCheck(doc.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({
  doc,
  isChecked,
  onToggle,
}: {
  doc: DocumentItem;
  isChecked: boolean;
  onToggle: () => void;
}) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div
      className={`border rounded-lg transition-all duration-200 ${
        isChecked
          ? "border-green-200 bg-green-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-start gap-3 p-3.5">
        <button
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0 transition-colors"
        >
          {isChecked ? (
            <CheckCircle2 size={18} className="text-green-500" />
          ) : (
            <Circle size={18} className="text-gray-300 hover:text-gray-400" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold leading-snug ${isChecked ? "line-through text-gray-400" : "text-gray-800"}`}>
              {doc.name}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {doc.required && (
                <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                  Required
                </span>
              )}
              {(doc.description || doc.notes) && (
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Info size={14} />
                </button>
              )}
            </div>
          </div>

          {showNotes && (doc.description || doc.notes) && (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
              {doc.description && (
                <p className="text-xs text-gray-600">{doc.description}</p>
              )}
              {doc.notes && (
                <p className="text-xs text-blue-600 flex items-start gap-1">
                  <Info size={10} className="mt-0.5 flex-shrink-0" />
                  {doc.notes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
