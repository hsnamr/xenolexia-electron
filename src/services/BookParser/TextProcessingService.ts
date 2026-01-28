/**
 * Text Processing Service
 *
 * Integrates tokenization, word matching, and replacement for EPUB content.
 * This is the main entry point for processing chapter text for foreign word display.
 *
 * Features:
 * - Extracts clean content from EPUB HTML
 * - Tokenizes text while preserving HTML structure
 * - Handles embedded CSS styles
 * - Processes images to base64
 * - Applies word replacements
 * - Maintains word positions for tap detection
 */

import type {
  Chapter,
  WordEntry,
  ProficiencyLevel,
  ForeignWordData,
  Language,
} from '@/types';
import {Tokenizer, type Token, type TokenizerOptions} from '../TranslationEngine/Tokenizer';
import {WordReplacer, type ReplacerOptions, type ReplacementStats} from '../TranslationEngine/WordReplacer';
import {dynamicWordDatabase} from '../TranslationEngine/DynamicWordDatabase';

// ============================================================================
// Types
// ============================================================================

export interface ProcessingOptions {
  /** Source language code */
  sourceLanguage: Language;
  /** Target language code */
  targetLanguage: Language;
  /** Maximum proficiency level */
  proficiencyLevel: ProficiencyLevel;
  /** Word density (0.0 - 1.0) */
  density: number;
  /** Minimum spacing between replaced words */
  minWordSpacing?: number;
  /** Selection strategy */
  selectionStrategy?: 'random' | 'frequency' | 'distributed';
  /** Words to exclude from replacement */
  excludeWords?: string[];
  /** Skip words in quotes */
  skipQuotes?: boolean;
  /** Skip proper names */
  skipNames?: boolean;
}

export interface ProcessedContent {
  /** The processed HTML with foreign word markers */
  html: string;
  /** Array of foreign words in the content */
  foreignWords: ForeignWordData[];
  /** Processing statistics */
  stats: ProcessingStats;
  /** Unique words found in the content */
  uniqueWords: string[];
  /** Tokens extracted from the content */
  tokens: Token[];
}

export interface ProcessingStats extends ReplacementStats {
  /** Time taken to process in milliseconds */
  processingTimeMs: number;
  /** Number of unique words */
  uniqueWordCount: number;
  /** Number of words looked up in database */
  databaseLookups: number;
  /** Number of words found in database */
  databaseHits: number;
}

export interface ExtractedContent {
  /** The body HTML content */
  body: string;
  /** Extracted CSS styles */
  styles: string[];
  /** Title from the HTML */
  title?: string;
  /** Language attribute if present */
  language?: string;
}

// ============================================================================
// Text Processing Service Class
// ============================================================================

export class TextProcessingService {
  private tokenizer: Tokenizer;
  private wordReplacer: WordReplacer;
  private wordCache: Map<string, WordEntry | null> = new Map();

  constructor() {
    this.tokenizer = new Tokenizer();
    this.wordReplacer = new WordReplacer();
  }

  /**
   * Process chapter content and replace words with foreign equivalents
   */
  async processChapter(
    chapter: Chapter,
    options: ProcessingOptions
  ): Promise<ProcessedContent> {
    const startTime = Date.now();

    // Extract clean HTML from chapter content
    const extracted = this.extractContent(chapter.content);

    // Update tokenizer options
    this.tokenizer.updateOptions({
      skipQuotes: options.skipQuotes ?? true,
      skipNames: options.skipNames ?? true,
      skipWords: new Set(options.excludeWords),
    });

    // Tokenize the content
    const tokens = this.tokenizer.tokenize(extracted.body);

    // Get unique words for database lookup
    const uniqueWords = Tokenizer.getUniqueWords(tokens);

    // Look up words in database
    const {wordEntries, lookups, hits} = await this.lookupWords(
      uniqueWords,
      options.sourceLanguage,
      options.targetLanguage
    );

    // Update replacer options
    this.wordReplacer.updateOptions({
      density: options.density,
      maxProficiency: options.proficiencyLevel,
      minWordSpacing: options.minWordSpacing ?? 3,
      selectionStrategy: options.selectionStrategy ?? 'distributed',
      excludeWords: new Set(options.excludeWords),
    });

    // Perform word replacement
    const result = this.wordReplacer.replace(extracted.body, tokens, wordEntries);

    const processingTimeMs = Date.now() - startTime;

    return {
      html: result.html,
      foreignWords: result.foreignWords,
      tokens,
      uniqueWords,
      stats: {
        ...result.stats,
        processingTimeMs,
        uniqueWordCount: uniqueWords.length,
        databaseLookups: lookups,
        databaseHits: hits,
      },
    };
  }

  /**
   * Extract clean content from EPUB HTML
   */
  extractContent(html: string): ExtractedContent {
    const result: ExtractedContent = {
      body: '',
      styles: [],
    };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      result.title = this.decodeHtmlEntities(titleMatch[1].trim());
    }

    // Extract language
    const langMatch = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
    if (langMatch) {
      result.language = langMatch[1];
    }

    // Extract styles from <style> tags
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let styleMatch;
    while ((styleMatch = styleRegex.exec(html)) !== null) {
      result.styles.push(styleMatch[1]);
    }

