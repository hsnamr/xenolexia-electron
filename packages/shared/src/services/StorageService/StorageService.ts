/**
 * Storage Service - Handles all database operations
 * 
 * This is a facade that delegates to repositories for actual database operations.
 */

import type {Book, VocabularyItem, ReadingSession, ReadingStats, UserPreferences} from '../types/index';
import {databaseService} from './DatabaseService';
import {bookRepository} from './repositories/BookRepository';
import {vocabularyRepository} from './repositories/VocabularyRepository';
import {sessionRepository} from './repositories/SessionRepository';
import {AsyncStorage} from '../../utils/AsyncStorage.electron';

export class StorageService {
  private static isInitialized = false;

  /**
   * Initialize the database
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize database service (creates tables, runs migrations)
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
    // TODO: Implement
    console.log('Adding book:', book.title);
  }

  static async updateBook(bookId: string, updates: Partial<Book>): Promise<void> {
    await this.initialize();
    // TODO: Implement
    console.log('Updating book:', bookId);
  }

  static async deleteBook(bookId: string): Promise<void> {
    await this.initialize();
    // TODO: Implement
    console.log('Deleting book:', bookId);
  }

  static async getBook(bookId: string): Promise<Book | null> {
    await this.initialize();
    // TODO: Implement
    return null;
  }

  static async getAllBooks(): Promise<Book[]> {
    await this.initialize();
    // TODO: Implement
    return [];
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
    await databaseService.execute(
      'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)',
      ['userPreferences', JSON.stringify(preferences)],
    );
  }

  static async loadPreferences(): Promise<UserPreferences | null> {
    await this.initialize();
    const row = await databaseService.getOne<{ value: string }>(
      'SELECT value FROM preferences WHERE key = ?',
      ['userPreferences'],
    );
    return row?.value ? JSON.parse(row.value) : null;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  static async exportData(): Promise<string> {
    await this.initialize();
    const books = await bookRepository.getAll();
    const vocabulary = await vocabularyRepository.getAll();
    const sessions = await sessionRepository.getRecent(1000); // Get recent sessions
    
    return JSON.stringify({
      books,
      vocabulary,
      sessions,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    }, null, 2);
  }

  static async importData(jsonData: string): Promise<void> {
    await this.initialize();
    const data = JSON.parse(jsonData);
    
    // Import in a transaction
    await databaseService.transaction(async () => {
      if (data.books && Array.isArray(data.books)) {
        for (const book of data.books) {
          try {
            await bookRepository.add(book);
          } catch (error) {
            console.warn('Failed to import book:', book.id, error);
          }
        }
      }
      
      if (data.vocabulary && Array.isArray(data.vocabulary)) {
        for (const word of data.vocabulary) {
          try {
            await vocabularyRepository.add(word);
          } catch (error) {
            console.warn('Failed to import vocabulary:', word.id, error);
          }
        }
      }
    });
  }

  static async clearAllData(): Promise<void> {
    await this.initialize();
    // Clear all data in a transaction
    await databaseService.transaction(async () => {
      await vocabularyRepository.deleteAll();
      await sessionRepository.deleteAll();
      await bookRepository.deleteAll();
    });
  }
}
