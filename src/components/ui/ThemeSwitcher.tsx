/**
 * Theme Switcher Component - UI for changing app theme
 */

import React from 'react';

import {View, StyleSheet, TouchableOpacity} from 'react-native';

import {useTheme, useColors} from '@/theme/ThemeProvider';
import type {ReaderTheme, ThemeMode} from '@/theme/themes';
import {spacing, borderRadius} from '@/theme/tokens';

import {Text} from './Text';

// ============================================================================
// Types
// ============================================================================

export interface ThemeSwitcherProps {
  /** Show system option */
  showSystemOption?: boolean;

  /** Compact mode (icons only) */
  compact?: boolean;

  /** Callback when theme changes */
  onChange?: (theme: ThemeMode) => void;
}

// ============================================================================
// Theme Options
// ============================================================================

interface ThemeOption {
  id: ThemeMode;
  label: string;
  icon: string;
  preview: {
    background: string;
    text: string;
    accent: string;
  };
}

const themeOptions: ThemeOption[] = [
  {
    id: 'light',
    label: 'Light',
    icon: '☀️',
    preview: {
      background: '#ffffff',
      text: '#1f2937',
      accent: '#0ea5e9',
    },
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: '🌙',
    preview: {
      background: '#0f172a',
      text: '#f1f5f9',
      accent: '#38bdf8',
    },
  },
  {
    id: 'sepia',
    label: 'Sepia',
    icon: '📜',
    preview: {
      background: '#f8f4e9',
      text: '#433422',
      accent: '#b45309',
    },
  },
  {
    id: 'system',
    label: 'System',
    icon: '⚙️',
    preview: {
      background: '#f3f4f6',
      text: '#1f2937',
      accent: '#6b7280',
    },
  },
];

// ============================================================================
// Theme Switcher Component
// ============================================================================

export function ThemeSwitcher({
  showSystemOption = true,
  compact = false,
  onChange,
}: ThemeSwitcherProps): React.JSX.Element {
  const {themeMode, setThemeMode} = useTheme();
  const colors = useColors();

  const options = showSystemOption ? themeOptions : themeOptions.filter(o => o.id !== 'system');

  const handleSelect = (option: ThemeOption) => {
    setThemeMode(option.id);
    onChange?.(option.id);
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {options.map(option => {
          const isSelected = themeMode === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.compactOption,
                {
                  backgroundColor: isSelected ? colors.primaryLight : colors.surfaceHover,
                  borderColor: isSelected ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => handleSelect(option)}
              activeOpacity={0.7}
            >
              <Text variant="bodyLarge">{option.icon}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {options.map(option => {
        const isSelected = themeMode === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.option,
              {
                backgroundColor: colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
            onPress={() => handleSelect(option)}
            activeOpacity={0.7}
          >
            {/* Preview box */}
            <View style={[styles.preview, {backgroundColor: option.preview.background}]}>
              <View style={[styles.previewLine, {backgroundColor: option.preview.text}]} />
              <View
                style={[
                  styles.previewLine,
                  styles.previewLineShort,
                  {backgroundColor: option.preview.text, opacity: 0.5},
                ]}
              />
              <View style={[styles.previewAccent, {backgroundColor: option.preview.accent}]} />
            </View>

            {/* Label */}
            <View style={styles.labelContainer}>
              <Text variant="bodySmall">{option.icon}</Text>
              <Text
                variant="labelSmall"
                color={isSelected ? 'primary' : 'secondary'}
                style={styles.label}
              >
                {option.label}
              </Text>
            </View>

            {/* Selected indicator */}
            {isSelected && (
              <View style={[styles.selectedIndicator, {backgroundColor: colors.primary}]}>
                <Text variant="labelSmall" customColor="#fff">
                  ✓
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================================================
// Quick Theme Toggle (single button)
// ============================================================================

export function QuickThemeToggle(): React.JSX.Element {
  const {theme, toggleTheme} = useTheme();
  const colors = useColors();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'sepia':
        return '📜';
      default:
        return '☀️';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.quickToggle,
        {
          backgroundColor: colors.surfaceHover,
          borderColor: colors.border,
        },
      ]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Text variant="bodyLarge">{getIcon()}</Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  compactOption: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  label: {
    marginTop: spacing[0.5],
  },
  labelContainer: {
    alignItems: 'center',
    marginTop: spacing[2],
  },
  option: {
    borderRadius: borderRadius.lg,
    flex: 1,
    minWidth: 80,
    overflow: 'hidden',
    padding: spacing[3],
    position: 'relative',
  },
  preview: {
    borderRadius: borderRadius.md,
    height: 60,
    padding: spacing[2],
  },
  previewAccent: {
    borderRadius: borderRadius.sm,
    height: 8,
    marginTop: spacing[2],
    width: 24,
  },
  previewLine: {
    borderRadius: 2,
    height: 4,
    marginBottom: spacing[1],
    width: '100%',
  },
  previewLineShort: {
    width: '60%',
  },
  quickToggle: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  selectedIndicator: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing[2],
    top: spacing[2],
    width: 20,
  },
});
