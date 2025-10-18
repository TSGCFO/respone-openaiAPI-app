"use client";
import React from "react";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Chip,
  Stack,
  Typography,
  useTheme,
  SelectChangeEvent,
  alpha,
} from "@mui/material";
import {
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Bolt as BoltIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import useConversationStore from "@/stores/useConversationStore";

const MODEL_OPTIONS = [
  { value: "gpt-4.1", label: "GPT-4.1", icon: PsychologyIcon },
  { value: "gpt-5", label: "GPT-5", icon: BoltIcon },
  { value: "gpt-5-pro", label: "GPT-5 Pro", icon: SchoolIcon },
];

const REASONING_EFFORTS = [
  { value: "low", label: "Low", icon: SpeedIcon },
  { value: "medium", label: "Medium", icon: PsychologyIcon },
  { value: "high", label: "High", icon: SchoolIcon },
];

export default function ModelSelector() {
  const theme = useTheme();
  const { selectedModel, setSelectedModel, reasoningEffort, setReasoningEffort } = useConversationStore();

  const handleModelChange = (event: SelectChangeEvent) => {
    setSelectedModel(event.target.value);
  };

  const handleReasoningEffortChange = (effort: 'low' | 'medium' | 'high') => {
    setReasoningEffort(effort);
  };

  const showReasoningEffort = selectedModel === "gpt-5" || selectedModel === "gpt-5-pro";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <FormControl 
        size="small" 
        sx={{ 
          minWidth: 140,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          borderRadius: 1,
          "& .MuiOutlinedInput-root": {
            "&.Mui-focused fieldset": {
              borderColor: theme.palette.primary.main,
            },
          },
        }}
      >
        <Select
          value={selectedModel}
          onChange={handleModelChange}
          displayEmpty
          sx={{
            "& .MuiSelect-select": {
              display: "flex",
              alignItems: "center",
              py: 1,
              px: 1.5,
            },
            fontSize: "0.875rem",
          }}
        >
          {MODEL_OPTIONS.map((model) => {
            const Icon = model.icon;
            return (
              <MenuItem 
                key={model.value} 
                value={model.value}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontSize: "0.875rem",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                  "&.Mui-selected": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.16),
                    },
                  },
                }}
              >
                <Icon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                <Typography variant="body2">{model.label}</Typography>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {showReasoningEffort && (
        <Stack 
          direction="row" 
          spacing={0.5}
          sx={{
            animation: "fadeIn 0.3s ease-in-out",
            "@keyframes fadeIn": {
              from: { opacity: 0, transform: "translateX(-10px)" },
              to: { opacity: 1, transform: "translateX(0)" },
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              mr: 0.5,
              color: "text.secondary",
              fontWeight: 500,
            }}
          >
            Reasoning:
          </Typography>
          {REASONING_EFFORTS.map((effort) => {
            const Icon = effort.icon;
            const isSelected = reasoningEffort === effort.value;
            return (
              <Chip
                key={effort.value}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Icon sx={{ fontSize: 14 }} />
                    <span>{effort.label}</span>
                  </Box>
                }
                onClick={() => handleReasoningEffortChange(effort.value as 'low' | 'medium' | 'high')}
                size="small"
                sx={{
                  height: 28,
                  backgroundColor: isSelected 
                    ? theme.palette.primary.main
                    : alpha(theme.palette.action.selected, 0.08),
                  color: isSelected
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.secondary,
                  borderColor: isSelected
                    ? theme.palette.primary.main
                    : theme.palette.divider,
                  borderWidth: 1,
                  borderStyle: "solid",
                  "&:hover": {
                    backgroundColor: isSelected
                      ? theme.palette.primary.dark
                      : alpha(theme.palette.action.selected, 0.16),
                  },
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: isSelected ? 600 : 400,
                  "& .MuiChip-label": {
                    px: 1,
                  },
                }}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
}