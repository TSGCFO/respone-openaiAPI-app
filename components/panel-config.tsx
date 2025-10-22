"use client";

import React from "react";
// TODO: Replace with Framework7 Toggle component
// import { Switch } from "./ui/switch";
// TODO: Replace with Framework7 Tooltip component  
// import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
// import { TooltipProvider } from "./ui/tooltip";

export default function PanelConfig({
  title,
  tooltip,
  enabled,
  setEnabled,
  disabled,
  children,
}: {
  title: string;
  tooltip: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const handleToggle = () => {
    setEnabled(!enabled);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex justify-between items-center">
        {/* TODO: Replace with Framework7 Tooltip component */}
        <div className="relative group">
          <h1 className="text-black font-medium">{title}</h1>
          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-sm rounded p-2 whitespace-nowrap z-10">
            {tooltip}
          </div>
        </div>
        {/* TODO: Replace with Framework7 Toggle component */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            id={title}
            checked={enabled}
            onChange={handleToggle}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
