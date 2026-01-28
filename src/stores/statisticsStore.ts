/**
 * Statistics Store - Manages reading and learning statistics
 */

import {create} from 'zustand';
import type {ReadingStats, ReadingSession} from '@types/index';

const defaultStats: ReadingStats = {
  totalBooksRead: 0,
  totalReadingTime: 0,
  totalWordsLearned: 0,
  currentStreak: 0,
  longestStreak: 0,
  averageSessionDuration: 0,
  wordsRevealedToday: 0,
  wordsSavedToday: 0,
};

interface ReviewSessionData {
  cardsReviewed: number;
  correctCount: number;
  timeSpentSeconds: number;
}

interface StatisticsState {
  stats: ReadingStats;
  currentSession: ReadingSession | null;
  sessions: ReadingSession[];
  isLoading: boolean;

  // Review stats
  reviewStats: {
    totalReviews: number;
    totalCorrect: number;
    totalTimeSpent: number;
    reviewsToday: number;
  };

  // Actions
  startSession: (bookId: string) => void;
  endSession: () => void;
  recordWordRevealed: () => void;
  recordWordSaved: () => void;
  recordReviewSession: (data: ReviewSessionData) => void;
  updateStats: (updates: Partial<ReadingStats>) => void;
  loadStats: () => Promise<void>;
  refreshStats: () => Promise<void>;
  resetDailyStats: () => void;
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  stats: defaultStats,
  currentSession: null,
  sessions: [],
  isLoading: false,
  reviewStats: {
    totalReviews: 0,
    totalCorrect: 0,
    totalTimeSpent: 0,
    reviewsToday: 0,
  },

  startSession: (bookId: string) => {
    const session: ReadingSession = {
      id: Date.now().toString(),
      bookId,
      startedAt: new Date(),
      endedAt: null,
      pagesRead: 0,
      wordsRevealed: 0,
      wordsSaved: 0,
      duration: 0,
    };
    set({currentSession: session});
  },

  endSession: () => {
    const {currentSession, stats, sessions} = get();
    if (!currentSession) return;

    const endedAt = new Date();
    const duration = Math.floor(
      (endedAt.getTime() - currentSession.startedAt.getTime()) / 1000,
    );

    const completedSession: ReadingSession = {
      ...currentSession,
      endedAt,
      duration,
    };

    // Update stats
    const newTotalTime = stats.totalReadingTime + duration;
    const newSessionCount = sessions.length + 1;
    const newAverageSession = Math.floor(newTotalTime / newSessionCount);

    set({
      currentSession: null,
      sessions: [...sessions, completedSession],
      stats: {
        ...stats,
        totalReadingTime: newTotalTime,
        averageSessionDuration: newAverageSession,
      },
    });

    // TODO: Persist to database
  },

  recordWordRevealed: () => {
    set(state => ({
      stats: {
        ...state.stats,
        wordsRevealedToday: state.stats.wordsRevealedToday + 1,
      },
      currentSession: state.currentSession
        ? {...state.currentSession, wordsRevealed: state.currentSession.wordsRevealed + 1}
        : null,
    }));
  },

  recordWordSaved: () => {
    set(state => ({
      stats: {
        ...state.stats,
        wordsSavedToday: state.stats.wordsSavedToday + 1,
        totalWordsLearned: state.stats.totalWordsLearned + 1,
      },
      currentSession: state.currentSession
        ? {...state.currentSession, wordsSaved: state.currentSession.wordsSaved + 1}
        : null,
    }));
  },

  recordReviewSession: (data: ReviewSessionData) => {
    set(state => ({
      reviewStats: {
        totalReviews: state.reviewStats.totalReviews + data.cardsReviewed,
        totalCorrect: state.reviewStats.totalCorrect + data.correctCount,
        totalTimeSpent: state.reviewStats.totalTimeSpent + data.timeSpentSeconds,
        reviewsToday: state.reviewStats.reviewsToday + data.cardsReviewed,
      },
    }));
    // TODO: Persist to database
  },

  updateStats: (updates: Partial<ReadingStats>) => {
    set(state => ({
      stats: {...state.stats, ...updates},
    }));
  },

  loadStats: async () => {
    set({isLoading: true});
    try {
      // TODO: Load from database
      // const stats = await StorageService.getStats();
      // const sessions = await StorageService.getRecentSessions();
      // set({ stats, sessions, isLoading: false });
      set({isLoading: false});
    } catch (error) {
      console.error('Failed to load stats:', error);
      set({isLoading: false});
    }
  },

  refreshStats: async () => {
    // Alias for loadStats - used for pull-to-refresh
    await get().loadStats();
  },

  resetDailyStats: () => {
    set(state => ({
      stats: {
        ...state.stats,
        wordsRevealedToday: 0,
        wordsSavedToday: 0,
      },
    }));
  },
}));
