/**
 * Tests for WordDatabase - Dictionary installation and word lookup
 */

import {WordDatabaseService} from '../services/TranslationEngine/WordDatabase';
import type {WordEntry, Language} from '../types';

// Mock react-native-sqlite-storage before importing WordDatabase
jest.mock('react-native-sqlite-storage', () => ({
  openDatabase: jest.fn(() => Promise.resolve({
    executeSql: jest.fn(),
    transaction: jest.fn(),
  })),
}));

// Mock DatabaseService
const mockDb = {
  execute: jest.fn(),
  getAll: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
  exec: jest.fn(),
};

jest.mock('../services/StorageService/DatabaseService', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => mockDb),
  },
}));

// Mock DatabaseSchema
jest.mock('../services/StorageService/DatabaseSchema', () => ({
  DatabaseSchema: {
    wordListTable: 'CREATE TABLE word_list...',
  },
}));

describe('WordDatabaseService', () => {
  let wordDatabase: WordDatabaseService;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const {DatabaseService} = require('../services/StorageService/DatabaseService');
    mockDb = DatabaseService.getInstance();
    wordDatabase = new WordDatabaseService();
  });

  describe('initialize', () => {
    it('should initialize database with schema', async () => {
      const {DatabaseService} = require('../services/StorageService/DatabaseService');
      const db = DatabaseService.getInstance();
      (db.exec as jest.Mock).mockResolvedValue(undefined);

      await wordDatabase.initialize();

      expect(db.exec).toHaveBeenCalled();
    });
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

      const {DatabaseService} = require('../services/StorageService/DatabaseService');
      const db = DatabaseService.getInstance();
      (db.run as jest.Mock).mockResolvedValue(undefined);

      await wordDatabase.initialize();
      await wordDatabase.installDictionary('en', 'el', mockWords);

      expect(db.run).toHaveBeenCalled();
    });

    it('should handle duplicate entries gracefully', async () => {
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
      ];

      const {DatabaseService} = require('../services/StorageService/DatabaseService');
      const db = DatabaseService.getInstance();
      (db.run as jest.Mock).mockResolvedValue(undefined);

      await wordDatabase.initialize();
      await wordDatabase.installDictionary('en', 'el', mockWords);
      // Install again (should handle duplicates)
      await wordDatabase.installDictionary('en', 'el', mockWords);

      expect(db.run).toHaveBeenCalled();
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

      const {DatabaseService} = require('../services/StorageService/DatabaseService');
      const db = DatabaseService.getInstance();
      (db.get as jest.Mock).mockResolvedValue(mockRow);

      await wordDatabase.initialize();
      const result = await wordDatabase.lookupWord('hello', 'en', 'el');

      expect(result).toBeDefined();
      expect(result?.sourceWord).toBe('hello');
      expect(result?.targetWord).toBe('γεια');
    });

    it('should return null for non-existent word', async () => {
      const {DatabaseService} = require('../services/StorageService/DatabaseService');
      const db = DatabaseService.getInstance();
      (db.get as jest.Mock).mockResolvedValue(undefined);

      await wordDatabase.initialize();
      const result = await wordDatabase.lookupWord('nonexistent', 'en', 'el');

      expect(result).toBeNull();
    });
  });

  describe('getWordCount', () => {
    it('should return word count for language pair', async () => {
      const {DatabaseService} = require('../services/StorageService/DatabaseService');
      const db = DatabaseService.getInstance();
      (db.get as jest.Mock).mockResolvedValue({count: 1000});

      await wordDatabase.initialize();
      const count = await wordDatabase.getWordCount('en', 'el');

      expect(count).toBe(1000);
    });
  });
});
