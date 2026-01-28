/**
 * Test Utilities - Common testing patterns and helpers
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ============================================================================
// Test Wrapper
// ============================================================================

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * AllProviders wraps components with all necessary providers for testing
 */
function AllProviders({ children }: WrapperProps): React.JSX.Element {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/**
 * Custom render function that includes all providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Generate a mock vocabulary item
 */
export function createMockVocabularyItem(overrides = {}): any {
  return {
    id: `vocab-${Math.random().toString(36).substr(2, 9)}`,
    sourceWord: 'hello',
    targetWord: 'hola',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    status: 'new',
    addedAt: new Date(),
    lastReviewedAt: null,
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 0,
    contextSentence: 'Hello, how are you?',
    bookId: 'book-1',
    bookTitle: 'Test Book',
    ...overrides,
  };
}

/**
 * Generate a mock book
 */
export function createMockBook(overrides = {}): any {
  return {
    id: `book-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Book',
    author: 'Test Author',
    filePath: '/path/to/book.epub',
    coverPath: null,
    format: 'epub',
    addedAt: new Date(),
    lastReadAt: null,
    progress: 0,
    currentChapter: 0,
    currentPage: 0,
    totalChapters: 10,
    totalPages: 200,
    readingTime: 0,
    sourceLanguage: 'en',
    targetLanguage: 'es',
    proficiencyLevel: 'beginner',
    wordDensity: 0.3,
    ...overrides,
  };
}

/**
 * Generate mock reading stats
 */
export function createMockReadingStats(overrides = {}): any {
  return {
    totalReadingTime: 3600, // 1 hour in seconds
    totalWordsRevealed: 500,
    totalWordsSaved: 50,
    totalWordsLearned: 20,
    currentStreak: 5,
    longestStreak: 10,
    todayReadingTime: 1800,
    todayWordsRevealed: 100,
    todayWordsSaved: 10,
    ...overrides,
  };
}

/**
 * Generate a list of mock vocabulary items
 */
export function createMockVocabularyList(count: number): any[] {
  const statuses = ['new', 'learning', 'review', 'learned'];
  return Array.from({ length: count }, (_, i) =>
    createMockVocabularyItem({
      id: `vocab-${i}`,
      sourceWord: `word${i}`,
      targetWord: `palabra${i}`,
      status: statuses[i % statuses.length],
    })
  );
}

/**
 * Generate a list of mock books
 */
export function createMockBookList(count: number): any[] {
  return Array.from({ length: count }, (_, i) =>
    createMockBook({
      id: `book-${i}`,
      title: `Book ${i + 1}`,
      author: `Author ${i + 1}`,
      progress: (i * 20) % 100,
    })
  );
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Flush all pending promises
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Wait for condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('waitFor timeout');
    }
    await wait(interval);
  }
}

// ============================================================================
// Mock Stores
// ============================================================================

/**
 * Create a mock vocabulary store
 */
export function createMockVocabularyStore(overrides = {}) {
  return {
    vocabulary: [],
    isLoading: false,
    error: null,
    isInitialized: true,
    stats: {
      total: 0,
      new: 0,
      learning: 0,
      review: 0,
      learned: 0,
      dueToday: 0,
    },
    initialize: jest.fn(),
    addWord: jest.fn(),
    removeWord: jest.fn(),
    updateWord: jest.fn(),
    updateWordStatus: jest.fn(),
    getWord: jest.fn(),
    getDueForReview: jest.fn().mockResolvedValue([]),
    recordReview: jest.fn(),
    refreshVocabulary: jest.fn(),
    refreshStats: jest.fn(),
    searchWords: jest.fn().mockResolvedValue([]),
    getWordsByBook: jest.fn().mockResolvedValue([]),
    getWordsByLanguage: jest.fn().mockResolvedValue([]),
    getWordsByStatus: jest.fn().mockReturnValue([]),
    isWordSaved: jest.fn().mockReturnValue(false),
    clearVocabulary: jest.fn(),
    getDueCount: jest.fn().mockReturnValue(0),
    ...overrides,
  };
}

/**
 * Create a mock library store
 */
export function createMockLibraryStore(overrides = {}) {
  return {
    books: [],
    isLoading: false,
    error: null,
    isInitialized: true,
    currentFilter: null,
    currentSort: { by: 'lastReadAt', order: 'desc' },
    addBook: jest.fn(),
    removeBook: jest.fn(),
    updateBook: jest.fn(),
    getBook: jest.fn(),
    initialize: jest.fn(),
    refreshBooks: jest.fn(),
    loadBooks: jest.fn(),
    searchBooks: jest.fn(),
    updateProgress: jest.fn(),
    updateReadingTime: jest.fn(),
    setFilter: jest.fn(),
    setSort: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    clearLibrary: jest.fn(),
    ...overrides,
  };
}

/**
 * Create a mock user store
 */
export function createMockUserStore(overrides = {}) {
  return {
    preferences: {
      hasCompletedOnboarding: true,
      defaultSourceLanguage: 'en',
      defaultTargetLanguage: 'es',
      defaultProficiencyLevel: 'beginner',
      defaultWordDensity: 0.3,
      dailyGoal: 15,
      notificationsEnabled: false,
      theme: 'system',
      readerSettings: {
        theme: 'light',
        fontFamily: 'serif',
        fontSize: 18,
        lineHeight: 1.6,
        margin: 24,
      },
    },
    updatePreferences: jest.fn(),
    resetPreferences: jest.fn(),
    ...overrides,
  };
}

// ============================================================================
// SM-2 Algorithm Test Helpers
// ============================================================================

/**
 * Create test cases for SM-2 algorithm
 */
export const SM2_TEST_CASES = [
  // First review - quality 0 (complete blackout)
  {
    input: { quality: 0, easeFactor: 2.5, interval: 0, reviewCount: 0 },
    expected: { easeFactor: 1.3, interval: 1, status: 'new' },
  },
  // First review - quality 3 (correct with difficulty)
  {
    input: { quality: 3, easeFactor: 2.5, interval: 0, reviewCount: 0 },
    expected: { easeFactor: 2.36, interval: 1, status: 'learning' },
  },
  // First review - quality 5 (perfect response)
  {
    input: { quality: 5, easeFactor: 2.5, interval: 0, reviewCount: 0 },
    expected: { easeFactor: 2.6, interval: 1, status: 'learning' },
  },
  // Second review - quality 4 (correct with hesitation)
  {
    input: { quality: 4, easeFactor: 2.5, interval: 1, reviewCount: 1 },
    expected: { easeFactor: 2.5, interval: 6, status: 'review' },
  },
  // Third+ review - quality 4
  {
    input: { quality: 4, easeFactor: 2.5, interval: 6, reviewCount: 2 },
    expected: { easeFactor: 2.5, interval: 15, status: 'review' },
  },
  // Failed review
  {
    input: { quality: 1, easeFactor: 2.5, interval: 10, reviewCount: 3 },
    expected: { easeFactor: 1.66, interval: 1, status: 'learning' },
  },
];

// ============================================================================
// Exports
// ============================================================================

export * from '@testing-library/react-native';
export { customRender as render };
