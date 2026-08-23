import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 };
const borderRadius = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 };
const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 2,
  },
};

const darkColors = {
  background: '#0C1524',
  backgroundAlt: '#101C2D',
  surface: '#152235',
  surfaceElevated: '#1B2A3F',
  surfaceSoft: '#24344A',
  glass: 'rgba(12, 21, 36, 0.86)',
  glassStrong: 'rgba(255, 255, 255, 0.12)',
  primary: '#4B8FF7',
  primarySoft: '#1B3B67',
  secondary: '#67C7E8',
  warning: '#F4B740',
  error: '#F05A67',
  success: '#42B978',
  mapOverlay: 'rgba(12, 21, 36, 0.86)',
  text: {
    primary: '#F5F7FA',
    secondary: '#C9D3DF',
    muted: '#8FA0B5',
    disabled: '#65758A',
    inverse: '#FFFFFF',
  },
  border: '#2B3B50',
  borderStrong: '#3A4C63',
};

const lightColors = {
  background: '#F3F6FA',
  backgroundAlt: '#E9EFF6',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  surfaceSoft: '#E8EEF6',
  glass: 'rgba(255, 255, 255, 0.9)',
  glassStrong: 'rgba(20, 32, 51, 0.1)',
  primary: '#1769D2',
  primarySoft: '#DCEAFF',
  secondary: '#08769A',
  warning: '#A85A00',
  error: '#C7353F',
  success: '#197645',
  mapOverlay: 'rgba(255, 255, 255, 0.9)',
  text: {
    primary: '#142033',
    secondary: '#405168',
    muted: '#687990',
    disabled: '#98A5B5',
    inverse: '#FFFFFF',
  },
  border: '#D9E1EA',
  borderStrong: '#C6D0DC',
};

export const createAppTheme = (isDark) => {
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  const colors = isDark ? darkColors : lightColors;

  return {
    ...base,
    dark: isDark,
    roundness: 12,
    colors: {
      ...base.colors,
      ...colors,
      primary: colors.primary,
      onPrimary: '#FFFFFF',
      primaryContainer: colors.primarySoft,
      onPrimaryContainer: colors.text.primary,
      secondary: colors.secondary,
      onSecondary: '#FFFFFF',
      background: colors.background,
      surface: colors.surface,
      surfaceVariant: colors.surfaceSoft,
      onSurface: colors.text.primary,
      onSurfaceVariant: colors.text.secondary,
      outline: colors.borderStrong,
      outlineVariant: colors.border,
      error: colors.error,
      onError: '#FFFFFF',
      elevation: {
        ...base.colors.elevation,
        level0: colors.background,
        level1: colors.surface,
        level2: colors.surfaceElevated,
        level3: colors.surfaceElevated,
        level4: colors.surfaceSoft,
        level5: colors.surfaceSoft,
      },
    },
    gradients: {
      weather: isDark
        ? ['#1769D2', '#08769A', '#153151']
        : ['#2378DC', '#129BC2', '#14688C'],
      emergency: ['#D33A45', '#A51F2A'],
    },
    spacing,
    borderRadius,
    shadows,
  };
};

export const THEME = createAppTheme(true);
