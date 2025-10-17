import { createTheme, alpha } from '@mui/material/styles';

// Material Design 3 color tokens
export const materialYouColors = {
  // Primary colors (Dynamic purple/violet)
  primary: {
    0: '#000000',
    10: '#21005D',
    20: '#381E72',
    30: '#4F378B',
    40: '#6750A4',
    50: '#7F67BE',
    60: '#9A82DB',
    70: '#B69DF8',
    80: '#D0BCFF',
    90: '#EADDFF',
    95: '#F6EDFF',
    99: '#FFFBFE',
    100: '#FFFFFF',
  },
  // Secondary colors (Complementary tones)
  secondary: {
    0: '#000000',
    10: '#1D192B',
    20: '#332D41',
    30: '#4A4458',
    40: '#625B71',
    50: '#7A7289',
    60: '#958DA5',
    70: '#B0A7C0',
    80: '#CCC2DC',
    90: '#E8DEF8',
    95: '#F6EDFF',
    99: '#FFFBFE',
    100: '#FFFFFF',
  },
  // Tertiary colors (Accent)
  tertiary: {
    0: '#000000',
    10: '#31111D',
    20: '#492532',
    30: '#633B48',
    40: '#7D5260',
    50: '#986977',
    60: '#B58392',
    70: '#D29DAC',
    80: '#EFB8C8',
    90: '#FFD8E4',
    95: '#FFECF1',
    99: '#FFFBFA',
    100: '#FFFFFF',
  },
  // Error colors
  error: {
    0: '#000000',
    10: '#410E0B',
    20: '#601410',
    30: '#8C1D18',
    40: '#B3261E',
    50: '#DC362E',
    60: '#E46962',
    70: '#EC928E',
    80: '#F2B8B5',
    90: '#F9DEDC',
    95: '#FCEEEE',
    99: '#FFFBF9',
    100: '#FFFFFF',
  },
  // Neutral colors (Surface and background)
  neutral: {
    0: '#000000',
    10: '#1C1B1F',
    20: '#313033',
    30: '#484649',
    40: '#605D62',
    50: '#787579',
    60: '#939094',
    70: '#AEAAAE',
    80: '#C9C5CA',
    90: '#E6E1E5',
    95: '#F4EFF4',
    99: '#FFFBFE',
    100: '#FFFFFF',
  },
  // Neutral variant colors (Surface variants)
  neutralVariant: {
    0: '#000000',
    10: '#1D1A22',
    20: '#322F37',
    30: '#49454F',
    40: '#605D66',
    50: '#79747E',
    60: '#938F99',
    70: '#AEA9B4',
    80: '#CAC4D0',
    90: '#E7E0EC',
    95: '#F5EEFA',
    99: '#FFFBFE',
    100: '#FFFFFF',
  },
};

// Material Design 3 elevation levels
export const md3Elevations = {
  level0: '0dp',
  level1: '1dp',
  level2: '3dp',
  level3: '6dp',
  level4: '8dp',
  level5: '12dp',
};

// Convert elevation to box shadow
export const getElevation = (level: number): string => {
  const elevations = {
    0: 'none',
    1: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
    2: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
    3: '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)',
    4: '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.3)',
    5: '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.3)',
  };
  return elevations[level as keyof typeof elevations] || elevations[0];
};

// Material You shape system (MD3 guidelines)
export const md3Shapes = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: '50%',
};

// Material motion constants
export const materialMotion = {
  duration: {
    short1: 50,
    short2: 100,
    short3: 150,
    short4: 200,
    medium1: 250,
    medium2: 300,
    medium3: 350,
    medium4: 400,
    long1: 450,
    long2: 500,
    long3: 550,
    long4: 600,
    extraLong1: 700,
    extraLong2: 800,
    extraLong3: 900,
    extraLong4: 1000,
  },
  easing: {
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
    standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    linear: 'linear',
  },
};

