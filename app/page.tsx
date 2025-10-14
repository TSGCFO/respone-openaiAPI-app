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
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* Main Content Area - Takes up available space */}
      <div className={cn(
        "flex-1 min-h-0 overflow-hidden transition-all duration-300",
        // Desktop: Side navigation layout
        "lg:ml-20 xl:ml-64 2xl:ml-72"
      )}>
        {/* Content Container */}
        <div className="h-full bg-white">
          {/* Content Wrapper for proper spacing */}
          <div className={cn(
            "h-full",
            // Desktop: Different layouts per tab
            isDesktop && activeTab === "chat" && "flex",
            isDesktop && activeTab !== "chat" && "container mx-auto"
          )}>
            {renderActiveView()}
          </div>
        </div>
      </div>
      
      {/* Navigation Component - At the bottom on mobile/tablet */}
      <BottomNavigation />
    </div>
  );
}
