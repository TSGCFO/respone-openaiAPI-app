"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ToolCall from "./tool-call";
import Message from "./message";
import Annotations from "./annotations";
import McpToolsList from "./mcp-tools-list";
import McpApproval from "./mcp-approval";
import { Item, McpApprovalRequestItem } from "@/lib/assistant";
import LoadingMessage from "./loading-message";
import useConversationStore from "@/stores/useConversationStore";
import { AudioRecorder } from "./audio-recorder";
import { cn } from "@/lib/utils";

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string) => void;
  onApprovalResponse: (approve: boolean, id: string) => void;
  onRegenerateMessage?: () => void;
}

const Chat: React.FC<ChatProps> = ({
  items,
  onSendMessage,
  onApprovalResponse,
  onRegenerateMessage,
}) => {
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [inputMessageText, setinputMessageText] = useState<string>("");
  // This state is used to provide better user experience for non-English IMEs such as Japanese
  const [isComposing, setIsComposing] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const { isAssistantLoading } = useConversationStore();

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end" 
    });
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey && !isComposing) {
        event.preventDefault();
        if (inputMessageText.trim()) {
          onSendMessage(inputMessageText);
          setinputMessageText("");
        }
      }
    },
    [onSendMessage, inputMessageText, isComposing]
  );

  const handleAudioReady = useCallback(
    async (audioBlob: Blob, audioUrl: string) => {
      // Store the audio blob temporarily
      console.log('Audio recorded:', {
        size: audioBlob.size,
        type: audioBlob.type,
        url: audioUrl
      });
      
      // Here you can store the audio blob in state or local storage
      // For now, we'll just log it
      // In a real implementation, you'd send this to your transcription API
    },
    []
  );

  const handleTranscriptionRequest = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessingAudio(true);
      
      try {
        console.log('Processing audio for transcription...');
        
        // Create FormData to send audio file
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        // Call the transcription API
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Transcription failed');
        }
        
        const data = await response.json();
        
        if (data.text) {
          // Set the transcribed text in the input field
          setinputMessageText(data.text);
          console.log('Transcription successful:', data.text);
          
          // Optional: Auto-send the message after transcription
          // Uncomment the following lines to enable auto-send
          // if (data.text.trim()) {
          //   onSendMessage(data.text);
          //   setinputMessageText("");
          // }
        }
        
        setIsProcessingAudio(false);
      } catch (error) {
        console.error('Transcription error:', error);
        setIsProcessingAudio(false);
        
        // Optionally show an error message to the user
        // You could set an error state here to display in the UI
      }
    },
    [setinputMessageText]
  );

  useEffect(() => {
    scrollToBottom();
  }, [items]);

  return (
    <div className="flex justify-center items-center size-full">
      <div className="flex grow flex-col h-full max-w-[750px] gap-2">
        <div 
          ref={scrollContainerRef}
          className={cn(
            "h-[90vh] overflow-y-auto overflow-x-hidden px-10 flex flex-col",
            "overscroll-contain touch-pan-y",
            isTouchDevice && "scroll-smooth"
          )}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
          }}
        >
          <div className="mt-auto space-y-5 pt-4">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === "tool_call" ? (
                  <ToolCall toolCall={item} />
                ) : item.type === "message" ? (
                  <div className="flex flex-col gap-1 group">
                    <Message 
                      message={item} 
                      onRegenerate={item.role === 'assistant' ? onRegenerateMessage : undefined}
                    />
                    {item.content &&
                      item.content[0].annotations &&
                      item.content[0].annotations.length > 0 && (
                        <Annotations
                          annotations={item.content[0].annotations}
                        />
                      )}
                  </div>
                ) : item.type === "mcp_list_tools" ? (
                  <McpToolsList item={item} />
                ) : item.type === "mcp_approval_request" ? (
                  <McpApproval
                    item={item as McpApprovalRequestItem}
                    onRespond={onApprovalResponse}
                  />
                ) : null}
              </React.Fragment>
            ))}
            {isAssistantLoading && <LoadingMessage />}
            <div ref={itemsEndRef} />
          </div>
        </div>
        <div className="flex-1 p-4 px-10">
          <div className="flex items-center">
            <div className="flex w-full items-center pb-4 md:pb-1">
              <div className="flex w-full flex-col gap-1.5 rounded-[20px] p-2.5 pl-1.5 transition-colors bg-white border border-stone-200 shadow-sm">
                <div className="flex items-end gap-1.5 md:gap-2 pl-4">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <textarea
                      id="prompt-textarea"
                      tabIndex={0}
                      dir="auto"
                      rows={2}
                      placeholder={isProcessingAudio ? "Processing audio..." : "Message..."}
                      className={cn(
                        "mb-2 resize-none border-0 focus:outline-none text-sm bg-transparent px-0 pb-6 pt-2",
                        "touch-manipulation"
                      )}
                      value={inputMessageText}
                      onChange={(e) => setinputMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={() => setIsComposing(false)}
                      disabled={isProcessingAudio}
                    />
                  </div>
                  <AudioRecorder
                    onAudioReady={handleAudioReady}
                    onTranscriptionRequest={handleTranscriptionRequest}
                    disabled={isAssistantLoading || isProcessingAudio}
                    className="mr-2 min-w-[44px] min-h-[44px]"
                  />
                  <button
                    disabled={!inputMessageText.trim() || isProcessingAudio}
                    data-testid="send-button"
                    className={cn(
                      "flex items-center justify-center rounded-full bg-black text-white transition-all",
                      "hover:opacity-70 focus-visible:outline-none focus-visible:outline-black",
                      "disabled:bg-[#D7D7D7] disabled:text-[#f4f4f4] disabled:hover:opacity-100",
                      "min-w-[44px] min-h-[44px] touch-manipulation",
                      "active:scale-[0.95]"
                    )}
                    onClick={() => {
                      if (inputMessageText.trim()) {
                        onSendMessage(inputMessageText);
                        setinputMessageText("");
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      fill="none"
                      viewBox="0 0 32 32"
                      className="icon-2xl"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M15.192 8.906a1.143 1.143 0 0 1 1.616 0l5.143 5.143a1.143 1.143 0 0 1-1.616 1.616l-3.192-3.192v9.813a1.143 1.143 0 0 1-2.286 0v-9.813l-3.192 3.192a1.143 1.143 0 1 1-1.616-1.616z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @supports (-webkit-touch-callout: none) {
          .overscroll-contain {
            -webkit-overflow-scrolling: touch;
          }
        }
        
        .touch-manipulation {
          touch-action: manipulation;
        }
        
        .touch-pan-y {
          touch-action: pan-y;
        }
        
        @media (hover: none) and (pointer: coarse) {
          .hover\\:opacity-70:hover {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;