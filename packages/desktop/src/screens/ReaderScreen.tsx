/**
 * Reader Screen - React DOM version
 */

import React, {useState, useCallback, useEffect} from 'react';

import {useLibraryStore} from '@xenolexia/shared/stores/libraryStore';
import {useReaderStore} from '@xenolexia/shared/stores/readerStore';
import {useVocabularyStore} from '@xenolexia/shared/stores/vocabularyStore';
import {useParams, useNavigate} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import {ReaderContent} from './ReaderContent';

import type {ForeignWordData, VocabularyItem} from '@xenolexia/shared/types';
import './ReaderScreen.css';

export function ReaderScreen(): React.JSX.Element {
  const {bookId} = useParams<{bookId: string}>();
  const navigate = useNavigate();
  const {getBook} = useLibraryStore();
  const {
    currentBook,
    currentChapter,
    chapters,
    processedHtml,
    settings,
    isLoading,
    isLoadingChapter,
    error,
    loadBook,
    goToNextChapter,
    goToPreviousChapter,
    updateProgress,
    updateSettings,
    closeBook,
    recordWordSaved,
  } = useReaderStore();

  const {addWord, isWordSaved} = useVocabularyStore();
  const book = bookId ? getBook(bookId) : null;
  const [selectedWord, setSelectedWord] = useState<ForeignWordData | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showReaderSettings, setShowReaderSettings] = useState(false);

  useEffect(() => {
    if (bookId && book) {
      loadBook(book);
    }
    return () => {
      closeBook();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, book]);

  // Keyboard shortcuts: next/prev chapter, toggle controls
  useEffect(() => {
    if (!book || selectedWord || showReaderSettings) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          goToNextChapter();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          goToPreviousChapter();
          break;
        case 'c':
        case 'C':
        case 'Escape':
          e.preventDefault();
          setShowControls(prev => !prev);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [book, selectedWord, showReaderSettings, goToNextChapter, goToPreviousChapter]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleWordClick = useCallback((word: ForeignWordData) => {
    setSelectedWord(word);
    setShowControls(false);
  }, []);

  const handleWordHover = useCallback((word: ForeignWordData) => {
    setSelectedWord(word);
    // Track word reveal for session stats
    useReaderStore.getState().recordWordRevealed();
  }, []);

  const handleWordHoverEnd = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const handleProgressChange = useCallback(
    (progress: number) => {
      updateProgress(progress);
    },
    [updateProgress]
  );

  const dismissPopup = useCallback(() => {
    setSelectedWord(null);
    setShowControls(true);
  }, []);

  if (error) {
    return (
      <div className="reader-screen">
        <div className="reader-error">
          <p>{error}</p>
          <button onClick={() => book && loadBook(book)}>Retry</button>
        </div>
      </div>
    );
  }

  if (isLoading || !book) {
    return (
      <div className="reader-screen">
        <div className="reader-loading">Loading book...</div>
      </div>
    );
  }

  const themeClass = `reader-theme-${settings.theme}`;

  return (
    <div className={`reader-screen ${themeClass}`}>
      {showControls && (
        <div className="reader-header">
          <button onClick={handleBack} className="reader-back-button">
            ← Back
          </button>
          <div className="reader-header-center">
            <h2>{currentChapter?.title || book.title}</h2>
          </div>
          <button onClick={() => setShowReaderSettings(true)} className="reader-settings-button">
            ⚙️
          </button>
        </div>
      )}

      <div
        className="reader-content"
        onClick={() => setShowControls(!showControls)}
        style={{
          fontSize: `${settings.fontSize}px`,
          fontFamily: settings.fontFamily,
          lineHeight: settings.lineHeight,
          padding: `0 ${settings.marginHorizontal}px`,
        }}
      >
        {isLoadingChapter ? (
          <div className="reader-loading-chapter">Loading chapter...</div>
        ) : processedHtml ? (
          <ReaderContent
            html={processedHtml}
            book={book}
            onWordClick={handleWordClick}
            onWordHover={handleWordHover}
            onWordHoverEnd={handleWordHoverEnd}
            onProgressChange={handleProgressChange}
          />
        ) : (
          <div className="reader-empty">No content available</div>
        )}
      </div>

      {showControls && (
        <div className="reader-footer">
          <button
            onClick={goToPreviousChapter}
            disabled={!currentChapter || currentChapter.index === 0}
          >
            ← Previous
          </button>
          <div className="reader-progress">
            {chapters.length > 0
              ? Math.round((((currentChapter?.index || 0) + 1) / chapters.length) * 100)
              : 0}
            %
          </div>
          <button
            onClick={goToNextChapter}
            disabled={!currentChapter || currentChapter.index >= chapters.length - 1}
          >
            Next →
          </button>
        </div>
      )}

      {showReaderSettings && (
        <ReaderSettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowReaderSettings(false)}
        />
      )}
      {selectedWord && (
        <TranslationPopup
          word={selectedWord}
          isSaved={isWordSaved(selectedWord.originalWord, selectedWord.wordEntry.targetLanguage)}
          onDismiss={dismissPopup}
          onSave={async () => {
            try {
              // Check if word is already saved
              if (isWordSaved(selectedWord.originalWord, selectedWord.wordEntry.targetLanguage)) {
                alert('This word is already in your vocabulary!');
                dismissPopup();
                return;
              }

              // Use currentBook from readerStore if available, otherwise fallback to book from library
              const bookForContext = currentBook || book;

              // Create VocabularyItem from ForeignWordData
              const vocabularyItem: VocabularyItem = {
                id: uuidv4(),
                sourceWord: selectedWord.originalWord,
                targetWord: selectedWord.foreignWord,
                sourceLanguage: selectedWord.wordEntry.sourceLanguage,
                targetLanguage: selectedWord.wordEntry.targetLanguage,
                contextSentence: null, // Could extract from chapter content in future
                bookId: bookForContext?.id ?? null,
                bookTitle: bookForContext?.title ?? null,
                addedAt: new Date(),
                lastReviewedAt: null,
                reviewCount: 0,
                easeFactor: 2.5, // SM-2 default
                interval: 0,
                status: 'new',
              };

              await addWord(vocabularyItem);
              recordWordSaved();
              dismissPopup();
            } catch (error) {
              console.error('Failed to save word:', error);
              alert('Failed to save word to vocabulary');
            }
          }}
          onKnewIt={() => {
            // For now, just dismiss - could mark word as known in future
            dismissPopup();
          }}
        />
      )}
    </div>
  );
}

interface ReaderSettingsPanelProps {
  settings: {
    theme: string;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
  onUpdate: (updates: Partial<ReaderSettingsPanelProps['settings']>) => void;
  onClose: () => void;
}

function ReaderSettingsPanel({
  settings,
  onUpdate,
  onClose,
}: ReaderSettingsPanelProps): React.JSX.Element {
  return (
    <div className="reader-settings-overlay" onClick={onClose}>
      <div className="reader-settings-panel" onClick={e => e.stopPropagation()}>
        <div className="reader-settings-header">
          <h3>Reader settings</h3>
          <button type="button" onClick={onClose} className="reader-settings-close">
            ✕
          </button>
        </div>
        <div className="reader-settings-body">
          <label>
            Theme
            <select
              value={settings.theme}
              onChange={e => onUpdate({theme: e.target.value})}
              className="reader-settings-select"
            >
              <option value="light">Light</option>
              <option value="sepia">Sepia</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Font size
            <input
              type="number"
              min={12}
              max={32}
              value={settings.fontSize}
              onChange={e => onUpdate({fontSize: Number(e.target.value) || 18})}
              className="reader-settings-input"
            />
          </label>
          <label>
            Font family
            <select
              value={settings.fontFamily}
              onChange={e => onUpdate({fontFamily: e.target.value})}
              className="reader-settings-select"
            >
              <option value="Georgia">Georgia</option>
              <option value="serif">Serif</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="system-ui, sans-serif">System</option>
            </select>
          </label>
          <label>
            Line spacing
            <input
              type="number"
              min={1}
              max={3}
              step={0.1}
              value={settings.lineHeight}
              onChange={e => onUpdate({lineHeight: Number(e.target.value) || 1.6})}
              className="reader-settings-input"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

interface TranslationPopupProps {
  word: ForeignWordData;
  isSaved?: boolean;
  onDismiss: () => void;
  onSave: () => void;
  onKnewIt?: () => void;
}

function TranslationPopup({
  word,
  isSaved,
  onDismiss,
  onSave,
  onKnewIt,
}: TranslationPopupProps): React.JSX.Element {
  return (
    <div className="translation-popup-overlay" onClick={onDismiss}>
      <div className="translation-popup" onClick={e => e.stopPropagation()}>
        <div className="translation-popup-header">
          <h3>{word.foreignWord}</h3>
          <button onClick={onDismiss} className="translation-popup-close">
            ✕
          </button>
        </div>
        <div className="translation-popup-content">
          <p className="translation-original">{word.originalWord}</p>
          {word.wordEntry.pronunciation && (
            <p className="translation-pronunciation">[{word.wordEntry.pronunciation}]</p>
          )}
        </div>
        <div className="translation-popup-actions">
          <button
            onClick={onSave}
            disabled={isSaved}
            className={isSaved ? 'translation-popup-saved' : ''}
          >
            {isSaved ? '✓ Already Saved' : 'Save to Vocabulary'}
          </button>
          {onKnewIt && <button onClick={onKnewIt}>I Knew This</button>}
        </div>
      </div>
    </div>
  );
}
