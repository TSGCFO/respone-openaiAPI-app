'use client';

import dynamic from "next/dynamic";

// Import F7AppProvider dynamically with SSR disabled to avoid Framework7 SSR issues
const F7AppProvider = dynamic(
  () => import("@/components/f7-app-provider").then((mod) => ({ default: mod.F7AppProvider })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-purple-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }
);

export function ClientAppWrapper({ children }: { children: React.ReactNode }) {
  return <F7AppProvider>{children}</F7AppProvider>;
}
