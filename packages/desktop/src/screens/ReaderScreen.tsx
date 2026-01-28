/**
 * Reader Screen - React DOM version
 */

import React, {useState, useCallback, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useLibraryStore} from '@xenolexia/shared/stores/libraryStore';
import {useReaderStore} from '@xenolexia/shared/stores/readerStore';
import type {ForeignWordData} from '@xenolexia/shared/types';
import {ReaderContent} from './ReaderContent';
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
  } = useReaderStore();

  const book = bookId ? getBook(bookId) : null;
  const [selectedWord, setSelectedWord] = useState<ForeignWordData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (bookId && book) {
      loadBook(book);
    }
    return () => {
      closeBook();
    };
  }, [bookId, book, loadBook, closeBook]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleWordClick = useCallback((word: ForeignWordData) => {
    setSelectedWord(word);
    setShowControls(false);
  }, []);

  const handleWordHover = useCallback((word: ForeignWordData) => {
    setSelectedWord(word);
  }, []);

  const handleWordHoverEnd = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const handleProgressChange = useCallback((progress: number) => {
    updateProgress(progress);
  }, [updateProgress]);

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
              ? Math.round(((currentChapter?.index || 0) + 1) / chapters.length * 100)
              : 0}%
          </div>
          <button
            onClick={goToNextChapter}
            disabled={!currentChapter || currentChapter.index >= (chapters.length - 1)}
          >
            Next →
          </button>
        </div>
      )}

      {selectedWord && (
        <TranslationPopup
          word={selectedWord}
          onDismiss={dismissPopup}
          onSave={async () => {
            // TODO: Implement save word to vocabulary
            console.log('Save word:', selectedWord);
            dismissPopup();
          }}
          onKnewIt={() => {
            // TODO: Mark word as known
            console.log('Mark word as known:', selectedWord);
            dismissPopup();
          }}
        />
      )}
    </div>
  );
}

interface TranslationPopupProps {
  word: ForeignWordData;
  onDismiss: () => void;
  onSave: () => void;
  onKnewIt?: () => void;
}

function TranslationPopup({word, onDismiss, onSave, onKnewIt}: TranslationPopupProps): React.JSX.Element {
  return (
    <div className="translation-popup-overlay" onClick={onDismiss}>
      <div className="translation-popup" onClick={(e) => e.stopPropagation()}>
        <div className="translation-popup-header">
          <h3>{word.foreignWord}</h3>
          <button onClick={onDismiss} className="translation-popup-close">✕</button>
        </div>
        <div className="translation-popup-content">
          <p className="translation-original">{word.originalWord}</p>
          {word.wordEntry.pronunciation && (
            <p className="translation-pronunciation">[{word.wordEntry.pronunciation}]</p>
          )}
        </div>
        <div className="translation-popup-actions">
          <button onClick={onSave}>Save to Vocabulary</button>
          {onKnewIt && <button onClick={onKnewIt}>I Knew This</button>}
        </div>
      </div>
    </div>
  );
}
