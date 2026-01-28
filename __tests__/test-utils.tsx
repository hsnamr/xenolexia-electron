/**
 * Test Utilities
 * Shared helpers for testing React Native components
 */

import React, {ReactElement} from 'react';
import {render, RenderOptions} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider} from '@/theme';

// ============================================================================
// All Providers Wrapper
// ============================================================================

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that includes all necessary providers for testing
 */
function AllTheProviders({children}: WrapperProps) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: {x: 0, y: 0, width: 375, height: 812},
        insets: {top: 47, left: 0, right: 0, bottom: 34},
      }}>
      <ThemeProvider>
        <NavigationContainer>{children}</NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Wrapper without navigation (for components that don't need it)
 */
function ProvidersWithoutNavigation({children}: WrapperProps) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: {x: 0, y: 0, width: 375, height: 812},
        insets: {top: 47, left: 0, right: 0, bottom: 34},
      }}>
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}

// ============================================================================
// Custom Render Functions
// ============================================================================

/**
 * Custom render with all providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, {wrapper: AllTheProviders, ...options});

/**
 * Custom render without navigation
 */
const renderWithTheme = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, {wrapper: ProvidersWithoutNavigation, ...options});

// ============================================================================
// Mock Navigation
// ============================================================================

/**
 * Create a mock navigation object for testing
 */
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(() => ({
    index: 0,
    routes: [{name: 'Test', key: 'test-1'}],
  })),
  addListener: jest.fn(() => () => {}),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
});

/**
 * Create a mock route object for testing
 */
export const createMockRoute = <T extends object>(params?: T) => ({
  key: 'test-route',
  name: 'TestScreen',
  params: params || {},
});

// ============================================================================
// Store Reset Utilities
// ============================================================================

/**
 * Reset all Zustand stores to their initial state
 */
export const resetAllStores = () => {
  // Import stores dynamically to avoid circular dependencies
  const {useLibraryStore} = require('@stores/libraryStore');
  const {useVocabularyStore} = require('@stores/vocabularyStore');
  const {useUserStore} = require('@stores/userStore');
  const {useReaderStore} = require('@stores/readerStore');
  const {useStatisticsStore} = require('@stores/statisticsStore');

  // Reset each store to its initial state
  useLibraryStore.setState({
    books: [],
    isLoading: false,
    error: null,
  });

  useVocabularyStore.setState({
    vocabulary: [],
    isLoading: false,
    error: null,
  });

  useUserStore.setState({
    preferences: {
      defaultSourceLanguage: 'en',
      defaultTargetLanguage: 'el',
      defaultProficiencyLevel: 'beginner',
      defaultWordDensity: 0.3,
      readerSettings: {
        theme: 'light',
        fontFamily: 'Georgia',
        fontSize: 18,
        lineHeight: 1.6,
        marginHorizontal: 24,
        marginVertical: 24,
        textAlign: 'left',
        brightness: 1.0,
      },
      hasCompletedOnboarding: true, // Default to true for most tests
      notificationsEnabled: true,
      dailyGoal: 15,
    },
    isLoading: false,
  });

  useReaderStore.setState({
    currentBook: null,
    chapters: [],
    currentChapterIndex: 0,
    currentChapter: null,
    processedContent: '',
    foreignWords: [],
    settings: {
      theme: 'light',
      fontFamily: 'Georgia',
      fontSize: 18,
      lineHeight: 1.6,
      marginHorizontal: 24,
      marginVertical: 24,
      textAlign: 'left',
      brightness: 1.0,
    },
    isLoading: false,
    error: null,
  });

  useStatisticsStore.setState({
    stats: {
      totalBooksRead: 0,
      totalReadingTime: 0,
      totalWordsLearned: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageSessionDuration: 0,
      wordsRevealedToday: 0,
      wordsSavedToday: 0,
    },
    isLoading: false,
  });
};

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Wait for a specific amount of time
 */
export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wait for the next tick of the event loop
 */
export const waitForNextTick = () => wait(0);

// ============================================================================
// Exports
// ============================================================================

export * from '@testing-library/react-native';
export {customRender as render, renderWithTheme};
