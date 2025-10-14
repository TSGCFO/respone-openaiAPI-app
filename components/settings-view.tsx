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
      {/* Header - Mobile First Responsive */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-3 md:px-6 md:py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Settings className="text-gray-600 w-5 h-5 md:w-6 md:h-6" />
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold">Settings</h2>
          </div>
        </div>
      </div>

      {/* Settings List - Mobile First Responsive */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 lg:p-8 xl:p-10 pb-20 lg:pb-4">
          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 lg:gap-8">
            {settingsGroups.map((group) => (
              <div key={group.title} className="lg:col-span-1">
                <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">
                  {group.title}
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {group.items.map((item) => (
                    <SettingRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sign Out Button - Responsive Position */}
          <div className="mt-8 md:mt-10 lg:mt-12 pt-4 md:pt-6 border-t">
            <div className="max-w-md mx-auto lg:max-w-lg">
              <Button
                variant="outline"
                className="w-full justify-center gap-2 text-red-600 hover:bg-red-50 border-red-200 min-h-touch md:min-h-[52px]"
                onClick={() => {
                  if (hapticEnabled) haptic.trigger("warning");
                  console.log("Sign out clicked");
                }}
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base">Sign Out</span>
              </Button>
            </div>
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
      className="bg-white rounded-lg border hover:shadow-sm transition-shadow cursor-pointer
                 p-3 md:p-4 lg:p-5"
      onClick={item.type === "link" || item.type === "button" ? item.action : undefined}
      style={{ cursor: item.type !== "switch" ? "pointer" : "default" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <Icon className="text-gray-500 w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base font-medium text-gray-900 truncate">
              {item.label}
            </p>
            {item.description && (
              <p className="text-xs md:text-sm text-gray-500 mt-0.5 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {item.type === "switch" && (
          <Switch
            checked={item.value}
            onCheckedChange={() => item.action?.()}
            className="min-w-[44px] min-h-touch"
          />
        )}

        {item.type === "button" && (
          <Button 
            variant="outline" 
            size="sm"
            className="min-h-touch"
            onClick={(e) => {
              e.stopPropagation();
              item.action?.();
            }}
          >
            Clear
          </Button>
        )}

        {item.type === "link" && (
          <span className="text-gray-400 text-lg md:text-xl">›</span>
        )}
      </div>
    </div>
  );
}