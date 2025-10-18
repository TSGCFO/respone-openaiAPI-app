import { McpServer } from "@/stores/useToolsStore";

export type GoogleConnectorOptions = {
  enabled: boolean;
  accessToken?: string;
};

export function withGoogleConnector(
  tools: any[],
  { enabled, accessToken }: GoogleConnectorOptions
): any[] {
  if (!enabled || !accessToken) return tools;
  return [
    ...tools,
    {
      type: "mcp",
      server_label: "GoogleCalendar",
      server_description: "Search the user's calendar and read calendar events",
      connector_id: "connector_googlecalendar",
      authorization: accessToken,
      // Defaults to requiring approval; this demo disables prompts for approval
      require_approval: "never",
    },
    {
      type: "mcp",
      server_label: "GoogleMail",
      server_description: "Search the user's email inbox and read emails",
      connector_id: "connector_gmail",
      authorization: accessToken,
      // Defaults to requiring approval; this demo disables prompts for approval
      require_approval: "never",
    },
  ];
}

export function withMcpServers(
  tools: any[],
  servers: McpServer[]
): any[] {
  // Filter enabled servers and add their tools
  const mcpTools = servers
    .filter(server => server.enabled && server.url && server.label)
    .map(server => {
      const mcpTool: any = {
        type: "mcp",
        server_label: server.label,
        server_url: server.url,
      };
      
      if (server.skip_approval) {
        mcpTool.require_approval = "never";
      }
      
      if (server.allowed_tools.trim()) {
        mcpTool.allowed_tools = server.allowed_tools
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);
      }
      
      const token = server.authToken?.trim();
      if (token) {
        mcpTool.headers = { Authorization: `Bearer ${token}` };
      }
      
      return mcpTool;
    });
  
  return [...tools, ...mcpTools];
}
