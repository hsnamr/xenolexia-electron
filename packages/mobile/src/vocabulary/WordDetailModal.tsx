/**
 * Word Detail Modal - Shows full word information with edit/delete capabilities
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
  Animated,
  TextInput,
} from 'react-native';
import { format, formatDistanceToNow } from 'date-fns';

import { useTheme } from '@theme/index';
import type { VocabularyItem, Language } from '@/types';
import { getLanguageInfo, SUPPORTED_LANGUAGES } from '@/types';
import { useVocabularyStore } from '@xenolexia/shared/stores/vocabularyStore';

// ============================================================================
// Types
// ============================================================================

interface WordDetailModalProps {
  visible: boolean;
  word: VocabularyItem | null;
  onClose: () => void;
  onNavigateToBook?: (bookId: string) => void;
  onStartReview?: (wordId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function WordDetailModal({
  visible,
  word,
  onClose,
  onNavigateToBook,
  onStartReview,
}: WordDetailModalProps): React.JSX.Element | null {
  const { colors, isDark } = useTheme();
  const { updateWord, removeWord } = useVocabularyStore();

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedSourceWord, setEditedSourceWord] = useState('');
  const [editedTargetWord, setEditedTargetWord] = useState('');
  const [editedContext, setEditedContext] = useState('');

  // Animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Reset edit state when word changes
  useEffect(() => {
    if (word) {
      setEditedSourceWord(word.sourceWord);
      setEditedTargetWord(word.targetWord);
      setEditedContext(word.contextSentence || '');
      setIsEditing(false);
    }
  }, [word]);

  // Animate on open
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  if (!word) return null;

  const sourceLanguage = getLanguageInfo(word.sourceLanguage);
  const targetLanguage = getLanguageInfo(word.targetLanguage);

  // Status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new':
        return { color: colors.primary[500], label: 'New', icon: '✨' };
      case 'learning':
        return { color: '#f59e0b', label: 'Learning', icon: '📖' };
      case 'review':
        return { color: colors.primary[400], label: 'Review', icon: '🔄' };
      case 'learned':
        return { color: '#10b981', label: 'Mastered', icon: '🎯' };
      default:
        return { color: colors.text.secondary, label: status, icon: '📝' };
    }
  };

  const statusConfig = getStatusConfig(word.status);

  // Calculate next review date
  const getNextReviewDate = () => {
    if (!word.lastReviewedAt || word.interval === 0) {
      return 'Due now';
    }
    const nextDate = new Date(word.lastReviewedAt);
    nextDate.setDate(nextDate.getDate() + word.interval);
    if (nextDate <= new Date()) {
      return 'Due now';
    }
    return formatDistanceToNow(nextDate, { addSuffix: true });
  };

  // Handlers
  const handleSaveEdit = async () => {
    if (!editedSourceWord.trim() || !editedTargetWord.trim()) {
      Alert.alert('Error', 'Source and target words are required');
      return;
    }

    try {
      await updateWord(word.id, {
        sourceWord: editedSourceWord.trim(),
        targetWord: editedTargetWord.trim(),
        contextSentence: editedContext.trim() || null,
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update word');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Word',
      `Are you sure you want to delete "${word.targetWord}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWord(word.id);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete word');
            }
          },
        },
      ]
    );
  };

  const handlePractice = () => {
    onStartReview?.(word.id);
    onClose();
  };

  const handleGoToBook = () => {
    if (word.bookId) {
      onNavigateToBook?.(word.bookId);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          <Pressable
            style={[styles.container, { backgroundColor: colors.background.primary }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <View style={[styles.closeIcon, { backgroundColor: colors.background.secondary }]}>
                  <View style={[styles.closeX, { backgroundColor: colors.text.secondary }]} />
                </View>
              </TouchableOpacity>
              <View style={styles.headerActions}>
                {!isEditing ? (
                  <>
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      style={[styles.headerButton, { backgroundColor: colors.background.secondary }]}
                    >
                      <View style={styles.editIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleDelete}
                      style={[styles.headerButton, { backgroundColor: '#fee2e2' }]}
                    >
                      <View style={[styles.deleteIcon, { backgroundColor: '#ef4444' }]} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => setIsEditing(false)}
                      style={[styles.headerButton, { backgroundColor: colors.background.secondary }]}
                    >
                      <View style={styles.cancelText}>✕</View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveEdit}
                      style={[styles.headerButton, { backgroundColor: colors.primary[500] }]}
                    >
                      <View style={styles.saveText}>✓</View>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Word Display */}
              <View style={styles.wordSection}>
                {isEditing ? (
                  <>
                    <TextInput
                      style={[
                        styles.editInput,
                        styles.targetWordInput,
                        {
                          color: colors.primary[500],
                          borderColor: colors.border.primary,
                          backgroundColor: colors.background.secondary,
                        },
                      ]}
                      value={editedTargetWord}
                      onChangeText={setEditedTargetWord}
                      placeholder="Foreign word"
                      placeholderTextColor={colors.text.tertiary}
                    />
                    <View style={styles.arrow}>
                      <View style={[styles.arrowLine, { backgroundColor: colors.border.primary }]} />
                    </View>
                    <TextInput
                      style={[
                        styles.editInput,
                        styles.sourceWordInput,
                        {
                          color: colors.text.primary,
                          borderColor: colors.border.primary,
                          backgroundColor: colors.background.secondary,
                        },
                      ]}
                      value={editedSourceWord}
                      onChangeText={setEditedSourceWord}
                      placeholder="Original word"
                      placeholderTextColor={colors.text.tertiary}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.targetWordRow}>
                      <View style={styles.targetWordContainer}>
                        <View style={styles.targetWord}>
                          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                          <View style={styles.targetWordText}>
                            <View style={[styles.wordText, { color: colors.primary[500] }]}>
                              {/* Using Text component would be better but keeping simple */}
                            </View>
                          </View>
                        </View>
                        <View style={styles.targetWordMain}>
                          <TextDisplay
                            text={word.targetWord}
                            style={[styles.targetWordTextStyle, { color: colors.primary[500] }]}
                          />
                        </View>
                      </View>
                      <View style={[styles.languageBadge, { backgroundColor: colors.background.secondary }]}>
                        <TextDisplay
                          text={`${targetLanguage?.flag || ''} ${targetLanguage?.code.toUpperCase() || ''}`}
                          style={[styles.languageText, { color: colors.text.secondary }]}
                        />
                      </View>
                    </View>

                    <View style={styles.arrow}>
                      <TextDisplay text="↓" style={[styles.arrowText, { color: colors.text.tertiary }]} />
                    </View>

                    <View style={styles.sourceWordRow}>
                      <TextDisplay
                        text={word.sourceWord}
                        style={[styles.sourceWordTextStyle, { color: colors.text.primary }]}
                      />
                      <View style={[styles.languageBadge, { backgroundColor: colors.background.secondary }]}>
                        <TextDisplay
                          text={`${sourceLanguage?.flag || ''} ${sourceLanguage?.code.toUpperCase() || ''}`}
                          style={[styles.languageText, { color: colors.text.secondary }]}
                        />
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* Status Badge */}
              <View style={styles.statusSection}>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                  <TextDisplay
                    text={`${statusConfig.icon} ${statusConfig.label}`}
                    style={[styles.statusText, { color: statusConfig.color }]}
                  />
                </View>
              </View>

              {/* Context Sentence */}
              {(word.contextSentence || isEditing) && (
                <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
                  <TextDisplay
                    text="Context"
                    style={[styles.sectionLabel, { color: colors.text.tertiary }]}
                  />
                  {isEditing ? (
                    <TextInput
                      style={[
                        styles.contextInput,
                        {
                          color: colors.text.primary,
                          borderColor: colors.border.primary,
                        },
                      ]}
                      value={editedContext}
                      onChangeText={setEditedContext}
                      placeholder="Add context sentence..."
                      placeholderTextColor={colors.text.tertiary}
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <TextDisplay
                      text={`"${word.contextSentence}"`}
                      style={[styles.contextText, { color: colors.text.secondary }]}
                    />
                  )}
                </View>
              )}

              {/* Book Source */}
              {word.bookTitle && (
                <TouchableOpacity
                  style={[styles.section, { backgroundColor: colors.background.secondary }]}
                  onPress={handleGoToBook}
                  disabled={!word.bookId}
                >
                  <TextDisplay
                    text="From Book"
                    style={[styles.sectionLabel, { color: colors.text.tertiary }]}
                  />
                  <View style={styles.bookRow}>
                    <TextDisplay text="📖" style={styles.bookIcon} />
                    <TextDisplay
                      text={word.bookTitle}
                      style={[styles.bookTitle, { color: colors.text.primary }]}
                    />
                    {word.bookId && (
                      <TextDisplay
                        text="→"
                        style={[styles.bookArrow, { color: colors.primary[500] }]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              )}

              {/* SRS Statistics */}
              <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
                <TextDisplay
                  text="Learning Progress"
                  style={[styles.sectionLabel, { color: colors.text.tertiary }]}
                />
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <TextDisplay
                      text={word.reviewCount.toString()}
                      style={[styles.statValue, { color: colors.text.primary }]}
                    />
                    <TextDisplay
                      text="Reviews"
                      style={[styles.statLabel, { color: colors.text.tertiary }]}
                    />
                  </View>
                  <View style={styles.statItem}>
                    <TextDisplay
                      text={word.easeFactor.toFixed(2)}
                      style={[styles.statValue, { color: colors.text.primary }]}
                    />
                    <TextDisplay
                      text="Ease Factor"
                      style={[styles.statLabel, { color: colors.text.tertiary }]}
                    />
                  </View>
                  <View style={styles.statItem}>
                    <TextDisplay
                      text={word.interval > 0 ? `${word.interval}d` : '-'}
                      style={[styles.statValue, { color: colors.text.primary }]}
                    />
                    <TextDisplay
                      text="Interval"
                      style={[styles.statLabel, { color: colors.text.tertiary }]}
                    />
                  </View>
                </View>

                <View style={[styles.nextReview, { borderTopColor: colors.border.secondary }]}>
                  <TextDisplay
                    text="Next Review:"
                    style={[styles.nextReviewLabel, { color: colors.text.tertiary }]}
                  />
                  <TextDisplay
                    text={getNextReviewDate()}
                    style={[
                      styles.nextReviewValue,
                      {
                        color:
                          getNextReviewDate() === 'Due now'
                            ? colors.primary[500]
                            : colors.text.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Dates */}
              <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
                <View style={styles.dateRow}>
                  <TextDisplay
                    text="Added"
                    style={[styles.dateLabel, { color: colors.text.tertiary }]}
                  />
                  <TextDisplay
                    text={format(word.addedAt, 'MMM d, yyyy')}
                    style={[styles.dateValue, { color: colors.text.secondary }]}
                  />
                </View>
                {word.lastReviewedAt && (
                  <View style={styles.dateRow}>
                    <TextDisplay
                      text="Last Reviewed"
                      style={[styles.dateLabel, { color: colors.text.tertiary }]}
                    />
                    <TextDisplay
                      text={formatDistanceToNow(word.lastReviewedAt, { addSuffix: true })}
                      style={[styles.dateValue, { color: colors.text.secondary }]}
                    />
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Action Button */}
            {!isEditing && (
              <View style={[styles.footer, { borderTopColor: colors.border.secondary }]}>
                <TouchableOpacity
                  style={[styles.practiceButton, { backgroundColor: colors.primary[500] }]}
                  onPress={handlePractice}
                >
                  <TextDisplay
                    text="🎴 Practice This Word"
                    style={styles.practiceButtonText}
                  />
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

// Simple text display component to avoid import issues
function TextDisplay({ text, style }: { text: string; style?: any }) {
  const { Text } = require('react-native');
  return <Text style={style}>{text}</Text>;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  arrow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  arrowLine: {
    height: 20,
    width: 2,
  },
  arrowText: {
    fontSize: 20,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
  backdropPressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  bookArrow: {
    fontSize: 16,
    marginLeft: 'auto',
  },
  bookIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  bookRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  bookTitle: {
    flex: 1,
    fontSize: 15,
  },
  cancelText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  closeX: {
    borderRadius: 1,
    height: 12,
    transform: [{ rotate: '45deg' }],
    width: 2,
  },
  container: {
    borderRadius: 20,
    maxHeight: '85%',
    maxWidth: 400,
    overflow: 'hidden',
    width: '100%',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contextInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    marginTop: 8,
    minHeight: 80,
    padding: 12,
    textAlignVertical: 'top',
  },
  contextText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 13,
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateValue: {
    fontSize: 13,
  },
  deleteIcon: {
    borderRadius: 2,
    height: 14,
    width: 2,
  },
  editIcon: {
    borderColor: '#6b7280',
    borderRadius: 2,
    borderWidth: 1.5,
    height: 14,
    width: 14,
  },
  editInput: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  languageBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  nextReview: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
  },
  nextReviewLabel: {
    fontSize: 13,
  },
  nextReviewValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  practiceButton: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
  practiceButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sourceWordInput: {
    fontSize: 20,
    fontWeight: '600',
  },
  sourceWordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sourceWordTextStyle: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusBadge: {
    alignSelf: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statusDot: {
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  targetWord: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  targetWordContainer: {
    alignItems: 'center',
  },
  targetWordInput: {
    fontSize: 24,
    fontWeight: '700',
  },
  targetWordMain: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  targetWordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  targetWordText: {},
  targetWordTextStyle: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 12,
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  wordText: {},
});
