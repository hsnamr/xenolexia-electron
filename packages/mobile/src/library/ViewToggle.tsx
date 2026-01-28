/**
 * View Toggle - Switch between grid and list views
 */

import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';

// ============================================================================
// Types
// ============================================================================

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  size?: 'sm' | 'md';
}

// ============================================================================
// Icons
// ============================================================================

function GridIcon({color, size = 20}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ListIcon({color, size = 20}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// Component
// ============================================================================

export function ViewToggle({
  mode,
  onChange,
  size = 'md',
}: ViewToggleProps): React.JSX.Element {
  const colors = useColors();

  const buttonSize = size === 'sm' ? 32 : 40;
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <View style={[styles.container, {backgroundColor: colors.surfaceHover}]}>
      <TouchableOpacity
        style={[
          styles.button,
          {width: buttonSize, height: buttonSize},
          mode === 'grid' && {backgroundColor: colors.background},
        ]}
        onPress={() => onChange('grid')}
        activeOpacity={0.7}
      >
        <GridIcon
          color={mode === 'grid' ? colors.primary : colors.textTertiary}
          size={iconSize}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          {width: buttonSize, height: buttonSize},
          mode === 'list' && {backgroundColor: colors.background},
        ]}
        onPress={() => onChange('list')}
        activeOpacity={0.7}
      >
        <ListIcon
          color={mode === 'list' ? colors.primary : colors.textTertiary}
          size={iconSize}
        />
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  container: {
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: spacing[1],
    padding: spacing[1],
  },
});
