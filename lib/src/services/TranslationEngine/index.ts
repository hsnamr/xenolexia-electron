/**
 * Translation Engine - Re-export from xenolexia-typescript core.
 */

export {
  TranslationEngine,
  createTranslationEngine,
  createDefaultEngine,
  Tokenizer,
  WordReplacer,
  WordMatcher,
  TranslationAPIService,
  translationAPI,
  FrequencyListService,
  frequencyListService,
  DynamicWordDatabase,
  WordDatabaseService,
  PROFICIENCY_THRESHOLDS,
  PROFICIENCY_RANKS,
  getProficiencyFromRank,
  generateInjectedScript,
  generateForeignWordStyles,
  getFullInjectedContent,
  injectedScript,
  foreignWordStyles,
} from 'xenolexia-typescript';
export type {
  TranslationOptions,
  ProcessedText,
  InjectedScriptOptions,
} from 'xenolexia-typescript';
