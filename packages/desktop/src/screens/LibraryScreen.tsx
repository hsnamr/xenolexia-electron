/**
 * Library Screen - React DOM version
 */

import React, {useState, useCallback, useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {useLibraryStore} from '@xenolexia/shared/stores/libraryStore';
import type {Book} from '@xenolexia/shared/types';
import {Button, Card, PressableCard, Input, SearchInput} from '../components/ui';
import {importBookFromFile} from '../services/ElectronImportService';
import './LibraryScreen.css';

export function LibraryScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const {books, isLoading, refreshBooks, removeBook, updateBook, initialize} = useLibraryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [detailBook, setDetailBook] = useState<Book | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleImportBook = useCallback(async () => {
    if (isImporting) return;

    try {
      setIsImporting(true);
      setImportProgress('Selecting file...');

      const book = await importBookFromFile((progress) => {
        setImportProgress(progress.currentStep || 'Importing...');
      });

      if (book) {
        // Refresh library to show new book
        await refreshBooks();
        setImportProgress('');
        // Optionally navigate to the book
        // navigate(`/reader/${book.id}`);
      }
    } catch (error) {
      console.error('Failed to import book:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import book';
      alert(`Import failed: ${errorMessage}`);
      setImportProgress('');
    } finally {
      setIsImporting(false);
    }
  }, [isImporting, refreshBooks]);

  // When navigated from menu with openImport, open the import dialog
  const openImportFromState = (location.state as {openImport?: boolean})?.openImport;
  useEffect(() => {
    if (openImportFromState) {
      navigate('/', {replace: true, state: {}});
      handleImportBook();
    }
  }, [openImportFromState]); // eslint-disable-line react-hooks/exhaustive-deps -- only run when flag is set

  const filteredBooks = books.filter(
    book =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshBooks();
    setIsRefreshing(false);
  }, [refreshBooks]);

  const handleBookPress = useCallback(
    (book: Book) => {
      navigate(`/reader/${book.id}`);
    },
    [navigate]
  );

  const handleDeleteBook = useCallback(
    async (bookId: string) => {
      if (window.confirm('Are you sure you want to delete this book?')) {
        try {
          await removeBook(bookId);
        } catch (error) {
          console.error('Failed to delete book:', error);
        }
      }
    },
    [removeBook]
  );

  const handleBrowseBooks = useCallback(() => {
    navigate('/discover');
  }, [navigate]);

  const handleChangeLanguage = useCallback(
    async (book: Book) => {
      const {SUPPORTED_LANGUAGES} = await import('@xenolexia/shared/types');
      const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === book.languagePair.targetLanguage);
      const langOptions = SUPPORTED_LANGUAGES
        .filter(l => l.code !== book.languagePair.sourceLanguage)
        .map(l => `${l.flag} ${l.name} (${l.code})`)
        .join('\n');
      
      const selection = window.prompt(
        `Change target language for "${book.title}"?\n\nCurrent: ${currentLang?.flag} ${currentLang?.name}\n\nAvailable languages:\n${langOptions}\n\nEnter language code:`,
        book.languagePair.targetLanguage
      );
      
      if (selection && selection !== book.languagePair.targetLanguage) {
        const isValid = SUPPORTED_LANGUAGES.some(l => l.code === selection);
        if (isValid) {
          try {
            await updateBook(book.id, {
              languagePair: {
                ...book.languagePair,
                targetLanguage: selection as any,
              },
            });
            await refreshBooks();
            alert(`Target language changed to ${selection}`);
          } catch (error) {
            console.error('Failed to change language:', error);
            alert('Failed to change language');
          }
        } else {
          alert('Invalid language code');
        }
      }
    },
    [updateBook, refreshBooks]
  );

  const handleForgetProgress = useCallback(
    async (book: Book) => {
      try {
        await updateBook(book.id, {
          progress: 0,
          currentChapter: 0,
          lastReadAt: null,
        });
        await refreshBooks();
        alert('Progress reset successfully');
      } catch (error) {
        console.error('Failed to reset progress:', error);
        alert('Failed to reset progress');
      }
    },
    [updateBook, refreshBooks]
  );

  const handleBookAbout = useCallback(
    (book: Book) => {
      const info = [
        `Title: ${book.title}`,
        `Author: ${book.author || 'Unknown'}`,
        `Format: ${book.format.toUpperCase()}`,
        `Progress: ${Math.round(book.progress)}%`,
        `Language Pair: ${book.languagePair.sourceLanguage} → ${book.languagePair.targetLanguage}`,
        `Proficiency: ${book.proficiencyLevel}`,
        `Added: ${new Date(book.addedAt).toLocaleDateString()}`,
      ].join('\n');
      alert(info);
    },
    []
  );

  if (isLoading && books.length === 0) {
    return (
      <div className="library-screen">
        <div className="library-header">
          <h1>Library</h1>
          <div className="library-header-actions">
            <button className="icon-button" onClick={handleBrowseBooks} title="Discover Books">
              🔍
            </button>
            <Button onClick={handleImportBook}>Import Book</Button>
          </div>
        </div>
        <div className="library-loading">Loading...</div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="library-screen">
        <div className="library-header">
          <h1>Library</h1>
          <div className="library-header-actions">
            <button className="icon-button" onClick={handleBrowseBooks} title="Discover Books">
              🔍
            </button>
            <Button onClick={handleImportBook} disabled={isImporting}>
              {isImporting ? importProgress || 'Importing...' : 'Import Book'}
            </Button>
          </div>
        </div>
        <div className="library-empty">
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h2>Your Library is Empty</h2>
            <p>Import a book from your device or browse free ebooks online to start your language learning journey.</p>
            <div className="empty-actions">
              <Button variant="primary" size="lg" onClick={handleImportBook} disabled={isImporting}>
                {isImporting ? importProgress || 'Importing...' : 'Import Book'}
              </Button>
              <Button variant="outline" size="lg" onClick={handleBrowseBooks}>
                Browse Free Books
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="library-screen">
      <div className="library-header">
        <div>
          <h1>Library</h1>
          <p className="library-subtitle">{books.length} books</p>
        </div>
        <div className="library-header-actions">
          <button className="icon-button" onClick={handleBrowseBooks} title="Discover Books">
            🔍
          </button>
          <Button onClick={handleImportBook}>Import Book</Button>
        </div>
      </div>

      <div className="library-search">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your library..."
        />
      </div>

      {filteredBooks.length === 0 ? (
        <div className="library-empty-results">
          <p>No books found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="library-grid">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onPress={() => handleBookPress(book)}
              onDelete={() => handleDeleteBook(book.id)}
              onChangeLanguage={handleChangeLanguage}
              onForgetProgress={handleForgetProgress}
              onAbout={handleBookAbout}
            />
          ))}
        </div>
      )}

      {detailBook && (
        <BookDetailModal
          book={detailBook}
          onClose={() => setDetailBook(null)}
          onRead={() => {
            setDetailBook(null);
            handleBookPress(detailBook);
          }}
          onDelete={async () => {
            await handleDeleteBook(detailBook.id);
            setDetailBook(null);
          }}
          onChangeLanguage={async () => {
            await handleChangeLanguage(detailBook);
            setDetailBook(null);
          }}
          onForgetProgress={async () => {
            await handleForgetProgress(detailBook);
            setDetailBook(null);
          }}
        />
      )}
    </div>
  );
}

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onRead: () => void;
  onDelete: () => void;
  onChangeLanguage: () => void;
  onForgetProgress: () => void;
}

