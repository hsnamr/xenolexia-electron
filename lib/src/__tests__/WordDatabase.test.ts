/**
 * Tests for WordDatabase - Dictionary installation and word lookup
 * Uses direct LowDB data API mocks.
 */

import {WordDatabaseService} from '../services/TranslationEngine/WordDatabase';
import type {WordEntry} from '../types';

jest.mock('../services/StorageService/DatabaseService', () => ({
  databaseService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getWordListEntry: jest.fn().mockResolvedValue(null),
    getWordListEntryByVariant: jest.fn().mockResolvedValue(null),
    getWordListByLangs: jest.fn().mockResolvedValue([]),
    getWordListByLevel: jest.fn().mockResolvedValue([]),
    getWordListSearch: jest.fn().mockResolvedValue([]),
    getWordListCount: jest.fn().mockResolvedValue(0),
    getWordListProficiencyCounts: jest.fn().mockResolvedValue({}),
    getWordListPosCounts: jest.fn().mockResolvedValue({}),
    addWordListEntry: jest.fn().mockResolvedValue(undefined),
    runTransaction: jest.fn().mockResolvedValue(undefined),
    deleteWordListByPair: jest.fn().mockResolvedValue(undefined),
  },
}));

const {databaseService} = require('../services/StorageService/DatabaseService');

describe('WordDatabaseService', () => {
  let wordDatabase: WordDatabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    (databaseService.runTransaction as jest.Mock).mockResolvedValue(undefined);
    (databaseService.getWordListEntry as jest.Mock).mockResolvedValue(null);
    (databaseService.getWordListByLangs as jest.Mock).mockResolvedValue([]);
    (databaseService.getWordListCount as jest.Mock).mockResolvedValue(0);
    wordDatabase = new WordDatabaseService();
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
      expect(databaseService.runTransaction).toHaveBeenCalledTimes(1);
      const ops = (databaseService.runTransaction as jest.Mock).mock.calls[0][0];
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
      expect(databaseService.runTransaction).toHaveBeenCalledTimes(1);
      expect((databaseService.runTransaction as jest.Mock).mock.calls[0][0]).toHaveLength(1);
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

      (databaseService.runTransaction as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

      const result = await wordDatabase.installDictionary('en', 'el', mockWords);

      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Disk full');
    });
  });

  describe('initialize', () => {
    it('should initialize database with schema', async () => {
      const {databaseService} = require('../services/StorageService/DatabaseService');
      await wordDatabase.initialize();
      expect(databaseService.initialize).toHaveBeenCalled();
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

      (databaseService.getWordListEntry as jest.Mock).mockResolvedValue(mockRow);

      await wordDatabase.initialize();
      const result = await wordDatabase.lookupWord('hello', 'en', 'el');

      expect(result).toBeDefined();
      expect(result?.sourceWord).toBe('hello');
      expect(result?.targetWord).toBe('γεια');
    });

    it('should return null for non-existent word', async () => {
      (databaseService.getWordListEntry as jest.Mock).mockResolvedValue(null);

      await wordDatabase.initialize();
      const result = await wordDatabase.lookupWord('nonexistent', 'en', 'el');

      expect(result).toBeNull();
    });
  });

  describe('getWordCount', () => {
    it('should return word count for language pair', async () => {
      (databaseService.getWordListCount as jest.Mock).mockResolvedValue(1000);

      await wordDatabase.initialize();
      const count = await wordDatabase.getWordCount('en', 'el');

      expect(count).toBe(1000);
    });
  });
});