// Create Material You theme for light mode
export const createMaterialYouTheme = (mode: 'light' | 'dark') => {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isLight ? materialYouColors.primary[40] : materialYouColors.primary[80],
        light: isLight ? materialYouColors.primary[30] : materialYouColors.primary[90],
        dark: isLight ? materialYouColors.primary[50] : materialYouColors.primary[70],
        contrastText: isLight ? materialYouColors.primary[100] : materialYouColors.primary[20],
      },
      secondary: {
        main: isLight ? materialYouColors.secondary[40] : materialYouColors.secondary[80],
        light: isLight ? materialYouColors.secondary[30] : materialYouColors.secondary[90],
        dark: isLight ? materialYouColors.secondary[50] : materialYouColors.secondary[70],
        contrastText: isLight ? materialYouColors.secondary[100] : materialYouColors.secondary[20],
      },
      error: {
        main: isLight ? materialYouColors.error[40] : materialYouColors.error[80],
        light: isLight ? materialYouColors.error[30] : materialYouColors.error[90],
        dark: isLight ? materialYouColors.error[50] : materialYouColors.error[70],
        contrastText: isLight ? materialYouColors.error[100] : materialYouColors.error[20],
      },
      warning: {
        main: isLight ? '#F9AB00' : '#F9CC4F',
        light: isLight ? '#FDD663' : '#FCE192',
        dark: isLight ? '#E37400' : '#F4B400',
        contrastText: isLight ? '#FFFFFF' : '#3E2723',
      },
      info: {
        main: isLight ? '#1E88E5' : '#64B5F6',
        light: isLight ? '#42A5F5' : '#90CAF9',
        dark: isLight ? '#1565C0' : '#42A5F5',
        contrastText: '#FFFFFF',
      },
      success: {
        main: isLight ? '#43A047' : '#81C784',
        light: isLight ? '#66BB6A' : '#A5D6A7',
        dark: isLight ? '#2E7D32' : '#66BB6A',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isLight ? materialYouColors.neutral[99] : materialYouColors.neutral[10],
        paper: isLight ? materialYouColors.neutral[99] : materialYouColors.neutral[10],
      },
      text: {
        primary: isLight ? materialYouColors.neutral[10] : materialYouColors.neutral[90],
        secondary: isLight ? materialYouColors.neutralVariant[30] : materialYouColors.neutralVariant[80],
        disabled: isLight ? alpha(materialYouColors.neutral[10], 0.38) : alpha(materialYouColors.neutral[90], 0.38),
      },
      divider: isLight ? materialYouColors.neutralVariant[50] : materialYouColors.neutralVariant[30],
      action: {
        active: isLight ? materialYouColors.neutral[10] : materialYouColors.neutral[90],
        hover: isLight ? alpha(materialYouColors.neutral[10], 0.04) : alpha(materialYouColors.neutral[90], 0.08),
        selected: isLight ? alpha(materialYouColors.primary[40], 0.08) : alpha(materialYouColors.primary[80], 0.16),
        disabled: isLight ? alpha(materialYouColors.neutral[10], 0.26) : alpha(materialYouColors.neutral[90], 0.26),
        disabledBackground: isLight ? alpha(materialYouColors.neutral[10], 0.12) : alpha(materialYouColors.neutral[90], 0.12),
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.125rem',
        fontWeight: 400,
        lineHeight: 1.235,
        letterSpacing: 0,
      },
      h2: {
        fontSize: '1.5rem',
        fontWeight: 400,
        lineHeight: 1.334,
        letterSpacing: 0,
      },
      h3: {
        fontSize: '1.25rem',
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: 0,
      },
      h4: {
        fontSize: '1.125rem',
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: 0,
      },
      h5: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: 0,
      },
      h6: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.6,
        letterSpacing: 0.0075,
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: 0.00938,
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.43,
        letterSpacing: 0.01071,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.75,
        letterSpacing: 0.02857,
        textTransform: 'none', // MD3 doesn't use uppercase for buttons
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.66,
        letterSpacing: 0.03333,
      },
    },
    shape: {
      borderRadius: md3Shapes.medium,
    },
    shadows: [
      'none',
      getElevation(1),
      getElevation(1),
      getElevation(2),
      getElevation(2),
      getElevation(2),
      getElevation(3),
      getElevation(3),
      getElevation(3),
      getElevation(3),
      getElevation(4),
      getElevation(4),
      getElevation(4),
      getElevation(4),
      getElevation(4),
      getElevation(4),
      getElevation(5),
      getElevation(5),
      getElevation(5),
      getElevation(5),
      getElevation(5),
      getElevation(5),
      getElevation(5),
      getElevation(5),
      getElevation(5),
    ],
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: md3Shapes.large,
            textTransform: 'none',
            minHeight: 40,
            transition: `all ${materialMotion.duration.medium1}ms ${materialMotion.easing.emphasized}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: `all ${materialMotion.duration.medium1}ms ${materialMotion.easing.emphasized}`,
          },
          rounded: {
            borderRadius: md3Shapes.medium,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: md3Shapes.large,
            transition: `all ${materialMotion.duration.medium1}ms ${materialMotion.easing.emphasized}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: md3Shapes.small,
            transition: `all ${materialMotion.duration.short4}ms ${materialMotion.easing.emphasized}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: md3Shapes.small,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: md3Shapes.extraLarge,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: md3Shapes.large,
            boxShadow: getElevation(3),
            '&:hover': {
              boxShadow: getElevation(4),
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: md3Shapes.small,
            backgroundColor: isLight ? materialYouColors.neutralVariant[30] : materialYouColors.neutralVariant[90],
            color: isLight ? materialYouColors.neutralVariant[90] : materialYouColors.neutralVariant[30],
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isLight ? materialYouColors.neutral[95] : materialYouColors.neutral[10],
            color: isLight ? materialYouColors.neutral[10] : materialYouColors.neutral[90],
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            borderRadius: 0,
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? materialYouColors.neutral[95] : materialYouColors.neutral[20],
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: md3Shapes.large,
            transition: `all ${materialMotion.duration.short4}ms ${materialMotion.easing.emphasized}`,
            '&.Mui-selected': {
              backgroundColor: isLight ? alpha(materialYouColors.primary[40], 0.12) : alpha(materialYouColors.primary[80], 0.12),
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: `all ${materialMotion.duration.short4}ms ${materialMotion.easing.emphasized}`,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-track': {
              borderRadius: md3Shapes.full,
            },
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          thumb: {
            transition: `all ${materialMotion.duration.short4}ms ${materialMotion.easing.emphasized}`,
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? alpha(materialYouColors.neutral[0], 0.4) : alpha(materialYouColors.neutral[0], 0.8),
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiPaper-root': {
              borderRadius: md3Shapes.small,
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: md3Shapes.small,
            marginTop: 8,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: md3Shapes.medium,
          },
        },
      },
    },
  });
};

// Export default light theme
export const materialYouLightTheme = createMaterialYouTheme('light');
export const materialYouDarkTheme = createMaterialYouTheme('dark');