function BookDetailModal({
  book,
  onClose,
  onRead,
  onDelete,
  onChangeLanguage,
  onForgetProgress,
}: BookDetailModalProps): React.JSX.Element {
  return (
    <div className="book-detail-overlay" onClick={onClose}>
      <div className="book-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="book-detail-header">
          <h2>Book details</h2>
          <button type="button" className="book-detail-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="book-detail-body">
          <h3 className="book-detail-title">{book.title}</h3>
          <p className="book-detail-author">{book.author || 'Unknown author'}</p>
          <dl className="book-detail-meta">
            <dt>Format</dt>
            <dd>{book.format.toUpperCase()}</dd>
            <dt>Progress</dt>
            <dd>{Math.round(book.progress)}%</dd>
            <dt>Language pair</dt>
            <dd>
              {book.languagePair.sourceLanguage} → {book.languagePair.targetLanguage}
            </dd>
            <dt>Proficiency</dt>
            <dd>{book.proficiencyLevel}</dd>
            <dt>Word density</dt>
            <dd>{Math.round((book.wordDensity ?? 0.3) * 100)}%</dd>
            <dt>Added</dt>
            <dd>{new Date(book.addedAt).toLocaleDateString()}</dd>
          </dl>
        </div>
        <div className="book-detail-actions">
          <Button variant="primary" onClick={onRead}>
            Read
          </Button>
          <Button variant="outline" onClick={onChangeLanguage}>
            Change language
          </Button>
          <Button variant="outline" onClick={onForgetProgress}>
            Forget progress
          </Button>
          <Button variant="outline" onClick={onDelete} className="book-detail-delete">
            Delete book
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface BookCardProps {
  book: Book;
  onPress: () => void;
  onDelete: () => void;
  onChangeLanguage: (book: Book) => void;
  onForgetProgress: (book: Book) => void;
  onAbout: (book: Book) => void;
}

function BookCard({book, onPress, onDelete, onChangeLanguage, onForgetProgress, onAbout}: BookCardProps): React.JSX.Element {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({x: 0, y: 0});
  const languageFlag = getLanguageFlag(book.languagePair.targetLanguage);
  const hasProgress = book.progress > 0;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({x: e.clientX, y: e.clientY});
    setShowContextMenu(true);
  };

  const handleCloseMenu = () => {
    setShowContextMenu(false);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    if (showContextMenu) {
      const handleClickOutside = () => {
        setShowContextMenu(false);
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  const handleMenuAction = (action: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowContextMenu(false);
    
    switch (action) {
      case 'delete':
        if (window.confirm(`Delete "${book.title}"? This cannot be undone.`)) {
          onDelete();
        }
        break;
      case 'change-language':
        onChangeLanguage(book);
        break;
      case 'forget-progress':
        if (window.confirm(`Reset progress for "${book.title}"? This will set progress to 0% and reset your reading position.`)) {
          onForgetProgress(book);
        }
        break;
      case 'about':
        onAbout(book);
        break;
    }
  };

  return (
    <>
      <PressableCard
        variant="elevated"
        padding="none"
        rounded="lg"
        className="book-card"
        onClick={onPress}
        onContextMenu={handleContextMenu}
      >
        <div className="book-card-cover">
          {book.coverPath ? (
            <img src={book.coverPath} alt={book.title} className="book-cover-image" />
          ) : (
            <div className="book-cover-placeholder">
              <span className="book-cover-icon">📖</span>
            </div>
          )}

          {hasProgress && (
            <div className="book-progress-bar">
              <div
                className="book-progress-fill"
                style={{width: `${book.progress}%`}}
              />
            </div>
          )}

          <div className="book-language-badge">{languageFlag}</div>

          {hasProgress && (
            <div className="book-progress-badge">{Math.round(book.progress)}%</div>
          )}
        </div>

        <div className="book-card-info">
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">{book.author}</p>
        </div>
      </PressableCard>

      {showContextMenu && (
        <BookContextMenu
          x={menuPosition.x}
          y={menuPosition.y}
          onAction={handleMenuAction}
          onClose={handleCloseMenu}
        />
      )}
    </>
  );
}

interface BookContextMenuProps {
  x: number;
  y: number;
  onAction: (action: string, e?: React.MouseEvent) => void;
  onClose: () => void;
}

function BookContextMenu({x, y, onAction, onClose}: BookContextMenuProps): React.JSX.Element {
  return (
    <div
      className="book-context-menu"
      style={{left: `${x}px`, top: `${y}px`}}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="context-menu-item" onClick={(e) => onAction('change-language', e)}>
        <span className="context-menu-icon">🌍</span>
        <span>Change Target Language</span>
      </button>
      <button className="context-menu-item" onClick={(e) => onAction('forget-progress', e)}>
        <span className="context-menu-icon">🔄</span>
        <span>Forget Progress</span>
      </button>
      <div className="context-menu-divider" />
      <button className="context-menu-item" onClick={(e) => onAction('about', e)}>
        <span className="context-menu-icon">ℹ️</span>
        <span>About</span>
      </button>
      <div className="context-menu-divider" />
      <button className="context-menu-item context-menu-item-danger" onClick={(e) => onAction('delete', e)}>
        <span className="context-menu-icon">🗑️</span>
        <span>Delete Book</span>
      </button>
    </div>
  );
}

function getLanguageFlag(lang: string): string {
  const flags: Record<string, string> = {
    el: '🇬🇷', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹',
    pt: '🇵🇹', ru: '🇷🇺', ja: '🇯🇵', zh: '🇨🇳', ko: '🇰🇷',
    ar: '🇸🇦', en: '🇬🇧',
  };
  return flags[lang] || '🌐';
}
