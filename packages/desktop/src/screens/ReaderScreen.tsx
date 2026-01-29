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
    closeBook,
    recordWordSaved,
  } = useReaderStore();

  const {addWord, isWordSaved} = useVocabularyStore();
  const book = bookId ? getBook(bookId) : null;
  const [selectedWord, setSelectedWord] = useState<ForeignWordData | null>(null);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (bookId && book) {
      loadBook(book);
    }
    return () => {
      closeBook();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, book]);

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
          <button onClick={() => setShowSettings(true)} className="reader-settings-button">
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

      {selectedWord && (
        <TranslationPopup
          word={selectedWord}
          book={book}
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
