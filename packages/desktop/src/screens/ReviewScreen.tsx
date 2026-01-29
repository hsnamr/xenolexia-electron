/**
 * Review Screen - Flashcard review with SM-2 grading
 */

import React, {useState, useEffect, useCallback} from 'react';

import {useVocabularyStore} from '@xenolexia/shared/stores/vocabularyStore';
import {useNavigate} from 'react-router-dom';

import {Card, Button} from '../components/ui';

import type {VocabularyItem} from '@xenolexia/shared/types';

import './ReviewScreen.css';

type GradeQuality = 0 | 1 | 3 | 4 | 5; // SM-2 quality values

interface GradeOption {
  label: string;
  quality: GradeQuality;
  description: string;
  variant: 'danger' | 'secondary' | 'primary' | 'outline';
  shortcut: string;
}

const GRADE_OPTIONS: GradeOption[] = [
  {label: 'Again', quality: 0, description: 'Forgot completely', variant: 'danger', shortcut: '1'},
  {
    label: 'Hard',
    quality: 1,
    description: 'Remembered with difficulty',
    variant: 'secondary',
    shortcut: '2',
  },
  {label: 'Good', quality: 3, description: 'Correct response', variant: 'primary', shortcut: '3'},
  {label: 'Easy', quality: 4, description: 'Too easy', variant: 'outline', shortcut: '4'},
  {
    label: 'Already Knew',
    quality: 5,
    description: 'Knew it already',
    variant: 'outline',
    shortcut: '5',
  },
];

export function ReviewScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const {getDueForReview, recordReview, refreshStats, stats} = useVocabularyStore();
  const [currentWords, setCurrentWords] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const currentWord = currentWords[currentIndex];

  // Load due words
  useEffect(() => {
    loadWords();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isRecording || !currentWord) return;

      const key = e.key;
      const option = GRADE_OPTIONS.find(opt => opt.shortcut === key);
      if (option && isFlipped) {
        handleGrade(option.quality);
      } else if (key === ' ' || key === 'Enter') {
        e.preventDefault();
        setIsFlipped(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord, isFlipped, isRecording]);

  const loadWords = async () => {
    setIsLoading(true);
    try {
      const words = await getDueForReview();
      setCurrentWords(words);
      setCurrentIndex(0);
      setIsFlipped(false);
      if (words.length === 0) {
        // No words to review
      }
    } catch (error) {
      console.error('Failed to load review words:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleGrade = async (quality: GradeQuality) => {
    if (!currentWord || isRecording) return;

    setIsRecording(true);
    try {
      await recordReview(currentWord.id, quality);
      setReviewedCount(prev => prev + 1);
      await refreshStats();

      // Move to next word
      if (currentIndex < currentWords.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // Finished all words, reload
        await loadWords();
      }
    } catch (error) {
      console.error('Failed to record review:', error);
    } finally {
      setIsRecording(false);
    }
  };

  if (isLoading) {
    return (
      <div className="review-screen">
        <div className="review-container">
          <Card padding="lg" className="review-loading">
            <p>Loading words for review...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (currentWords.length === 0) {
    return (
      <div className="review-screen">
        <div className="review-container">
          <Card padding="lg" className="review-empty">
            <h2>🎉 All Caught Up!</h2>
            <p>You have no words due for review right now.</p>
            <p className="review-stats">
              Total vocabulary: {stats.total} words
              {stats.dueToday > 0 && ` • ${stats.dueToday} due later`}
            </p>
            <div className="review-actions">
              <Button onClick={() => navigate('/vocabulary')} variant="primary">
                Go to Vocabulary
              </Button>
              <Button onClick={() => navigate('/')} variant="outline">
                Back to Library
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / currentWords.length) * 100;

  return (
    <div className="review-screen">
      <div className="review-header">
        <Button onClick={() => navigate('/vocabulary')} variant="ghost" size="sm">
          ← Back
        </Button>
        <div className="review-progress">
          <span className="review-progress-text">
            {currentIndex + 1} / {currentWords.length}
          </span>
          <div className="review-progress-bar">
            <div className="review-progress-fill" style={{width: `${progress}%`}} />
          </div>
        </div>
        <div className="review-stats-header">
          Reviewed: {reviewedCount} • Due: {stats.dueToday}
        </div>
      </div>

      <div className="review-container">
        <Card
          padding="lg"
          className={`review-card ${isFlipped ? 'review-card-flipped' : ''}`}
          onClick={!isFlipped ? handleFlip : undefined}
        >
          <div className="review-card-front">
            <div className="review-word-source">
              <h2>{currentWord.sourceWord}</h2>
              <p className="review-context">{currentWord.contextSentence || 'No context'}</p>
            </div>
            <p className="review-hint">Click or press Space to reveal answer</p>
          </div>

          <div className="review-card-back">
            <div className="review-word-target">
              <h2>{currentWord.targetWord}</h2>
              <p className="review-source-hint">{currentWord.sourceWord}</p>
              {currentWord.contextSentence && (
                <p className="review-context">{currentWord.contextSentence}</p>
              )}
            </div>

            <div className="review-grading">
              <p className="review-grading-prompt">How well did you know this?</p>
              <div className="review-grading-buttons">
                {GRADE_OPTIONS.map(option => (
                  <Button
                    key={option.quality}
                    variant={option.variant}
                    onClick={() => handleGrade(option.quality)}
                    disabled={isRecording}
                    className="review-grade-button"
                    title={`${option.description} (${option.shortcut})`}
                  >
                    <span className="review-grade-label">{option.label}</span>
                    <span className="review-grade-shortcut">{option.shortcut}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
