"use client";

import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onUpload?: (files: File[]) => Promise<any>;
  accept?: string;
}

export default function FileUpload({ onUpload, accept }: FileUploadProps) {
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onUpload) {
      await onUpload(files);
    }
  }, [onUpload]);

  return (
    <label className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-md cursor-pointer transition-colors">
      <Upload size={16} className="text-gray-600" />
      <span className="text-sm text-gray-700">Upload Files</span>
      <input
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </label>
  );
}