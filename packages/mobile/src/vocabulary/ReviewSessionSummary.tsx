/**
 * Review Session Summary - Shows stats at the end of a review session
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';

import { useTheme } from '@theme/index';

// ============================================================================
// Types
// ============================================================================

interface ReviewSessionSummaryProps {
  totalCards: number;
  correctCount: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  timeSpentSeconds: number;
  onContinue: () => void;
  onReviewAgain?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ReviewSessionSummary({
  totalCards,
  correctCount,
  againCount,
  hardCount,
  goodCount,
  easyCount,
  timeSpentSeconds,
  onContinue,
  onReviewAgain,
}: ReviewSessionSummaryProps): React.JSX.Element {
  const { colors } = useTheme();

  const accuracy = totalCards > 0 ? (correctCount / totalCards) * 100 : 0;
  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;

  // Determine performance message
  const getPerformanceMessage = () => {
    if (accuracy >= 90) return { emoji: '🌟', text: 'Excellent!' };
    if (accuracy >= 70) return { emoji: '👏', text: 'Great job!' };
    if (accuracy >= 50) return { emoji: '💪', text: 'Keep practicing!' };
    return { emoji: '📚', text: 'More review needed' };
  };

  const performance = getPerformanceMessage();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TextDisplay
          text={performance.emoji}
          style={styles.headerEmoji}
        />
        <TextDisplay
          text={performance.text}
          style={[styles.headerText, { color: colors.text.primary }]}
        />
        <TextDisplay
          text="Review Complete"
          style={[styles.headerSubtext, { color: colors.text.secondary }]}
        />
      </View>

      {/* Main stats */}
      <View style={[styles.mainStats, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.mainStatItem}>
          <TextDisplay
            text={`${accuracy.toFixed(0)}%`}
            style={[
              styles.mainStatValue,
              {
                color: accuracy >= 70 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444',
              },
            ]}
          />
          <TextDisplay
            text="Accuracy"
            style={[styles.mainStatLabel, { color: colors.text.tertiary }]}
          />
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border.secondary }]} />

        <View style={styles.mainStatItem}>
          <TextDisplay
            text={`${totalCards}`}
            style={[styles.mainStatValue, { color: colors.text.primary }]}
          />
          <TextDisplay
            text="Cards Reviewed"
            style={[styles.mainStatLabel, { color: colors.text.tertiary }]}
          />
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border.secondary }]} />

        <View style={styles.mainStatItem}>
          <TextDisplay
            text={minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
            style={[styles.mainStatValue, { color: colors.text.primary }]}
          />
          <TextDisplay
            text="Time Spent"
            style={[styles.mainStatLabel, { color: colors.text.tertiary }]}
          />
        </View>
      </View>

      {/* Grade breakdown */}
      <View style={[styles.gradeBreakdown, { backgroundColor: colors.background.secondary }]}>
        <TextDisplay
          text="Grade Breakdown"
          style={[styles.sectionTitle, { color: colors.text.secondary }]}
        />

        <View style={styles.gradeRow}>
          <GradeItem label="Again" count={againCount} color="#ef4444" total={totalCards} />
          <GradeItem label="Hard" count={hardCount} color="#f59e0b" total={totalCards} />
          <GradeItem label="Good" count={goodCount} color="#10b981" total={totalCards} />
          <GradeItem label="Easy" count={easyCount} color="#6366f1" total={totalCards} />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {againCount > 0 && onReviewAgain && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border.primary }]}
            onPress={onReviewAgain}
          >
            <TextDisplay
              text={`Review ${againCount} Failed Cards`}
              style={[styles.secondaryButtonText, { color: colors.text.primary }]}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary[500] }]}
          onPress={onContinue}
        >
          <TextDisplay
            text="Done"
            style={styles.primaryButtonText}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Grade item sub-component
function GradeItem({
  label,
  count,
  color,
  total,
}: {
  label: string;
  count: number;
  color: string;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <View style={styles.gradeItem}>
      <View style={[styles.gradeBar, { backgroundColor: color + '20' }]}>
        <View
          style={[
            styles.gradeBarFill,
            {
              backgroundColor: color,
              height: `${percentage}%`,
            },
          ]}
        />
      </View>
      <TextDisplay text={count.toString()} style={[styles.gradeCount, { color }]} />
      <TextDisplay text={label} style={styles.gradeLabel} />
    </View>
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
  actions: {
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    paddingTop: 40,
  },
  gradeBar: {
    borderRadius: 4,
    height: 60,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 32,
  },
  gradeBarFill: {
    borderRadius: 4,
    width: '100%',
  },
  gradeBreakdown: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
  },
  gradeCount: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  gradeItem: {
    alignItems: 'center',
    flex: 1,
  },
  gradeLabel: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 4,
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
  },
  mainStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  mainStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  mainStats: {
    borderRadius: 16,
    flexDirection: 'row',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statDivider: {
    height: '60%',
    width: 1,
  },
});
