/**
 * Unit tests for StorageService (xenolexia-typescript core) - vocabulary, sessions, preferences, export
 */

import { createStorageService } from '../services/StorageService';
import type { IDataStore } from 'xenolexia-typescript';
import type { VocabularyItem, ReadingStats } from 'xenolexia-typescript';

const uuid = require('uuid');

function createMockDataStore(): IDataStore {
  const noop = jest.fn().mockResolvedValue(undefined);
  const noopNull = jest.fn().mockResolvedValue(null);
  const noopArray = jest.fn().mockResolvedValue([]);
  const noopNumber = jest.fn().mockResolvedValue(0);
  const mockStats: ReadingStats = {
    totalBooksRead: 0,
    totalReadingTime: 0,
    totalWordsLearned: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageSessionDuration: 0,
    wordsRevealedToday: 0,
    wordsSavedToday: 0,
  };
  return {
    initialize: noop,
    close: noop,
    isReady: jest.fn().mockReturnValue(true),
    getSchemaVersion: jest.fn().mockResolvedValue(1),
    getBookById: noopNull,
    getBooks: noopArray,
    addBook: noop,
    updateBook: noop,
    deleteBook: noop,
    deleteAllBooks: noop,
    getBookCount: noopNumber,
    getBookStatistics: jest.fn().mockResolvedValue({ total: 0, in_progress: 0, completed: 0, total_time: 0 }),
    getVocabularyById: noopNull,
    getVocabulary: noopArray,
    addVocabulary: noop,
    updateVocabulary: noop,
    deleteVocabulary: noop,
    deleteAllVocabulary: noop,
    getVocabularyDueCount: noopNumber,
    getVocabularyStatistics: jest.fn().mockResolvedValue({
      total: 0,
      new_count: 0,
      learning_count: 0,
      review_count: 0,
      learned_count: 0,
      due: 0,
    }),
    getVocabularyCountByStatus: noopNumber,
    getSessionById: noopNull,
    getSessionsByBookId: noopArray,
    getRecentSessions: noopArray,
    getTodaySessions: noopArray,
    addSession: noop,
    updateSession: noop,
    deleteSession: noop,
    deleteSessionsByBookId: noop,
    deleteAllSessions: noop,
    getSessionStatistics: jest.fn().mockResolvedValue(mockStats),
    getReadingTimeForPeriod: noopNumber,
    getDailyReadingTime: noopArray,
    getDistinctSessionDays: noopArray,
    getPreference: noopNull,
    setPreference: noop,
    getWordListEntry: noopNull,
    getWordListEntryByVariant: noopNull,
    getWordListByLevel: noopArray,
    getWordListByLangs: noopArray,
    getWordListCount: noopNumber,
    addWordListEntry: noop,
    deleteWordListByPair: noop,
    getWordListProficiencyCounts: jest.fn().mockResolvedValue({}),
    getWordListPosCounts: jest.fn().mockResolvedValue({}),
    getWordListStats: jest.fn().mockResolvedValue({ total: 0, pairs: [] }),
    getWordListSearch: noopArray,
    runTransaction: noop,
  } as IDataStore;
}

describe('StorageService', () => {
  let mockDataStore: IDataStore;
  let storageService: ReturnType<typeof createStorageService>;

  beforeEach(() => {
    mockDataStore = createMockDataStore();
    storageService = createStorageService(mockDataStore);
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should call databaseService.initialize', async () => {
      await storageService.initialize();
      expect(mockDataStore.initialize).toHaveBeenCalled();
    });
  });

  describe('addVocabulary', () => {
    it('should call vocabularyRepository.add with item', async () => {
      const item: VocabularyItem = {
        id: 'v1',
        sourceWord: 'house',
        targetWord: 'casa',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        contextSentence: null,
        bookId: null,
        bookTitle: null,
        addedAt: new Date(),
        lastReviewedAt: null,
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 0,
        status: 'new',
      };
      await storageService.addVocabulary(item);
      expect(mockDataStore.addVocabulary).toHaveBeenCalled();
    });
  });

  describe('getReadingStats', () => {
    it('should return stats from sessionRepository.getStatistics', async () => {
      const mockStats: ReadingStats = {
        totalBooksRead: 2,
        totalReadingTime: 3600,
        totalWordsLearned: 10,
        currentStreak: 3,
        longestStreak: 7,
        averageSessionDuration: 1200,
        wordsRevealedToday: 5,
        wordsSavedToday: 2,
      };
      (mockDataStore.getSessionStatistics as jest.Mock).mockResolvedValue(mockStats);
      const result = await storageService.getReadingStats();
      expect(result).toEqual(mockStats);
      expect(mockDataStore.getSessionStatistics).toHaveBeenCalled();
    });
  });

  describe('startSession', () => {
    it('should return session id from sessionRepository.startSession', async () => {
      (uuid.v4 as jest.Mock).mockReturnValue('test-session-id');
      (mockDataStore.addSession as jest.Mock).mockResolvedValue(undefined);
      const addSession = mockDataStore.addSession as jest.Mock;
      const id = await storageService.startSession('book-1');
      expect(id).toBe('test-session-id');
      expect(addSession).toHaveBeenCalled();
    });
  });

  describe('exportData', () => {
    it('should return JSON string with books, vocabulary, sessions', async () => {
      (mockDataStore.getBooks as jest.Mock).mockResolvedValue([{ id: 'b1', title: 'Test' }]);
      (mockDataStore.getVocabulary as jest.Mock).mockResolvedValue([
        { id: 'v1', source_word: 'hello', target_word: 'hola' },
      ]);
      (mockDataStore.getRecentSessions as jest.Mock).mockResolvedValue([]);
      const json = await storageService.exportData();
      const parsed = JSON.parse(json);
      expect(parsed.books).toBeDefined();
      expect(parsed.vocabulary).toBeDefined();
      expect(parsed.version).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
    });
  });
});
