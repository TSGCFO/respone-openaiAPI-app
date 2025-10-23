'use client';

import React from 'react';

export function LoadingDots() {
  return (
    <div className="flex justify-start animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl rounded-bl-md shadow-lg px-5 py-4 border border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce"></div>
          <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
}