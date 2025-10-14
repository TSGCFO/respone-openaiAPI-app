import { MessageItem } from "@/lib/assistant";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useLongPress } from "@/hooks/useLongPress";
import { usePinchZoom } from "@/hooks/usePinchZoom";
import { Copy, RotateCcw, Share, MoreVertical } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MessageProps {
  message: MessageItem;
  onRegenerate?: () => void;
}

interface ContextMenuOption {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

const Message: React.FC<MessageProps> = ({ message, onRegenerate }) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const messageRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const { scale, x, y, reset } = usePinchZoom(contentRef, {
    minScale: 1,
    maxScale: 3,
  });

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleCopy = () => {
    const text = message.content[0].text as string;
    navigator.clipboard.writeText(text);
    setShowContextMenu(false);
    
    // Show a brief toast or feedback
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50 animate-fade-in';
    toast.textContent = 'Copied to clipboard';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2000);
  };

  const handleShare = async () => {
    const text = message.content[0].text as string;
    if (navigator.share) {
      try {
        await navigator.share({
          text: text,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
    setShowContextMenu(false);
  };

  const contextMenuOptions: ContextMenuOption[] = [
    {
      label: 'Copy',
      icon: <Copy className="h-4 w-4" />,
      action: handleCopy,
    },
    ...(message.role === 'assistant' && onRegenerate ? [{
      label: 'Regenerate',
      icon: <RotateCcw className="h-4 w-4" />,
      action: () => {
        onRegenerate();
        setShowContextMenu(false);
      },
    }] : []),
    ...(typeof navigator !== 'undefined' && navigator.share ? [{
      label: 'Share',
      icon: <Share className="h-4 w-4" />,
      action: handleShare,
    }] : []),
  ];

  const { handlers: longPressHandlers, isLongPressing } = useLongPress(
    (event) => {
      const rect = messageRef.current?.getBoundingClientRect();
      if (rect) {
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
        
        setContextMenuPosition({
          x: clientX,
          y: clientY - 100, // Position above the touch point
        });
        setShowContextMenu(true);
      }
    },
    {
      threshold: 500,
      onCancel: () => {
        if (showContextMenu) {
          setShowContextMenu(false);
        }
      },
    }
  );

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showContextMenu]);

  return (
    <div className="text-sm relative">
      {message.role === "user" ? (
        <div className="flex justify-end">
          <div
            ref={messageRef}
            {...longPressHandlers}
            className="select-none touch-manipulation"
          >
            <div className="ml-4 rounded-[16px] px-4 py-2 md:ml-24 bg-[#ededed] text-stone-900 font-light min-h-[44px] flex items-center">
              <div>
                <div>
                  <ReactMarkdown>
                    {message.content[0].text as string}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex">
            <div
              ref={messageRef}
              {...longPressHandlers}
              className="select-none touch-manipulation"
            >
              <div 
                ref={contentRef}
                className="mr-4 rounded-[16px] px-4 py-2 md:mr-24 text-black bg-white font-light min-h-[44px]"
                style={{
                  transform: `scale(${scale}) translate(${x}px, ${y}px)`,
                  transition: scale === 1 ? 'transform 0.3s ease-out' : 'none',
                  transformOrigin: 'top left',
                }}
              >
                <div>
                  <ReactMarkdown>
                    {message.content[0].text as string}
                  </ReactMarkdown>
                  {message.content[0].annotations &&
                    message.content[0].annotations
                      .filter(
                        (a) =>
                          a.type === "container_file_citation" &&
                          a.filename &&
                          /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.filename)
                      )
                      .map((a, i) => (
                        <img
                          key={i}
                          src={`/api/container_files/content?file_id=${a.fileId}${a.containerId ? `&container_id=${a.containerId}` : ""}${a.filename ? `&filename=${encodeURIComponent(a.filename)}` : ""}`}
                          alt={a.filename || ""}
                          className="mt-2 max-w-full touch-manipulation"
                        />
                      ))}
                </div>
              </div>
              {scale > 1 && (
                <button
                  onClick={() => reset()}
                  className="mt-2 text-xs text-muted-foreground underline"
                >
                  Reset zoom
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className={cn(
            "fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700",
            "min-w-[150px] py-1 animate-fade-in"
          )}
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {contextMenuOptions.map((option, index) => (
            <button
              key={index}
              onClick={option.action}
              className={cn(
                "w-full px-4 py-3 min-h-[44px] text-left flex items-center gap-3",
                "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                "active:scale-[0.98] touch-manipulation"
              )}
            >
              {option.icon}
              <span className="text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mobile context menu button - visible only on touch devices */}
      {isTouchDevice && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setContextMenuPosition({
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
            });
            setShowContextMenu(!showContextMenu);
          }}
          className={cn(
            "absolute top-2 right-2 p-2 rounded-full",
            "bg-gray-100 dark:bg-gray-700 opacity-0 group-hover:opacity-100",
            "touch-manipulation min-w-[44px] min-h-[44px]",
            message.role === "user" ? "hidden" : "md:hidden"
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        @media (hover: none) and (pointer: coarse) {
          .select-none {
            -webkit-user-select: none;
            user-select: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Message;