/**
 * Unit tests for VocabularyStore - addWord, isWordSaved, removeWord.
 * Store uses getCore().storageService (mock adapters set in jest.setup.ts).
 */

import { useVocabularyStore } from '../stores/vocabularyStore';

import type { VocabularyItem } from '../types';

describe('VocabularyStore', () => {
  const makeWord = (overrides: Partial<VocabularyItem> = {}): VocabularyItem => ({
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
    ...overrides,
  });

  beforeEach(() => {
    useVocabularyStore.setState({
      vocabulary: [],
      stats: { total: 0, new: 0, learning: 0, review: 0, learned: 0, dueToday: 0 },
    });
  });

  describe('addWord', () => {
    it('should add word and update state', async () => {
      const word = makeWord({ id: 'w1' });
      await useVocabularyStore.getState().addWord(word);
      expect(useVocabularyStore.getState().vocabulary).toHaveLength(1);
      expect(useVocabularyStore.getState().vocabulary[0].id).toBe('w1');
      expect(useVocabularyStore.getState().stats.total).toBe(1);
      expect(useVocabularyStore.getState().stats.new).toBe(1);
    });
  });

  describe('isWordSaved', () => {
    it('should return false when vocabulary is empty', () => {
      expect(useVocabularyStore.getState().isWordSaved('house', 'es')).toBe(false);
    });

    it('should return true when word exists for target language', async () => {
      const word = makeWord({ sourceWord: 'house', targetLanguage: 'es' });
      await useVocabularyStore.getState().addWord(word);
      expect(useVocabularyStore.getState().isWordSaved('house', 'es')).toBe(true);
    });

    it('should return false for different target language', async () => {
      const word = makeWord({ sourceWord: 'house', targetLanguage: 'es' });
      await useVocabularyStore.getState().addWord(word);
      expect(useVocabularyStore.getState().isWordSaved('house', 'fr')).toBe(false);
    });
  });

  describe('removeWord', () => {
    it('should remove word from state after delete', async () => {
      const word = makeWord({ id: 'w2' });
      await useVocabularyStore.getState().addWord(word);
      await useVocabularyStore.getState().removeWord('w2');
      expect(useVocabularyStore.getState().vocabulary).toHaveLength(0);
    });
  });

  describe('getDueForReview', () => {
    it('should return words from core storage (mock returns [])', async () => {
      const result = await useVocabularyStore.getState().getDueForReview();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });
});
