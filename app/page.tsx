"use client";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import EnhancedMemoriesView from "@/components/enhanced-memories-view";
import SettingsView from "@/components/settings-view";
import BottomNavigation from "@/components/bottom-navigation";
import useNavigationStore from "@/stores/useNavigationStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useConversationStore from "@/stores/useConversationStore";
import { cn } from "@/lib/utils";

export default function Main() {
  const router = useRouter();
  const { resetConversation } = useConversationStore();
  const { activeTab } = useNavigationStore();
  const [isDesktop, setIsDesktop] = useState(false);

  // After OAuth redirect, reinitialize the conversation so the next turn
  // uses the connector-enabled server configuration immediately
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isConnected = new URLSearchParams(window.location.search).get("connected");
    if (isConnected === "1") {
      resetConversation();
      router.replace("/", { scroll: false });
    }
  }, [router, resetConversation]);

  // Detect desktop breakpoint
  useEffect(() => {
    const checkBreakpoint = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);
    return () => window.removeEventListener("resize", checkBreakpoint);
  }, []);

  // Render the active view based on selected tab
  const renderActiveView = () => {
    switch(activeTab) {
      case "chat":
        return <Assistant />;
      case "memories":
        return <EnhancedMemoriesView />;
      case "tools":
        return <ToolsPanel />;
      case "settings":
        return <SettingsView />;
      default:
        return <Assistant />;
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-gray-50">
      {/* Navigation Component */}
      <BottomNavigation />
      
      {/* Main Content Area - Mobile First Responsive Design */}
      <div className={cn(
        "h-full transition-all duration-300",
        // Mobile (default): Full width with bottom padding for nav
        "w-full pb-16",
        // Tablet: Slightly more padding for bottom nav
        "md:pb-20",
        // Desktop: Side navigation layout
        "lg:pb-0 lg:pl-20",
        // Large desktop: Wider sidebar
        "xl:pl-64",
        // Extra large desktop: Even more spacing
        "2xl:pl-72"
      )}>
        {/* Content Container with responsive max-width */}
        <div className={cn(
          "h-full bg-white",
          // Mobile: Full width
          "w-full",
          // Desktop: Add max-width for better readability
          activeTab === "chat" && "lg:max-w-none",
          activeTab === "settings" && "lg:max-w-none",
          activeTab === "tools" && "lg:max-w-none",
          activeTab === "memories" && "lg:max-w-none"
        )}>
          {/* Content Wrapper for proper spacing */}
          <div className={cn(
            "h-full",
            // Mobile: No extra padding (handled by components)
            "",
            // Desktop: Different layouts per tab
            isDesktop && activeTab === "chat" && "flex",
            isDesktop && activeTab !== "chat" && "container mx-auto"
          )}>
            {renderActiveView()}
          </div>
        </div>
      </div>
    </div>
  );
}
