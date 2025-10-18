"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Alert,
  Stack,
} from "@mui/material";
import type { McpServer } from "@/stores/useToolsStore";

interface McpServerDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (server: Omit<McpServer, 'id'>) => void;
  initialData: McpServer | null;
}

export default function McpServerDialog({
  open,
  onClose,
  onSave,
  initialData,
}: McpServerDialogProps) {
  const [formData, setFormData] = useState<Omit<McpServer, 'id'>>({
    label: "",
    url: "",
    allowed_tools: "",
    skip_approval: true,
    authToken: "",
    enabled: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        label: initialData.label,
        url: initialData.url,
        allowed_tools: initialData.allowed_tools,
        skip_approval: initialData.skip_approval,
        authToken: initialData.authToken || "",
        enabled: initialData.enabled,
      });
    } else {
      setFormData({
        label: "",
        url: "",
        allowed_tools: "",
        skip_approval: true,
        authToken: "",
        enabled: true,
      });
    }
    setErrors({});
  }, [initialData, open]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};
    
    if (!formData.label.trim()) {
      newErrors.label = "Server label is required";
    }
    
    if (!formData.url.trim()) {
      newErrors.url = "Server URL is required";
    } else if (!formData.url.match(/^https?:\/\/.+/)) {
      newErrors.url = "Please enter a valid URL starting with http:// or https://";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === "skip_approval" || field === "enabled" 
      ? (event.target as HTMLInputElement).checked 
      : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: 'primary.main', 
        color: 'primary.contrastText',
        fontWeight: 600,
      }}>
        {initialData ? "Edit MCP Server" : "Add MCP Server"}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Server Label"
            fullWidth
            value={formData.label}
            onChange={handleChange("label")}
            error={!!errors.label}
            helperText={errors.label || "A friendly name for this server"}
            required
            variant="outlined"
            size="small"
          />
          
          <TextField
            label="Server URL"
            fullWidth
            value={formData.url}
            onChange={handleChange("url")}
            error={!!errors.url}
            helperText={errors.url || "The MCP server endpoint URL"}
            required
            placeholder="https://example.com/mcp"
            variant="outlined"
            size="small"
          />
          
          <TextField
            label="Allowed Tools"
            fullWidth
            value={formData.allowed_tools}
            onChange={handleChange("allowed_tools")}
            helperText="Comma-separated list of allowed tool names (leave empty for all)"
            placeholder="tool1,tool2,tool3"
            variant="outlined"
            size="small"
          />
          
          <TextField
            label="Auth Token"
            fullWidth
            value={formData.authToken}
            onChange={handleChange("authToken")}
            helperText="Bearer token for authentication (optional)"
            placeholder="Bearer token"
            type="password"
            variant="outlined"
            size="small"
          />
          
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.skip_approval}
                  onChange={handleChange("skip_approval")}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "primary.main",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "primary.main",
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Skip approval</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatically approve tool calls from this server
                  </Typography>
                </Box>
              }
            />
          </Box>
          
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled}
                  onChange={handleChange("enabled")}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "success.main",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "success.main",
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Enable server</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Server will be active immediately when enabled
                  </Typography>
                </Box>
              }
            />
          </Box>
          
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Please fix the errors above before saving
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          sx={{
            backgroundColor: "primary.main",
            "&:hover": {
              backgroundColor: "primary.dark",
            },
          }}
        >
          {initialData ? "Update" : "Add"} Server
        </Button>
      </DialogActions>
    </Dialog>
  );
}