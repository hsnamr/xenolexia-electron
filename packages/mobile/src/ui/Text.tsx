/**
 * Text Component - Themed typography with variants
 */

import React from 'react';

import {Text as RNText, TextProps as RNTextProps, StyleSheet} from 'react-native';

import {typography, fontFamilies} from '@/theme/fonts';
import type {TypographyVariant} from '@/theme/fonts';
import {useColors} from '@/theme/ThemeProvider';

// ============================================================================
// Types
// ============================================================================

export interface TextProps extends RNTextProps {
  /** Typography variant preset */
  variant?: TypographyVariant;

  /** Text color - uses theme colors */
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success' | 'accent';

  /** Custom color override */
  customColor?: string;

  /** Font weight override */
  weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

  /** Use serif font */
  serif?: boolean;

  /** Use monospace font */
  mono?: boolean;

  /** Center text */
  center?: boolean;

  /** Right align text */
  right?: boolean;

  /** Uppercase text */
  uppercase?: boolean;

  /** Children */
  children: React.ReactNode;
}

// ============================================================================
// Weight mapping
// ============================================================================

const weightMap = {
  thin: '100',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// ============================================================================
// Component
// ============================================================================

export function Text({
  variant = 'bodyMedium',
  color = 'primary',
  customColor,
  weight,
  serif,
  mono,
  center,
  right,
  uppercase,
  style,
  children,
  ...props
}: TextProps): React.JSX.Element {
  const colors = useColors();

  // Get color based on prop
  const getTextColor = () => {
    if (customColor) return customColor;
    switch (color) {
      case 'primary':
        return colors.text;
      case 'secondary':
        return colors.textSecondary;
      case 'tertiary':
        return colors.textTertiary;
      case 'inverse':
        return colors.textInverse;
      case 'error':
        return colors.error;
      case 'success':
        return colors.success;
      case 'accent':
        return colors.accent;
      default:
        return colors.text;
    }
  };

  // Get font family
  const getFontFamily = () => {
    if (mono) return fontFamilies.mono;
    if (serif) return fontFamilies.serif;
    return typography[variant]?.fontFamily || fontFamilies.sans;
  };

  // Build style
  const textStyle = [
    typography[variant],
    {
      color: getTextColor(),
      fontFamily: getFontFamily(),
    },
    weight && {fontWeight: weightMap[weight]},
    center && styles.center,
    right && styles.right,
    uppercase && styles.uppercase,
    style,
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export function Heading({
  level = 1,
  children,
  ...props
}: TextProps & {level?: 1 | 2 | 3 | 4 | 5 | 6}) {
  const variantMap: Record<number, TypographyVariant> = {
    1: 'displayMedium',
    2: 'headlineLarge',
    3: 'headlineMedium',
    4: 'headlineSmall',
    5: 'titleLarge',
    6: 'titleMedium',
  };

  return (
    <Text variant={variantMap[level]} {...props}>
      {children}
    </Text>
  );
}

export function Title({children, ...props}: TextProps) {
  return (
    <Text variant="titleLarge" {...props}>
      {children}
    </Text>
  );
}

export function Body({children, ...props}: TextProps) {
  return (
    <Text variant="bodyMedium" {...props}>
      {children}
    </Text>
  );
}

export function Caption({children, ...props}: TextProps) {
  return (
    <Text variant="bodySmall" color="secondary" {...props}>
      {children}
    </Text>
  );
}

export function Label({children, ...props}: TextProps) {
  return (
    <Text variant="labelMedium" {...props}>
      {children}
    </Text>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  right: {
    textAlign: 'right',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
