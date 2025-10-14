"use client";

import React, { useState } from "react";
import { MessageList } from "@/components/message-list";
import { MessageInput } from "@/components/message-input";
import { Item, MessageItem } from "@/lib/assistant";

// Sample messages for testing
const sampleMessages: MessageItem[] = [
  {
    type: "message",
    role: "assistant",
    content: [{ type: "output_text", text: "Hi! I'm your AI assistant. How can I help you today?" }]
  },
  {
    type: "message",
    role: "user",
    content: [{ type: "input_text", text: "Can you help me write some code?" }]
  },
  {
    type: "message",
    role: "user",
    content: [{ type: "input_text", text: "Specifically, I need help with React components" }]
  },
  {
    type: "message",
    role: "assistant",
    content: [{ 
      type: "output_text", 
      text: "Of course! I'd be happy to help you with React components. Here's a simple example of a functional component:\n\n```jsx\nconst Button = ({ onClick, children }) => {\n  return (\n    <button\n      className=\"px-4 py-2 bg-blue-500 text-white rounded\"\n      onClick={onClick}\n    >\n      {children}\n    </button>\n  );\n};\n```\n\nWhat specific aspect of React components would you like to explore?"
    }]
  },
  {
    type: "message",
    role: "user",
    content: [{ type: "input_text", text: "That's great! Can you show me how to add state to it?" }]
  },
  {
    type: "message",
    role: "assistant",
    content: [{ 
      type: "output_text", 
      text: "Certainly! Here's how you can add state using the `useState` hook:"
    }]
  },
  {
    type: "message",
    role: "assistant",
    content: [{ 
      type: "output_text", 
      text: "```jsx\nimport { useState } from 'react';\n\nconst Button = ({ children }) => {\n  const [clicked, setClicked] = useState(false);\n  \n  const handleClick = () => {\n    setClicked(true);\n    setTimeout(() => setClicked(false), 1000);\n  };\n  \n  return (\n    <button\n      className={`px-4 py-2 rounded ${\n        clicked \n          ? 'bg-green-500 scale-95' \n          : 'bg-blue-500 hover:bg-blue-600'\n      } text-white transition-all`}\n      onClick={handleClick}\n    >\n      {clicked ? '✓ Clicked!' : children}\n    </button>\n  );\n};\n```"
    }]
  },
  {
    type: "message",
    role: "assistant",
    content: [{ 
      type: "output_text", 
      text: "This example shows:\n• State management with `useState`\n• Conditional styling based on state\n• Automatic state reset using `setTimeout`\n• Smooth transitions with CSS"
    }]
  },
  {
    type: "message",
    role: "user",
    content: [{ type: "input_text", text: "Perfect! 👍" }]
  },
  {
    type: "message",
    role: "user",
    content: [{ type: "input_text", text: "One more question - how do I handle props validation?" }]
  },
  {
    type: "message",
    role: "assistant",
    content: [{ 
      type: "output_text", 
      text: "Great question! In modern React with TypeScript, you can use interfaces or type definitions for prop validation. Here's an example:\n\n```typescript\ninterface ButtonProps {\n  children: React.ReactNode;\n  onClick?: () => void;\n  variant?: 'primary' | 'secondary' | 'danger';\n  disabled?: boolean;\n  size?: 'small' | 'medium' | 'large';\n}\n\nconst Button: React.FC<ButtonProps> = ({\n  children,\n  onClick,\n  variant = 'primary',\n  disabled = false,\n  size = 'medium'\n}) => {\n  // Component implementation\n};\n```\n\nThis provides compile-time type checking and great IDE support! 🚀"
    }]
  }
];

export default function TestMessagesPage() {
  const [messages, setMessages] = useState<Item[]>(sampleMessages);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (text: string) => {
    const newMessage: MessageItem = {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text }]
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate assistant response
    setIsLoading(true);
    setTimeout(() => {
      const response: MessageItem = {
        type: "message",
        role: "assistant",
        content: [{ 
          type: "output_text", 
          text: `I received your message: "${text}". This is a demo response showing how the message bubbles look and animate!`
        }]
      };
      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 2000);
  };

  const handleRegenerate = () => {
    console.log("Regenerating last message...");
  };

  const handleApproval = (approve: boolean, id: string) => {
    console.log(`Approval response: ${approve} for ${id}`);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-hidden">
        <MessageList
          items={messages}
          isLoading={isLoading}
          onApprovalResponse={handleApproval}
          onRegenerateMessage={handleRegenerate}
        />
      </div>
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder="Type a message to test..."
      />
    </div>
  );
}