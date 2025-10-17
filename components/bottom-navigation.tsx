"use client";

import React, { useEffect, useState } from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  useTheme,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar
} from "@mui/material";
import {
  Chat as ChatIcon,
  Psychology as BrainIcon,
  Build as ToolsIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";
import useNavigationStore, { NavigationTab } from "@/stores/useNavigationStore";
import haptic from "@/lib/haptic";

interface TabItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
}

const tabs: TabItem[] = [
  { id: "chat", label: "Chat", icon: ChatIcon },
  { id: "memories", label: "Memories", icon: BrainIcon },
  { id: "tools", label: "Tools", icon: ToolsIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon }
];

export default function BottomNavigationComponent() {
  const theme = useTheme();
  const { activeTab, setActiveTab } = useNavigationStore();
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform for native styling
    const userAgent = navigator.userAgent || navigator.vendor;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/android/i.test(userAgent));
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: NavigationTab) => {
    if (activeTab === newValue) return;
    
    // Trigger haptic feedback
    haptic.trigger("selection");
    
    // Set active tab
    setActiveTab(newValue);
  };

  return (
    <>
      {/* Mobile and Tablet Bottom Navigation - Mobile First */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: { xs: 'block', lg: 'none' },
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: isIOS 
            ? 'rgba(255, 255, 255, 0.6)' 
            : theme.palette.background.paper,
          backdropFilter: isIOS ? 'saturate(180%) blur(20px)' : undefined,
          pb: 'env(safe-area-inset-bottom, 0px)'
        }}
        elevation={isAndroid ? 8 : 0}
      >
        <BottomNavigation
          value={activeTab}
          onChange={handleTabChange}
          showLabels
          sx={{
            backgroundColor: 'transparent',
            height: { xs: 56, md: 64 },
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 12px 8px',
              '&.Mui-selected': {
                '& .MuiSvgIcon-root': {
                  transform: 'scale(1.1)',
                  transition: 'transform 0.2s'
                }
              }
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              '&.Mui-selected': {
                fontSize: '0.75rem',
                fontWeight: 600
              }
            }
          }}
        >
          {tabs.map((tab) => (
            <BottomNavigationAction
              key={tab.id}
              label={tab.label}
              value={tab.id}
              icon={
                tab.id === "chat" && activeTab === "chat" ? (
                  <Badge 
                    variant="dot" 
                    color="primary"
                    sx={{ 
                      '& .MuiBadge-dot': { 
                        width: 6, 
                        height: 6,
                        minWidth: 6,
                        animation: 'pulse 2s infinite'
                      },
                      '@keyframes pulse': {
                        '0%': { opacity: 1, transform: 'scale(1)' },
                        '50%': { opacity: 0.7, transform: 'scale(1.2)' },
                        '100%': { opacity: 1, transform: 'scale(1)' }
                      }
                    }}
                  >
                    <tab.icon />
                  </Badge>
                ) : (
                  <tab.icon />
                )
              }
              sx={{
                color: isIOS ? 'text.secondary' : 'text.primary',
                '&.Mui-selected': {
                  color: theme.palette.primary.main
                }
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>

      {/* Desktop Sidebar Navigation - Progressive Enhancement */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            width: { lg: 80, xl: 256, '2xl': 288 },
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo/Brand area */}
          <Box 
            sx={{ 
              px: 2, 
              py: 3, 
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: { xs: 'none', xl: 'block' }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              AI Assistant
            </Typography>
          </Box>
          
          {/* Navigation Items */}
          <List sx={{ flex: 1, py: 2 }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <ListItem key={tab.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={isActive}
                    onClick={() => {
                      haptic.trigger("selection");
                      setActiveTab(tab.id);
                    }}
                    sx={{
                      mx: 1,
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.primary.main + '15',
                        '& .MuiListItemIcon-root': {
                          color: theme.palette.primary.main
                        },
                        '& .MuiListItemText-primary': {
                          color: theme.palette.primary.main,
                          fontWeight: 600
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.primary.main + '20'
                        }
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        minWidth: { lg: 'auto', xl: 56 },
                        justifyContent: 'center',
                        color: isActive ? theme.palette.primary.main : 'text.secondary'
                      }}
                    >
                      {tab.id === "chat" && (
                        <Badge 
                          variant="dot" 
                          color="error"
                          invisible={!isActive}
                          sx={{ 
                            '& .MuiBadge-dot': { 
                              width: 8, 
                              height: 8
                            }
                          }}
                        >
                          <Icon />
                        </Badge>
                      )}
                      {tab.id !== "chat" && <Icon />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={tab.label}
                      sx={{
                        display: { lg: 'none', xl: 'block' },
                        '& .MuiListItemText-primary': {
                          fontSize: '0.9rem'
                        }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          
          {/* User Profile Section - Only on larger screens */}
          <Box
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              p: 2,
              display: { xs: 'none', '2xl': 'block' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40,
                  bgcolor: theme.palette.grey[200]
                }}
              />
              <Box sx={{ display: { xs: 'none', '2xl': 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  User
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  user@example.com
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}