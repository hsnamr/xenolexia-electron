/**
 * Theme Definitions - Complete theme configurations
 */

import {palette, fontSize, fontWeight, lineHeight, spacing, borderRadius, shadows} from './tokens';

// ============================================================================
// Theme Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'sepia' | 'system';
export type ReaderTheme = 'light' | 'dark' | 'sepia';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Primary brand color
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryLight: string;
  onPrimary: string;

  // Accent color
  accent: string;
  accentLight: string;
  onAccent: string;

  // Borders & dividers
  border: string;
  borderLight: string;
  divider: string;

  // Foreign word highlighting
  foreignWord: string;
  foreignWordBg: string;
  foreignWordBorder: string;

  // Semantic colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Interactive states
  disabled: string;
  disabledText: string;
  placeholder: string;

  // Overlay
  overlay: string;
  overlayLight: string;

  // Tab bar
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export interface Theme {
  mode: ReaderTheme;
  isDark: boolean;
  colors: ThemeColors;
}

// ============================================================================
// Light Theme
// ============================================================================

export const lightTheme: Theme = {
  mode: 'light',
  isDark: false,
  colors: {
    // Backgrounds
    background: palette.white,
    backgroundSecondary: palette.slate50,
    surface: palette.white,
    surfaceHover: palette.slate50,
    surfaceActive: palette.slate100,

    // Text
    text: palette.slate900,
    textSecondary: palette.slate600,
    textTertiary: palette.slate400,
    textInverse: palette.white,

    // Primary
    primary: palette.sky500,
    primaryHover: palette.sky600,
    primaryActive: palette.sky700,
    primaryLight: palette.sky100,
    onPrimary: palette.white,

    // Accent
    accent: palette.violet500,
    accentLight: palette.violet100,
    onAccent: palette.white,

    // Borders
    border: palette.slate200,
    borderLight: palette.slate100,
    divider: palette.slate200,

    // Foreign words
    foreignWord: palette.indigo600,
    foreignWordBg: palette.indigo50,
    foreignWordBorder: palette.indigo200,

    // Semantic
    success: palette.green600,
    successLight: palette.green50,
    warning: palette.yellow500,
    warningLight: palette.yellow50,
    error: palette.red500,
    errorLight: palette.red50,
    info: palette.sky500,
    infoLight: palette.sky50,

    // Interactive
    disabled: palette.slate200,
    disabledText: palette.slate400,
    placeholder: palette.slate400,

    // Overlay
    overlay: 'rgba(15, 23, 42, 0.5)',
    overlayLight: 'rgba(15, 23, 42, 0.2)',

    // Tab bar
    tabBarBackground: palette.white,
    tabBarBorder: palette.slate200,
    tabBarActive: palette.sky500,
    tabBarInactive: palette.slate400,
  },
};

// ============================================================================
// Dark Theme
// ============================================================================

export const darkTheme: Theme = {
  mode: 'dark',
  isDark: true,
  colors: {
    // Backgrounds
    background: palette.slate900,
    backgroundSecondary: palette.slate950,
    surface: palette.slate800,
    surfaceHover: palette.slate700,
    surfaceActive: palette.slate600,

    // Text
    text: palette.slate100,
    textSecondary: palette.slate400,
    textTertiary: palette.slate500,
    textInverse: palette.slate900,

    // Primary
    primary: palette.sky400,
    primaryHover: palette.sky300,
    primaryActive: palette.sky200,
    primaryLight: palette.sky900,
    onPrimary: palette.slate900,

    // Accent
    accent: palette.violet400,
    accentLight: palette.violet900,
    onAccent: palette.slate900,

    // Borders
    border: palette.slate700,
    borderLight: palette.slate800,
    divider: palette.slate700,

    // Foreign words
    foreignWord: palette.indigo400,
    foreignWordBg: palette.indigo900,
    foreignWordBorder: palette.indigo700,

    // Semantic
    success: palette.green500,
    successLight: 'rgba(34, 197, 94, 0.15)',
    warning: palette.yellow500,
    warningLight: 'rgba(234, 179, 8, 0.15)',
    error: palette.red400,
    errorLight: 'rgba(239, 68, 68, 0.15)',
    info: palette.sky400,
    infoLight: 'rgba(56, 189, 248, 0.15)',

    // Interactive
    disabled: palette.slate700,
    disabledText: palette.slate500,
    placeholder: palette.slate500,

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',

    // Tab bar
    tabBarBackground: palette.slate800,
    tabBarBorder: palette.slate700,
    tabBarActive: palette.sky400,
    tabBarInactive: palette.slate500,
  },
};

// ============================================================================
// Sepia Theme (Warm, book-like reading experience)
// ============================================================================

export const sepiaTheme: Theme = {
  mode: 'sepia',
  isDark: false,
  colors: {
    // Backgrounds - warm paper-like
    background: '#f8f4e9',
    backgroundSecondary: '#f0ebe0',
    surface: '#f8f4e9',
    surfaceHover: '#efe9dc',
    surfaceActive: '#e5dece',

    // Text - warm brown tones
    text: '#433422',
    textSecondary: '#6b5c4a',
    textTertiary: '#9a8b79',
    textInverse: '#f8f4e9',

    // Primary - warm amber/gold
    primary: palette.amber700,
    primaryHover: palette.amber800,
    primaryActive: palette.amber900,
    primaryLight: '#fef3c7',
    onPrimary: palette.white,

    // Accent - sienna brown
    accent: '#8b4513',
    accentLight: '#f5e6c8',
    onAccent: palette.white,

    // Borders
    border: '#d4c4a8',
    borderLight: '#e5dece',
    divider: '#d4c4a8',

    // Foreign words
    foreignWord: '#8b4513',
    foreignWordBg: '#fef3c7',
    foreignWordBorder: '#e5c890',

    // Semantic
    success: palette.green700,
    successLight: '#dcfce7',
    warning: palette.amber600,
    warningLight: palette.amber100,
    error: palette.red700,
    errorLight: palette.red100,
    info: palette.amber700,
    infoLight: palette.amber100,

    // Interactive
    disabled: '#d4c4a8',
    disabledText: '#9a8b79',
    placeholder: '#9a8b79',

    // Overlay
    overlay: 'rgba(67, 52, 34, 0.5)',
    overlayLight: 'rgba(67, 52, 34, 0.2)',

    // Tab bar
    tabBarBackground: '#f0ebe0',
    tabBarBorder: '#d4c4a8',
    tabBarActive: palette.amber700,
    tabBarInactive: '#9a8b79',
  },
};

// ============================================================================
// Theme Map
// ============================================================================

export const themes: Record<ReaderTheme, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  sepia: sepiaTheme,
};

// ============================================================================
// Helper to get theme
// ============================================================================

export function getTheme(mode: ReaderTheme): Theme {
  return themes[mode] ?? lightTheme;
}

// ============================================================================
// Re-export tokens for convenience
// ============================================================================

export {palette, fontSize, fontWeight, lineHeight, spacing, borderRadius, shadows};