    // Extract linked stylesheets (just the references, actual content handled elsewhere)
    const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
    // Note: We'd need the EPUB context to resolve these, skipping for now

    // Extract body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      result.body = bodyMatch[1];
    } else {
      // If no body tag, try to extract content after </head> or use entire content
      const afterHeadMatch = html.match(/<\/head>\s*([\s\S]*?)$/i);
      if (afterHeadMatch) {
        // Remove closing tags
        result.body = afterHeadMatch[1].replace(/<\/html>\s*$/i, '').trim();
      } else {
        // No head either, strip doctype and html wrapper
        result.body = html
          .replace(/<!DOCTYPE[^>]*>/i, '')
          .replace(/<\/?html[^>]*>/gi, '')
          .replace(/<head[^>]*>[\s\S]*?<\/head>/i, '')
          .trim();
      }
    }

    // Clean up the body content
    result.body = this.cleanBodyContent(result.body);

    return result;
  }

  /**
   * Clean up body content for processing
   */
  private cleanBodyContent(html: string): string {
    return (
      html
        // Remove XML processing instructions
        .replace(/<\?xml[^?]*\?>/gi, '')
        // Normalize whitespace in text nodes (but preserve structure)
        .replace(/>\s+</g, '> <')
        // Remove empty paragraphs
        .replace(/<p[^>]*>\s*<\/p>/gi, '')
        // Normalize line breaks
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Remove excessive blank lines
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&mdash;': '—',
      '&ndash;': '–',
      '&hellip;': '…',
      '&lsquo;': '\u2018',
      '&rsquo;': '\u2019',
      '&ldquo;': '\u201C',
      '&rdquo;': '\u201D',
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }

    // Handle numeric entities
    decoded = decoded.replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 10))
    );
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );

    return decoded;
  }

  /**
   * Look up words in the dynamic word database
   */
  private async lookupWords(
    words: string[],
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<{
    wordEntries: Map<string, WordEntry | null>;
    lookups: number;
    hits: number;
  }> {
    const wordEntries = new Map<string, WordEntry | null>();
    let lookups = 0;
    let hits = 0;

    for (const word of words) {
      // Check cache first
      const cacheKey = `${sourceLanguage}:${targetLanguage}:${word}`;
      if (this.wordCache.has(cacheKey)) {
        const cached = this.wordCache.get(cacheKey);
        wordEntries.set(word, cached ?? null);
        if (cached) hits++;
        continue;
      }

      lookups++;

      try {
        const result = await dynamicWordDatabase.lookupWord(
          word,
          sourceLanguage,
          targetLanguage
        );

        if (result) {
          const entry: WordEntry = {
            id: result.id,
            sourceWord: result.sourceWord,
            targetWord: result.targetWord,
            sourceLanguage,
            targetLanguage,
            proficiencyLevel: result.proficiencyLevel,
            frequencyRank: result.frequencyRank,
            partOfSpeech: result.partOfSpeech || 'unknown',
            pronunciation: result.pronunciation,
            variants: result.variants,
          };
          wordEntries.set(word, entry);
          this.wordCache.set(cacheKey, entry);
          hits++;
        } else {
          wordEntries.set(word, null);
          this.wordCache.set(cacheKey, null);
        }
      } catch (error) {
        console.warn(`Failed to lookup word "${word}":`, error);
        wordEntries.set(word, null);
      }
    }

    return {wordEntries, lookups, hits};
  }

  /**
   * Get word at a specific position in the original content
   */
  getWordAtPosition(tokens: Token[], position: number): Token | null {
    for (const token of tokens) {
      if (position >= token.startIndex && position <= token.endIndex) {
        return token;
      }
    }
    return null;
  }

  /**
   * Get words in a range of positions
   */
  getWordsInRange(tokens: Token[], start: number, end: number): Token[] {
    return tokens.filter(
      token => token.startIndex >= start && token.endIndex <= end
    );
  }

  /**
   * Get context around a word (surrounding sentence)
   */
  getWordContext(html: string, token: Token, contextLength: number = 100): string {
    const plainText = this.stripHtml(html);

    // Find approximate position in plain text
    // This is a simplification; in practice you'd need proper position mapping
    const wordPos = plainText.toLowerCase().indexOf(token.word.toLowerCase());
    if (wordPos === -1) {
      return '';
    }

    const start = Math.max(0, wordPos - contextLength);
    const end = Math.min(plainText.length, wordPos + token.word.length + contextLength);

    let context = plainText.substring(start, end);

    // Try to extend to sentence boundaries
    const sentenceStart = context.lastIndexOf('.', wordPos - start);
    const sentenceEnd = context.indexOf('.', wordPos - start + token.word.length);

    if (sentenceStart !== -1 && sentenceEnd !== -1) {
      context = context.substring(sentenceStart + 1, sentenceEnd + 1).trim();
    }

    return (start > 0 ? '...' : '') + context + (end < plainText.length ? '...' : '');
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Clear the word cache
   */
  clearCache(): void {
    this.wordCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {size: number; memoryEstimate: number} {
    const size = this.wordCache.size;
    // Rough estimate: ~200 bytes per entry
    const memoryEstimate = size * 200;
    return {size, memoryEstimate};
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const textProcessingService = new TextProcessingService();
