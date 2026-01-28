/**
 * Font Configuration - Custom font loading and management
 *
 * Fonts used:
 * - Inter: Modern sans-serif for UI
 * - Merriweather: Elegant serif for reading
 * - JetBrains Mono: Monospace for code/technical content
 */

import {Platform} from 'react-native';

// ============================================================================
// Font Family Names
// ============================================================================

/**
 * Font families available in the app
 */
export const fontFamilies = {
  // Sans-serif - UI elements
  sans: Platform.select({
    ios: 'Inter',
    android: 'Inter',
    default: 'System',
  }),

  // Serif - Reading content
  serif: Platform.select({
    ios: 'Merriweather',
    android: 'Merriweather',
    default: 'Georgia',
  }),

  // Monospace - Code, technical
  mono: Platform.select({
    ios: 'JetBrainsMono',
    android: 'JetBrainsMono',
    default: 'Courier',
  }),

  // System fallbacks
  systemSans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),

  systemSerif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
} as const;

// ============================================================================
// Font Weights
// ============================================================================

/**
 * Available font weights per family
 */
export const fontWeights = {
  sans: {
    thin: '100',
    extraLight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
  },
  serif: {
    light: '300',
    regular: '400',
    bold: '700',
    black: '900',
  },
  mono: {
    thin: '100',
    extraLight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
} as const;

// ============================================================================
// Font Files Mapping (for react-native-asset linking)
// ============================================================================

/**
 * Font files to be placed in:
 * - iOS: ios/xenolexia/Fonts/
 * - Android: android/app/src/main/assets/fonts/
 *
 * Run `npx react-native-asset` after adding fonts
 */
export const fontFiles = {
  inter: [
    'Inter-Thin.ttf',
    'Inter-ExtraLight.ttf',
    'Inter-Light.ttf',
    'Inter-Regular.ttf',
    'Inter-Medium.ttf',
    'Inter-SemiBold.ttf',
    'Inter-Bold.ttf',
    'Inter-ExtraBold.ttf',
    'Inter-Black.ttf',
  ],
  merriweather: [
    'Merriweather-Light.ttf',
    'Merriweather-Regular.ttf',
    'Merriweather-Bold.ttf',
    'Merriweather-Black.ttf',
    'Merriweather-LightItalic.ttf',
    'Merriweather-Italic.ttf',
    'Merriweather-BoldItalic.ttf',
    'Merriweather-BlackItalic.ttf',
  ],
  jetbrainsMono: [
    'JetBrainsMono-Thin.ttf',
    'JetBrainsMono-ExtraLight.ttf',
    'JetBrainsMono-Light.ttf',
    'JetBrainsMono-Regular.ttf',
    'JetBrainsMono-Medium.ttf',
    'JetBrainsMono-SemiBold.ttf',
    'JetBrainsMono-Bold.ttf',
    'JetBrainsMono-ExtraBold.ttf',
  ],
} as const;

// ============================================================================
// Reader Font Options
// ============================================================================

/**
 * Font options available in the reader
 */
export interface ReaderFontOption {
  id: string;
  name: string;
  family: string;
  category: 'serif' | 'sans-serif' | 'monospace';
  preview: string;
}

export const readerFonts: ReaderFontOption[] = [
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: fontFamilies.serif,
    category: 'serif',
    preview: 'A classic serif typeface',
  },
  {
    id: 'inter',
    name: 'Inter',
    family: fontFamilies.sans,
    category: 'sans-serif',
    preview: 'A modern sans-serif',
  },
  {
    id: 'georgia',
    name: 'Georgia',
    family: 'Georgia',
    category: 'serif',
    preview: 'A web-safe serif',
  },
  {
    id: 'system',
    name: 'System Default',
    family: fontFamilies.systemSans,
    category: 'sans-serif',
    preview: 'Your device font',
  },
  {
    id: 'jetbrains',
    name: 'JetBrains Mono',
    family: fontFamilies.mono,
    category: 'monospace',
    preview: 'For code & data',
  },
];

// ============================================================================
// Typography Presets
// ============================================================================

/**
 * Pre-defined text styles for common use cases
 */
export const typography = {
  // Display - Large headings
  displayLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 48,
    fontWeight: '700' as const,
    lineHeight: 56,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: 40,
    fontWeight: '700' as const,
    lineHeight: 48,
    letterSpacing: -0.25,
  },
  displaySmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
    letterSpacing: 0,
  },

  // Headings
  headlineLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },

  // Titles
  titleLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  titleSmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // Body text
  bodyLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.25,
  },
  bodyMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },

  // Labels
  labelLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
    letterSpacing: 0.5,
  },

  // Reader text (serif)
  readerLarge: {
    fontFamily: fontFamilies.serif,
    fontSize: 22,
    fontWeight: '400' as const,
    lineHeight: 36,
    letterSpacing: 0,
  },
  readerMedium: {
    fontFamily: fontFamilies.serif,
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 30,
    letterSpacing: 0,
  },
  readerSmall: {
    fontFamily: fontFamilies.serif,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 26,
    letterSpacing: 0,
  },
} as const;

// ============================================================================
// Type exports
// ============================================================================

export type FontFamily = keyof typeof fontFamilies;
export type TypographyVariant = keyof typeof typography;
