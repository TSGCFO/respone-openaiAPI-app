"use client";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import EnhancedMemoriesView from "@/components/enhanced-memories-view";
import SettingsView from "@/components/settings-view";
import BottomNavigation from "@/components/bottom-navigation";
import useNavigationStore from "@/stores/useNavigationStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useConversationStore from "@/stores/useConversationStore";
import { cn } from "@/lib/utils";

export default function Main() {
  const router = useRouter();
  const { resetConversation } = useConversationStore();
  const { activeTab } = useNavigationStore();

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
      {/* Bottom Navigation */}
      <BottomNavigation />
      
      {/* Main Content Area */}
      <div className={cn(
        "h-full transition-all duration-300",
        // Add padding for desktop sidebar
        "lg:pl-20 xl:pl-64",
        // Add padding for mobile bottom nav
        "pb-16 md:pb-20 lg:pb-0"
      )}>
        {/* Content Container */}
        <div className="h-full bg-white">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
}
