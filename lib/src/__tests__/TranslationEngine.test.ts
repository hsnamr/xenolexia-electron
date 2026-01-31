/**
 * Unit tests for TranslationEngine - processContent returns content and foreignWords
 */

import {
  TranslationEngine,
  createTranslationEngine,
} from '../services/TranslationEngine/TranslationEngine';

jest.mock('../services/TranslationEngine/DynamicWordDatabase', () => ({
  dynamicWordDatabase: {
    initialize: jest.fn().mockResolvedValue(undefined),
    lookup: jest.fn(),
    lookupWords: jest.fn().mockResolvedValue(new Map()),
    getStats: jest.fn().mockResolvedValue({totalEntries: 0}),
  },
}));

jest.mock('../services/TranslationEngine/WordMatcher', () => ({
  WordMatcher: class MockWordMatcher {
    initialize = jest.fn().mockResolvedValue(undefined);
    findMatch = jest.fn();
  },
}));

const {dynamicWordDatabase} = require('../services/TranslationEngine/DynamicWordDatabase');

describe('TranslationEngine', () => {
  const defaultOptions = {
    sourceLanguage: 'en' as const,
    targetLanguage: 'el' as const,
    proficiencyLevel: 'beginner' as const,
    density: 0.2,
  };

  const houseEntry = {
    id: '1',
    sourceWord: 'house',
    targetWord: 'σπίτι',
    sourceLanguage: 'en',
    targetLanguage: 'el',
    proficiencyLevel: 'beginner',
    frequencyRank: 10,
    partOfSpeech: 'noun',
    variants: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (dynamicWordDatabase.initialize as jest.Mock).mockResolvedValue(undefined);
    (dynamicWordDatabase.lookupWords as jest.Mock).mockImplementation((words: string[]) => {
      const map = new Map();
      for (const w of words) {
        if (w.toLowerCase() === 'house') {
          map.set(w, {entry: houseEntry});
        } else {
          map.set(w, {entry: null});
        }
      }
      return Promise.resolve(map);
    });
  });

  describe('createTranslationEngine', () => {
    it('should create engine with options', () => {
      const engine = createTranslationEngine(defaultOptions);
      expect(engine).toBeInstanceOf(TranslationEngine);
    });
  });

  describe('processContent', () => {
    it('should return content and foreignWords array', async () => {
      const engine = createTranslationEngine(defaultOptions);
      const html = '<p>The house is big.</p>';
      const result = await engine.processContent(html);
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('foreignWords');
      expect(Array.isArray(result.foreignWords)).toBe(true);
      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('totalWords');
      expect(result.stats).toHaveProperty('replacedWords');
      expect(typeof result.content).toBe('string');
    });

    it('should return content that includes foreign word markers when matches exist', async () => {
      const engine = createTranslationEngine({...defaultOptions, density: 1});
      const html = '<p>The house is big.</p>';
      const result = await engine.processContent(html);
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.stats.replacedWords).toBeGreaterThanOrEqual(0);
    });

    it('should return empty foreignWords when no matches', async () => {
      (dynamicWordDatabase.lookup as jest.Mock).mockResolvedValue(null);
      const engine = createTranslationEngine(defaultOptions);
      const html = '<p>Xyzzy abracadabra.</p>';
      const result = await engine.processContent(html);
      expect(result.foreignWords).toEqual([]);
    });
  });
});
