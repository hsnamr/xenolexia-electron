/**
 * Unit tests for StorageService - vocabulary, sessions, preferences, export
 */

import {StorageService} from '../services/StorageService/StorageService';

import type {VocabularyItem, ReadingStats} from '../types';

jest.mock('../services/StorageService/DatabaseService', () => ({
  databaseService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    transaction: jest.fn((cb: () => Promise<void>) => cb()),
  },
}));

jest.mock('../services/StorageService/repositories/BookRepository', () => ({
  bookRepository: {
    add: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    getById: jest.fn().mockResolvedValue(null),
    getAll: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../services/StorageService/repositories/VocabularyRepository', () => ({
  vocabularyRepository: {
    add: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    getAll: jest.fn().mockResolvedValue([]),
    getDueForReview: jest.fn().mockResolvedValue([]),
    deleteAll: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../services/StorageService/repositories/SessionRepository', () => ({
  sessionRepository: {
    startSession: jest.fn().mockResolvedValue('session-1'),
    endSession: jest.fn().mockResolvedValue(undefined),
    getStatistics: jest.fn().mockResolvedValue({
      totalBooksRead: 0,
      totalReadingTime: 0,
      totalWordsLearned: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageSessionDuration: 0,
      wordsRevealedToday: 0,
      wordsSavedToday: 0,
    } as ReadingStats),
    getRecent: jest.fn().mockResolvedValue([]),
    deleteAll: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../utils/AsyncStorage.electron', () => ({
  AsyncStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

const {databaseService} = require('../services/StorageService/DatabaseService');
const {sessionRepository} = require('../services/StorageService/repositories/SessionRepository');
const {
  vocabularyRepository,
} = require('../services/StorageService/repositories/VocabularyRepository');

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);
  });

  describe('initialize', () => {
    it('should call databaseService.initialize', async () => {
      await StorageService.initialize();
      expect(databaseService.initialize).toHaveBeenCalled();
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
      await StorageService.addVocabulary(item);
      expect(vocabularyRepository.add).toHaveBeenCalledWith(item);
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
      (sessionRepository.getStatistics as jest.Mock).mockResolvedValue(mockStats);
      const result = await StorageService.getReadingStats();
      expect(result).toEqual(mockStats);
      expect(sessionRepository.getStatistics).toHaveBeenCalled();
    });
  });

  describe('startSession', () => {
    it('should return session id from sessionRepository.startSession', async () => {
      (sessionRepository.startSession as jest.Mock).mockResolvedValue('session-123');
      const id = await StorageService.startSession('book-1');
      expect(id).toBe('session-123');
      expect(sessionRepository.startSession).toHaveBeenCalledWith('book-1');
    });
  });

  describe('exportData', () => {
    it('should return JSON string with books, vocabulary, sessions', async () => {
      const books = [{id: 'b1', title: 'Test'}];
      const vocabulary = [{id: 'v1', sourceWord: 'hello', targetWord: 'hola'}];
      (
        require('../services/StorageService/repositories/BookRepository').bookRepository
          .getAll as jest.Mock
      ).mockResolvedValue(books);
      (vocabularyRepository.getAll as jest.Mock).mockResolvedValue(vocabulary);
      const json = await StorageService.exportData();
      const parsed = JSON.parse(json);
      expect(parsed.books).toEqual(books);
      expect(parsed.vocabulary).toEqual(vocabulary);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.exportedAt).toBeDefined();
    });
  });
});
