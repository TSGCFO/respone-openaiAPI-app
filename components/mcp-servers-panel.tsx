"use client";
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Switch,
  Stack,
  Button,
  Chip,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Key as KeyIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import useToolsStore from "@/stores/useToolsStore";
import McpServerDialog from "./mcp-server-dialog";
import type { McpServer } from "@/stores/useToolsStore";

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
    <Box>
      <Stack spacing={2}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Configure multiple MCP servers
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
            onClick={handleAdd}
            sx={{
              backgroundColor: "primary.main",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            Add Server
          </Button>
        </Box>

        {mcpServers.length === 0 ? (
          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              backgroundColor: "background.paper",
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No MCP servers configured
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Click "Add Server" to configure your first MCP server
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {mcpServers.map((server) => (
              <Box key={server.id}>
                <Card
                  variant="outlined"
                  sx={{
                    backgroundColor: server.enabled ? "background.paper" : "action.disabledBackground",
                    opacity: server.enabled ? 1 : 0.8,
                  }}
                >
                  <CardContent sx={{ pb: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {server.label}
                          </Typography>
                          {server.enabled && (
                            <CheckCircleIcon
                              sx={{ ml: 1, fontSize: 16, color: "success.main" }}
                            />
                          )}
                        </Box>
                        
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <Chip
                            icon={<LinkIcon />}
                            label={server.url}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.75rem" }}
                          />
                          {server.authToken && (
                            <Chip
                              icon={<KeyIcon />}
                              label="Auth"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: "0.75rem" }}
                            />
                          )}
                          {server.skip_approval && (
                            <Chip
                              label="Auto-approve"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: "0.75rem" }}
                            />
                          )}
                        </Stack>
                        
                        {server.allowed_tools && (
                          <Typography variant="caption" color="text.secondary">
                            Tools: {server.allowed_tools}
                          </Typography>
                        )}
                      </Box>
                      
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Tooltip title={server.enabled ? "Enabled" : "Disabled"}>
                          <Switch
                            size="small"
                            checked={server.enabled}
                            onChange={(e) => handleToggleEnabled(server.id, e.target.checked)}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "primary.main",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "primary.main",
                              },
                            }}
                          />
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(server)}
                          sx={{ color: "primary.main" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(server.id)}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>

      <McpServerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={editingServer}
      />
    </Box>
  );
}