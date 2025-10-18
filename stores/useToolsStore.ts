import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultVectorStore } from "@/config/constants";

type File = {
  id: string;
  name: string;
  content: string;
};

type VectorStore = {
  id: string;
  name: string;
  files?: File[];
};

export type WebSearchConfig = {
  user_location?: {
    type: "approximate";
    country?: string;
    city?: string;
    region?: string;
  };
};

export type McpServer = {
  id: string;
  label: string;
  url: string;
  allowed_tools: string;
  skip_approval: boolean;
  authToken?: string;
  enabled: boolean;
};

// Legacy config type for migration
export type McpConfig = {
  server_label: string;
  server_url: string;
  allowed_tools: string;
  skip_approval: boolean;
  mcpAuthToken?: string;
};

interface StoreState {
  fileSearchEnabled: boolean;
  //previousFileSearchEnabled: boolean;
  setFileSearchEnabled: (enabled: boolean) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  functionsEnabled: boolean;
  //previousFunctionsEnabled: boolean;
  setFunctionsEnabled: (enabled: boolean) => void;
  googleIntegrationEnabled: boolean;
  setGoogleIntegrationEnabled: (enabled: boolean) => void;
  codeInterpreterEnabled: boolean;
  setCodeInterpreterEnabled: (enabled: boolean) => void;
  vectorStore: VectorStore | null;
  setVectorStore: (store: VectorStore) => void;
  webSearchConfig: WebSearchConfig;
  setWebSearchConfig: (config: WebSearchConfig) => void;
  mcpEnabled: boolean;
  setMcpEnabled: (enabled: boolean) => void;
  // Legacy single MCP config for backwards compatibility
  mcpConfig: McpConfig;
  setMcpConfig: (config: McpConfig) => void;
  // Multiple MCP servers support
  mcpServers: McpServer[];
  addMcpServer: (server: Omit<McpServer, 'id'>) => void;
  updateMcpServer: (id: string, server: Partial<McpServer>) => void;
  removeMcpServer: (id: string) => void;
  setMcpServers: (servers: McpServer[]) => void;
}

// Helper function to generate unique ID
const generateId = () => `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to migrate legacy config to new format
const migrateLegacyConfig = (config: McpConfig): McpServer | null => {
  if (!config.server_url || !config.server_label) return null;
  return {
    id: generateId(),
    label: config.server_label,
    url: config.server_url,
    allowed_tools: config.allowed_tools,
    skip_approval: config.skip_approval,
    authToken: config.mcpAuthToken,
    enabled: true,
  };
};

const useToolsStore = create<StoreState>()(
  persist(
    (set, get) => ({
      vectorStore: defaultVectorStore.id !== "" ? defaultVectorStore : null,
      webSearchConfig: {
        user_location: {
          type: "approximate",
          country: "",
          city: "",
          region: "",
        },
      },
      mcpConfig: {
        server_label: "",
        server_url: "",
        allowed_tools: "",
        skip_approval: true,
        mcpAuthToken: "",
      },
      mcpServers: [],
      fileSearchEnabled: false,
      previousFileSearchEnabled: false,
      setFileSearchEnabled: (enabled) => {
        set({ fileSearchEnabled: enabled });
      },
      webSearchEnabled: false,
      setWebSearchEnabled: (enabled) => {
        set({ webSearchEnabled: enabled });
      },
      functionsEnabled: true,
      previousFunctionsEnabled: true,
      setFunctionsEnabled: (enabled) => {
        set({ functionsEnabled: enabled });
      },
      googleIntegrationEnabled: false,
      setGoogleIntegrationEnabled: (enabled) => {
        set({ googleIntegrationEnabled: enabled });
      },
      mcpEnabled: false,
      setMcpEnabled: (enabled) => {
        set({ mcpEnabled: enabled });
      },
      codeInterpreterEnabled: false,
      setCodeInterpreterEnabled: (enabled) => {
        set({ codeInterpreterEnabled: enabled });
      },
      setVectorStore: (store) => set({ vectorStore: store }),
      setWebSearchConfig: (config) => set({ webSearchConfig: config }),
      setMcpConfig: (config) => {
        set({ mcpConfig: config });
        // Auto-migrate to new format when legacy config is set
        const migrated = migrateLegacyConfig(config);
        if (migrated && !get().mcpServers.find(s => s.url === migrated.url)) {
          set(state => ({ mcpServers: [...state.mcpServers, migrated] }));
        }
      },
      addMcpServer: (server) => {
        const newServer: McpServer = {
          ...server,
          id: generateId(),
        };
        set(state => ({ mcpServers: [...state.mcpServers, newServer] }));
      },
      updateMcpServer: (id, updates) => {
        set(state => ({
          mcpServers: state.mcpServers.map(server =>
            server.id === id ? { ...server, ...updates } : server
          ),
        }));
      },
      removeMcpServer: (id) => {
        set(state => ({
          mcpServers: state.mcpServers.filter(server => server.id !== id),
        }));
      },
      setMcpServers: (servers) => set({ mcpServers: servers }),
    }),
    {
      name: "tools-store",
      onRehydrateStorage: () => (state) => {
        // Migrate legacy config on storage rehydration
        if (state && state.mcpConfig && state.mcpServers.length === 0) {
          const migrated = migrateLegacyConfig(state.mcpConfig);
          if (migrated) {
            state.mcpServers = [migrated];
          }
        }
      },
    }
  )
);

export default useToolsStore;
