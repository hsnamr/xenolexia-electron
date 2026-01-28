/**
 * Theme Provider - Context-based theming with persistence
 *
 * Features:
 * - Light, Dark, and Sepia themes
 * - System theme detection
 * - Theme persistence via AsyncStorage
 * - Smooth transitions
 */

import React, {createContext, useContext, useState, useCallback, useMemo, useEffect} from 'react';

import {useColorScheme, Appearance} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {themes, getTheme, lightTheme} from './themes';
import {palette, fontSize, fontWeight, lineHeight, spacing, borderRadius, shadows} from './tokens';

import type {Theme, ThemeMode, ReaderTheme, ThemeColors} from './themes';

// ============================================================================
// Storage Keys
// ============================================================================

const THEME_STORAGE_KEY = '@xenolexia/theme';

// ============================================================================
// Context Types
// ============================================================================

interface ThemeContextValue {
  // Current theme
  theme: ReaderTheme;
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;

  // Theme setters
  setTheme: (theme: ReaderTheme) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;

  // Design tokens
  tokens: {
    palette: typeof palette;
    fontSize: typeof fontSize;
    fontWeight: typeof fontWeight;
    lineHeight: typeof lineHeight;
    spacing: typeof spacing;
    borderRadius: typeof borderRadius;
    shadows: typeof shadows;
  };
}

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeMode;
}

// ============================================================================
// Provider Component
// ============================================================================

export function ThemeProvider({
  children,
  initialTheme = 'system',
}: ThemeProviderProps): React.JSX.Element {
  // State for user's theme preference
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Get system color scheme
  const systemColorScheme = useColorScheme();

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      // Only update if in system mode
      if (themeMode === 'system') {
        // Force re-render by touching state
        setThemeModeState('system');
      }
    });

    return () => subscription.remove();
  }, [themeMode]);

  // Load saved theme from storage
  const loadSavedTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && ['light', 'dark', 'sepia', 'system'].includes(saved)) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  // Save theme to storage
  const saveTheme = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  // Calculate actual theme based on mode
  const resolvedTheme = useMemo((): ReaderTheme => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  // Get theme object
  const currentTheme = useMemo(() => getTheme(resolvedTheme), [resolvedTheme]);

  // Theme setters
  const setTheme = useCallback((theme: ReaderTheme) => {
    setThemeModeState(theme);
    saveTheme(theme);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    saveTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const themeOrder: ReaderTheme[] = ['light', 'dark', 'sepia'];
    const currentIndex = themeOrder.indexOf(resolvedTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Context value
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedTheme,
      themeMode,
      colors: currentTheme.colors,
      isDark: currentTheme.isDark,
      setTheme,
      setThemeMode,
      toggleTheme,
      tokens: {
        palette,
        fontSize,
        fontWeight,
        lineHeight,
        spacing,
        borderRadius,
        shadows,
      },
    }),
    [resolvedTheme, themeMode, currentTheme, setTheme, setThemeMode, toggleTheme]
  );

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return <>{null}</>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ============================================================================
// Additional Hooks
// ============================================================================

/**
 * Hook to get just the colors
 */
export function useColors(): ThemeColors {
  const {colors} = useTheme();
  return colors;
}

/**
 * Hook to check if dark mode
 */
export function useIsDark(): boolean {
  const {isDark} = useTheme();
  return isDark;
}

/**
 * Hook to get themed styles
 */
export function useThemedStyles<T>(styleFactory: (colors: ThemeColors, isDark: boolean) => T): T {
  const {colors, isDark} = useTheme();
  return useMemo(() => styleFactory(colors, isDark), [colors, isDark, styleFactory]);
}
