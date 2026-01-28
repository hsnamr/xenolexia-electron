/**
 * Dynamic Word Database - Language-agnostic word translation database
 *
 * Combines:
 * - TranslationAPIService for real-time translations
 * - FrequencyListService for proficiency-based word selection
 * - SQLite for caching and offline support
 *
 * Features:
 * - Supports any language pair
 * - Builds vocabulary dynamically using translation APIs
 * - Uses frequency lists to determine word difficulty
 * - Caches translations for offline use
 */

import {DatabaseSchema} from '../StorageService/DatabaseSchema';
import {databaseService} from '../StorageService/DatabaseService';

import {
  FrequencyListService,
  frequencyListService,
  PROFICIENCY_THRESHOLDS,
} from './FrequencyListService';
import {TranslationAPIService, translationAPI} from './TranslationAPIService';

import type {Language, ProficiencyLevel, WordEntry, PartOfSpeech} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface DynamicWordEntry extends WordEntry {
  isTranslated: boolean;
  translationProvider?: string;
  cachedAt?: string;
}

export interface WordLookupResult {
  entry: DynamicWordEntry | null;
  source: 'cache' | 'database' | 'api' | 'none';
}

export interface DatabaseStats {
  totalCachedWords: number;
  languagePairs: Array<{source: Language; target: Language; count: number}>;
  lastUpdated: string | null;
}

// ============================================================================
// Dynamic Word Database
// ============================================================================

