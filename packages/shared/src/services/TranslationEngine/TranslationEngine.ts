/**
 * Translation Engine - Core service for processing text and replacing words
 *
 * Orchestrates the translation process:
 * 1. Tokenizes HTML content while preserving structure
 * 2. Looks up translations using DynamicWordDatabase
 * 3. Replaces words based on proficiency and density settings
 * 4. Returns processed content with foreign word markers
 *
 * Supports any language pair through the DynamicWordDatabase.
 */

import type { Language, ProficiencyLevel, ForeignWordData, WordEntry } from '../types';
import type { TranslationOptions, ProcessedText, ProcessingStats } from './types';
import { Tokenizer, Token } from './Tokenizer';
import { WordReplacer, ReplacerOptions } from './WordReplacer';
import { DynamicWordDatabase, dynamicWordDatabase } from './DynamicWordDatabase';
import { WordMatcher } from './WordMatcher';

// ============================================================================
// Translation Engine
// ============================================================================

export class TranslationEngine {
  private tokenizer: Tokenizer;
  private replacer: WordReplacer;
  private database: DynamicWordDatabase;
  private wordMatcher: WordMatcher;
  private options: TranslationOptions;
  private initialized: boolean = false;

  constructor(options: TranslationOptions) {
    this.options = options;

    // Initialize tokenizer with context-aware settings
    this.tokenizer = new Tokenizer({
      skipQuotes: true,
      skipNames: true,
      skipCode: true,
      minWordLength: 2,
      maxWordLength: 25,
      skipWords: new Set(options.excludeWords || []),
    });

    // Initialize replacer with density and proficiency settings
    this.replacer = new WordReplacer({
      density: options.density,
      maxProficiency: options.proficiencyLevel,
      preferredPartsOfSpeech: options.preferredPartOfSpeech,
      excludeWords: new Set(options.excludeWords || []),
      minWordSpacing: 3,
      selectionStrategy: 'distributed',
    });

    // Use dynamic database for multi-language support
    this.database = dynamicWordDatabase;

    // Keep WordMatcher for fallback/bundled data
    this.wordMatcher = new WordMatcher(options.sourceLanguage, options.targetLanguage);
  }

  /**
   * Initialize the translation engine
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.database.initialize();
    await this.wordMatcher.initialize();
    this.initialized = true;
  }

  /**
   * Process text content and replace eligible words with foreign equivalents
   */
  async processContent(content: string): Promise<ProcessedText> {
    await this.initialize();

    const startTime = Date.now();

    // Step 1: Tokenize the HTML content
    const tokens = this.tokenizer.tokenize(content);

    // Step 2: Get unique words that need translation
    const uniqueWords = Tokenizer.getUniqueWords(tokens);

    // Step 3: Look up translations for all unique words
    const wordEntries = await this.lookupWords(uniqueWords);

    // Step 4: Replace words in content
    const result = this.replacer.replace(content, tokens, wordEntries);

    // Build processing stats
    const stats: ProcessingStats = {
      totalWords: result.stats.totalTokens,
      eligibleWords: result.stats.eligibleTokens,
      replacedWords: result.stats.replacedTokens,
      processingTime: Date.now() - startTime,
    };

    return {
      content: result.html,
      foreignWords: result.foreignWords,
      stats,
    };
  }

