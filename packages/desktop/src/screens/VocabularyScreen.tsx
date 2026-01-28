/**
 * Vocabulary Screen - React DOM version
 */

import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useVocabularyStore} from '@xenolexia/shared/stores/vocabularyStore';
import type {VocabularyItem} from '@xenolexia/shared/types';
import {Card, PressableCard, SearchInput, Button, Modal} from '../components/ui';
import './VocabularyScreen.css';

type FilterType = 'all' | 'new' | 'learning' | 'learned';

const FILTER_OPTIONS: Array<{id: FilterType; label: string; icon: string}> = [
  {id: 'all', label: 'All', icon: '📚'},
  {id: 'new', label: 'New', icon: '✨'},
  {id: 'learning', label: 'Learning', icon: '📖'},
  {id: 'learned', label: 'Mastered', icon: '🎯'},
];

export function VocabularyScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const {wordId} = useParams<{wordId?: string}>();
  const {vocabulary, isLoading, refreshVocabulary, initialize, getWord, updateWord, removeWord} = useVocabularyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle word detail view from URL
  useEffect(() => {
    if (wordId) {
      const word = getWord(wordId);
      if (word) {
        setSelectedWord(word);
      } else {
        // Word not found, navigate back
        navigate('/vocabulary');
      }
    }
  }, [wordId, getWord, navigate]);

  const filteredVocabulary = useMemo(() => {
    return vocabulary.filter(item => {
      const matchesSearch =
        searchQuery.length === 0 ||
        item.sourceWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.targetWord.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filter === 'all' || item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [vocabulary, searchQuery, filter]);

  const statusCounts = useMemo(() => {
    return vocabulary.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [vocabulary]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshVocabulary();
    setIsRefreshing(false);
  }, [refreshVocabulary]);

  const handleWordPress = useCallback(
    (item: VocabularyItem) => {
      setSelectedWord(item);
    },
    []
  );

  const handleCloseWordDetail = useCallback(() => {
    setSelectedWord(null);
    if (wordId) {
      navigate('/vocabulary');
    }
  }, [wordId, navigate]);

  const handleDeleteWord = useCallback(async (itemId: string) => {
    if (window.confirm('Delete this word from your vocabulary?')) {
      try {
        await removeWord(itemId);
        if (selectedWord?.id === itemId) {
          setSelectedWord(null);
        }
      } catch (error) {
        console.error('Failed to delete word:', error);
        alert('Failed to delete word');
      }
    }
  }, [removeWord, selectedWord]);

  const handleStartReview = useCallback(() => {
    navigate('/vocabulary/review');
  }, [navigate]);

  if (isLoading && vocabulary.length === 0) {
    return (
      <div className="vocabulary-screen">
        <div className="vocabulary-header">
          <h1>Vocabulary</h1>
        </div>
        <div className="vocabulary-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="vocabulary-screen">
      <div className="vocabulary-header">
        <div>
          <h1>Vocabulary</h1>
          <p className="vocabulary-subtitle">{vocabulary.length} words</p>
        </div>
        <div className="vocabulary-header-actions">
          <Button onClick={handleStartReview}>Start Review</Button>
        </div>
      </div>

      <div className="vocabulary-stats">
        <div className="vocabulary-stat-card">
          <div className="stat-value">{vocabulary.length}</div>
          <div className="stat-label">Total Words</div>
        </div>
        <div className="vocabulary-stat-card">
          <div className="stat-value">{statusCounts.new || 0}</div>
          <div className="stat-label">New</div>
        </div>
        <div className="vocabulary-stat-card">
          <div className="stat-value">{statusCounts.learning || 0}</div>
          <div className="stat-label">Learning</div>
        </div>
        <div className="vocabulary-stat-card">
          <div className="stat-value">{statusCounts.learned || 0}</div>
          <div className="stat-label">Mastered</div>
        </div>
      </div>

      <div className="vocabulary-filters">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            className={`filter-button ${filter === option.id ? 'filter-button-active' : ''}`}
            onClick={() => setFilter(option.id)}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      <div className="vocabulary-search">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vocabulary..."
        />
      </div>

      {filteredVocabulary.length === 0 ? (
        <div className="vocabulary-empty">
          {searchQuery ? (
            <p>No words found matching "{searchQuery}"</p>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h2>No Vocabulary Yet</h2>
              <p>Start reading and save words to build your vocabulary!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="vocabulary-list">
          {filteredVocabulary.map((item) => (
            <VocabularyCard
              key={item.id}
              item={item}
              onPress={() => handleWordPress(item)}
            />
          ))}
        </div>
      )}

      {/* Word Detail Modal */}
      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={handleCloseWordDetail}
          onDelete={handleDeleteWord}
          onUpdate={async (updates) => {
            try {
              await updateWord(selectedWord.id, updates);
              setSelectedWord({...selectedWord, ...updates});
            } catch (error) {
              console.error('Failed to update word:', error);
              alert('Failed to update word');
            }
          }}
        />
      )}
    </div>
  );
}

interface VocabularyCardProps {
  item: VocabularyItem;
  onPress: () => void;
}

function VocabularyCard({item, onPress}: VocabularyCardProps): React.JSX.Element {
  const [isRevealed, setIsRevealed] = useState(false);

  const statusConfig = {
    new: {label: 'New', color: '#6366f1'},
    learning: {label: 'Learning', color: '#f59e0b'},
    learned: {label: 'Mastered', color: '#10b981'},
  }[item.status] || {label: item.status, color: '#6b7280'};

  return (
    <PressableCard
      variant="elevated"
      padding="md"
      rounded="lg"
      className="vocabulary-card"
      onClick={() => setIsRevealed(!isRevealed)}
    >
      <div className="vocabulary-card-header">
        <h3 className="vocabulary-word">{item.targetWord}</h3>
        <span
          className="vocabulary-status-badge"
          style={{backgroundColor: `${statusConfig.color}20`, color: statusConfig.color}}
        >
          {statusConfig.label}
        </span>
      </div>

      {isRevealed && (
        <div className="vocabulary-card-content">
          <p className="vocabulary-original">{item.sourceWord}</p>
          {item.contextSentence && (
            <p className="vocabulary-context">"{item.contextSentence}"</p>
          )}
          {item.bookTitle && (
            <p className="vocabulary-book">📖 {item.bookTitle}</p>
          )}
        </div>
      )}

      {!isRevealed && (
        <p className="vocabulary-hint">Click to reveal</p>
      )}
    </PressableCard>
  );
}

// Word Detail Modal
interface WordDetailModalProps {
  word: VocabularyItem;
  onClose: () => void;
  onDelete: (wordId: string) => void;
  onUpdate: (updates: Partial<VocabularyItem>) => Promise<void>;
}

function WordDetailModal({word, onClose, onDelete, onUpdate}: WordDetailModalProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editedWord, setEditedWord] = useState(word);

  const statusConfig = {
    new: {label: 'New', color: '#6366f1'},
    learning: {label: 'Learning', color: '#f59e0b'},
    learned: {label: 'Mastered', color: '#10b981'},
  }[word.status] || {label: word.status, color: '#6b7280'};

  const handleSave = async () => {
    await onUpdate(editedWord);
    setIsEditing(false);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Word Details" size="medium">
      <div className="word-detail-content">
        {!isEditing ? (
          <>
            <div className="word-detail-header">
              <div>
                <h3 className="word-detail-foreign">{word.targetWord}</h3>
                <p className="word-detail-original">{word.sourceWord}</p>
              </div>
              <span
                className="word-detail-status-badge"
                style={{backgroundColor: `${statusConfig.color}20`, color: statusConfig.color}}
              >
                {statusConfig.label}
              </span>
            </div>

            {word.contextSentence && (
              <div className="word-detail-section">
                <h4>Context</h4>
                <p className="word-detail-context">"{word.contextSentence}"</p>
              </div>
            )}

            {word.bookTitle && (
              <div className="word-detail-section">
                <h4>From Book</h4>
                <p className="word-detail-book">📖 {word.bookTitle}</p>
              </div>
            )}

            <div className="word-detail-section">
              <h4>Review Info</h4>
              <div className="word-detail-stats">
                <div className="word-detail-stat">
                  <span className="stat-label">Reviews:</span>
                  <span className="stat-value">{word.reviewCount}</span>
                </div>
                <div className="word-detail-stat">
                  <span className="stat-label">Added:</span>
                  <span className="stat-value">{new Date(word.addedAt).toLocaleDateString()}</span>
                </div>
                {word.lastReviewedAt && (
                  <div className="word-detail-stat">
                    <span className="stat-label">Last Reviewed:</span>
                    <span className="stat-value">{new Date(word.lastReviewedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="word-detail-actions">
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
              <Button variant="outline" onClick={() => onDelete(word.id)}>Delete</Button>
              <Button variant="primary" onClick={onClose}>Close</Button>
            </div>
          </>
        ) : (
          <>
            <div className="word-detail-edit">
              <div className="word-detail-edit-field">
                <label>Foreign Word (Learning):</label>
                <input
                  type="text"
                  value={editedWord.targetWord}
                  onChange={(e) => setEditedWord({...editedWord, targetWord: e.target.value})}
                />
              </div>
              <div className="word-detail-edit-field">
                <label>Original Word:</label>
                <input
                  type="text"
                  value={editedWord.sourceWord}
                  onChange={(e) => setEditedWord({...editedWord, sourceWord: e.target.value})}
                />
              </div>
              <div className="word-detail-edit-field">
                <label>Context Sentence:</label>
                <textarea
                  value={editedWord.contextSentence || ''}
                  onChange={(e) => setEditedWord({...editedWord, contextSentence: e.target.value || null})}
                  rows={3}
                />
              </div>
            </div>
            <div className="word-detail-actions">
              <Button variant="outline" onClick={() => {setIsEditing(false); setEditedWord(word);}}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>Save</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
