/**
 * Book Detail Screen - Displays detailed book information
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import Svg, {Path} from 'react-native-svg';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import {Text, Button, Card} from '@components/ui';
import {BookCover} from '@components/library';
import {useLibraryStore} from '@xenolexia/shared/stores/libraryStore';
import type {RootStackParamList} from '@/types';

// ============================================================================
// Types
// ============================================================================

type BookDetailRouteProp = RouteProp<RootStackParamList, 'BookDetail'>;
type BookDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================================================
// Icons
// ============================================================================

function BackIcon({color, size = 24}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon({color, size = 18}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M12 6v6l4 2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BookIcon({color, size = 18}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5a2 2 0 012-2h14v14H6.5A2.5 2.5 0 004 19.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LanguageIcon({color, size = 18}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrashIcon({color, size = 18}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// Constants
// ============================================================================

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  el: 'Greek',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  ar: 'Arabic',
};

const PROFICIENCY_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

// ============================================================================
// Component
// ============================================================================

export function BookDetailScreen(): React.JSX.Element {
  const colors = useColors();
  const navigation = useNavigation<BookDetailNavigationProp>();
  const route = useRoute<BookDetailRouteProp>();
  const {bookId} = route.params;

  const book = useLibraryStore(state => state.getBook(bookId));
  const removeBook = useLibraryStore(state => state.removeBook);

  if (!book) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall">Book not found</Text>
          <Button variant="primary" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleStartReading = useCallback(() => {
    navigation.navigate('Reader', {bookId: book.id});
  }, [navigation, book.id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${book.title}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeBook(book.id);
            navigation.goBack();
          },
        },
      ],
    );
  }, [book, removeBook, navigation]);

  // Format helpers
  const formatReadingTime = (minutes: number): string => {
    if (minutes === 0) return 'Not started';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const progressPercent = Math.round(book.progress);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, {backgroundColor: colors.surfaceHover}]}
          onPress={() => navigation.goBack()}
        >
          <BackIcon color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, {backgroundColor: colors.errorLight}]}
          onPress={handleDelete}
        >
          <TrashIcon color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover & Title Section */}
        <View style={styles.heroSection}>
          <View style={styles.coverWrapper}>
            <BookCover
              bookId={book.id}
              coverPath={book.coverPath}
              title={book.title}
              size="large"
              width={160}
            />
          </View>

          <Text variant="headlineSmall" center style={styles.title}>
            {book.title}
          </Text>
          <Text variant="bodyLarge" color="secondary" center>
            {book.author}
          </Text>
        </View>

        {/* Progress Section */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text variant="labelMedium">Reading Progress</Text>
            <Text variant="headlineSmall" customColor={colors.primary}>
              {progressPercent}%
            </Text>
          </View>
          <View style={[styles.progressTrack, {backgroundColor: colors.surfaceHover}]}>
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
          <View style={styles.progressMeta}>
            <Text variant="bodySmall" color="tertiary">
              Chapter {book.currentChapter + 1} of {book.totalChapters || '?'}
            </Text>
            {book.lastReadAt && (
              <Text variant="bodySmall" color="tertiary">
                Last read: {formatDate(book.lastReadAt)}
              </Text>
            )}
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <ClockIcon color={colors.primary} />
            <Text variant="titleMedium" style={styles.statValue}>
              {formatReadingTime(book.readingTimeMinutes)}
            </Text>
            <Text variant="labelSmall" color="tertiary">
              Time Read
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <BookIcon color={colors.primary} />
            <Text variant="titleMedium" style={styles.statValue}>
              {book.format.toUpperCase()}
            </Text>
            <Text variant="labelSmall" color="tertiary">
              Format
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <LanguageIcon color={colors.primary} />
            <Text variant="titleMedium" style={styles.statValue}>
              {LANGUAGE_NAMES[book.languagePair.targetLanguage] || book.languagePair.targetLanguage}
            </Text>
            <Text variant="labelSmall" color="tertiary">
              Learning
            </Text>
          </Card>
        </View>

        {/* Details Section */}
        <Card style={styles.detailsCard}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Book Details
          </Text>

          <DetailRow
            label="Proficiency Level"
            value={PROFICIENCY_LABELS[book.proficiencyLevel]}
          />
          <DetailRow
            label="Word Density"
            value={`${Math.round(book.wordDensity * 100)}%`}
          />
          <DetailRow
            label="File Size"
            value={formatFileSize(book.fileSize)}
          />
          <DetailRow
            label="Added"
            value={formatDate(book.addedAt)}
          />
          {book.sourceUrl && (
            <DetailRow
              label="Source"
              value="Downloaded"
            />
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleStartReading}
            style={styles.readButton}
          >
            {book.progress > 0 ? 'Continue Reading' : 'Start Reading'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// Detail Row Component
// ============================================================================

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({label, value}: DetailRowProps): React.JSX.Element {
  const colors = useColors();

  return (
    <View style={[styles.detailRow, {borderBottomColor: colors.border}]}>
      <Text variant="bodyMedium" color="secondary">
        {label}
      </Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  actions: {
    marginTop: spacing[6],
    paddingBottom: spacing[8],
  },
  backButton: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  container: {
    flex: 1,
  },
  coverWrapper: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  deleteButton: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  detailRow: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
  detailsCard: {
    marginTop: spacing[4],
    padding: spacing[4],
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[4],
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing[4],
  },
  progressCard: {
    marginTop: spacing[6],
    padding: spacing[4],
  },
  progressFill: {
    borderRadius: borderRadius.full,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  progressTrack: {
    borderRadius: borderRadius.full,
    height: 8,
    width: '100%',
  },
  readButton: {
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: spacing[2],
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    padding: spacing[3],
  },
  statValue: {
    marginTop: spacing[2],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  title: {
    marginBottom: spacing[1],
  },
});
