/**
 * Book List Item - Displays a book in list view
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import {Text} from '@components/ui';
import type {Book} from '@/types';

import {BookCover} from './BookCover';

// ============================================================================
// Types
// ============================================================================

interface BookListItemProps {
  book: Book;
  onPress: () => void;
  onLongPress?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const LANGUAGE_FLAGS: Record<string, string> = {
  el: '🇬🇷',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  ru: '🇷🇺',
  ja: '🇯🇵',
  zh: '🇨🇳',
  ko: '🇰🇷',
  ar: '🇸🇦',
  en: '🇬🇧',
};

// ============================================================================
// Component
// ============================================================================

export function BookListItem({
  book,
  onPress,
  onLongPress,
}: BookListItemProps): React.JSX.Element {
  const colors = useColors();

  const languageFlag = LANGUAGE_FLAGS[book.languagePair.targetLanguage] || '🌐';
  const hasProgress = book.progress > 0;
  const progressPercent = Math.round(book.progress);

  // Format reading time
  const formatReadingTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format last read date
  const formatLastRead = (date: Date | null): string => {
    if (!date) return 'Not started';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.container, {backgroundColor: colors.surface}]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={300}
    >
      {/* Cover */}
      <View style={styles.coverContainer}>
        <BookCover
          bookId={book.id}
          coverPath={book.coverPath}
          title={book.title}
          size="small"
          width={60}
        />
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text variant="labelMedium" numberOfLines={1} style={styles.title}>
            {book.title}
          </Text>
          <Text variant="bodySmall">{languageFlag}</Text>
        </View>

        <Text variant="bodySmall" color="secondary" numberOfLines={1}>
          {book.author}
        </Text>

        <View style={styles.metaRow}>
          <Text variant="labelSmall" color="tertiary">
            {formatLastRead(book.lastReadAt)}
          </Text>
          {book.readingTimeMinutes > 0 && (
            <>
              <Text variant="labelSmall" color="tertiary">
                •
              </Text>
              <Text variant="labelSmall" color="tertiary">
                {formatReadingTime(book.readingTimeMinutes)}
              </Text>
            </>
          )}
        </View>

        {/* Progress Bar */}
        {hasProgress && (
          <View style={styles.progressRow}>
            <View
              style={[styles.progressTrack, {backgroundColor: colors.surfaceHover}]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text variant="labelSmall" customColor={colors.primary}>
              {progressPercent}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[2],
    padding: spacing[3],
  },
  coverContainer: {
    width: 60,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  progressFill: {
    borderRadius: borderRadius.full,
    height: '100%',
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  progressTrack: {
    borderRadius: borderRadius.full,
    flex: 1,
    height: 4,
  },
  title: {
    flex: 1,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
});
