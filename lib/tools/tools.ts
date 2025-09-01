import { toolsList } from "../../config/tools-list";
import useToolsStore from "@/stores/useToolsStore";
import { WebSearchConfig } from "@/stores/useToolsStore";

interface WebSearchTool extends WebSearchConfig {
  type: "web_search";
}
export const getTools = () => {
  const state = useToolsStore.getState();
  const tools: any[] = [];

  const addWebSearch = () => {
    if (!state.webSearchEnabled) return;
    const loc = state.webSearchConfig.user_location;
    const hasLocation = !!(
      loc && (loc.country || loc.region || loc.city)
    );
    const tool: WebSearchTool = { type: "web_search" };
    if (hasLocation && loc) tool.user_location = loc;
    tools.push(tool);
  };

  const addFileSearch = () => {
    if (!state.fileSearchEnabled) return;
    tools.push({ type: "file_search", vector_store_ids: [state.vectorStore?.id] });
  };

  const addCodeInterpreter = () => {
    if (state.codeInterpreterEnabled) {
      tools.push({ type: "code_interpreter", container: { type: "auto" } });
    }
  };

  const addFunctions = () => {
    if (!state.functionsEnabled) return;
    tools.push(
      ...toolsList.map((tool) => ({
        type: "function",
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: { ...tool.parameters },
          required: Object.keys(tool.parameters),
          additionalProperties: false,
        },
        strict: true,
      }))
    );
  };

  const addMcp = () => {
    const cfg = state.mcpConfig;
    if (!(state.mcpEnabled && cfg.server_url && cfg.server_label)) return;
    const mcpTool: any = {
      type: "mcp",
      server_label: cfg.server_label,
      server_url: cfg.server_url,
    };
    if (cfg.skip_approval) mcpTool.require_approval = "never";
    if (cfg.allowed_tools.trim()) {
      mcpTool.allowed_tools = cfg.allowed_tools
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    }
    const token = cfg.mcpAuthToken?.trim();
    if (token) {
      mcpTool.headers = { Authorization: `Bearer ${token}` };
    }
    tools.push(mcpTool);
  };

  addWebSearch();
  addFileSearch();
  addCodeInterpreter();
  addFunctions();
  addMcp();

  console.log("tools", tools);
  return tools;
};
