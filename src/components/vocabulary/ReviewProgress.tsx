/**
 * Review Progress - Shows progress through a review session
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';

import { useTheme } from '@theme/index';

// ============================================================================
// Types
// ============================================================================

interface ReviewProgressProps {
  current: number;
  total: number;
  correctCount?: number;
}

// ============================================================================
// Component
// ============================================================================

export function ReviewProgress({
  current,
  total,
  correctCount = 0,
}: ReviewProgressProps): React.JSX.Element {
  const { colors } = useTheme();

  const progress = total > 0 ? (current / total) * 100 : 0;
  const accuracy = current > 0 ? (correctCount / current) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.background.secondary }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary[500],
              width: `${progress}%`,
            },
          ]}
        />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <TextDisplay
            text={`${current}`}
            style={[styles.statValue, { color: colors.text.primary }]}
          />
          <TextDisplay
            text={`of ${total}`}
            style={[styles.statLabel, { color: colors.text.tertiary }]}
          />
        </View>

        {current > 0 && (
          <View style={styles.stat}>
            <TextDisplay
              text={`${accuracy.toFixed(0)}%`}
              style={[
                styles.statValue,
                {
                  color: accuracy >= 70 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444',
                },
              ]}
            />
            <TextDisplay
              text="accuracy"
              style={[styles.statLabel, { color: colors.text.tertiary }]}
            />
          </View>
        )}
      </View>
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
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressBar: {
    borderRadius: 4,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    borderRadius: 4,
    height: '100%',
  },
  stat: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
