/**
 * Book Discovery Screen - React DOM version
 * Search and download ebooks from online sources
 */

import React, {useState, useCallback, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useLibraryStore} from '@xenolexia/shared/stores/libraryStore';
import {EBOOK_SOURCES} from '@xenolexia/shared/services/BookDownloadService';
import type {EbookSource, EbookSearchResult, SearchResponse} from '@xenolexia/shared/services/BookDownloadService';
import {searchBooks, downloadBook} from '../services/ElectronBookDownloadService';
import type {DownloadProgress} from '@xenolexia/shared/services/BookDownloadService';
import {Button, Card, PressableCard, Input, SearchInput} from '../components/ui';
import './BookDiscoveryScreen.css';

export function BookDiscoveryScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const {addBook, refreshBooks, initialize} = useLibraryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<EbookSearchResult[]>([]);
  const [selectedSource, setSelectedSource] = useState<EbookSource['type']>('gutenberg');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setErrorMessage('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setHasSearched(true);

    try {
      const response: SearchResponse = await searchBooks(searchQuery, selectedSource);
      setResults(response.results);

      if (response.error && response.results.length === 0) {
        setErrorMessage(response.error);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Search failed. Please check your internet connection and try again.'
      );
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedSource]);

  const handleDownload = useCallback(async (book: EbookSearchResult) => {
    setDownloadingId(book.id);
    setDownloadProgress(0);
    setErrorMessage(null);
    setSuccessMessage(null);

    const onProgress = (progress: DownloadProgress) => {
      setDownloadProgress(progress.percentage);
    };

    try {
      const result = await downloadBook(book, onProgress);

      if (result.success && result.book) {
        await addBook(result.book);
        await refreshBooks();
        setSuccessMessage(`"${result.book.title}" added to library!`);
        setResults(prev => prev.filter(r => r.id !== book.id));
        // Optionally navigate to the book
        // navigate(`/reader/${result.book.id}`);
      } else {
        setErrorMessage(result.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Download failed';
      setErrorMessage(errorMsg);
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  }, [addBook, refreshBooks, navigate]);

  const handleSourceChange = useCallback((source: EbookSource['type']) => {
    setSelectedSource(source);
    setResults([]);
    setErrorMessage(null);
    setHasSearched(false);
  }, []);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const searchableSources = EBOOK_SOURCES.filter(s => s.searchEnabled);

  return (
    <div className="book-discovery-screen">
      <div className="discovery-header">
        <button className="back-button" onClick={handleBack} title="Back to Library">
          ← Back
        </button>
        <h1>Discover Books</h1>
      </div>

      {/* Search Bar */}
      <div className="discovery-search">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for books..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isSearching) {
              handleSearch();
            }
          }}
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Source Tabs */}
      <div className="discovery-sources">
        {searchableSources.map((source) => (
          <button
            key={source.type}
            className={`source-tab ${selectedSource === source.type ? 'active' : ''}`}
            onClick={() => handleSourceChange(source.type)}
          >
            {source.name}
          </button>
        ))}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-banner">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="error-banner">
          <span>⚠ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 ? (
        <div className="discovery-results">
          {results.map((book) => (
            <BookResultCard
              key={book.id}
              book={book}
              isDownloading={downloadingId === book.id}
              downloadProgress={downloadingId === book.id ? downloadProgress : 0}
              onDownload={() => handleDownload(book)}
            />
          ))}
        </div>
      ) : hasSearched ? (
        <div className="discovery-empty">
          <p>No books found. Try different keywords or check another source.</p>
        </div>
      ) : (
        <div className="discovery-empty">
          <div className="empty-icon">🔍</div>
          <h2>Search for Free Books</h2>
          <p>Search Project Gutenberg, Standard Ebooks, or Open Library for free ebooks to add to your library.</p>
        </div>
      )}
    </div>
  );
}

interface BookResultCardProps {
  book: EbookSearchResult;
  isDownloading: boolean;
  downloadProgress: number;
  onDownload: () => void;
}

function BookResultCard({book, isDownloading, downloadProgress, onDownload}: BookResultCardProps): React.JSX.Element {
  return (
    <Card variant="elevated" padding="md" rounded="lg" className="book-result-card">
      <div className="book-result-content">
        {book.coverUrl && (
          <img src={book.coverUrl} alt={book.title} className="book-result-cover" />
        )}
        <div className="book-result-info">
          <h3 className="book-result-title">{book.title}</h3>
          <p className="book-result-author">by {book.author}</p>
          {book.description && (
            <p className="book-result-description">{book.description}</p>
          )}
          {book.language && (
            <span className="book-result-language">Language: {book.language}</span>
          )}
        </div>
        <div className="book-result-actions">
          <Button
            onClick={onDownload}
            disabled={isDownloading}
            variant="primary"
          >
            {isDownloading ? (
              <>
                <span>Downloading... {downloadProgress}%</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${downloadProgress}%`}} />
                </div>
              </>
            ) : (
              'Download'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
