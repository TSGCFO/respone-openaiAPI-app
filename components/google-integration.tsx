"use client";
import { useEffect, useState } from "react";
import { Button } from "framework7-react";
import useToolsStore from "@/stores/useToolsStore";

export default function GoogleIntegrationPanel() {
  const [connected, setConnected] = useState<boolean>(false);
  const [oauthConfigured, setOauthConfigured] = useState<boolean>(false);
  const googleIntegrationEnabled = useToolsStore((s) => s.googleIntegrationEnabled);

  useEffect(() => {
    fetch("/api/google/status")
      .then((r) => r.json())
      .then((d) => {
        setConnected(Boolean(d.connected));
        setOauthConfigured(Boolean(d.oauthConfigured));
      })
      .catch(() => {
        setConnected(false);
        setOauthConfigured(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      {!connected ? (
        <div className="space-y-2">
          {oauthConfigured ? (
            googleIntegrationEnabled ? (
              <a href="/api/google/auth">
                <Button fill>Connect Google Integration</Button>
              </a>
            ) : (
              <Button fill disabled>Connect Google Integration</Button>
            )
          ) : (
            <div>
              <Button fill disabled>
                Connect Google Integration
              </Button>
              <div className="text-xs text-zinc-500 mt-1">
                Requires Google OAuth environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded border p-3 bg-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-green-600"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 7.28a.75.75 0 00-1.06-1.06l-4.47 4.47-1.97-1.97a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l5-5z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-gray-700">Google Integration connected</p>
          </div>
        </div>
      )}
    </div>
  );
}