  /**
   * Process content with custom options (doesn't modify engine state)
   */
  async processContentWithOptions(
    content: string,
    overrides: Partial<TranslationOptions>
  ): Promise<ProcessedText> {
    const mergedOptions = { ...this.options, ...overrides };

    // Create temporary replacer with overridden options
    const tempReplacer = new WordReplacer({
      density: mergedOptions.density,
      maxProficiency: mergedOptions.proficiencyLevel,
      preferredPartsOfSpeech: mergedOptions.preferredPartOfSpeech,
      excludeWords: new Set(mergedOptions.excludeWords || []),
    });

    await this.initialize();

    const startTime = Date.now();
    const tokens = this.tokenizer.tokenize(content);
    const uniqueWords = Tokenizer.getUniqueWords(tokens);
    const wordEntries = await this.lookupWords(uniqueWords);
    const result = tempReplacer.replace(content, tokens, wordEntries);

    return {
      content: result.html,
      foreignWords: result.foreignWords,
      stats: {
        totalWords: result.stats.totalTokens,
        eligibleWords: result.stats.eligibleTokens,
        replacedWords: result.stats.replacedTokens,
        processingTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Look up translations for a list of words
   */
  private async lookupWords(words: string[]): Promise<Map<string, WordEntry | null>> {
    const results = new Map<string, WordEntry | null>();

    // Try dynamic database first (supports any language pair)
    const lookupResults = await this.database.lookupWords(
      words,
      this.options.sourceLanguage,
      this.options.targetLanguage
    );

    for (const [word, result] of lookupResults) {
      if (result.entry) {
        results.set(word, result.entry);
      } else {
        // Fallback to WordMatcher for bundled data
        const fallbackEntry = await this.wordMatcher.findMatch(
          word,
          this.options.proficiencyLevel
        );
        results.set(word, fallbackEntry);
      }
    }

    return results;
  }

  /**
   * Update translation options
   */
  updateOptions(options: Partial<TranslationOptions>): void {
    this.options = { ...this.options, ...options };

    // Update tokenizer if exclude words changed
    if (options.excludeWords) {
      this.tokenizer.updateOptions({
        skipWords: new Set(options.excludeWords),
      });
    }

    // Update replacer
    const replacerUpdates: Partial<ReplacerOptions> = {};
    if (options.density !== undefined) {
      replacerUpdates.density = options.density;
    }
    if (options.proficiencyLevel !== undefined) {
      replacerUpdates.maxProficiency = options.proficiencyLevel;
    }
    if (options.preferredPartOfSpeech !== undefined) {
      replacerUpdates.preferredPartsOfSpeech = options.preferredPartOfSpeech;
    }
    if (options.excludeWords !== undefined) {
      replacerUpdates.excludeWords = new Set(options.excludeWords);
    }
    this.replacer.updateOptions(replacerUpdates);

    // Reinitialize word matcher if language changed
    if (options.sourceLanguage || options.targetLanguage) {
      this.wordMatcher = new WordMatcher(
        options.sourceLanguage || this.options.sourceLanguage,
        options.targetLanguage || this.options.targetLanguage
      );
      this.initialized = false; // Force re-initialization
    }
  }

  /**
   * Get current options
   */
  getOptions(): TranslationOptions {
    return { ...this.options };
  }

  /**
   * Get translation statistics for the current language pair
   */
  async getStats(): Promise<{
    cachedWords: number;
    availableWords: number;
    byProficiency: { beginner: number; intermediate: number; advanced: number };
  }> {
    await this.initialize();

    const dbStats = await this.database.getStats();
    const matcherStats = await this.wordMatcher.getStats();

    return {
      cachedWords: dbStats.totalCachedWords,
      availableWords: matcherStats.total,
      byProficiency: {
        beginner: matcherStats.beginner,
        intermediate: matcherStats.intermediate,
        advanced: matcherStats.advanced,
      },
    };
  }

  /**
   * Pre-cache common words for better offline performance
   */
  async preCacheWords(count: number = 500): Promise<{ cached: number; failed: number }> {
    await this.initialize();

    return this.database.preCacheCommonWords(
      this.options.sourceLanguage,
      this.options.targetLanguage,
      count
    );
  }

  /**
   * Check if the current language pair is supported
   */
  async isLanguagePairSupported(): Promise<boolean> {
    return this.database.isLanguagePairSupported(
      this.options.sourceLanguage,
      this.options.targetLanguage
    );
  }

  /**
   * Get a single word translation (useful for popup details)
   */
  async translateWord(word: string): Promise<WordEntry | null> {
    await this.initialize();

    const result = await this.database.lookupWord(
      word,
      this.options.sourceLanguage,
      this.options.targetLanguage
    );

    return result.entry;
  }

  /**
   * Get words for vocabulary practice
   */
  async getWordsForPractice(
    level: ProficiencyLevel,
    count: number
  ): Promise<WordEntry[]> {
    await this.initialize();

    return this.database.getWordsByProficiency(
      this.options.sourceLanguage,
      this.options.targetLanguage,
      level,
      count
    );
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new TranslationEngine instance
 */
export function createTranslationEngine(options: TranslationOptions): TranslationEngine {
  return new TranslationEngine(options);
}

/**
 * Create a TranslationEngine with default options for a language pair
 */
export function createDefaultEngine(
  sourceLanguage: Language,
  targetLanguage: Language
): TranslationEngine {
  return new TranslationEngine({
    sourceLanguage,
    targetLanguage,
    proficiencyLevel: 'beginner',
    density: 0.15,
  });
}
