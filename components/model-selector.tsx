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
  useMediaQuery,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { selectedModel, setSelectedModel, reasoningEffort, setReasoningEffort } = useConversationStore();

  const handleModelChange = (event: SelectChangeEvent) => {
    setSelectedModel(event.target.value);
  };

  const handleReasoningEffortChange = (effort: 'low' | 'medium' | 'high') => {
    setReasoningEffort(effort);
  };

  const showReasoningEffort = selectedModel === "gpt-5" || selectedModel === "gpt-5-pro";

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" }, 
        gap: { xs: 1, sm: 2 },
        width: "100%",
      }}
    >
      <FormControl 
        size="small" 
        sx={{ 
          minWidth: { xs: 100, sm: 140 },
          flexShrink: 0,
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
              py: { xs: 0.75, sm: 1 },
              px: { xs: 1, sm: 1.5 },
            },
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
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
                <Icon sx={{ fontSize: { xs: 16, sm: 18 }, color: theme.palette.primary.main }} />
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{isMobile ? model.label.replace('GPT-', '') : model.label}</Typography>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {showReasoningEffort && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            width: { xs: "100%", sm: "auto" },
            overflowX: { xs: "auto", sm: "visible" },
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
            px: { xs: 0.5, sm: 0 },
            animation: "fadeIn 0.3s ease-in-out",
            "@keyframes fadeIn": {
              from: { opacity: 0, transform: isMobile ? "translateY(-10px)" : "translateX(-10px)" },
              to: { opacity: 1, transform: isMobile ? "translateY(0)" : "translateX(0)" },
            },
          }}
        >
          {!isMobile && (
            <Typography
              variant="caption"
              sx={{
                alignItems: "center",
                mr: 0.5,
                color: "text.secondary",
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Reasoning:
            </Typography>
          )}
          <Stack 
            direction="row" 
            spacing={0.5}
            sx={{
              flexShrink: 0,
              minWidth: "max-content",
            }}
          >
            {REASONING_EFFORTS.map((effort) => {
              const Icon = effort.icon;
              const isSelected = reasoningEffort === effort.value;
              return (
                <Chip
                  key={effort.value}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Icon sx={{ fontSize: { xs: 16, sm: 14 } }} />
                      <span>{effort.label}</span>
                    </Box>
                  }
                  onClick={() => handleReasoningEffortChange(effort.value as 'low' | 'medium' | 'high')}
                  size={isMobile ? "medium" : "small"}
                  sx={{
                    height: { xs: 40, sm: 28 },
                    minWidth: { xs: 72, sm: "auto" },
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
                    fontSize: { xs: "0.875rem", sm: "0.75rem" },
                    fontWeight: isSelected ? 600 : 400,
                    "& .MuiChip-label": {
                      px: { xs: 1.5, sm: 1 },
                      py: { xs: 1.5, sm: 1 },
                    },
                    // Ensure minimum touch target for Android (48px)
                    "@media (hover: none)": {
                      minHeight: 48,
                      "& .MuiChip-label": {
                        py: 1.5,
                      },
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
}