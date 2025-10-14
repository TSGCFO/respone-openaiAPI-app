"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Brain, Wrench, Settings } from "lucide-react";
import useNavigationStore, { NavigationTab } from "@/stores/useNavigationStore";
import haptic from "@/lib/haptic";
import { cn } from "@/lib/utils";

interface TabItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
}

const tabs: TabItem[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "memories", label: "Memories", icon: Brain },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "settings", label: "Settings", icon: Settings }
];

export default function BottomNavigation() {
  const { activeTab, setActiveTab } = useNavigationStore();
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform for native styling
    const userAgent = navigator.userAgent || navigator.vendor;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/android/i.test(userAgent));
  }, []);

  const handleTabPress = (tabId: NavigationTab) => {
    if (activeTab === tabId) return;
    
    // Trigger haptic feedback
    haptic.trigger("selection");
    
    // Set active tab
    setActiveTab(tabId);
  };

  return (
    <>
      {/* Mobile and Tablet Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        {/* Safe area padding for devices with home indicator */}
        <div 
          className={cn(
            "bg-white/80 backdrop-blur-xl border-t",
            isIOS && "bg-white/60 backdrop-saturate-150",
            isAndroid && "bg-white shadow-lg"
          )}
          style={{
            paddingBottom: "env(safe-area-inset-bottom, 0px)"
          }}
        >
          <nav className="flex justify-around items-center h-16 md:h-20">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => handleTabPress(tab.id)}
                showLabel={true}
                isIOS={isIOS}
                isAndroid={isAndroid}
                size="mobile"
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-20 xl:w-64 bg-white border-r z-40">
        <nav className="flex flex-col h-full py-8">
          <div className="flex-1 flex flex-col gap-2 px-3">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => handleTabPress(tab.id)}
                showLabel={true}
                isIOS={isIOS}
                isAndroid={isAndroid}
                size="desktop"
              />
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

interface TabButtonProps {
  tab: TabItem;
  isActive: boolean;
  onClick: () => void;
  showLabel: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  size: "mobile" | "desktop";
}

function TabButton({ tab, isActive, onClick, showLabel, isIOS, isAndroid, size }: TabButtonProps) {
  const Icon = tab.icon;
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 150);
  };

  if (size === "desktop") {
    return (
      <button
        onClick={handlePress}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
          "hover:bg-gray-100",
          isActive && "bg-blue-50 text-blue-600",
          !isActive && "text-gray-600 hover:text-gray-900",
          isPressed && "scale-95"
        )}
      >
        <Icon 
          size={24} 
          className={cn(
            "transition-colors",
            isActive && "text-blue-600"
          )}
        />
        <span className={cn(
          "hidden xl:block font-medium transition-colors",
          isActive && "text-blue-600"
        )}>
          {tab.label}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handlePress}
      className={cn(
        "flex flex-col items-center justify-center",
        "min-w-[48px] min-h-[48px] px-3 py-2",
        "transition-all duration-200 rounded-lg",
        "relative overflow-hidden",
        isPressed && "scale-90",
        // iOS styling
        isIOS && [
          isActive && "text-blue-500",
          !isActive && "text-gray-500"
        ],
        // Android Material Design styling
        isAndroid && [
          "relative",
          isActive && "text-blue-600",
          !isActive && "text-gray-600"
        ]
      )}
    >
      {/* Android ripple effect */}
      {isAndroid && isPressed && (
        <span 
          className="absolute inset-0 bg-gray-400/20 animate-pulse rounded-lg"
        />
      )}
      
      {/* Icon container with active indicator */}
      <div className={cn(
        "relative flex items-center justify-center",
        size === "mobile" && "mb-1"
      )}>
        {/* Active background pill for mobile */}
        {isActive && size === "mobile" && (
          <div className={cn(
            "absolute inset-0 -inset-x-2 rounded-full",
            "transition-all duration-300",
            isIOS && "bg-blue-500/10",
            isAndroid && "bg-blue-600/15"
          )} />
        )}
        
        <Icon 
          size={size === "mobile" ? 24 : 28} 
          className={cn(
            "relative z-10 transition-all duration-200",
            isActive && "transform scale-110"
          )}
        />
      </div>
      
      {/* Label */}
      <span className={cn(
        "text-xs transition-all duration-200",
        size === "mobile" && "md:text-sm",
        isActive ? "font-semibold" : "font-medium",
        isActive && isIOS && "text-blue-500",
        isActive && isAndroid && "text-blue-600",
        !isActive && "text-gray-500"
      )}>
        {tab.label}
      </span>
      
      {/* Active dot indicator for iOS style */}
      {isIOS && isActive && size === "mobile" && (
        <div className="absolute bottom-0 w-1 h-1 bg-blue-500 rounded-full" />
      )}
    </button>
  );
}