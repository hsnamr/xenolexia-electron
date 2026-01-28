/**
 * Vocabulary Stats - Overview statistics for vocabulary
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { useTheme } from '@theme/index';

// ============================================================================
// Types
// ============================================================================

interface VocabularyStatsProps {
  total: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  learnedCount: number;
  dueCount: number;
  onStartReview?: () => void;
  onViewStats?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function VocabularyStats({
  total,
  newCount,
  learningCount,
  reviewCount,
  learnedCount,
  dueCount,
  onStartReview,
  onViewStats,
}: VocabularyStatsProps): React.JSX.Element {
  const { colors } = useTheme();

  // Calculate percentages for progress bar
  const getPercentage = (count: number) => (total > 0 ? (count / total) * 100 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <TextDisplay
            text="Learning Progress"
            style={[styles.sectionTitle, { color: colors.text.secondary }]}
          />
          <TextDisplay
            text={`${total} words`}
            style={[styles.totalCount, { color: colors.text.tertiary }]}
          />
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.background.tertiary }]}>
          {/* Learned */}
          <View
            style={[
              styles.progressSegment,
              {
                backgroundColor: '#10b981',
                width: `${getPercentage(learnedCount)}%`,
              },
            ]}
          />
          {/* Review */}
          <View
            style={[
              styles.progressSegment,
              {
                backgroundColor: colors.primary[400],
                width: `${getPercentage(reviewCount)}%`,
              },
            ]}
          />
          {/* Learning */}
          <View
            style={[
              styles.progressSegment,
              {
                backgroundColor: '#f59e0b',
                width: `${getPercentage(learningCount)}%`,
              },
            ]}
          />
          {/* New */}
          <View
            style={[
              styles.progressSegment,
              {
                backgroundColor: colors.primary[500],
                width: `${getPercentage(newCount)}%`,
              },
            ]}
          />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <LegendItem color="#10b981" label="Mastered" count={learnedCount} />
          <LegendItem color={colors.primary[400]} label="Review" count={reviewCount} />
          <LegendItem color="#f59e0b" label="Learning" count={learningCount} />
          <LegendItem color={colors.primary[500]} label="New" count={newCount} />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {dueCount > 0 && onStartReview && (
          <TouchableOpacity
            style={[styles.reviewButton, { backgroundColor: colors.primary[500] }]}
            onPress={onStartReview}
            activeOpacity={0.8}
          >
            <TextDisplay text="🎴" style={styles.reviewButtonIcon} />
            <View style={styles.reviewButtonContent}>
              <TextDisplay
                text="Start Review"
                style={styles.reviewButtonText}
              />
              <TextDisplay
                text={`${dueCount} cards due`}
                style={styles.reviewButtonSubtext}
              />
            </View>
            <View style={[styles.dueBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <TextDisplay
                text={dueCount.toString()}
                style={styles.dueBadgeText}
              />
            </View>
          </TouchableOpacity>
        )}

        {dueCount === 0 && total > 0 && (
          <View style={[styles.allCaughtUp, { backgroundColor: '#10b981' + '20' }]}>
            <TextDisplay
              text="🎉 All caught up! No cards due for review."
              style={[styles.allCaughtUpText, { color: '#10b981' }]}
            />
          </View>
        )}
      </View>
    </View>
  );
}

// Legend Item sub-component
function LegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <TextDisplay text={`${label}: ${count}`} style={styles.legendText} />
    </View>
  );
}

// Simple text display component
function TextDisplay({ text, style }: { text: string; style?: any }) {
  const { Text } = require('react-native');
  return <Text style={style}>{text}</Text>;
}

// ============================================================================
// Compact Stats Header Component
// ============================================================================

interface VocabularyStatsHeaderProps {
  total: number;
  dueCount: number;
  learnedCount: number;
  onStartReview?: () => void;
  onExport?: () => void;
}

export function VocabularyStatsHeader({
  total,
  dueCount,
  learnedCount,
  onStartReview,
  onExport,
}: VocabularyStatsHeaderProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.background.secondary }]}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <TextDisplay
            text={total.toString()}
            style={[styles.statValue, { color: colors.text.primary }]}
          />
          <TextDisplay
            text="Total"
            style={[styles.statLabel, { color: colors.text.tertiary }]}
          />
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border.secondary }]} />

        <View style={styles.statItem}>
          <TextDisplay
            text={learnedCount.toString()}
            style={[styles.statValue, { color: '#10b981' }]}
          />
          <TextDisplay
            text="Mastered"
            style={[styles.statLabel, { color: colors.text.tertiary }]}
          />
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border.secondary }]} />

        <View style={styles.statItem}>
          <TextDisplay
            text={dueCount.toString()}
            style={[
              styles.statValue,
              { color: dueCount > 0 ? colors.primary[500] : colors.text.tertiary },
            ]}
          />
          <TextDisplay
            text="Due"
            style={[styles.statLabel, { color: colors.text.tertiary }]}
          />
        </View>
      </View>

      {/* Action Row */}
      <View style={styles.headerActions}>
        {onExport && (
          <TouchableOpacity
            style={[styles.headerButton, { borderColor: colors.border.primary }]}
            onPress={onExport}
          >
            <TextDisplay text="📤" style={styles.headerButtonIcon} />
            <TextDisplay
              text="Export"
              style={[styles.headerButtonText, { color: colors.text.primary }]}
            />
          </TouchableOpacity>
        )}

        {onStartReview && dueCount > 0 && (
          <TouchableOpacity
            style={[styles.headerButton, styles.reviewHeaderButton, { backgroundColor: colors.primary[500] }]}
            onPress={onStartReview}
          >
            <TextDisplay text="🎴" style={styles.headerButtonIcon} />
            <TextDisplay
              text={`Review (${dueCount})`}
              style={[styles.headerButtonText, { color: '#ffffff' }]}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  actions: {
    marginTop: 16,
  },
  allCaughtUp: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  allCaughtUpText: {
    fontSize: 14,
    fontWeight: '500',
  },
  container: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
  },
  dueBadge: {
    borderRadius: 12,
    minWidth: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dueBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  headerButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerButtonIcon: {
    fontSize: 16,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerContainer: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  legendText: {
    color: '#6b7280',
    fontSize: 12,
  },
  progressBar: {
    borderRadius: 4,
    flexDirection: 'row',
    height: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressSection: {},
  progressSegment: {
    height: '100%',
  },
  reviewButton: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  reviewButtonContent: {
    flex: 1,
  },
  reviewButtonIcon: {
    fontSize: 24,
  },
  reviewButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewHeaderButton: {
    borderWidth: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statDivider: {
    height: '60%',
    width: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalCount: {
    fontSize: 13,
  },
});
