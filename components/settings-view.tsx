"use client";

import React from "react";
import { Settings, Moon, Bell, Shield, Database, Zap, HelpCircle, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import haptic from "@/lib/haptic";

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  type: "switch" | "button" | "link";
  value?: boolean;
  action?: () => void;
}

export default function SettingsView() {
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [autoSave, setAutoSave] = React.useState(true);
  const [hapticEnabled, setHapticEnabled] = React.useState(true);

  const handleToggle = (setting: string, value: boolean) => {
    if (hapticEnabled) {
      haptic.trigger("selection");
    }

    switch(setting) {
      case "darkMode":
        setDarkMode(value);
        // In a real app, you'd apply dark mode here
        break;
      case "notifications":
        setNotifications(value);
        break;
      case "autoSave":
        setAutoSave(value);
        break;
      case "haptic":
        setHapticEnabled(value);
        break;
    }
  };

  const settingsGroups = [
    {
      title: "Appearance",
      items: [
        {
          id: "darkMode",
          label: "Dark Mode",
          description: "Use dark theme across the app",
          icon: Moon,
          type: "switch" as const,
          value: darkMode,
          action: () => handleToggle("darkMode", !darkMode)
        }
      ]
    },
    {
      title: "Notifications",
      items: [
        {
          id: "notifications",
          label: "Push Notifications",
          description: "Receive notifications for important updates",
          icon: Bell,
          type: "switch" as const,
          value: notifications,
          action: () => handleToggle("notifications", !notifications)
        },
        {
          id: "haptic",
          label: "Haptic Feedback",
          description: "Vibration feedback for interactions",
          icon: Zap,
          type: "switch" as const,
          value: hapticEnabled,
          action: () => handleToggle("haptic", !hapticEnabled)
        }
      ]
    },
    {
      title: "Data & Storage",
      items: [
        {
          id: "autoSave",
          label: "Auto-save Conversations",
          description: "Automatically save your chat history",
          icon: Database,
          type: "switch" as const,
          value: autoSave,
          action: () => handleToggle("autoSave", !autoSave)
        },
        {
          id: "clearData",
          label: "Clear All Data",
          description: "Remove all conversations and memories",
          icon: Database,
          type: "button" as const,
          action: () => {
            if (hapticEnabled) haptic.trigger("warning");
            // In a real app, you'd show a confirmation dialog
            console.log("Clear data clicked");
          }
        }
      ]
    },
    {
      title: "About",
      items: [
        {
          id: "help",
          label: "Help & Support",
          icon: HelpCircle,
          type: "link" as const,
          action: () => console.log("Help clicked")
        },
        {
          id: "privacy",
          label: "Privacy Policy",
          icon: Shield,
          type: "link" as const,
          action: () => console.log("Privacy clicked")
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Settings className="text-gray-600" size={24} />
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
      </div>

      {/* Settings List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-20 lg:pb-4">
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <SettingRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}

          {/* Sign Out Button */}
          <div className="mt-8 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-center gap-2 text-red-600 hover:bg-red-50 border-red-200"
              onClick={() => {
                if (hapticEnabled) haptic.trigger("warning");
                console.log("Sign out clicked");
              }}
            >
              <LogOut size={18} />
              Sign Out
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

interface SettingRowProps {
  item: SettingItem;
}

function SettingRow({ item }: SettingRowProps) {
  const Icon = item.icon;

  return (
    <div 
      className="bg-white rounded-lg border p-4 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow"
      onClick={item.type === "link" || item.type === "button" ? item.action : undefined}
      style={{ cursor: item.type !== "switch" ? "pointer" : "default" }}
    >
      <div className="flex items-center gap-3 flex-1">
        <Icon size={20} className="text-gray-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{item.label}</p>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
          )}
        </div>
      </div>

      {item.type === "switch" && (
        <Switch
          checked={item.value}
          onCheckedChange={() => item.action?.()}
        />
      )}

      {item.type === "button" && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            item.action?.();
          }}
        >
          Clear
        </Button>
      )}

      {item.type === "link" && (
        <span className="text-gray-400">›</span>
      )}
    </div>
  );
}