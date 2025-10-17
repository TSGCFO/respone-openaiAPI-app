'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Fab,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Paper,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useMaterialTheme } from '@/components/theme/MaterialThemeProvider';
import { createRippleEffect, hapticFeedback } from '@/components/theme/materialUtilities';

export default function MaterialUIDemo() {
  const { mode, toggleColorMode } = useMaterialTheme();
  const [switchChecked, setSwitchChecked] = React.useState(false);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRippleEffect(e);
    hapticFeedback.medium();
  };

  return (
    <Box sx={{ p: 2, maxWidth: '800px', mx: 'auto' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ borderRadius: 2, mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Material You Demo
          </Typography>
          <IconButton
            color="inherit"
            onClick={toggleColorMode}
            aria-label="toggle theme"
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Typography Section */}
      <Card sx={{ mb: 3 }} elevation={1}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Material Design 3
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This is a demonstration of Material UI v5 with Material You theming.
            The theme supports dynamic colors, proper elevation, and Android-native experiences.
          </Typography>
        </CardContent>
      </Card>

      {/* Buttons Section */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Buttons & Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Button variant="contained" onClick={handleButtonClick}>
            Contained
          </Button>
          <Button variant="outlined" color="secondary">
            Outlined
          </Button>
          <Button variant="text" color="primary">
            Text Button
          </Button>
          <Button variant="contained" disabled>
            Disabled
          </Button>
        </Box>
        
        {/* Icon Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <IconButton color="primary" aria-label="edit">
            <EditIcon />
          </IconButton>
          <IconButton color="secondary" aria-label="delete">
            <DeleteIcon />
          </IconButton>
          <IconButton color="error" aria-label="favorite">
            <FavoriteIcon />
          </IconButton>
          <IconButton aria-label="share">
            <ShareIcon />
          </IconButton>
        </Box>

        {/* FAB */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Fab color="primary" aria-label="add">
            <AddIcon />
          </Fab>
          <Fab variant="extended" color="secondary">
            <AddIcon sx={{ mr: 1 }} />
            Extended FAB
          </Fab>
        </Box>
      </Paper>

      {/* Form Controls */}
      <Card sx={{ mb: 3 }} elevation={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Form Controls
          </Typography>
          
          <TextField
            label="Material You Input"
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            helperText="This input follows Material Design 3 guidelines"
          />
          
          <TextField
            label="Filled Input"
            variant="filled"
            fullWidth
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={switchChecked}
                onChange={(e) => setSwitchChecked(e.target.checked)}
                color="primary"
              />
            }
            label="Material You Switch"
          />
        </CardContent>
      </Card>

      {/* Chips */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <Typography variant="h6" gutterBottom>
          Chips
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="Default" />
          <Chip label="Primary" color="primary" />
          <Chip label="Secondary" color="secondary" variant="outlined" />
          <Chip label="Success" color="success" />
          <Chip label="Error" color="error" />
          <Chip label="Clickable" onClick={() => hapticFeedback.light()} />
          <Chip label="Deletable" onDelete={() => hapticFeedback.medium()} />
        </Box>
      </Paper>

      {/* Elevation Examples */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Material You Elevation Levels
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
          {[0, 1, 2, 3, 4, 5].map((elevation) => (
            <Paper
              key={elevation}
              elevation={elevation}
              sx={{
                p: 2,
                textAlign: 'center',
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h6">{elevation}dp</Typography>
              <Typography variant="caption" color="text.secondary">
                Level {elevation}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}