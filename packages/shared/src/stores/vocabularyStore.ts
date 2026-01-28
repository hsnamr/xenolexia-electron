/**
 * Vocabulary Store - Manages saved words and SRS with database persistence
 */

import { create } from 'zustand';
import type { VocabularyItem, VocabularyStatus, Language } from '../types/index';
import { vocabularyRepository } from '../services/StorageService/repositories/VocabularyRepository';

// ============================================================================
// Types
// ============================================================================

interface VocabularyState {
  vocabulary: VocabularyItem[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Statistics
  stats: {
    total: number;
    new: number;
    learning: number;
    review: number;
    learned: number;
    dueToday: number;
  };

  // Actions
  initialize: () => Promise<void>;
  addWord: (word: VocabularyItem) => Promise<void>;
  removeWord: (wordId: string) => Promise<void>;
  updateWord: (wordId: string, updates: Partial<VocabularyItem>) => Promise<void>;
  updateWordStatus: (wordId: string, status: VocabularyStatus) => Promise<void>;
  getWord: (wordId: string) => VocabularyItem | undefined;
  getDueForReview: () => Promise<VocabularyItem[]>;
  recordReview: (wordId: string, quality: number) => Promise<void>;
  refreshVocabulary: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Search and filter
  searchWords: (query: string) => Promise<VocabularyItem[]>;
  getWordsByBook: (bookId: string) => Promise<VocabularyItem[]>;
  getWordsByLanguage: (sourceLanguage: Language, targetLanguage: Language) => Promise<VocabularyItem[]>;
  getWordsByStatus: (status: VocabularyStatus) => VocabularyItem[];

  // Check if word exists
  isWordSaved: (sourceWord: string, targetLanguage: Language) => boolean;

  // Data management
  clearVocabulary: () => Promise<void>;
  getDueCount: () => number;
}

// ============================================================================
// Initial State
// ============================================================================

const initialStats = {
  total: 0,
  new: 0,
  learning: 0,
  review: 0,
  learned: 0,
  dueToday: 0,
};

// ============================================================================
// Store
// ============================================================================

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  vocabulary: [],
  isLoading: false,
  error: null,
  isInitialized: false,
  stats: initialStats,

