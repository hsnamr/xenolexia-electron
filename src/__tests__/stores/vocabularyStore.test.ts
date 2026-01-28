/**
 * Vocabulary Store Tests
 */

import { act, renderHook } from '@testing-library/react-native';
import { createMockVocabularyItem, createMockVocabularyList } from '../utils/testUtils';

// Mock the database service
jest.mock('@services/StorageService/repositories/VocabularyRepository', () => ({
  vocabularyRepository: {
    getAll: jest.fn().mockResolvedValue([]),
    add: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    deleteAll: jest.fn().mockResolvedValue(undefined),
    getFiltered: jest.fn().mockResolvedValue([]),
    search: jest.fn().mockResolvedValue([]),
    getDueForReview: jest.fn().mockResolvedValue([]),
    recordReview: jest.fn().mockResolvedValue(undefined),
    getStatistics: jest.fn().mockResolvedValue({
      total: 0,
      new: 0,
      learning: 0,
      review: 0,
      learned: 0,
      dueToday: 0,
    }),
  },
}));

// Import store after mocking
import { useVocabularyStore } from '@stores/vocabularyStore';

describe('vocabularyStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useVocabularyStore.setState({
      vocabulary: [],
      isLoading: false,
      error: null,
      isInitialized: false,
      stats: {
        total: 0,
        new: 0,
        learning: 0,
        review: 0,
        learned: 0,
        dueToday: 0,
      },
    });
  });

  describe('initial state', () => {
    it('should have empty vocabulary', () => {
      const { result } = renderHook(() => useVocabularyStore());
      
      expect(result.current.vocabulary).toEqual([]);
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useVocabularyStore());
      
      expect(result.current.isLoading).toBe(false);
    });

    it('should have empty stats', () => {
      const { result } = renderHook(() => useVocabularyStore());
      
      expect(result.current.stats.total).toBe(0);
    });
  });

  describe('getWord', () => {
    it('should return undefined for non-existent word', () => {
      const { result } = renderHook(() => useVocabularyStore());
      
      const word = result.current.getWord('non-existent-id');
      
      expect(word).toBeUndefined();
    });

    it('should return word if it exists', () => {
      const mockWord = createMockVocabularyItem({ id: 'test-id' });
      useVocabularyStore.setState({ vocabulary: [mockWord] });
      
      const { result } = renderHook(() => useVocabularyStore());
      
      const word = result.current.getWord('test-id');
      
      expect(word).toEqual(mockWord);
    });
  });

  describe('getWordsByStatus', () => {
    it('should filter words by status', () => {
      const vocabulary = [
        createMockVocabularyItem({ id: '1', status: 'new' }),
        createMockVocabularyItem({ id: '2', status: 'learning' }),
        createMockVocabularyItem({ id: '3', status: 'new' }),
      ];
      useVocabularyStore.setState({ vocabulary });
      
      const { result } = renderHook(() => useVocabularyStore());
      
      const newWords = result.current.getWordsByStatus('new');
      
      expect(newWords).toHaveLength(2);
      expect(newWords.every(w => w.status === 'new')).toBe(true);
    });

    it('should return empty array when no words match', () => {
      const vocabulary = [
        createMockVocabularyItem({ status: 'new' }),
      ];
      useVocabularyStore.setState({ vocabulary });
      
      const { result } = renderHook(() => useVocabularyStore());
      
      const learnedWords = result.current.getWordsByStatus('learned');
      
      expect(learnedWords).toHaveLength(0);
    });
  });

  describe('isWordSaved', () => {
    it('should return false for unsaved word', () => {
      const { result } = renderHook(() => useVocabularyStore());
      
      const isSaved = result.current.isWordSaved('hello', 'es');
      
      expect(isSaved).toBe(false);
    });

    it('should return true for saved word (case insensitive)', () => {
      const mockWord = createMockVocabularyItem({
        sourceWord: 'Hello',
        targetLanguage: 'es',
      });
      useVocabularyStore.setState({ vocabulary: [mockWord] });
      
      const { result } = renderHook(() => useVocabularyStore());
      
      const isSaved = result.current.isWordSaved('hello', 'es');
      
      expect(isSaved).toBe(true);
    });

    it('should return false for different target language', () => {
      const mockWord = createMockVocabularyItem({
        sourceWord: 'hello',
        targetLanguage: 'es',
      });
      useVocabularyStore.setState({ vocabulary: [mockWord] });
      
      const { result } = renderHook(() => useVocabularyStore());
      
      const isSaved = result.current.isWordSaved('hello', 'fr');
      
      expect(isSaved).toBe(false);
    });
  });

  describe('getDueCount', () => {
    it('should return dueToday from stats', () => {
      useVocabularyStore.setState({
        stats: {
          total: 10,
          new: 3,
          learning: 2,
          review: 3,
          learned: 2,
          dueToday: 5,
        },
      });
      
      const { result } = renderHook(() => useVocabularyStore());
      
      const dueCount = result.current.getDueCount();
      
      expect(dueCount).toBe(5);
    });
  });

  describe('clearVocabulary', () => {
    it('should clear all vocabulary', async () => {
      const vocabulary = createMockVocabularyList(5);
      useVocabularyStore.setState({ vocabulary, isInitialized: true });
      
      const { result } = renderHook(() => useVocabularyStore());
      
      await act(async () => {
        await result.current.clearVocabulary();
      });
      
      expect(result.current.vocabulary).toEqual([]);
      expect(result.current.stats.total).toBe(0);
    });
  });
});
