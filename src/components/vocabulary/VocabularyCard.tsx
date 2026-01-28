/**
 * Vocabulary Card - Displays a saved word with reveal animation
 */

import React, {useState, useCallback} from 'react';
import {View, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager} from 'react-native';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import {Text, Card} from '@components/ui';
import type {VocabularyItem} from '@/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface VocabularyCardProps {
  item: VocabularyItem;
  onPress?: () => void;
}

export function VocabularyCard({item, onPress}: VocabularyCardProps): React.JSX.Element {
  const colors = useColors();
  const [isRevealed, setIsRevealed] = useState(false);

  const getStatusConfig = (status: string): {color: string; label: string} => {
    switch (status) {
      case 'new':
        return {color: colors.primary, label: 'New'};
      case 'learning':
        return {color: '#f59e0b', label: 'Learning'};
      case 'review':
        return {color: colors.accent, label: 'Review'};
      case 'learned':
        return {color: colors.success, label: 'Mastered'};
      default:
        return {color: colors.textSecondary, label: status};
    }
  };

  const handlePress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsRevealed(!isRevealed);
  }, [isRevealed]);

  const handleLongPress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const statusConfig = getStatusConfig(item.status);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
      delayLongPress={300}
    >
      <Card variant="filled" padding="md" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" customColor={colors.foreignWord}>
            {item.targetWord}
          </Text>
          <View style={[styles.statusBadge, {backgroundColor: statusConfig.color + '20'}]}>
            <Text variant="labelSmall" customColor={statusConfig.color}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Revealed content */}
        {isRevealed ? (
          <View style={styles.revealedContent}>
            <Text variant="titleMedium" style={styles.originalWord}>
              {item.sourceWord}
            </Text>

            {item.contextSentence && (
              <Text variant="bodySmall" color="secondary" serif style={styles.context} numberOfLines={2}>
                "{item.contextSentence}"
              </Text>
            )}

            {item.bookTitle && (
              <Text variant="labelSmall" color="tertiary" style={styles.bookSource}>
                📖 {item.bookTitle}
              </Text>
            )}
          </View>
        ) : (
          <Text variant="bodySmall" color="tertiary" style={styles.tapHint}>
            Tap to reveal • Long press for details
          </Text>
        )}

        {/* Footer */}
        <View style={[styles.footer, {borderTopColor: colors.divider}]}>
          <View style={styles.footerItem}>
            <Text variant="labelSmall" color="tertiary">
              Reviews
            </Text>
            <Text variant="labelMedium">{item.reviewCount}</Text>
          </View>

          {item.interval > 0 && (
            <View style={styles.footerItem}>
              <Text variant="labelSmall" color="tertiary">
                Next in
              </Text>
              <Text variant="labelMedium">
                {item.interval} day{item.interval !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          <View style={styles.footerItem}>
            <Text variant="labelSmall" color="tertiary">
              Ease
            </Text>
            <Text variant="labelMedium">{item.easeFactor.toFixed(1)}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bookSource: {
    marginTop: spacing[2],
  },
  container: {
    marginBottom: spacing[3],
  },
  context: {
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: spacing[2],
  },
  footer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    paddingTop: spacing[3],
  },
  footerItem: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  originalWord: {
    marginTop: spacing[1],
  },
  revealedContent: {
    marginBottom: spacing[1],
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
  },
  tapHint: {
    fontStyle: 'italic',
  },
});
