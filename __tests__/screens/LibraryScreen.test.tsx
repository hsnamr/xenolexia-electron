/**
 * Library Screen Tests
 */

import React from 'react';
import {render, screen, fireEvent, waitFor} from '../test-utils';
import {LibraryScreen} from '@screens/Library/LibraryScreen';
import {useLibraryStore} from '@stores/libraryStore';

import type {Book} from '@/types';

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

describe('LibraryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLibraryStore.setState({
      books: [],
      isLoading: false,
      error: null,
    });
  });

  describe('Empty State', () => {
    it('renders empty library message when no books', async () => {
      render(<LibraryScreen />);

      expect(await screen.findByText('Your Library is Empty')).toBeTruthy();
    });

    it('shows import book option in empty state', async () => {
      render(<LibraryScreen />);

      expect(await screen.findByText('Import Book')).toBeTruthy();
    });

    it('shows browse books option in empty state', async () => {
      render(<LibraryScreen />);

      expect(await screen.findByText('Browse Free Books')).toBeTruthy();
    });
  });

  describe('With Books', () => {
    const mockBook: Book = {
      id: 'book-1',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      coverPath: null,
      filePath: '/path/to/book.epub',
      format: 'epub',
      fileSize: 500000,
      addedAt: new Date(),
      lastReadAt: null,
      languagePair: {
        sourceLanguage: 'en',
        targetLanguage: 'el',
      },
      proficiencyLevel: 'beginner',
      wordDensity: 0.3,
      progress: 0,
      currentLocation: null,
      currentChapter: 0,
      totalChapters: 20,
      currentPage: 0,
      totalPages: 300,
      readingTimeMinutes: 0,
      isDownloaded: true,
    };

    beforeEach(() => {
      useLibraryStore.setState({
        books: [mockBook],
        isLoading: false,
        error: null,
      });
    });

    it('renders book cards when books exist', async () => {
      render(<LibraryScreen />);

      expect(await screen.findByText('Pride and Prejudice')).toBeTruthy();
      expect(await screen.findByText('Jane Austen')).toBeTruthy();
    });

    it('navigates to reader when book is pressed', async () => {
      render(<LibraryScreen />);

      const bookCard = await screen.findByText('Pride and Prejudice');
      fireEvent.press(bookCard);

      expect(mockNavigate).toHaveBeenCalledWith('Reader', {bookId: 'book-1'});
    });
  });

  describe('Search', () => {
    const mockBooks: Book[] = [
      {
        id: 'book-1',
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        coverPath: null,
        filePath: '/path/to/book1.epub',
        format: 'epub',
        fileSize: 500000,
        addedAt: new Date(),
        lastReadAt: null,
        languagePair: {sourceLanguage: 'en', targetLanguage: 'el'},
        proficiencyLevel: 'beginner',
        wordDensity: 0.3,
        progress: 0,
        currentLocation: null,
        currentChapter: 0,
        totalChapters: 20,
        currentPage: 0,
        totalPages: 300,
        readingTimeMinutes: 0,
        isDownloaded: true,
      },
      {
        id: 'book-2',
        title: 'Great Expectations',
        author: 'Charles Dickens',
        coverPath: null,
        filePath: '/path/to/book2.epub',
        format: 'epub',
        fileSize: 600000,
        addedAt: new Date(),
        lastReadAt: null,
        languagePair: {sourceLanguage: 'en', targetLanguage: 'el'},
        proficiencyLevel: 'beginner',
        wordDensity: 0.3,
        progress: 0,
        currentLocation: null,
        currentChapter: 0,
        totalChapters: 30,
        currentPage: 0,
        totalPages: 400,
        readingTimeMinutes: 0,
        isDownloaded: true,
      },
    ];

    beforeEach(() => {
      useLibraryStore.setState({
        books: mockBooks,
        isLoading: false,
        error: null,
      });
    });

    it('filters books by title', async () => {
      render(<LibraryScreen />);

      const searchInput = await screen.findByPlaceholderText(
        'Search your library...',
      );
      fireEvent.changeText(searchInput, 'Pride');

      await waitFor(() => {
        expect(screen.getByText('Pride and Prejudice')).toBeTruthy();
        expect(screen.queryByText('Great Expectations')).toBeNull();
      });
    });

    it('filters books by author', async () => {
      render(<LibraryScreen />);

      const searchInput = await screen.findByPlaceholderText(
        'Search your library...',
      );
      fireEvent.changeText(searchInput, 'Dickens');

      await waitFor(() => {
        expect(screen.queryByText('Pride and Prejudice')).toBeNull();
        expect(screen.getByText('Great Expectations')).toBeTruthy();
      });
    });
  });
});
