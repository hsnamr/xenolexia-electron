/**
 * Review Screen - Spaced repetition flashcard review
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { useTheme } from '@theme/index';
import type { VocabularyItem, RootStackParamList } from '@/types';
import { useVocabularyStore } from '@stores/vocabularyStore';
import { useStatisticsStore } from '@stores/statisticsStore';
import {
  FlashCard,
  GradingButtons,
  ReviewProgress,
  ReviewSessionSummary,
} from '@components/vocabulary';
import { EmptyState } from '@components/common';

// ============================================================================
// Types
// ============================================================================

type ReviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VocabularyQuiz'>;
type ReviewScreenRouteProp = RouteProp<RootStackParamList, 'VocabularyQuiz'>;

interface SessionStats {
  totalCards: number;
  correctCount: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  startTime: number;
}

// ============================================================================
// Component
// ============================================================================

export function ReviewScreen(): React.JSX.Element {
  const navigation = useNavigation<ReviewScreenNavigationProp>();
  const route = useRoute<ReviewScreenRouteProp>();
  const { colors } = useTheme();

  const { getDueForReview, recordReview, vocabulary } = useVocabularyStore();
  const { recordReviewSession } = useStatisticsStore();

  // State
  const [cards, setCards] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalCards: 0,
    correctCount: 0,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
    startTime: Date.now(),
  });

  // Animation for card transition
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;

  // Load cards on mount
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      // Get specific word IDs if provided, otherwise get due cards
      const wordIds = route.params?.wordIds;

      let reviewCards: VocabularyItem[];
      if (wordIds && wordIds.length > 0) {
        reviewCards = vocabulary.filter((v) => wordIds.includes(v.id));
      } else {
        reviewCards = await getDueForReview();
      }

      // Shuffle cards
      const shuffled = [...reviewCards].sort(() => Math.random() - 0.5);

      setCards(shuffled);
      setSessionStats((prev) => ({
        ...prev,
        totalCards: shuffled.length,
        startTime: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to load review cards:', error);
      Alert.alert('Error', 'Failed to load cards for review');
    } finally {
      setIsLoading(false);
    }
  };

  const currentCard = cards[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleGrade = useCallback(
    async (quality: number) => {
      if (!currentCard) return;

      // Record the review
      try {
        await recordReview(currentCard.id, quality);
      } catch (error) {
        console.error('Failed to record review:', error);
      }

      // Update session stats
      setSessionStats((prev) => {
        const newStats = { ...prev };
        if (quality >= 2) {
          newStats.correctCount += 1;
        }
        switch (quality) {
          case 0:
            newStats.againCount += 1;
            break;
          case 1:
            newStats.hardCount += 1;
            break;
          case 2:
            newStats.goodCount += 1;
            break;
          case 3:
            newStats.easyCount += 1;
            break;
        }
        return newStats;
      });

      // Animate card exit
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateX, {
          toValue: quality >= 2 ? 100 : -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Move to next card or complete
        if (currentIndex < cards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);

          // Reset animation
          cardOpacity.setValue(1);
          cardTranslateX.setValue(0);
        } else {
          // Session complete
          setIsComplete(true);

          // Record session stats
          const timeSpent = Math.floor((Date.now() - sessionStats.startTime) / 1000);
          recordReviewSession({
            cardsReviewed: sessionStats.totalCards,
            correctCount: sessionStats.correctCount + (quality >= 2 ? 1 : 0),
            timeSpentSeconds: timeSpent,
          });
        }
      });
    },
    [currentCard, currentIndex, cards.length, cardOpacity, cardTranslateX, recordReview, sessionStats, recordReviewSession]
  );

  const handleContinue = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleReviewAgain = useCallback(() => {
    // Get cards that were marked "Again"
    const failedCardIds = cards
      .slice(0, currentIndex + 1)
      .filter((_, i) => {
        // This is a simplification - in a real app we'd track which cards failed
        return true;
      })
      .map((c) => c.id);

    // Reset for another round
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsComplete(false);
    setSessionStats({
      totalCards: failedCardIds.length,
      correctCount: 0,
      againCount: 0,
      hardCount: 0,
      goodCount: 0,
      easyCount: 0,
      startTime: Date.now(),
    });

    // Reload cards
    loadCards();
  }, [cards, currentIndex]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0 && !isComplete) {
      Alert.alert(
        'End Review?',
        'Your progress in this session will be saved.',
        [
          { text: 'Continue Review', style: 'cancel' },
          { text: 'End Review', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [currentIndex, isComplete, navigation]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <TextDisplay
            text="Loading cards..."
            style={[styles.loadingText, { color: colors.text.secondary }]}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <TextDisplay
              text="←"
              style={[styles.backButtonText, { color: colors.text.primary }]}
            />
          </TouchableOpacity>
          <TextDisplay
            text="Review"
            style={[styles.headerTitle, { color: colors.text.primary }]}
          />
          <View style={styles.headerSpacer} />
        </View>

        <EmptyState
          icon="🎉"
          title="All Caught Up!"
          description="You have no cards due for review right now. Keep reading and saving new words!"
          actionLabel="Go Back"
          onAction={handleBack}
        />
      </SafeAreaView>
    );
  }

  // Session complete
  if (isComplete) {
    const timeSpent = Math.floor((Date.now() - sessionStats.startTime) / 1000);

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ReviewSessionSummary
          totalCards={sessionStats.totalCards}
          correctCount={sessionStats.correctCount}
          againCount={sessionStats.againCount}
          hardCount={sessionStats.hardCount}
          goodCount={sessionStats.goodCount}
          easyCount={sessionStats.easyCount}
          timeSpentSeconds={timeSpent}
          onContinue={handleContinue}
          onReviewAgain={sessionStats.againCount > 0 ? handleReviewAgain : undefined}
        />
      </SafeAreaView>
    );
  }

  // Main review UI
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <TextDisplay
            text="←"
            style={[styles.backButtonText, { color: colors.text.primary }]}
          />
        </TouchableOpacity>
        <TextDisplay
          text="Review"
          style={[styles.headerTitle, { color: colors.text.primary }]}
        />
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress */}
      <ReviewProgress
        current={currentIndex + 1}
        total={cards.length}
        correctCount={sessionStats.correctCount}
      />

      {/* Card */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: cardOpacity,
              transform: [{ translateX: cardTranslateX }],
            },
          ]}
        >
          <FlashCard
            word={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />
        </Animated.View>
      </View>

      {/* Grading buttons (only show when flipped) */}
      {isFlipped && (
        <View style={[styles.gradingContainer, { backgroundColor: colors.background.primary }]}>
          <GradingButtons onGrade={handleGrade} />
        </View>
      )}

      {/* Flip hint (only show when not flipped) */}
      {!isFlipped && (
        <View style={styles.flipHintContainer}>
          <TextDisplay
            text="Tap the card to reveal the answer"
            style={[styles.flipHint, { color: colors.text.tertiary }]}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// Simple text display component
function TextDisplay({ text, style }: { text: string; style?: any }) {
  const { Text } = require('react-native');
  return <Text style={style}>{text}</Text>;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    width: 44,
  },
  backButtonText: {
    fontSize: 24,
  },
  cardContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  flipHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  flipHintContainer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  gradingContainer: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});
