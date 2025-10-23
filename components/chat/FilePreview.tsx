'use client';

import React from 'react';

interface FilePreviewProps {
  selectedFiles: File[];
  formatFileSize: (bytes: number) => string;
  removeFile: (index: number) => void;
}

export function FilePreview({
  selectedFiles,
  formatFileSize,
  removeFile,
}: FilePreviewProps) {
  if (selectedFiles.length === 0) return null;

  return (
    <div className="mb-3 px-2 animate-slideDown">
      <div className="flex flex-wrap gap-2">
        {selectedFiles.map((file, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-2 flex items-center gap-2 animate-fadeIn shadow-md hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 max-w-[120px] truncate">
                {file.name}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </span>
            </div>
            <button
              onClick={() => removeFile(index)}
              className="ml-1 text-red-500 hover:text-red-700 transition-colors p-1"
              aria-label={`Remove ${file.name}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}