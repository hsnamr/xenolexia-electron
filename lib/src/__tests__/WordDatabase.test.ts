/**
 * Tests for WordDatabaseService (xenolexia-typescript core) - Dictionary installation and word lookup
 */

import { WordDatabaseService } from '../services/TranslationEngine';
import type { WordEntry } from 'xenolexia-typescript';
import type { IDataStore } from 'xenolexia-typescript';

function createMockDataStore(): IDataStore {
  const noop = jest.fn().mockResolvedValue(undefined);
  const noopNull = jest.fn().mockResolvedValue(null);
  const noopArray = jest.fn().mockResolvedValue([]);
  const noopNumber = jest.fn().mockResolvedValue(0);
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
    getSessionStatistics: jest.fn().mockResolvedValue({
      totalBooksRead: 0,
      totalReadingTime: 0,
      totalWordsLearned: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageSessionDuration: 0,
      wordsRevealedToday: 0,
      wordsSavedToday: 0,
    }),
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

describe('WordDatabaseService', () => {
  let wordDatabase: WordDatabaseService;
  let mockDataStore: IDataStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataStore = createMockDataStore();
    wordDatabase = new WordDatabaseService(mockDataStore);
  });

  describe('installDictionary', () => {
    it('should install word entries for a language pair', async () => {
      const mockWords: WordEntry[] = [
        {
          id: 'word-1',
          sourceWord: 'hello',
          targetWord: 'γεια',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 1,
          partOfSpeech: 'interjection',
          variants: [],
        },
        {
          id: 'word-2',
          sourceWord: 'world',
          targetWord: 'κόσμος',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 2,
          partOfSpeech: 'noun',
          variants: [],
        },
      ];

      const result = await wordDatabase.installDictionary('en', 'el', mockWords);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockDataStore.runTransaction).toHaveBeenCalledTimes(1);
      const ops = (mockDataStore.runTransaction as jest.Mock).mock.calls[0][0];
      expect(ops).toHaveLength(2);
      expect(ops[0].method).toBe('addWordListEntry');
      expect(ops[1].method).toBe('addWordListEntry');
    });

    it('should skip duplicate entries (same id in batch)', async () => {
      const mockWords: WordEntry[] = [
        {
          id: 'word-1',
          sourceWord: 'hello',
          targetWord: 'γεια',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 1,
          partOfSpeech: 'interjection',
          variants: [],
        },
        {
          id: 'word-1',
          sourceWord: 'hello',
          targetWord: 'γεια',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 1,
          partOfSpeech: 'interjection',
          variants: [],
        },
      ];

      const result = await wordDatabase.installDictionary('en', 'el', mockWords);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockDataStore.runTransaction).toHaveBeenCalledTimes(1);
      expect((mockDataStore.runTransaction as jest.Mock).mock.calls[0][0]).toHaveLength(1);
    });

    it('should report errors when runTransaction fails', async () => {
      const mockWords: WordEntry[] = [
        {
          id: 'word-1',
          sourceWord: 'hello',
          targetWord: 'γεια',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 1,
          partOfSpeech: 'interjection',
          variants: [],
        },
        {
          id: 'word-2',
          sourceWord: 'world',
          targetWord: 'κόσμος',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 2,
          partOfSpeech: 'noun',
          variants: [],
        },
      ];

      (mockDataStore.runTransaction as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

      const result = await wordDatabase.installDictionary('en', 'el', mockWords);

      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Disk full');
    });
  });

  describe('initialize', () => {
    it('should initialize database with schema', async () => {
      // mockDataStore is created in beforeEach
      await wordDatabase.initialize();
      expect(mockDataStore.initialize).toHaveBeenCalled();
    });
  });

  describe('lookupWord', () => {
    it('should lookup a word translation', async () => {
      const mockRow = {
        id: 'word-1',
        source_word: 'hello',
        target_word: 'γεια',
        source_lang: 'en',
        target_lang: 'el',
        proficiency: 'beginner',
        frequency_rank: 1,
        part_of_speech: 'interjection',
        variants: '[]',
        pronunciation: null,
      };

      (mockDataStore.getWordListEntry as jest.Mock).mockResolvedValue(mockRow);

      await wordDatabase.initialize();
      const result = await wordDatabase.lookupWord('hello', 'en', 'el');

      expect(result).toBeDefined();
      expect(result?.sourceWord).toBe('hello');
      expect(result?.targetWord).toBe('γεια');
    });

    it('should return null for non-existent word', async () => {
      (mockDataStore.getWordListEntry as jest.Mock).mockResolvedValue(null);

      await wordDatabase.initialize();
      const result = await wordDatabase.lookupWord('nonexistent', 'en', 'el');

      expect(result).toBeNull();
    });
  });

  describe('getWordCount', () => {
    it('should return word count for language pair', async () => {
      (mockDataStore.getWordListCount as jest.Mock).mockResolvedValue(1000);

      await wordDatabase.initialize();
      const count = await wordDatabase.getWordCount('en', 'el');

      expect(count).toBe(1000);
    });
  });
});
