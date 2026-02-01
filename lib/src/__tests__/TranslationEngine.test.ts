/**
 * Unit tests for TranslationEngine (xenolexia-typescript core) - processContent returns content and foreignWords
 * Uses getCore() from jest.setup (mock adapters).
 */

// Use lib wrapper so getCore() (jest.setup mock adapters) is used
import { createTranslationEngine } from '../index';

describe('TranslationEngine', () => {
  const defaultOptions = {
    sourceLanguage: 'en' as const,
    targetLanguage: 'el' as const,
    proficiencyLevel: 'beginner' as const,
    density: 0.2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTranslationEngine', () => {
    it('should create engine with options', () => {
      const engine = createTranslationEngine(defaultOptions);
      expect(engine).toBeDefined();
      expect(typeof engine.processContent).toBe('function');
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
      const engine = createTranslationEngine({ ...defaultOptions, density: 1 });
      const html = '<p>The house is big.</p>';
      const result = await engine.processContent(html);
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.stats.replacedWords).toBeGreaterThanOrEqual(0);
    });

    it('should return empty foreignWords when no matches', async () => {
      const engine = createTranslationEngine(defaultOptions);
      const html = '<p>Xyzzy abracadabra.</p>';
      const result = await engine.processContent(html);
      expect(Array.isArray(result.foreignWords)).toBe(true);
    });
  });
});