export class DynamicWordDatabase {
  private db: typeof databaseService;
  private translationAPI: TranslationAPIService;
  private frequencyService: FrequencyListService;
  private memoryCache: Map<string, DynamicWordEntry> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.db = databaseService;
    this.translationAPI = translationAPI;
    this.frequencyService = frequencyListService;
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.db.initialize();
    this.initialized = true;
  }

  /**
   * Look up a word translation
   * Checks: memory cache → database → translation API
   */
  async lookupWord(
    word: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<WordLookupResult> {
    await this.initialize();
    const normalizedWord = word.toLowerCase().trim();
    const cacheKey = this.getCacheKey(normalizedWord, sourceLanguage, targetLanguage);

    // 1. Check memory cache
    if (this.memoryCache.has(cacheKey)) {
      return {entry: this.memoryCache.get(cacheKey)!, source: 'cache'};
    }

    // 2. Check database
    const dbEntry = await this.lookupFromDatabase(normalizedWord, sourceLanguage, targetLanguage);
    if (dbEntry) {
      this.memoryCache.set(cacheKey, dbEntry);
      return {entry: dbEntry, source: 'database'};
    }

    // 3. Translate via API and cache
    try {
      const translated = await this.translateAndCache(
        normalizedWord,
        sourceLanguage,
        targetLanguage
      );
      if (translated) {
        this.memoryCache.set(cacheKey, translated);
        return {entry: translated, source: 'api'};
      }
    } catch (error) {
      console.warn(`Translation failed for "${word}":`, error);
    }

    return {entry: null, source: 'none'};
  }

  /**
   * Look up multiple words efficiently
   */
  async lookupWords(
    words: string[],
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<Map<string, WordLookupResult>> {
    const results = new Map<string, WordLookupResult>();
    const toTranslate: string[] = [];

    // First pass: check cache and database
    for (const word of words) {
      const normalizedWord = word.toLowerCase().trim();
      const cacheKey = this.getCacheKey(normalizedWord, sourceLanguage, targetLanguage);

      if (this.memoryCache.has(cacheKey)) {
        results.set(word, {entry: this.memoryCache.get(cacheKey)!, source: 'cache'});
      } else {
        const dbEntry = await this.lookupFromDatabase(
          normalizedWord,
          sourceLanguage,
          targetLanguage
        );
        if (dbEntry) {
          this.memoryCache.set(cacheKey, dbEntry);
          results.set(word, {entry: dbEntry, source: 'database'});
        } else {
          toTranslate.push(word);
        }
      }
    }

    // Batch translate remaining words
    if (toTranslate.length > 0) {
      const bulkResult = await this.translationAPI.translateBulk(
        toTranslate,
        sourceLanguage,
        targetLanguage
      );

      for (const [word, translation] of bulkResult.translations) {
        const entry = await this.createAndCacheEntry(
          word,
          translation,
          sourceLanguage,
          targetLanguage,
          bulkResult.provider
        );
        results.set(word, {entry, source: 'api'});
      }

      for (const word of bulkResult.failed) {
        results.set(word, {entry: null, source: 'none'});
      }
    }

    return results;
  }

  /**
   * Get words by proficiency level for a language
   * Uses frequency list to select appropriate words
   */
  async getWordsByProficiency(
    sourceLanguage: Language,
    targetLanguage: Language,
    level: ProficiencyLevel,
    limit: number = 50
  ): Promise<DynamicWordEntry[]> {
    await this.initialize();

    // Get frequency-ranked words for the source language
    const frequencyWords = await this.frequencyService.getWordsByProficiency(sourceLanguage, level);

    if (frequencyWords.length === 0) {
      // Frequency list not available, return cached words
      return this.getCachedWordsByLevel(sourceLanguage, targetLanguage, level, limit);
    }

    // Select random subset
    const shuffled = [...frequencyWords].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, limit);

    // Look up translations for selected words
    const entries: DynamicWordEntry[] = [];
    for (const freqWord of selected) {
      const result = await this.lookupWord(freqWord.word, sourceLanguage, targetLanguage);
      if (result.entry) {
        entries.push(result.entry);
      }
    }

    return entries;
  }

  /**
   * Get random words for vocabulary practice
   */
  async getRandomWords(
    sourceLanguage: Language,
    targetLanguage: Language,
    level: ProficiencyLevel,
    count: number
  ): Promise<DynamicWordEntry[]> {
    return this.getWordsByProficiency(sourceLanguage, targetLanguage, level, count);
  }

  /**
   * Check if a language pair is supported
   */
  async isLanguagePairSupported(
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<boolean> {
    return this.translationAPI.isLanguagePairSupported(sourceLanguage, targetLanguage);
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    await this.initialize();

    const totalResult = await this.db.getOne<{count: number}>(
      'SELECT COUNT(*) as count FROM word_list'
    );

    const pairsResult = await this.db.getAll<{
      source_lang: string;
      target_lang: string;
      count: number;
    }>(
      `SELECT source_lang, target_lang, COUNT(*) as count 
       FROM word_list 
       GROUP BY source_lang, target_lang`
    );

    const languagePairs = pairsResult.map(row => ({
      source: row.source_lang as Language,
      target: row.target_lang as Language,
      count: row.count,
    }));

    return {
      totalCachedWords: totalResult?.count || 0,
      languagePairs,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Clear cached translations for a language pair
   */
  async clearCache(sourceLanguage?: Language, targetLanguage?: Language): Promise<void> {
    if (sourceLanguage && targetLanguage) {
      await this.db.execute('DELETE FROM word_list WHERE source_lang = ? AND target_lang = ?', [
        sourceLanguage,
        targetLanguage,
      ]);

      // Clear memory cache for this pair
      const prefix = `${sourceLanguage}_${targetLanguage}_`;
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
      }
    } else {
      await this.db.execute('DELETE FROM word_list');
      this.memoryCache.clear();
    }
  }

  /**
   * Pre-cache common words for a language pair
   */
  async preCacheCommonWords(
    sourceLanguage: Language,
    targetLanguage: Language,
    count: number = 500
  ): Promise<{cached: number; failed: number}> {
    // Get most frequent words
    const frequencyWords = await this.frequencyService.getWordsByProficiency(
      sourceLanguage,
      'beginner'
    );
    const words = frequencyWords.slice(0, count).map(w => w.word);

    if (words.length === 0) {
      return {cached: 0, failed: 0};
    }

    // Translate and cache
    const results = await this.lookupWords(words, sourceLanguage, targetLanguage);

    let cached = 0;
    let failed = 0;
    for (const result of results.values()) {
      if (result.entry) {
        cached++;
      } else {
        failed++;
      }
    }

    return {cached, failed};
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private getCacheKey(word: string, source: Language, target: Language): string {
    return `${source}_${target}_${word}`;
  }

  private async lookupFromDatabase(
    word: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<DynamicWordEntry | null> {
    const row = await this.db.getOne<any>(DatabaseSchema.wordList.getByWord, [
      word,
      sourceLanguage,
      targetLanguage,
    ]);

    if (!row) return null;

    return this.rowToEntry(row);
  }

  private async translateAndCache(
    word: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<DynamicWordEntry | null> {
    const result = await this.translationAPI.translate(word, sourceLanguage, targetLanguage);

    if (result.translatedText) {
      return this.createAndCacheEntry(
        word,
        result.translatedText,
        sourceLanguage,
        targetLanguage,
        result.provider
      );
    }

    return null;
  }

  private async createAndCacheEntry(
    sourceWord: string,
    targetWord: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    provider: string
  ): Promise<DynamicWordEntry> {
    // Get frequency rank if available
    const rank = await this.frequencyService.getWordRank(sourceLanguage, sourceWord);
    const proficiencyLevel = rank
      ? this.frequencyService.getProficiencyLevel(rank)
      : 'intermediate'; // Default to intermediate if no frequency data

    const entry: DynamicWordEntry = {
      id: `${sourceLanguage}_${targetLanguage}_${sourceWord}`,
      sourceWord,
      targetWord,
      sourceLanguage,
      targetLanguage,
      proficiencyLevel,
      frequencyRank: rank || 1000, // Default rank
      partOfSpeech: 'other' as PartOfSpeech,
      variants: [],
      isTranslated: true,
      translationProvider: provider,
      cachedAt: new Date().toISOString(),
    };

    // Save to database
    try {
      await this.db.execute(DatabaseSchema.wordList.insert, [
        entry.id,
        entry.sourceWord,
        entry.targetWord,
        entry.sourceLanguage,
        entry.targetLanguage,
        entry.proficiencyLevel,
        entry.frequencyRank,
        entry.partOfSpeech,
        null, // variants
        null, // pronunciation
      ]);
    } catch (error) {
      // Entry might already exist, ignore duplicate error
      if (!(error instanceof Error && error.message.includes('UNIQUE'))) {
        console.warn('Failed to cache translation:', error);
      }
    }

    return entry;
  }

  private async getCachedWordsByLevel(
    sourceLanguage: Language,
    targetLanguage: Language,
    level: ProficiencyLevel,
    limit: number
  ): Promise<DynamicWordEntry[]> {
    const rows = await this.db.getAll<any>(
      `SELECT * FROM word_list 
       WHERE source_lang = ? AND target_lang = ? AND proficiency = ?
       ORDER BY RANDOM() LIMIT ?`,
      [sourceLanguage, targetLanguage, level, limit]
    );

    return rows.map(row => this.rowToEntry(row));
  }

  private rowToEntry(row: any): DynamicWordEntry {
    return {
      id: row.id,
      sourceWord: row.source_word,
      targetWord: row.target_word,
      sourceLanguage: row.source_lang as Language,
      targetLanguage: row.target_lang as Language,
      proficiencyLevel: row.proficiency as ProficiencyLevel,
      frequencyRank: row.frequency_rank || 0,
      partOfSpeech: (row.part_of_speech as PartOfSpeech) || 'other',
      variants: row.variants ? JSON.parse(row.variants) : [],
      pronunciation: row.pronunciation,
      isTranslated: true,
    };
  }
}

// Export singleton instance
export const dynamicWordDatabase = new DynamicWordDatabase();
