/**
 * Book Card - Displays a book in the library grid
 */

import React, {useState, useCallback} from 'react';
import {View, StyleSheet, TouchableOpacity, Dimensions, Alert, Platform} from 'react-native';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import {Text} from '@components/ui';
import type {Book} from '@/types';

import {BookCover} from './BookCover';

interface BookCardProps {
  book: Book;
  onPress: () => void;
  onDelete?: (bookId: string) => void;
}

const {width} = Dimensions.get('window');
const cardWidth = (width - 56) / 2; // 2 columns with padding and gap

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

export function BookCard({book, onPress, onDelete}: BookCardProps): React.JSX.Element {
  const colors = useColors();
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const languageFlag = LANGUAGE_FLAGS[book.languagePair.targetLanguage] || '🌐';
  const hasProgress = book.progress > 0;

  const handleLongPress = useCallback(() => {
    if (onDelete) {
      setShowDeleteButton(true);
    }
  }, [onDelete]);

  const handleDelete = useCallback(() => {
    if (!onDelete) return;

    const confirmDelete = () => {
      onDelete(book.id);
      setShowDeleteButton(false);
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Delete "${book.title}"?\n\nThis will remove the book from your library.`);
      if (confirmed) {
        confirmDelete();
      } else {
        setShowDeleteButton(false);
      }
    } else {
      Alert.alert(
        'Delete Book',
        `Are you sure you want to delete "${book.title}"?`,
        [
          {text: 'Cancel', style: 'cancel', onPress: () => setShowDeleteButton(false)},
          {text: 'Delete', style: 'destructive', onPress: confirmDelete},
        ]
      );
    }
  }, [book.id, book.title, onDelete]);

  const handlePress = useCallback(() => {
    if (showDeleteButton) {
      setShowDeleteButton(false);
    } else {
      onPress();
    }
  }, [showDeleteButton, onPress]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
      delayLongPress={500}
    >
      {/* Book Cover */}
      <View style={styles.coverWrapper}>
        <BookCover
          bookId={book.id}
          coverPath={book.coverPath}
          title={book.title}
          size="medium"
          width="100%"
        />

        {/* Progress Bar */}
        {hasProgress && (
          <View style={[styles.progressContainer, {backgroundColor: colors.overlay}]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${book.progress}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        )}

        {/* Language Badge */}
        <View style={[styles.languageBadge, {backgroundColor: colors.background}]}>
          <Text variant="bodySmall">{languageFlag}</Text>
        </View>

        {/* Progress percentage */}
        {hasProgress && (
          <View style={[styles.progressBadge, {backgroundColor: colors.background}]}>
            <Text variant="labelSmall" customColor={colors.primary}>
              {Math.round(book.progress)}%
            </Text>
          </View>
        )}

        {/* Delete Button Overlay */}
        {showDeleteButton && (
          <TouchableOpacity
            style={[styles.deleteOverlay, {backgroundColor: 'rgba(0,0,0,0.7)'}]}
            onPress={handleDelete}
            activeOpacity={0.9}
          >
            <Text variant="labelMedium" customColor="#ffffff">🗑️ Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Book Info */}
      <View style={styles.infoContainer}>
        <Text variant="labelMedium" numberOfLines={2} style={styles.title}>
          {book.title}
        </Text>
        <Text variant="bodySmall" color="secondary" numberOfLines={1}>
          {book.author}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
    width: cardWidth,
  },
  coverWrapper: {
    position: 'relative',
    width: '100%',
  },
  deleteOverlay: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20,
  },
  infoContainer: {
    paddingTop: spacing[2],
  },
  languageBadge: {
    borderRadius: borderRadius.md,
    padding: spacing[1],
    position: 'absolute',
    right: spacing[2],
    top: spacing[2],
    zIndex: 10,
  },
  progressBadge: {
    borderRadius: borderRadius.sm,
    bottom: spacing[2],
    left: spacing[2],
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
    position: 'absolute',
    zIndex: 10,
  },
  progressBar: {
    borderRadius: borderRadius.full,
    height: '100%',
  },
  progressContainer: {
    borderRadius: borderRadius.full,
    bottom: 0,
    height: 4,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  title: {
    lineHeight: 18,
  },
});
