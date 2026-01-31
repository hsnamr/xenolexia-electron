/**
 * Translation Engine - Core word replacement and translation logic
 *
 * Supports:
 * - Any language pair via free translation APIs
 * - Frequency-based proficiency levels
 * - Offline caching
 * - Multiple translation providers
 */

// Main engine
export {
  TranslationEngine,
  createTranslationEngine,
  createDefaultEngine,
} from './TranslationEngine';

// Tokenizer
export { Tokenizer, tokenizer } from './Tokenizer';
export type { Token, TextSegment, TokenizerOptions } from './Tokenizer';

// Word Replacer
export { WordReplacer, createWordReplacer } from './WordReplacer';
export type {
  ReplacementCandidate,
  ReplacementResult,
  ReplacementStats,
  ReplacerOptions,
} from './WordReplacer';

// Injected Script (WebView JS)
export {
  generateInjectedScript,
  generateForeignWordStyles,
  getFullInjectedContent,
  injectedScript,
  foreignWordStyles,
} from './InjectedScript';
export type { InjectedScriptOptions } from './InjectedScript';

// Word matching (legacy, uses bundled data)
export { WordMatcher } from './WordMatcher';

// Translation API Service (multiple providers)
export {
  TranslationAPIService,
  translationAPI,
} from './TranslationAPIService';
export type {
  TranslationProvider,
  TranslationResult,
  TranslationAPIConfig,
  BulkTranslationResult,
} from './TranslationAPIService';

// Frequency List Service
export {
  FrequencyListService,
  frequencyListService,
  PROFICIENCY_THRESHOLDS,
} from './FrequencyListService';
export type {
  FrequencyWord,
  FrequencyList,
  FrequencyListStats,
} from './FrequencyListService';

// Dynamic Word Database (any language pair)
export {
  DynamicWordDatabase,
  dynamicWordDatabase,
} from './DynamicWordDatabase';
export type {
  DynamicWordEntry,
  WordLookupResult,
  DatabaseStats,
} from './DynamicWordDatabase';

// Legacy Word Database (bundled EN-EL data)
export {
  WordDatabaseService,
  wordDatabase,
  PROFICIENCY_RANKS,
  getProficiencyFromRank,
} from './WordDatabase';
export type {
  WordDatabaseEntry,
  WordLookupOptions,
  WordDatabaseStats,
  BulkImportResult,
} from './WordDatabase';

// Types
export type {
  TranslationOptions,
  ProcessedText,
  ProcessingStats,
  WordMatch,
} from './types';
