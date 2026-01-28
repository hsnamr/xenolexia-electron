/**
 * Translation Popup - Shows translation and actions when foreign word is tapped
 *
 * Features:
 * - Displays foreign word with pronunciation
 * - Shows original word translation
 * - Context sentence display
 * - Save to vocabulary button
 * - "I knew this" button
 * - Theme-aware styling
 * - Smooth animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import type { ForeignWordData } from '@xenolexia/shared/types/index';
import { useTheme } from '@theme/index';

// ============================================================================
// Types
// ============================================================================

interface TranslationPopupProps {
  word: ForeignWordData;
  contextSentence?: string | null;
  onDismiss: () => void;
  onSave: () => void;
  onKnewIt: () => void;
  isAlreadySaved?: boolean;
}

// ============================================================================
// Component
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TranslationPopup({
  word,
  contextSentence,
  onDismiss,
  onSave,
  onKnewIt,
  isAlreadySaved = false,
}: TranslationPopupProps): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Animate out before dismiss
  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handleSave = () => {
    onSave();
  };

  const handleKnewIt = () => {
    onKnewIt();
  };

  // Format part of speech for display
  const formatPartOfSpeech = (pos: string): string => {
    const posMap: Record<string, string> = {
      noun: 'noun',
      verb: 'verb',
      adjective: 'adj.',
      adverb: 'adv.',
      pronoun: 'pron.',
      preposition: 'prep.',
      conjunction: 'conj.',
      interjection: 'interj.',
      article: 'art.',
      other: '',
    };
    return posMap[pos] || pos;
  };

  // Highlight the foreign word in context sentence
  const renderContextSentence = () => {
    if (!contextSentence) return null;

    // Simple highlight - in real implementation, would use regex to find exact word
    const parts = contextSentence.split(new RegExp(`(${word.foreignWord})`, 'gi'));

    return (
      <Text style={[styles.contextText, { color: colors.text.secondary }]}>
        {parts.map((part, index) =>
          part.toLowerCase() === word.foreignWord.toLowerCase() ? (
            <Text key={index} style={[styles.contextHighlight, { color: colors.primary[500] }]}>
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={handleDismiss}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdropPressable} onPress={handleDismiss}>
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}>
            <Pressable
              style={[
                styles.popup,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.primary,
                },
              ]}
              onPress={(e) => e.stopPropagation()}>
              {/* Foreign Word */}
              <Text style={[styles.foreignWord, { color: colors.primary[500] }]}>
                {word.foreignWord}
              </Text>

              {/* Pronunciation */}
              {word.wordEntry.pronunciation && (
                <Text style={[styles.pronunciation, { color: colors.text.tertiary }]}>
                  [{word.wordEntry.pronunciation}]
                </Text>
              )}

              {/* Part of Speech */}
              {word.wordEntry.partOfSpeech && word.wordEntry.partOfSpeech !== 'other' && (
                <View style={[styles.posBadge, { backgroundColor: colors.background.secondary }]}>
                  <Text style={[styles.posText, { color: colors.text.secondary }]}>
                    {formatPartOfSpeech(word.wordEntry.partOfSpeech)}
                  </Text>
                </View>
              )}

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

              {/* Original Word */}
              <Text style={[styles.originalWord, { color: colors.text.primary }]}>
                {word.originalWord}
              </Text>

              {/* Context Sentence */}
              {contextSentence && (
                <View style={[styles.contextContainer, { backgroundColor: colors.background.secondary }]}>
                  <Text style={[styles.contextLabel, { color: colors.text.tertiary }]}>
                    Context:
                  </Text>
                  {renderContextSentence()}
                </View>
              )}

              {/* Proficiency Badge */}
              <View
                style={[
                  styles.levelBadge,
                  {
                    backgroundColor:
                      word.wordEntry.proficiencyLevel === 'beginner'
                        ? '#10b981'
                        : word.wordEntry.proficiencyLevel === 'intermediate'
                          ? '#f59e0b'
                          : '#ef4444',
                  },
                ]}>
                <Text style={styles.levelText}>
                  {word.wordEntry.proficiencyLevel.charAt(0).toUpperCase() +
                    word.wordEntry.proficiencyLevel.slice(1)}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.knewButton,
                    { backgroundColor: colors.background.secondary },
                  ]}
                  onPress={handleKnewIt}
                  activeOpacity={0.7}>
                  <Text style={[styles.knewButtonText, { color: colors.text.secondary }]}>
                    ✓ I knew this
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.saveButton,
                    {
                      backgroundColor: isAlreadySaved
                        ? colors.background.secondary
                        : colors.primary[500],
                    },
                  ]}
                  onPress={handleSave}
                  disabled={isAlreadySaved}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.saveButtonText,
                      {
                        color: isAlreadySaved ? colors.text.tertiary : colors.text.inverted,
                      },
                    ]}>
                    {isAlreadySaved ? '✓ Saved' : '+ Save word'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
  },
  popup: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  foreignWord: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  pronunciation: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  posBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  posText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  divider: {
    width: 60,
    height: 2,
    borderRadius: 1,
    marginBottom: 16,
  },
  originalWord: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  contextContainer: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  contextText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  contextHighlight: {
    fontWeight: '600',
    fontStyle: 'normal',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  levelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knewButton: {},
  knewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {},
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
