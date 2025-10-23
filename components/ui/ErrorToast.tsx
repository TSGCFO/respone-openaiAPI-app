'use client';

import React from 'react';

interface ErrorToastProps {
  message: string;
}

export function ErrorToast({ message }: ErrorToastProps) {
  return (
    <div className="mb-3 px-2 py-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-center gap-2 animate-slideDown">
      <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p className="text-xs text-red-700 dark:text-red-300 font-medium">{message}</p>
    </div>
  );
}