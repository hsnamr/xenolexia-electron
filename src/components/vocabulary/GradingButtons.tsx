/**
 * Grading Buttons - Self-assessment buttons for spaced repetition review
 *
 * SM-2 Grading Scale:
 * - Again (0): Complete blackout, reset interval
 * - Hard (1): Incorrect but remembered something
 * - Good (2): Correct with some effort
 * - Easy (3): Correct immediately
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

interface GradingButtonsProps {
  onGrade: (quality: number) => void;
  disabled?: boolean;
  showLabels?: boolean;
}

interface GradeOption {
  quality: number;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

const GRADE_OPTIONS: GradeOption[] = [
  {
    quality: 0,
    label: 'Again',
    shortLabel: '🔄',
    color: '#ef4444',
    description: "Didn't know it",
  },
  {
    quality: 1,
    label: 'Hard',
    shortLabel: '😓',
    color: '#f59e0b',
    description: 'Barely recalled',
  },
  {
    quality: 2,
    label: 'Good',
    shortLabel: '👍',
    color: '#10b981',
    description: 'Recalled correctly',
  },
  {
    quality: 3,
    label: 'Easy',
    shortLabel: '⚡',
    color: '#6366f1',
    description: 'Instant recall',
  },
];

// ============================================================================
// Component
// ============================================================================

export function GradingButtons({
  onGrade,
  disabled = false,
  showLabels = true,
}: GradingButtonsProps): React.JSX.Element {
  const { colors } = useTheme();

  const handlePress = (quality: number) => {
    if (!disabled) {
      onGrade(quality);
    }
  };

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.header}>
          <TextDisplay
            text="How well did you know this?"
            style={[styles.headerText, { color: colors.text.secondary }]}
          />
        </View>
      )}

      <View style={styles.buttonsRow}>
        {GRADE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.quality}
            style={[
              styles.button,
              {
                backgroundColor: option.color + '15',
                borderColor: option.color + '40',
                opacity: disabled ? 0.5 : 1,
              },
            ]}
            onPress={() => handlePress(option.quality)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <TextDisplay
              text={option.shortLabel}
              style={styles.buttonIcon}
            />
            <TextDisplay
              text={option.label}
              style={[styles.buttonLabel, { color: option.color }]}
            />
            {showLabels && (
              <TextDisplay
                text={option.description}
                style={[styles.buttonDescription, { color: colors.text.tertiary }]}
              />
            )}
          </TouchableOpacity>
        ))}
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
  button: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  buttonDescription: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
