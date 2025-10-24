"use client";

import React from "react";
import { Toggle } from "framework7-react";

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
        <h1 className="text-black font-medium" title={tooltip}>
          {title}
        </h1>
        <Toggle
          checked={enabled}
          onToggleChange={handleToggle}
          disabled={disabled}
        />
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
