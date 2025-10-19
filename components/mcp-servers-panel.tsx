"use client";
import React, { useState } from "react";
import useToolsStore from "@/stores/useToolsStore";
import McpServerDialog from "./mcp-server-dialog";
import type { McpServer } from "@/stores/useToolsStore";

// Icon components
const AddIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

const LinkIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
  </svg>
);

const KeyIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

// Switch component
const Switch = ({ checked, onChange, disabled = false }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default function McpServersPanel() {
  const { mcpServers, updateMcpServer, removeMcpServer, addMcpServer } = useToolsStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);

  const handleAdd = () => {
    setEditingServer(null);
    setDialogOpen(true);
  };

  const handleEdit = (server: McpServer) => {
    setEditingServer(server);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this MCP server?")) {
      removeMcpServer(id);
    }
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    updateMcpServer(id, { enabled });
  };

  const handleSave = (server: Omit<McpServer, 'id'>) => {
    if (editingServer) {
      updateMcpServer(editingServer.id, server);
    } else {
      addMcpServer(server);
    }
    setDialogOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">MCP Servers</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Configure multiple MCP servers
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
        >
          <AddIcon />
          <span>Add Server</span>
        </button>
      </div>

      {/* Servers List */}
      <div className="flex-1 overflow-y-auto">
        {mcpServers.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              No MCP servers configured
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Click "Add Server" to configure your first MCP server
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mcpServers.map((server) => (
              <div
                key={server.id}
                className={`border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all duration-200 ${
                  server.enabled 
                    ? 'bg-white dark:bg-gray-800 shadow-sm' 
                    : 'bg-gray-50 dark:bg-gray-900 opacity-75'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                        {server.label}
                      </h4>
                      {server.enabled && (
                        <CheckCircleIcon className="text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                        <LinkIcon />
                        {server.url}
                      </span>
                      {server.authToken && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                          <KeyIcon />
                          Auth
                        </span>
                      )}
                      {server.skip_approval && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                          Auto-approve
                        </span>
                      )}
                    </div>
                    
                    {server.allowed_tools && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tools: {server.allowed_tools}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={server.enabled}
                      onChange={(checked) => handleToggleEnabled(server.id, checked)}
                    />
                    <button
                      onClick={() => handleEdit(server)}
                      className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(server.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <McpServerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={editingServer}
      />
    </div>
  );
}