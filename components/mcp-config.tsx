"use client";
import React from "react";
import useToolsStore from "@/stores/useToolsStore";
import { Toggle } from "framework7-react";

export default function McpConfig() {
  const { mcpConfig, setMcpConfig } = useToolsStore();

  const handleClear = () => {
    setMcpConfig({
      server_label: "",
      server_url: "",
      allowed_tools: "",
      skip_approval: false,
  mcpAuthToken: "",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-zinc-600 text-sm">Server details</div>
        <button
          type="button"
          className="text-zinc-400 text-sm px-1 transition-colors hover:text-zinc-600 underline-offset-2 hover:underline"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
      <div className="mt-3 space-y-3 text-zinc-400">
        <div className="flex items-center gap-2">
          <label htmlFor="server_label" className="text-sm w-24">
            Label
          </label>
          <input
            id="server_label"
            type="text"
            placeholder="deepwiki"
            className="bg-white border border-zinc-300 rounded text-sm flex-1 text-zinc-900 placeholder:text-zinc-400 px-3 py-2"
            value={mcpConfig.server_label}
            onChange={(e) =>
              setMcpConfig({ ...mcpConfig, server_label: e.target.value })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="server_url" className="text-sm w-24">
            URL
          </label>
          <input
            id="server_url"
            type="text"
            placeholder="https://example.com/mcp"
            className="bg-white border border-zinc-300 rounded text-sm flex-1 text-zinc-900 placeholder:text-zinc-400 px-3 py-2"
            value={mcpConfig.server_url}
            onChange={(e) =>
              setMcpConfig({ ...mcpConfig, server_url: e.target.value })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="allowed_tools" className="text-sm w-24">
            Allowed
          </label>
          <input
            id="allowed_tools"
            type="text"
            placeholder="tool1,tool2"
            className="bg-white border border-zinc-300 rounded text-sm flex-1 text-zinc-900 placeholder:text-zinc-400 px-3 py-2"
            value={mcpConfig.allowed_tools}
            onChange={(e) =>
              setMcpConfig({ ...mcpConfig, allowed_tools: e.target.value })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="skip_approval" className="text-sm w-24">
            Skip approval
          </label>
          <Toggle
            checked={mcpConfig.skip_approval}
            onToggleChange={(checked) =>
              setMcpConfig({ ...mcpConfig, skip_approval: checked })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="mcp_auth_token" className="text-sm w-24">
            Auth token
          </label>
          <input
            id="mcp_auth_token"
            type="password"
            placeholder="Bearer token"
            className="bg-white border border-zinc-300 rounded text-sm flex-1 text-zinc-900 placeholder:text-zinc-400 px-3 py-2"
            value={mcpConfig.mcpAuthToken || ""}
            onChange={(e) =>
              setMcpConfig({ ...mcpConfig, mcpAuthToken: e.target.value.trim() })
            }
          />
        </div>
      </div>
    </div>
  );
}
