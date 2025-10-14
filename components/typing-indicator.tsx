"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

interface TypingIndicatorProps {
  className?: string;
  showAvatar?: boolean;
  platform?: "ios" | "android" | "other";
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  className,
  showAvatar = true,
  platform = "other"
}) => {
  return (
    <div className={cn("flex items-end gap-2", className)}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      
      {/* Typing bubble */}
      <div
        className={cn(
          "relative max-w-[80px] rounded-2xl px-4 py-3",
          platform === "ios" ? "bg-gray-200" : "bg-white shadow-sm",
          "animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
        )}
      >
        {/* Three dots animation */}
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              platform === "ios" ? "bg-gray-500" : "bg-gray-400",
              "animate-typing-bounce"
            )}
            style={{ animationDelay: "0ms" }}
          />
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              platform === "ios" ? "bg-gray-500" : "bg-gray-400",
              "animate-typing-bounce"
            )}
            style={{ animationDelay: "150ms" }}
          />
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              platform === "ios" ? "bg-gray-500" : "bg-gray-400",
              "animate-typing-bounce"
            )}
            style={{ animationDelay: "300ms" }}
          />
        </div>
        
        {/* Message tail (iOS style) */}
        {platform === "ios" && (
          <div
            className={cn(
              "absolute bottom-0 left-[-6px]",
              "w-0 h-0",
              "border-r-[6px] border-r-gray-200",
              "border-t-[8px] border-t-transparent",
              "border-b-[8px] border-b-transparent"
            )}
          />
        )}
      </div>
      
      <style jsx>{`
        @keyframes typing-bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
        
        .animate-typing-bounce {
          animation: typing-bounce 1.4s infinite;
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;