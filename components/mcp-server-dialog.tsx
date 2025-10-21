"use client";
import React, { useState, useEffect } from "react";
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-t-2xl">
            <h2 className="text-xl font-bold">
              {initialData ? "Edit MCP Server" : "Add MCP Server"}
            </h2>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Server Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Server Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={handleChange("label")}
                placeholder="My MCP Server"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                  errors.label 
                    ? 'border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
              />
              <p className={`text-xs mt-1 ${errors.label ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {errors.label || "A friendly name for this server"}
              </p>
            </div>
            
            {/* Server URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Server URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={handleChange("url")}
                placeholder="https://example.com/mcp"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                  errors.url 
                    ? 'border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
              />
              <p className={`text-xs mt-1 ${errors.url ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {errors.url || "The MCP server endpoint URL"}
              </p>
            </div>
            
            {/* Allowed Tools */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Allowed Tools
              </label>
              <input
                type="text"
                value={formData.allowed_tools}
                onChange={handleChange("allowed_tools")}
                placeholder="tool1,tool2,tool3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Comma-separated list of allowed tool names (leave empty for all)
              </p>
            </div>
            
            {/* Auth Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Auth Token
              </label>
              <input
                type="password"
                value={formData.authToken}
                onChange={handleChange("authToken")}
                placeholder="Bearer token"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Bearer token for authentication (optional)
              </p>
            </div>
            
            {/* Skip Approval Switch */}
            <div className="flex items-start gap-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, skip_approval: !prev.skip_approval }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.skip_approval ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.skip_approval ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Skip approval
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically approve tool calls from this server
                </p>
              </div>
            </div>
            
            {/* Enable Server Switch */}
            <div className="flex items-start gap-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.enabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable server
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Server will be active immediately when enabled
                </p>
              </div>
            </div>
            
            {/* Error Alert */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                <p className="text-sm">Please fix the errors above before saving</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-lg hover:shadow-xl active:scale-95"
            >
              {initialData ? "Update" : "Add"} Server
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}