import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NavigationTab = "chat" | "memories" | "tools" | "settings";

interface NavigationState {
  activeTab: NavigationTab;
  previousTab: NavigationTab | null;
  tabHistory: NavigationTab[];
  setActiveTab: (tab: NavigationTab) => void;
  goToPreviousTab: () => void;
  clearHistory: () => void;
}

const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      activeTab: "chat",
      previousTab: null,
      tabHistory: ["chat"],
      
      setActiveTab: (tab: NavigationTab) => {
        const currentTab = get().activeTab;
        if (currentTab === tab) return;
        
        set((state) => ({
          activeTab: tab,
          previousTab: currentTab,
          tabHistory: [...state.tabHistory.slice(-9), tab] // Keep last 10 items
        }));
      },
      
      goToPreviousTab: () => {
        const { previousTab } = get();
        if (previousTab) {
          set((state) => ({
            activeTab: previousTab,
            previousTab: state.activeTab
          }));
        }
      },
      
      clearHistory: () => {
        set({
          activeTab: "chat",
          previousTab: null,
          tabHistory: ["chat"]
        });
      }
    }),
    {
      name: "navigation-store",
      partialize: (state) => ({
        activeTab: state.activeTab
      })
    }
  )
);

export default useNavigationStore;