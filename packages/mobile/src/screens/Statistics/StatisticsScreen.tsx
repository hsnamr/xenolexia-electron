/**
 * Statistics Screen - Displays reading and learning progress
 */

import React, {useMemo} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';

import {useStatisticsStore} from '@xenolexia/shared/stores/statisticsStore';
import {StatCard} from '@components/statistics/StatCard';
import {ScreenHeader, LoadingStats} from '@components/common';
import {Text, Card} from '@components/ui';

export function StatisticsScreen(): React.JSX.Element {
  const colors = useColors();
  const {stats, isLoading, refreshStats} = useStatisticsStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refreshStats();
    setIsRefreshing(false);
  }, [refreshStats]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate progress percentage for daily goal
  const dailyProgress = useMemo(() => {
    const goalMinutes = 30; // Default goal: 30 minutes
    const todayMinutes = Math.floor(stats.wordsRevealedToday / 10); // Rough estimate
    return Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));
  }, [stats.wordsRevealedToday]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]} edges={['top']}>
        <ScreenHeader title="Statistics" subtitle="Track your learning journey" />
        <LoadingStats />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]} edges={['top']}>
      <ScreenHeader title="Statistics" subtitle="Track your learning journey" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Streak Card */}
        <Card variant="filled" padding="lg" style={styles.streakCard}>
          <View style={[styles.streakCardInner, {backgroundColor: colors.primaryLight}]}>
            <Text variant="displaySmall" style={styles.streakEmoji}>
              🔥
            </Text>
            <Text variant="displayLarge" customColor={colors.primary} style={styles.streakNumber}>
              {stats.currentStreak}
            </Text>
            <Text variant="titleMedium" customColor={colors.primary}>
              Day Streak
            </Text>
            <Text variant="bodySmall" color="secondary" style={styles.streakBest}>
              Best: {stats.longestStreak} days
            </Text>
          </View>
        </Card>

        {/* Daily Progress */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Today's Progress
          </Text>

          <Card variant="outlined" padding="md" style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text variant="bodyMedium" color="secondary">
                Daily Goal
              </Text>
              <Text variant="labelLarge" customColor={colors.primary}>
                {dailyProgress}%
              </Text>
            </View>
            <View style={[styles.progressBar, {backgroundColor: colors.border}]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${dailyProgress}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </Card>

          <View style={styles.statsGrid}>
            <StatCard
              icon="📖"
              value={stats.wordsRevealedToday.toString()}
              label="Words Seen"
              color={colors.primary}
            />
            <StatCard
              icon="💾"
              value={stats.wordsSavedToday.toString()}
              label="Words Saved"
              color={colors.accent}
            />
          </View>
        </View>

        {/* All-time Stats */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            All Time
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="📚"
              value={stats.totalBooksRead.toString()}
              label="Books Read"
              color={colors.success}
            />
            <StatCard
              icon="⏱️"
              value={formatTime(stats.totalReadingTime)}
              label="Reading Time"
              color="#f59e0b"
            />
            <StatCard
              icon="🧠"
              value={stats.totalWordsLearned.toString()}
              label="Words Learned"
              color={colors.error}
            />
            <StatCard
              icon="📊"
              value={formatTime(stats.averageSessionDuration)}
              label="Avg. Session"
              color={colors.foreignWord}
            />
          </View>
        </View>

        {/* Learning Insights */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Insights
          </Text>

          <Card variant="outlined" padding="md">
            <View style={styles.insightRow}>
              <Text variant="bodyMedium">Most active day</Text>
              <Text variant="labelLarge" customColor={colors.primary}>
                Monday
              </Text>
            </View>
            <View style={[styles.insightDivider, {backgroundColor: colors.divider}]} />
            <View style={styles.insightRow}>
              <Text variant="bodyMedium">Favorite reading time</Text>
              <Text variant="labelLarge" customColor={colors.primary}>
                Evening
              </Text>
            </View>
            <View style={[styles.insightDivider, {backgroundColor: colors.divider}]} />
            <View style={styles.insightRow}>
              <Text variant="bodyMedium">Words learned this week</Text>
              <Text variant="labelLarge" customColor={colors.success}>
                +42
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  insightDivider: {
    height: 1,
    marginVertical: spacing[3],
  },
  insightRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    borderRadius: borderRadius.full,
    height: 8,
    marginTop: spacing[2],
    overflow: 'hidden',
  },
  progressCard: {
    marginBottom: spacing[4],
  },
  progressFill: {
    borderRadius: borderRadius.full,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[5],
  },
  section: {
    marginTop: spacing[6],
  },
  sectionTitle: {
    marginBottom: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  streakBest: {
    marginTop: spacing[2],
  },
  streakCard: {
    marginTop: spacing[4],
  },
  streakCardInner: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[6],
  },
  streakEmoji: {
    marginBottom: spacing[2],
  },
  streakNumber: {
    fontWeight: '800',
    lineHeight: 60,
  },
});
