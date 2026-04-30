"use client";

import { useState, useRef } from "react";
import { Search, Upload, X, Loader2, FileText, Link } from "lucide-react";

interface InputFormProps {
  onAnalyze: (formData: FormData) => void;
  isLoading: boolean;
}

export default function InputForm({ onAnalyze, isLoading }: InputFormProps) {
  const [url, setUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url && !pdfFile) return;

    const formData = new FormData();
    if (url) formData.append("url", url);
    if (pdfFile) formData.append("pdf", pdfFile);
    onAnalyze(formData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else if (file) {
      // Non-PDF selected — reset the input so the user can try again
      e.target.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <span className="flex items-center gap-2">
            <Link size={16} />
            Bid Solicitation URL
          </span>
        </label>
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://vendor.myfloridamarketplace.com/search/bids/detail/..."
            className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Supports Florida Marketplace, SAM.gov, and other government procurement portals
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-500 font-medium">AND / OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* PDF Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <span className="flex items-center gap-2">
            <FileText size={16} />
            Upload Bid Document (PDF)
          </span>
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          {pdfFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="text-blue-500" size={24} />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">{pdfFile.name}</p>
                <p className="text-xs text-gray-500">{(pdfFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto text-gray-400 mb-3" size={28} />
              <p className="text-sm text-gray-600 font-medium">
                Drop PDF here or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">Solicitation documents, amendments, attachments</p>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || (!url && !pdfFile)}
        className="w-full py-3.5 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analyzing Bid...
          </>
        ) : (
          <>
            <Search size={18} />
            Analyze Bid Solicitation
          </>
        )}
      </button>
    </form>
  );
}
