/**
 * Tests for WordReplacer - Translating 1-5 words per sentence
 */

import {WordReplacer} from '../services/TranslationEngine';
import type {Token, WordEntry} from 'xenolexia-typescript';

describe('WordReplacer', () => {
  let replacer: WordReplacer;

  beforeEach(() => {
    replacer = new WordReplacer({
      density: 0.2, // 20% of words
      maxProficiency: 'beginner',
      minWordSpacing: 3,
      selectionStrategy: 'distributed',
    });
  });

  describe('replace - Word Translation', () => {
    it('should replace 1-5 words per sentence based on sentence length', () => {
      const html = '<p>This is a simple sentence with several words.</p>';
      const tokens: Token[] = [
        {word: 'This', original: 'This', startIndex: 3, endIndex: 7, prefix: '<p>', suffix: ' ', isProtected: false},
        {word: 'is', original: 'is', startIndex: 8, endIndex: 10, prefix: ' ', suffix: ' ', isProtected: false},
        {word: 'a', original: 'a', startIndex: 11, endIndex: 12, prefix: ' ', suffix: ' ', isProtected: false},
        {word: 'simple', original: 'simple', startIndex: 13, endIndex: 19, prefix: ' ', suffix: ' ', isProtected: false},
        {word: 'sentence', original: 'sentence', startIndex: 20, endIndex: 28, prefix: ' ', suffix: ' ', isProtected: false},
        {word: 'with', original: 'with', startIndex: 29, endIndex: 33, prefix: ' ', suffix: ' ', isProtected: false},
        {word: 'several', original: 'several', startIndex: 34, endIndex: 41, prefix: ' ', suffix: ' ', isProtected: false},
        {word: 'words', original: 'words', startIndex: 42, endIndex: 47, prefix: ' ', suffix: '.', isProtected: false},
      ];

      const wordEntries = new Map<string, WordEntry | null>([
        ['simple', {
          id: '1',
          sourceWord: 'simple',
          targetWord: 'απλό',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 100,
          partOfSpeech: 'adjective',
          variants: [],
        }],
        ['sentence', {
          id: '2',
          sourceWord: 'sentence',
          targetWord: 'πρόταση',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 200,
          partOfSpeech: 'noun',
          variants: [],
        }],
      ]);

      const result = replacer.replace(html, tokens, wordEntries);

      expect(result.foreignWords.length).toBeGreaterThan(0);
      expect(result.foreignWords.length).toBeLessThanOrEqual(5);
      expect(result.html).toContain('foreign-word');
    });

    it('should respect density setting', () => {
      const html = '<p>Word one two three four five six seven eight nine ten.</p>';
      const tokens: Token[] = Array.from({length: 10}, (_, i) => ({
        word: `word${i}`,
        original: `word${i}`,
        startIndex: i * 6,
        endIndex: i * 6 + 4,
        prefix: i === 0 ? '<p>' : ' ',
        suffix: i === 9 ? '.' : ' ',
        isProtected: false,
      }));

      const wordEntries = new Map<string, WordEntry | null>();
      tokens.forEach((token, i) => {
        wordEntries.set(token.word, {
          id: `word-${i}`,
          sourceWord: token.word,
          targetWord: `target${i}`,
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: i,
          partOfSpeech: 'noun',
          variants: [],
        });
      });

      replacer = new WordReplacer({density: 0.3}); // 30% density
      const result = replacer.replace(html, tokens, wordEntries);

      // Should replace approximately 30% of words (3 out of 10)
      expect(result.stats.replacedTokens).toBeGreaterThanOrEqual(2);
      expect(result.stats.replacedTokens).toBeLessThanOrEqual(4);
    });

    it('should respect minimum word spacing', () => {
      const html = '<p>One two three four five.</p>';
      const tokens: Token[] = [
        {word: 'One', original: 'One', startIndex: 3, endIndex: 6, prefix: '<p>', suffix: ' ', isProtected: false},
        {word: 'two', original: 'two', startIndex: 7, endIndex: 10, prefix: ' ', suffix: ' ', isProtected: false},
        {word: 'three', original: 'three', startIndex: 11, endIndex: 16, prefix: ' ', suffix: ' ', isProtected: false},
        {word: 'four', original: 'four', startIndex: 17, endIndex: 21, prefix: ' ', suffix: ' ', isProtected: false},
        {word: 'five', original: 'five', startIndex: 22, endIndex: 26, prefix: ' ', suffix: '.', isProtected: false},
      ];

      const wordEntries = new Map<string, WordEntry | null>();
      tokens.forEach((token) => {
        wordEntries.set(token.word.toLowerCase(), {
          id: `word-${token.word}`,
          sourceWord: token.word,
          targetWord: `target-${token.word}`,
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 1,
          partOfSpeech: 'noun',
          variants: [],
        });
      });

      replacer = new WordReplacer({minWordSpacing: 3});
      const result = replacer.replace(html, tokens, wordEntries);

      // With minWordSpacing of 3, should not have adjacent replacements
      const foreignWords = result.foreignWords;
      for (let i = 1; i < foreignWords.length; i++) {
        const spacing = foreignWords[i].startIndex - foreignWords[i - 1].endIndex;
        expect(spacing).toBeGreaterThanOrEqual(3);
      }
    });

    it('should not replace protected words', () => {
      const html = '<p>Hello world!</p>';
      const tokens: Token[] = [
        {word: 'Hello', original: 'Hello', startIndex: 3, endIndex: 8, prefix: '<p>', suffix: ' ', isProtected: true},
        {word: 'world', original: 'world', startIndex: 9, endIndex: 14, prefix: ' ', suffix: '!', isProtected: false},
      ];

      const wordEntries = new Map<string, WordEntry | null>([
        ['hello', {
          id: '1',
          sourceWord: 'hello',
          targetWord: 'γεια',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 1,
          partOfSpeech: 'interjection',
          variants: [],
        }],
        ['world', {
          id: '2',
          sourceWord: 'world',
          targetWord: 'κόσμος',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 2,
          partOfSpeech: 'noun',
          variants: [],
        }],
      ]);

      const result = replacer.replace(html, tokens, wordEntries);

      // 'Hello' should not be replaced (protected)
      expect(result.html).not.toContain('data-original="Hello"');
      // 'world' may be replaced
      expect(result.stats.protectedTokens).toBe(1);
    });

    it('should respect proficiency level', () => {
      const html = '<p>Simple advanced word.</p>';
      const tokens: Token[] = [
        {word: 'Simple', original: 'Simple', startIndex: 3, endIndex: 9, prefix: '<p>', suffix: ' ', isProtected: false},
        {word: 'advanced', original: 'advanced', startIndex: 10, endIndex: 18, prefix: ' ', suffix: ' ', isProtected: false},
        {word: 'word', original: 'word', startIndex: 19, endIndex: 23, prefix: ' ', suffix: '.', isProtected: false},
      ];

      const wordEntries = new Map<string, WordEntry | null>([
        ['simple', {
          id: '1',
          sourceWord: 'simple',
          targetWord: 'απλό',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'beginner',
          frequencyRank: 1,
          partOfSpeech: 'adjective',
          variants: [],
        }],
        ['advanced', {
          id: '2',
          sourceWord: 'advanced',
          targetWord: 'προχωρημένο',
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: 'advanced',
          frequencyRank: 1000,
          partOfSpeech: 'adjective',
          variants: [],
        }],
      ]);

      replacer = new WordReplacer({maxProficiency: 'beginner'});
      const result = replacer.replace(html, tokens, wordEntries);

      // 'advanced' should not be replaced (exceeds proficiency)
      expect(result.html).not.toContain('data-original="advanced"');
    });
  });
});
