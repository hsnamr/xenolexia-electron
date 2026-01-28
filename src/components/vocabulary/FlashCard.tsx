/**
 * FlashCard - Animated flashcard component for vocabulary review
 *
 * Features:
 * - Flip animation on tap
 * - Front shows foreign word
 * - Back shows original word + context
 * - Swipe gestures for grading
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';

import { useTheme } from '@theme/index';
import type { VocabularyItem } from '@/types';
import { getLanguageInfo } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface FlashCardProps {
  word: VocabularyItem;
  isFlipped: boolean;
  onFlip: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

// ============================================================================
// Component
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

export function FlashCard({
  word,
  isFlipped,
  onFlip,
}: FlashCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const flipAnim = React.useRef(new Animated.Value(0)).current;

  // Animate flip
  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, flipAnim]);

  // Interpolate rotations
  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [0, 0, 1],
  });

  const targetLanguage = getLanguageInfo(word.targetLanguage);
  const sourceLanguage = getLanguageInfo(word.sourceLanguage);

  // Status color
  const getStatusColor = () => {
    switch (word.status) {
      case 'new':
        return colors.primary[500];
      case 'learning':
        return '#f59e0b';
      case 'review':
        return colors.primary[400];
      case 'learned':
        return '#10b981';
      default:
        return colors.text.secondary;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onFlip}
      style={styles.container}
    >
      {/* Front of card */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          {
            backgroundColor: colors.background.primary,
            borderColor: colors.border.primary,
            transform: [{ rotateY: frontRotate }],
            opacity: frontOpacity,
          },
        ]}
      >
        {/* Language badge */}
        <View style={[styles.languageBadge, { backgroundColor: colors.background.secondary }]}>
          <TextDisplay
            text={`${targetLanguage?.flag || ''} ${targetLanguage?.name || ''}`}
            style={[styles.languageText, { color: colors.text.secondary }]}
          />
        </View>

        {/* Status indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />

        {/* Foreign word */}
        <View style={styles.wordContainer}>
          <TextDisplay
            text={word.targetWord}
            style={[styles.foreignWord, { color: colors.primary[500] }]}
          />
        </View>

        {/* Hint */}
        <View style={styles.hintContainer}>
          <TextDisplay
            text="Tap to reveal"
            style={[styles.hintText, { color: colors.text.tertiary }]}
          />
        </View>

        {/* Review count */}
        <View style={[styles.reviewBadge, { backgroundColor: colors.background.secondary }]}>
          <TextDisplay
            text={`${word.reviewCount} reviews`}
            style={[styles.reviewText, { color: colors.text.tertiary }]}
          />
        </View>
      </Animated.View>

      {/* Back of card */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          {
            backgroundColor: colors.background.primary,
            borderColor: colors.border.primary,
            transform: [{ rotateY: backRotate }],
            opacity: backOpacity,
          },
        ]}
      >
        {/* Language badge */}
        <View style={[styles.languageBadge, { backgroundColor: colors.background.secondary }]}>
          <TextDisplay
            text={`${sourceLanguage?.flag || ''} ${sourceLanguage?.name || ''}`}
            style={[styles.languageText, { color: colors.text.secondary }]}
          />
        </View>

        {/* Original word */}
        <View style={styles.wordContainer}>
          <TextDisplay
            text={word.sourceWord}
            style={[styles.originalWord, { color: colors.text.primary }]}
          />
        </View>

        {/* Foreign word reminder */}
        <View style={styles.reminderContainer}>
          <TextDisplay
            text={word.targetWord}
            style={[styles.reminderWord, { color: colors.primary[500] }]}
          />
        </View>

        {/* Context sentence */}
        {word.contextSentence && (
          <View style={[styles.contextContainer, { backgroundColor: colors.background.secondary }]}>
            <TextDisplay
              text={`"${word.contextSentence}"`}
              style={[styles.contextText, { color: colors.text.secondary }]}
            />
          </View>
        )}

        {/* Book source */}
        {word.bookTitle && (
          <View style={styles.bookContainer}>
            <TextDisplay
              text={`📖 ${word.bookTitle}`}
              style={[styles.bookText, { color: colors.text.tertiary }]}
            />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
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
  bookContainer: {
    marginTop: 16,
  },
  bookText: {
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    height: 400,
    justifyContent: 'center',
    padding: 24,
    position: 'absolute',
    width: CARD_WIDTH,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardBack: {},
  cardFront: {},
  container: {
    alignItems: 'center',
    height: 400,
    justifyContent: 'center',
    width: CARD_WIDTH,
  },
  contextContainer: {
    borderRadius: 12,
    marginTop: 20,
    padding: 16,
    width: '100%',
  },
  contextText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  foreignWord: {
    fontSize: 42,
    fontWeight: '700',
    textAlign: 'center',
  },
  hintContainer: {
    marginTop: 24,
  },
  hintText: {
    fontSize: 14,
  },
  languageBadge: {
    borderRadius: 20,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    top: 20,
  },
  languageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  originalWord: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  reminderContainer: {
    marginTop: 8,
  },
  reminderWord: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  reviewBadge: {
    borderRadius: 12,
    bottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
  },
  reviewText: {
    fontSize: 12,
  },
  statusIndicator: {
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    right: 20,
    top: 28,
    width: 8,
  },
  wordContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
