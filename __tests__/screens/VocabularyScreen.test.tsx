/**
 * Vocabulary Screen Tests
 */

import React from 'react';
import {render, screen, fireEvent, waitFor} from '../test-utils';
import {VocabularyScreen} from '@screens/Vocabulary/VocabularyScreen';
import {useVocabularyStore} from '@stores/vocabularyStore';

import type {VocabularyItem} from '@/types';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

describe('VocabularyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useVocabularyStore.setState({
      vocabulary: [],
      isLoading: false,
      error: null,
    });
  });

  describe('Empty State', () => {
    it('renders empty vocabulary message when no words', async () => {
      render(<VocabularyScreen />);

      expect(await screen.findByText('No Words Saved Yet')).toBeTruthy();
    });
  });

  describe('With Words', () => {
    const mockWord: VocabularyItem = {
      id: 'word-1',
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

    beforeEach(() => {
      useVocabularyStore.setState({
        vocabulary: [mockWord],
        isLoading: false,
        error: null,
      });
    });

    it('renders vocabulary cards when words exist', async () => {
      render(<VocabularyScreen />);

      expect(await screen.findByText('σπίτι')).toBeTruthy();
    });

    it('shows word status badge', async () => {
      render(<VocabularyScreen />);

      expect(await screen.findByText('New')).toBeTruthy();
    });
  });

  describe('Filters', () => {
    const mockWords: VocabularyItem[] = [
      {
        id: 'word-1',
        sourceWord: 'house',
        targetWord: 'σπίτι',
        sourceLanguage: 'en',
        targetLanguage: 'el',
        contextSentence: null,
        bookId: null,
        bookTitle: null,
        addedAt: new Date(),
        lastReviewedAt: null,
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 0,
        status: 'new',
      },
      {
        id: 'word-2',
        sourceWord: 'water',
        targetWord: 'νερό',
        sourceLanguage: 'en',
        targetLanguage: 'el',
        contextSentence: null,
        bookId: null,
        bookTitle: null,
        addedAt: new Date(),
        lastReviewedAt: new Date(),
        reviewCount: 3,
        easeFactor: 2.5,
        interval: 5,
        status: 'learning',
      },
      {
        id: 'word-3',
        sourceWord: 'sun',
        targetWord: 'ήλιος',
        sourceLanguage: 'en',
        targetLanguage: 'el',
        contextSentence: null,
        bookId: null,
        bookTitle: null,
        addedAt: new Date(),
        lastReviewedAt: new Date(),
        reviewCount: 10,
        easeFactor: 2.5,
        interval: 30,
        status: 'learned',
      },
    ];

    beforeEach(() => {
      useVocabularyStore.setState({
        vocabulary: mockWords,
        isLoading: false,
        error: null,
      });
    });

    it('shows all words by default', async () => {
      render(<VocabularyScreen />);

      expect(await screen.findByText('σπίτι')).toBeTruthy();
      expect(await screen.findByText('νερό')).toBeTruthy();
      expect(await screen.findByText('ήλιος')).toBeTruthy();
    });

    it('filters words by New status', async () => {
      render(<VocabularyScreen />);

      const newFilter = await screen.findByText('New');
      fireEvent.press(newFilter);

      await waitFor(() => {
        expect(screen.getByText('σπίτι')).toBeTruthy();
        expect(screen.queryByText('νερό')).toBeNull();
        expect(screen.queryByText('ήλιος')).toBeNull();
      });
    });

    it('filters words by Learning status', async () => {
      render(<VocabularyScreen />);

      const learningFilter = await screen.findByText('Learning');
      fireEvent.press(learningFilter);

      await waitFor(() => {
        expect(screen.queryByText('σπίτι')).toBeNull();
        expect(screen.getByText('νερό')).toBeTruthy();
        expect(screen.queryByText('ήλιος')).toBeNull();
      });
    });
  });

  describe('Search', () => {
    const mockWords: VocabularyItem[] = [
      {
        id: 'word-1',
        sourceWord: 'house',
        targetWord: 'σπίτι',
        sourceLanguage: 'en',
        targetLanguage: 'el',
        contextSentence: null,
        bookId: null,
        bookTitle: null,
        addedAt: new Date(),
        lastReviewedAt: null,
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 0,
        status: 'new',
      },
      {
        id: 'word-2',
        sourceWord: 'water',
        targetWord: 'νερό',
        sourceLanguage: 'en',
        targetLanguage: 'el',
        contextSentence: null,
        bookId: null,
        bookTitle: null,
        addedAt: new Date(),
        lastReviewedAt: null,
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 0,
        status: 'new',
      },
    ];

    beforeEach(() => {
      useVocabularyStore.setState({
        vocabulary: mockWords,
        isLoading: false,
        error: null,
      });
    });

    it('filters words by search query', async () => {
      render(<VocabularyScreen />);

      const searchInput = await screen.findByPlaceholderText('Search words...');
      fireEvent.changeText(searchInput, 'house');

      await waitFor(() => {
        expect(screen.getByText('σπίτι')).toBeTruthy();
        expect(screen.queryByText('νερό')).toBeNull();
      });
    });

    it('searches target language words', async () => {
      render(<VocabularyScreen />);

      const searchInput = await screen.findByPlaceholderText('Search words...');
      fireEvent.changeText(searchInput, 'νερό');

      await waitFor(() => {
        expect(screen.queryByText('σπίτι')).toBeNull();
        expect(screen.getByText('νερό')).toBeTruthy();
      });
    });
  });
});
