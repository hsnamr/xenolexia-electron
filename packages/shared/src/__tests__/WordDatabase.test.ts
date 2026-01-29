/**
 * Tests for WordDatabase - Dictionary installation and word lookup
 */

import {WordDatabaseService} from '../services/TranslationEngine/WordDatabase';

import type {WordEntry} from '../types';

// Mock DatabaseService with object created inside factory (avoid hoisting)
jest.mock('../services/StorageService/DatabaseService', () => {
  const m = {
    execute: jest.fn(),
    getAll: jest.fn(),
    getOne: jest.fn(),
    run: jest.fn(),
    exec: jest.fn(),
    transaction: jest
      .fn()
      .mockImplementation(async (callback: () => Promise<unknown>) => await callback()),
    initialize: jest.fn().mockResolvedValue(undefined),
  };
  return {
    DatabaseService: {getInstance: jest.fn(() => m)},
    databaseService: m,
  };
});

// Mock DatabaseSchema (WordDatabase uses wordList.getByWord, wordList.count, etc.)
jest.mock('../services/StorageService/DatabaseSchema', () => ({
  DatabaseSchema: {
    wordList: {
      getByWord:
        'SELECT * FROM word_list WHERE source_word = ? AND source_lang = ? AND target_lang = ?',
      getByLevel:
        'SELECT * FROM word_list WHERE source_lang = ? AND target_lang = ? AND proficiency = ?',
      count: 'SELECT COUNT(*) as count FROM word_list WHERE source_lang = ? AND target_lang = ?',
      insert: 'INSERT INTO word_list (...) VALUES (...)',
    },
  },
}));

describe('WordDatabaseService', () => {
  let wordDatabase: WordDatabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    const mod = require('../services/StorageService/DatabaseService');
    mod.DatabaseService.getInstance.mockReturnValue(mod.databaseService);
    mod.databaseService.transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => await callback({})
    );
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

      const {databaseService} = require('../services/StorageService/DatabaseService');
      (databaseService.execute as jest.Mock).mockResolvedValue({rows: [], rowsAffected: 1});

      const result = await wordDatabase.installDictionary('en', 'el', mockWords);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(databaseService.execute).toHaveBeenCalledTimes(2);
    });

    it('should skip duplicate entries (UNIQUE constraint)', async () => {
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

      const {databaseService} = require('../services/StorageService/DatabaseService');
      (databaseService.execute as jest.Mock)
        .mockResolvedValueOnce({rows: [], rowsAffected: 1})
        .mockRejectedValueOnce(
          new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: word_list.id')
        );

      const result = await wordDatabase.installDictionary('en', 'el', mockWords);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should report errors for non-UNIQUE failures', async () => {
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

      const {databaseService} = require('../services/StorageService/DatabaseService');
      (databaseService.execute as jest.Mock)
        .mockResolvedValueOnce({rows: [], rowsAffected: 1})
        .mockRejectedValueOnce(new Error('Disk full'));

      const result = await wordDatabase.installDictionary('en', 'el', mockWords);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('world');
      expect(result.errors[0]).toContain('Disk full');
    });
  });

  describe('initialize', () => {
    it('should initialize database with schema', async () => {
      const {databaseService} = require('../services/StorageService/DatabaseService');
      (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);

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
        proficiency_level: 'beginner',
        frequency_rank: 1,
        part_of_speech: 'interjection',
        variants: '[]',
      };

      const {databaseService} = require('../services/StorageService/DatabaseService');
      (databaseService.getOne as jest.Mock).mockResolvedValue(mockRow);

      await wordDatabase.initialize();
      const result = await wordDatabase.lookupWord('hello', 'en', 'el');

      expect(result).toBeDefined();
      expect(result?.sourceWord).toBe('hello');
      expect(result?.targetWord).toBe('γεια');
    });

    it('should return null for non-existent word', async () => {
      const {databaseService} = require('../services/StorageService/DatabaseService');
      (databaseService.getOne as jest.Mock).mockResolvedValue(undefined);

      await wordDatabase.initialize();
      const result = await wordDatabase.lookupWord('nonexistent', 'en', 'el');

      expect(result).toBeNull();
    });
  });

  describe('getWordCount', () => {
    it('should return word count for language pair', async () => {
      const {databaseService} = require('../services/StorageService/DatabaseService');
      (databaseService.getOne as jest.Mock).mockResolvedValue({count: 1000});

      await wordDatabase.initialize();
      const count = await wordDatabase.getWordCount('en', 'el');

      expect(count).toBe(1000);
    });
  });
});
