"use client";
import React from "react";
import FileSearchSetup from "./file-search-setup";
import WebSearchConfig from "./websearch-config";
import FunctionsView from "./functions-view";
import McpServersPanel from "./mcp-servers-panel";
import PanelConfig from "./panel-config";
import useToolsStore from "@/stores/useToolsStore";
import GoogleIntegrationPanel from "@/components/google-integration";

export default function ContextPanel() {
  const {
    fileSearchEnabled,
    setFileSearchEnabled,
    webSearchEnabled,
    setWebSearchEnabled,
    functionsEnabled,
    setFunctionsEnabled,
    googleIntegrationEnabled,
    setGoogleIntegrationEnabled,
    mcpEnabled,
    setMcpEnabled,
    codeInterpreterEnabled,
    setCodeInterpreterEnabled,
  } = useToolsStore();
  const [oauthConfigured, setOauthConfigured] = React.useState<boolean>(false);

  React.useEffect(() => {
    fetch("/api/google/status")
      .then((r) => r.json())
      .then((d) => setOauthConfigured(Boolean(d.oauthConfigured)))
      .catch(() => setOauthConfigured(false));
  }, []);
  return (
    <div className="h-full w-full bg-[#f9f9f9] rounded-t-xl md:rounded-none border-l-1 border-stone-100">
      {/* Mobile First Responsive Padding */}
      <div className="p-4 md:p-6 lg:p-8 xl:p-10 h-full">
        {/* Header for Mobile/Tablet */}
        <div className="mb-4 md:mb-6 lg:hidden">
          <h2 className="text-lg md:text-xl font-semibold">Tools & Integrations</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Configure available tools and features</p>
        </div>
        
        {/* Responsive Grid Layout */}
        <div className="overflow-y-auto h-full pb-20 lg:pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {/* File Search Panel */}
            <div className="lg:col-span-1">
              <PanelConfig
                title="File Search"
                tooltip="Allows to search a knowledge base (vector store)"
                enabled={fileSearchEnabled}
                setEnabled={setFileSearchEnabled}
              >
                <FileSearchSetup />
              </PanelConfig>
            </div>
            
            {/* Web Search Panel */}
            <div className="lg:col-span-1">
              <PanelConfig
                title="Web Search"
                tooltip="Allows to search the web"
                enabled={webSearchEnabled}
                setEnabled={setWebSearchEnabled}
              >
                <WebSearchConfig />
              </PanelConfig>
            </div>
            
            {/* Code Interpreter Panel */}
            <div className="lg:col-span-1">
              <PanelConfig
                title="Code Interpreter"
                tooltip="Allows the assistant to run Python code"
                enabled={codeInterpreterEnabled}
                setEnabled={setCodeInterpreterEnabled}
              />
            </div>
            
            {/* Functions Panel */}
            <div className="lg:col-span-1">
              <PanelConfig
                title="Functions"
                tooltip="Allows to use locally defined functions"
                enabled={functionsEnabled}
                setEnabled={setFunctionsEnabled}
              >
                <FunctionsView />
              </PanelConfig>
            </div>
            
            {/* MCP Panel */}
            <div className="lg:col-span-1">
              <PanelConfig
                title="MCP Servers"
                tooltip="Configure multiple MCP servers for tool integration"
                enabled={mcpEnabled}
                setEnabled={setMcpEnabled}
              >
                <McpServersPanel />
              </PanelConfig>
            </div>
            
            {/* Google Integration Panel */}
            <div className="lg:col-span-1 2xl:col-span-1">
              <PanelConfig
                title="Google Integration"
                tooltip="Connect your Google account to enable Gmail and Calendar features."
                enabled={oauthConfigured && googleIntegrationEnabled}
                setEnabled={setGoogleIntegrationEnabled}
                disabled={!oauthConfigured}
              >
                <GoogleIntegrationPanel />
              </PanelConfig>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
