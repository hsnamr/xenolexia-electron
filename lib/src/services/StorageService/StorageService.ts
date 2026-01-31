/**
 * Storage Service - Handles all database operations
 * Facade that delegates to repositories; uses direct LowDB data API.
 */

import type {Book, VocabularyItem, ReadingStats, UserPreferences} from '../../types';
import type {BookRow, VocabularyRow} from './DataStore.types';
import {databaseService} from './DatabaseService';
import {bookRepository} from './repositories/BookRepository';
import {vocabularyRepository} from './repositories/VocabularyRepository';
import {sessionRepository} from './repositories/SessionRepository';

export class StorageService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await databaseService.initialize();
      this.isInitialized = true;
      console.log('StorageService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize StorageService:', error);
      throw error;
    }
  }

  // ============================================================================
  // Book Operations
  // ============================================================================

  static async addBook(book: Book): Promise<void> {
    await this.initialize();
    await bookRepository.add(book);
  }

  static async updateBook(bookId: string, updates: Partial<Book>): Promise<void> {
    await this.initialize();
    await bookRepository.update(bookId, updates);
  }

  static async deleteBook(bookId: string): Promise<void> {
    await this.initialize();
    await bookRepository.delete(bookId);
  }

  static async getBook(bookId: string): Promise<Book | null> {
    await this.initialize();
    return await bookRepository.getById(bookId);
  }

  static async getAllBooks(): Promise<Book[]> {
    await this.initialize();
    return await bookRepository.getAll();
  }

  // ============================================================================
  // Vocabulary Operations
  // ============================================================================

  static async addVocabulary(item: VocabularyItem): Promise<void> {
    await this.initialize();
    await vocabularyRepository.add(item);
  }

  static async updateVocabulary(itemId: string, updates: Partial<VocabularyItem>): Promise<void> {
    await this.initialize();
    await vocabularyRepository.update(itemId, updates);
  }

  static async deleteVocabulary(itemId: string): Promise<void> {
    await this.initialize();
    await vocabularyRepository.delete(itemId);
  }

  static async getAllVocabulary(): Promise<VocabularyItem[]> {
    await this.initialize();
    return await vocabularyRepository.getAll();
  }

  static async getVocabularyDueForReview(): Promise<VocabularyItem[]> {
    await this.initialize();
    return await vocabularyRepository.getDueForReview();
  }

  // ============================================================================
  // Session Operations
  // ============================================================================

  static async startSession(bookId: string): Promise<string> {
    await this.initialize();
    return await sessionRepository.startSession(bookId);
  }

  static async endSession(
    sessionId: string,
    stats: {pagesRead: number; wordsRevealed: number; wordsSaved: number},
  ): Promise<void> {
    await this.initialize();
    await sessionRepository.endSession(sessionId, stats);
  }

  static async getReadingStats(): Promise<ReadingStats> {
    await this.initialize();
    return await sessionRepository.getStatistics();
  }

  // ============================================================================
  // Preferences Operations
  // ============================================================================

  static async savePreferences(preferences: UserPreferences): Promise<void> {
    await this.initialize();
    await databaseService.setPreference('userPreferences', JSON.stringify(preferences));
  }

  static async loadPreferences(): Promise<UserPreferences | null> {
    await this.initialize();
    const value = await databaseService.getPreference('userPreferences');
    return value ? JSON.parse(value) : null;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  static async exportData(): Promise<string> {
    await this.initialize();
    const books = await bookRepository.getAll();
    const vocabulary = await vocabularyRepository.getAll();
    const sessions = await sessionRepository.getRecent(1000);
    return JSON.stringify(
      {books, vocabulary, sessions, exportedAt: new Date().toISOString(), version: '1.0.0'},
      null,
      2
    );
  }

  static async importData(jsonData: string): Promise<void> {
    await this.initialize();
    const data = JSON.parse(jsonData);
    const operations: Array<{method: string; args: unknown[]}> = [];

    const toMs = (v: unknown): number =>
      typeof v === 'number' ? v : v ? new Date(v as string).getTime() : Date.now();

    if (data.books && Array.isArray(data.books)) {
      for (const book of data.books) {
        try {
          const row: BookRow = {
            id: book.id,
            title: book.title,
            author: book.author ?? null,
            description: null,
            cover_path: book.coverPath ?? null,
            file_path: book.filePath,
            format: book.format,
            file_size: book.fileSize ?? 0,
            added_at: toMs(book.addedAt),
            last_read_at: book.lastReadAt != null ? toMs(book.lastReadAt) : null,
            progress: book.progress ?? 0,
            current_location: book.currentLocation ?? null,
            current_chapter: book.currentChapter ?? 0,
            total_chapters: book.totalChapters ?? 0,
            current_page: book.currentPage ?? 0,
            total_pages: book.totalPages ?? 0,
            reading_time_minutes: book.readingTimeMinutes ?? 0,
            source_lang: book.languagePair?.sourceLanguage ?? 'en',
            target_lang: book.languagePair?.targetLanguage ?? 'el',
            proficiency: book.proficiencyLevel ?? 'intermediate',
            word_density: book.wordDensity ?? 0.3,
            source_url: book.sourceUrl ?? null,
            is_downloaded: book.isDownloaded ? 1 : 0,
          };
          operations.push({method: 'addBook', args: [row]});
        } catch (e) {
          console.warn('Failed to import book:', book?.id, e);
        }
      }
    }

    if (data.vocabulary && Array.isArray(data.vocabulary)) {
      for (const word of data.vocabulary) {
        try {
          const row: VocabularyRow = {
            id: word.id,
            source_word: word.sourceWord,
            target_word: word.targetWord,
            source_lang: word.sourceLanguage,
            target_lang: word.targetLanguage,
            context_sentence: word.contextSentence ?? null,
            book_id: word.bookId ?? null,
            book_title: word.bookTitle ?? null,
            added_at: toMs(word.addedAt),
            last_reviewed_at: word.lastReviewedAt != null ? toMs(word.lastReviewedAt) : null,
            review_count: word.reviewCount ?? 0,
            ease_factor: word.easeFactor ?? 2.5,
            interval: word.interval ?? 0,
            status: word.status ?? 'new',
          };
          operations.push({method: 'addVocabulary', args: [row]});
        } catch (e) {
          console.warn('Failed to import vocabulary:', word?.id, e);
        }
      }
    }

    if (operations.length > 0) await databaseService.runTransaction(operations);
  }

  static async clearAllData(): Promise<void> {
    await this.initialize();
    await databaseService.runTransaction([
      {method: 'deleteAllVocabulary', args: []},
      {method: 'deleteAllSessions', args: []},
      {method: 'deleteAllBooks', args: []},
    ]);
  }
}
