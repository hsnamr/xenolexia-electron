/**
 * useWordTapHandler - Hook for handling foreign word taps in the reader
 *
 * Features:
 * - Processes word tap data from WebView
 * - Fetches full word entry from database
 * - Manages selected word state
 * - Provides save/dismiss actions
 * - Extracts context sentence
 */

import { useState, useCallback, useRef } from 'react';
import type { ForeignWordData, WordEntry, VocabularyItem, Language, ProficiencyLevel } from '@/types';
import { useVocabularyStore } from '@xenolexia/shared/stores/vocabularyStore';
import { useStatisticsStore } from '@xenolexia/shared/stores/statisticsStore';
import { dynamicWordDatabase } from '@xenolexia/shared/services/TranslationEngine/DynamicWordDatabase';

// ============================================================================
// Types
// ============================================================================

export interface WebViewWordData {
  foreignWord: string;
  originalWord: string;
  wordId?: string;
  pronunciation?: string | null;
  partOfSpeech?: string;
  context?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    windowHeight: number;
    windowWidth: number;
  };
}

export interface WordTapHandlerOptions {
  bookId: string;
  bookTitle: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  onWordSaved?: (word: VocabularyItem) => void;
  onWordKnown?: (wordId: string) => void;
}

export interface WordTapHandlerResult {
  /** Currently selected word data */
  selectedWord: ForeignWordData | null;
  /** Context sentence around the word */
  contextSentence: string | null;
  /** Position for popup placement */
  popupPosition: { x: number; y: number } | null;
  /** Whether word data is being fetched */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Handle a word tap from WebView */
  handleWordTap: (data: WebViewWordData) => void;
  /** Handle a word long press from WebView */
  handleWordLongPress: (data: WebViewWordData) => void;
  /** Save the current word to vocabulary */
  saveWord: () => Promise<void>;
  /** Mark current word as known */
  markAsKnown: () => void;
  /** Dismiss the popup */
  dismiss: () => void;
  /** Check if a word is already saved */
  isWordSaved: (wordId: string) => boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWordTapHandler(options: WordTapHandlerOptions): WordTapHandlerResult {
  const {
    bookId,
    bookTitle,
    sourceLanguage,
    targetLanguage,
    onWordSaved,
    onWordKnown,
  } = options;

  // State
  const [selectedWord, setSelectedWord] = useState<ForeignWordData | null>(null);
  const [contextSentence, setContextSentence] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track saved words
  const savedWordIds = useRef<Set<string>>(new Set());

  // Store hooks
  const { addWord, vocabulary } = useVocabularyStore();
  const { recordWordRevealed, recordWordSaved } = useStatisticsStore();

  /**
   * Process word data from WebView and fetch full entry
   */
  const processWordData = useCallback(async (data: WebViewWordData): Promise<ForeignWordData | null> => {
    try {
      // Try to get full word entry from database
      let wordEntry: WordEntry | null = null;

      if (data.wordId) {
        const result = await dynamicWordDatabase.lookupWord(
          data.originalWord,
          sourceLanguage,
          targetLanguage
        );
        wordEntry = result.entry;
      }

      // Create word entry from WebView data if not found in database
      if (!wordEntry) {
        wordEntry = {
          id: data.wordId || `${sourceLanguage}_${targetLanguage}_${data.originalWord.toLowerCase()}`,
          sourceWord: data.originalWord,
          targetWord: data.foreignWord,
          sourceLanguage,
          targetLanguage,
          proficiencyLevel: 'beginner' as ProficiencyLevel,
          frequencyRank: 0,
          partOfSpeech: (data.partOfSpeech as WordEntry['partOfSpeech']) || 'other',
          variants: [],
          pronunciation: data.pronunciation || undefined,
        };
      }

      return {
        originalWord: data.originalWord,
        foreignWord: data.foreignWord,
        startIndex: 0,
        endIndex: 0,
        wordEntry,
      };
    } catch (err) {
      console.error('Error processing word data:', err);
      return null;
    }
  }, [sourceLanguage, targetLanguage]);

  /**
   * Handle word tap from WebView
   */
  const handleWordTap = useCallback(async (data: WebViewWordData) => {
    setIsLoading(true);
    setError(null);

    const wordData = await processWordData(data);

    if (wordData) {
      setSelectedWord(wordData);
      setContextSentence(data.context || null);
      setPopupPosition(data.position ? { x: data.position.x, y: data.position.y } : null);
      recordWordRevealed();
    } else {
      setError('Failed to load word data');
    }

    setIsLoading(false);
  }, [processWordData, recordWordRevealed]);

  /**
   * Handle word long press from WebView
   */
  const handleWordLongPress = useCallback(async (data: WebViewWordData) => {
    // Same as tap for now, but could show extended options
    await handleWordTap(data);
  }, [handleWordTap]);

  /**
   * Handle word hover end (desktop only)
   */
  const handleWordHoverEnd = useCallback(() => {
    setSelectedWord(null);
    setContextSentence(null);
    setPopupPosition(null);
  }, []);

  /**
   * Save current word to vocabulary
   */
  const saveWord = useCallback(async () => {
    if (!selectedWord) return;

    try {
      const vocabularyItem: VocabularyItem = {
        id: `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceWord: selectedWord.originalWord,
        targetWord: selectedWord.foreignWord,
        sourceLanguage: selectedWord.wordEntry.sourceLanguage,
        targetLanguage: selectedWord.wordEntry.targetLanguage,
        contextSentence: contextSentence,
        bookId,
        bookTitle,
        addedAt: new Date(),
        lastReviewedAt: null,
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 0,
        status: 'new',
      };

      await addWord(vocabularyItem);
      savedWordIds.current.add(selectedWord.wordEntry.id);
      recordWordSaved();
      onWordSaved?.(vocabularyItem);

      // Dismiss popup after saving
      setSelectedWord(null);
      setContextSentence(null);
      setPopupPosition(null);
    } catch (err) {
      console.error('Failed to save word:', err);
      setError('Failed to save word');
    }
  }, [selectedWord, contextSentence, bookId, bookTitle, addWord, recordWordSaved, onWordSaved]);

  /**
   * Mark current word as known
   */
  const markAsKnown = useCallback(() => {
    if (!selectedWord) return;

    // Track that user knows this word (could be used to exclude from future replacements)
    onWordKnown?.(selectedWord.wordEntry.id);

    // Dismiss popup
    setSelectedWord(null);
    setContextSentence(null);
    setPopupPosition(null);
  }, [selectedWord, onWordKnown]);

  /**
   * Dismiss the popup
   */
  const dismiss = useCallback(() => {
    setSelectedWord(null);
    setContextSentence(null);
    setPopupPosition(null);
    setError(null);
  }, []);

  /**
   * Check if a word is already saved
   */
  const isWordSaved = useCallback((wordId: string) => {
    if (savedWordIds.current.has(wordId)) return true;
    return vocabulary.some(v => 
      v.sourceWord.toLowerCase() === wordId.toLowerCase() ||
      v.targetWord.toLowerCase() === wordId.toLowerCase()
    );
  }, [vocabulary]);

  return {
    selectedWord,
    contextSentence,
    popupPosition,
    isLoading,
    error,
    handleWordTap,
    handleWordLongPress,
    handleWordHoverEnd,
    saveWord,
    markAsKnown,
    dismiss,
    isWordSaved,
  };
}
