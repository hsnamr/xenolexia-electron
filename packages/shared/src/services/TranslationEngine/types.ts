/**
 * Translation Engine Types
 */

import type {Language, ProficiencyLevel, WordEntry, ForeignWordData} from '../types/index';

export interface TranslationOptions {
  /**
   * Source language (book's language)
   */
  sourceLanguage: Language;

  /**
   * Target language (language to learn)
   */
  targetLanguage: Language;

  /**
   * Proficiency level - determines which words to replace
   */
  proficiencyLevel: ProficiencyLevel;

  /**
   * Percentage of eligible words to replace (0.0 - 1.0)
   */
  density: number;

  /**
   * Words to exclude from replacement (already learned)
   */
  excludeWords?: string[];

  /**
   * Prefer replacing certain parts of speech
   */
  preferredPartOfSpeech?: string[];
}

export interface ProcessedText {
  /**
   * The processed HTML/text with foreign word markers
   */
  content: string;

  /**
   * Array of foreign words found in the text
   */
  foreignWords: ForeignWordData[];

  /**
   * Statistics about the processing
   */
  stats: ProcessingStats;
}

export interface ProcessingStats {
  /**
   * Total words in original text
   */
  totalWords: number;

  /**
   * Words eligible for replacement
   */
  eligibleWords: number;

  /**
   * Words actually replaced
   */
  replacedWords: number;

  /**
   * Processing time in milliseconds
   */
  processingTime: number;
}

export interface WordMatch {
  /**
   * Original word as found in text
   */
  originalWord: string;

  /**
   * Normalized form (lowercase, no punctuation)
   */
  normalizedWord: string;

  /**
   * Position in original text
   */
  startIndex: number;

  /**
   * End position in original text
   */
  endIndex: number;

  /**
   * Matching dictionary entry
   */
  entry: WordEntry | null;

  /**
   * Leading punctuation/whitespace
   */
  prefix: string;

  /**
   * Trailing punctuation/whitespace
   */
  suffix: string;
}