  /**
   * Initialize the store and load vocabulary from database
   */
  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true, error: null });
    try {
      const vocabulary = await vocabularyRepository.getAll({
        by: 'addedAt',
        order: 'desc',
      });
      const stats = await vocabularyRepository.getStatistics();

      set({
        vocabulary,
        stats,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize vocabulary store:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load vocabulary',
        isLoading: false,
        isInitialized: true, // Mark as initialized to prevent infinite retries
      });
    }
  },

  /**
   * Add a new word to vocabulary
   */
  addWord: async (word: VocabularyItem) => {
    try {
      // Add to database
      await vocabularyRepository.add(word);

      // Update local state
      set((state) => ({
        vocabulary: [word, ...state.vocabulary],
        stats: {
          ...state.stats,
          total: state.stats.total + 1,
          new: state.stats.new + 1,
        },
      }));
    } catch (error) {
      console.error('Failed to add word:', error);
      throw error;
    }
  },

  /**
   * Remove a word from vocabulary
   */
  removeWord: async (wordId: string) => {
    const word = get().vocabulary.find((w) => w.id === wordId);
    if (!word) return;

    try {
      // Remove from database
      await vocabularyRepository.delete(wordId);

      // Update local state
      set((state) => {
        const newStats = { ...state.stats };
        newStats.total -= 1;
        newStats[word.status] -= 1;

        return {
          vocabulary: state.vocabulary.filter((w) => w.id !== wordId),
          stats: newStats,
        };
      });
    } catch (error) {
      console.error('Failed to remove word:', error);
      throw error;
    }
  },

  /**
   * Update a word's data
   */
  updateWord: async (wordId: string, updates: Partial<VocabularyItem>) => {
    try {
      // Update in database
      await vocabularyRepository.update(wordId, updates);

      // Update local state
      set((state) => ({
        vocabulary: state.vocabulary.map((word) =>
          word.id === wordId ? { ...word, ...updates } : word
        ),
      }));

      // Refresh stats if status changed
      if (updates.status) {
        await get().refreshStats();
      }
    } catch (error) {
      console.error('Failed to update word:', error);
      throw error;
    }
  },

  /**
   * Update a word's status
   */
  updateWordStatus: async (wordId: string, status: VocabularyStatus) => {
    await get().updateWord(wordId, { status });
  },

  /**
   * Get a word by ID
   */
  getWord: (wordId: string) => {
    return get().vocabulary.find((w) => w.id === wordId);
  },

  /**
   * Get words due for review
   */
  getDueForReview: async () => {
    try {
      return await vocabularyRepository.getDueForReview(20);
    } catch (error) {
      console.error('Failed to get due words:', error);
      return [];
    }
  },

  /**
   * Record a review result (SM-2 algorithm)
   */
  recordReview: async (wordId: string, quality: number) => {
    const word = get().getWord(wordId);
    if (!word) return;

    const oldStatus = word.status;

    try {
      // Record in database (handles SM-2 calculation)
      await vocabularyRepository.recordReview(wordId, quality);

      // Fetch updated word
      const updatedWord = await vocabularyRepository.getById(wordId);
      if (!updatedWord) return;

      // Update local state
      set((state) => {
        const newStats = { ...state.stats };
        // Adjust stats based on status change
        if (oldStatus !== updatedWord.status) {
          newStats[oldStatus] = Math.max(0, newStats[oldStatus] - 1);
          newStats[updatedWord.status] += 1;
        }

        return {
          vocabulary: state.vocabulary.map((w) =>
            w.id === wordId ? updatedWord : w
          ),
          stats: newStats,
        };
      });
    } catch (error) {
      console.error('Failed to record review:', error);
      throw error;
    }
  },

  /**
   * Refresh vocabulary from database
   */
  refreshVocabulary: async () => {
    set({ isLoading: true, error: null });
    try {
      const vocabulary = await vocabularyRepository.getAll({
        by: 'addedAt',
        order: 'desc',
      });
      set({ vocabulary, isLoading: false });
      await get().refreshStats();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh vocabulary',
        isLoading: false,
      });
    }
  },

  /**
   * Refresh statistics
   */
  refreshStats: async () => {
    try {
      const stats = await vocabularyRepository.getStatistics();
      set({ stats });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  },

  /**
   * Search words
   */
  searchWords: async (query: string) => {
    if (!query.trim()) {
      return get().vocabulary;
    }

    try {
      return await vocabularyRepository.search(query);
    } catch (error) {
      console.error('Failed to search words:', error);
      // Fallback to local search
      const lowerQuery = query.toLowerCase();
      return get().vocabulary.filter(
        (w) =>
          w.sourceWord.toLowerCase().includes(lowerQuery) ||
          w.targetWord.toLowerCase().includes(lowerQuery)
      );
    }
  },

  /**
   * Get words from a specific book
   */
  getWordsByBook: async (bookId: string) => {
    try {
      return await vocabularyRepository.getFiltered({ bookId });
    } catch (error) {
      console.error('Failed to get words by book:', error);
      return get().vocabulary.filter((w) => w.bookId === bookId);
    }
  },

  /**
   * Get words by language pair
   */
  getWordsByLanguage: async (sourceLanguage: Language, targetLanguage: Language) => {
    try {
      return await vocabularyRepository.getFiltered({
        sourceLanguage,
        targetLanguage,
      });
    } catch (error) {
      console.error('Failed to get words by language:', error);
      return get().vocabulary.filter(
        (w) =>
          w.sourceLanguage === sourceLanguage &&
          w.targetLanguage === targetLanguage
      );
    }
  },

  /**
   * Get words by status (local filter)
   */
  getWordsByStatus: (status: VocabularyStatus) => {
    return get().vocabulary.filter((w) => w.status === status);
  },

  /**
   * Check if a word is already saved
   */
  isWordSaved: (sourceWord: string, targetLanguage: Language) => {
    return get().vocabulary.some(
      (w) =>
        w.sourceWord.toLowerCase() === sourceWord.toLowerCase() &&
        w.targetLanguage === targetLanguage
    );
  },

  /**
   * Clear all vocabulary (for data management)
   */
  clearVocabulary: async () => {
    set({ isLoading: true });
    try {
      await vocabularyRepository.deleteAll();
      set({
        vocabulary: [],
        stats: initialStats,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to clear vocabulary:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Get count of words due for review
   */
  getDueCount: () => {
    return get().stats.dueToday;
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectVocabularyStats = (state: VocabularyState) => state.stats;
export const selectDueCount = (state: VocabularyState) => state.stats.dueToday;
export const selectNewWords = (state: VocabularyState) =>
  state.vocabulary.filter((w) => w.status === 'new');
export const selectLearningWords = (state: VocabularyState) =>
  state.vocabulary.filter((w) => w.status === 'learning');
export const selectLearnedWords = (state: VocabularyState) =>
  state.vocabulary.filter((w) => w.status === 'learned');
