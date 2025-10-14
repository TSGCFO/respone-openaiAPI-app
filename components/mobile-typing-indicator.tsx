"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

interface MobileTypingIndicatorProps {
  platform?: "ios" | "android" | "other";
  className?: string;
}

const MobileTypingIndicator: React.FC<MobileTypingIndicatorProps> = ({ 
  platform = "other", 
  className 
}) => {
  const dots = useMemo(() => [0, 1, 2], []);
  
  return (
    <div className={cn("flex items-end gap-2 px-4", className)}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 shadow-sm">
        <Bot className="h-4 w-4 text-white" />
      </div>
      
      {/* Typing bubble */}
      <div
        className={cn(
          "relative max-w-[120px] rounded-2xl px-5 py-3 min-h-[44px] flex items-center",
          platform === "ios" 
            ? "bg-gray-100 rounded-bl-[6px]"
            : "bg-white shadow-sm border border-gray-100 rounded-bl-[8px]"
        )}
      >
        <div className="flex gap-1.5 items-center">
          {dots.map((index) => (
            <div
              key={index}
              className={cn(
                "w-2.5 h-2.5 rounded-full bg-gray-400",
                "animate-bounce-dots"
              )}
              style={{
                animationDelay: `${index * 150}ms`,
                animationDuration: "1.4s",
              }}
            />
          ))}
        </div>
        
        {/* Message tail for iOS style */}
        {platform === "ios" && (
          <div
            className="absolute bottom-0 left-[-6px] w-0 h-0 border-r-[6px] border-r-gray-100 border-t-[8px] border-t-transparent"
          />
        )}
      </div>
      
      <style jsx>{`
        @keyframes bounce-dots {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
        
        .animate-bounce-dots {
          animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
        }
      `}</style>
    </div>
  );
};

export default React.memo(MobileTypingIndicator);