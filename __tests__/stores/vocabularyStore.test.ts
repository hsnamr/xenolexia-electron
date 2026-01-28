/**
 * Tests for Vocabulary Store
 */

import {useVocabularyStore} from '@stores/vocabularyStore';
import type {VocabularyItem} from '@types/index';

// Reset store before each test
beforeEach(() => {
  useVocabularyStore.setState({
    vocabulary: [],
    isLoading: false,
    error: null,
  });
});

describe('VocabularyStore', () => {
  const mockWord: VocabularyItem = {
    id: 'test-1',
    sourceWord: 'house',
    targetWord: 'σπίτι',
    sourceLanguage: 'en',
    targetLanguage: 'el',
    contextSentence: 'She walked into the house.',
    bookId: 'book-1',
    bookTitle: 'Sample Book',
    addedAt: new Date(),
    lastReviewedAt: null,
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 0,
    status: 'new',
  };

  describe('addWord', () => {
    it('should add a word to vocabulary', () => {
      const {addWord, vocabulary} = useVocabularyStore.getState();
      addWord(mockWord);

      const state = useVocabularyStore.getState();
      expect(state.vocabulary).toHaveLength(1);
      expect(state.vocabulary[0]).toEqual(mockWord);
    });

    it('should add multiple words', () => {
      const {addWord} = useVocabularyStore.getState();
      addWord(mockWord);
      addWord({...mockWord, id: 'test-2', sourceWord: 'water'});

      const state = useVocabularyStore.getState();
      expect(state.vocabulary).toHaveLength(2);
    });
  });

  describe('removeWord', () => {
    it('should remove a word from vocabulary', () => {
      const {addWord, removeWord} = useVocabularyStore.getState();
      addWord(mockWord);
      removeWord('test-1');

      const state = useVocabularyStore.getState();
      expect(state.vocabulary).toHaveLength(0);
    });

    it('should not affect other words', () => {
      const {addWord, removeWord} = useVocabularyStore.getState();
      addWord(mockWord);
      addWord({...mockWord, id: 'test-2'});
      removeWord('test-1');

      const state = useVocabularyStore.getState();
      expect(state.vocabulary).toHaveLength(1);
      expect(state.vocabulary[0].id).toBe('test-2');
    });
  });

  describe('updateWord', () => {
    it('should update word properties', () => {
      const {addWord, updateWord} = useVocabularyStore.getState();
      addWord(mockWord);
      updateWord('test-1', {reviewCount: 5});

      const state = useVocabularyStore.getState();
      expect(state.vocabulary[0].reviewCount).toBe(5);
    });

    it('should preserve other properties', () => {
      const {addWord, updateWord} = useVocabularyStore.getState();
      addWord(mockWord);
      updateWord('test-1', {reviewCount: 5});

      const state = useVocabularyStore.getState();
      expect(state.vocabulary[0].sourceWord).toBe('house');
      expect(state.vocabulary[0].targetWord).toBe('σπίτι');
    });
  });

  describe('updateWordStatus', () => {
    it('should update word status', () => {
      const {addWord, updateWordStatus} = useVocabularyStore.getState();
      addWord(mockWord);
      updateWordStatus('test-1', 'learning');

      const state = useVocabularyStore.getState();
      expect(state.vocabulary[0].status).toBe('learning');
    });
  });

  describe('getWord', () => {
    it('should return word by id', () => {
      const {addWord, getWord} = useVocabularyStore.getState();
      addWord(mockWord);

      const word = useVocabularyStore.getState().getWord('test-1');
      expect(word).toEqual(mockWord);
    });

    it('should return undefined for non-existent word', () => {
      const word = useVocabularyStore.getState().getWord('non-existent');
      expect(word).toBeUndefined();
    });
  });

  describe('getDueForReview', () => {
    it('should return words that have never been reviewed', () => {
      const {addWord} = useVocabularyStore.getState();
      addWord(mockWord);

      const due = useVocabularyStore.getState().getDueForReview();
      expect(due).toHaveLength(1);
    });

    it('should not return learned words', () => {
      const {addWord} = useVocabularyStore.getState();
      addWord({...mockWord, status: 'learned'});

      const due = useVocabularyStore.getState().getDueForReview();
      expect(due).toHaveLength(0);
    });
  });

  describe('recordReview', () => {
    it('should update interval and review count on correct answer', () => {
      const {addWord, recordReview} = useVocabularyStore.getState();
      addWord(mockWord);
      recordReview('test-1', 4); // Good answer

      const state = useVocabularyStore.getState();
      expect(state.vocabulary[0].reviewCount).toBe(1);
      expect(state.vocabulary[0].interval).toBeGreaterThan(0);
    });

    it('should reset on incorrect answer', () => {
      const {addWord, updateWord, recordReview} = useVocabularyStore.getState();
      addWord(mockWord);
      updateWord('test-1', {reviewCount: 3, interval: 10});
      recordReview('test-1', 1); // Bad answer

      const state = useVocabularyStore.getState();
      expect(state.vocabulary[0].reviewCount).toBe(0);
      expect(state.vocabulary[0].interval).toBe(1);
    });
  });
});
