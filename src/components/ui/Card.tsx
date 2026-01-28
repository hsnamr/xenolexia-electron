/**
 * Card Component - Themed container with variants
 */

import React from 'react';

import {View, ViewProps, StyleSheet, TouchableOpacity, TouchableOpacityProps} from 'react-native';

import {useColors} from '@/theme/ThemeProvider';
import {spacing, borderRadius, shadows} from '@/theme/tokens';

// ============================================================================
// Types
// ============================================================================

export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps extends ViewProps {
  /** Visual variant */
  variant?: CardVariant;

  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /** Border radius size */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  /** Children */
  children: React.ReactNode;
}

export interface PressableCardProps extends Omit<TouchableOpacityProps, 'children'> {
  /** Visual variant */
  variant?: CardVariant;

  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /** Border radius size */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  /** Children */
  children: React.ReactNode;
}

// ============================================================================
// Size configurations
// ============================================================================

const paddingConfig = {
  none: 0,
  sm: spacing[2],
  md: spacing[4],
  lg: spacing[6],
} as const;

const roundedConfig = {
  none: borderRadius.none,
  sm: borderRadius.sm,
  md: borderRadius.md,
  lg: borderRadius.lg,
  xl: borderRadius.xl,
} as const;

// ============================================================================
// Card Component
// ============================================================================

export function Card({
  variant = 'elevated',
  padding = 'md',
  rounded = 'lg',
  style,
  children,
  ...props
}: CardProps): React.JSX.Element {
  const colors = useColors();

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          borderWidth: 0,
          borderColor: 'transparent',
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.surfaceHover,
          borderWidth: 0,
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 0,
          borderColor: 'transparent',
        };
    }
  };

  const variantStyles = getVariantStyles();

  const containerStyle = [
    styles.container,
    {
      padding: paddingConfig[padding],
      borderRadius: roundedConfig[rounded],
      ...variantStyles,
    },
    style,
  ];

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
}

// ============================================================================
// Pressable Card Component
// ============================================================================

export function PressableCard({
  variant = 'elevated',
  padding = 'md',
  rounded = 'lg',
  style,
  children,
  disabled,
  ...props
}: PressableCardProps): React.JSX.Element {
  const colors = useColors();

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          borderWidth: 0,
          borderColor: 'transparent',
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.surfaceHover,
          borderWidth: 0,
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 0,
          borderColor: 'transparent',
        };
    }
  };

  const variantStyles = getVariantStyles();

  const containerStyle = [
    styles.container,
    {
      padding: paddingConfig[padding],
      borderRadius: roundedConfig[rounded],
      ...variantStyles,
      opacity: disabled ? 0.6 : 1,
    },
    style,
  ];

  return (
    <TouchableOpacity style={containerStyle} activeOpacity={0.8} disabled={disabled} {...props}>
      {children}
    </TouchableOpacity>
  );
}

// ============================================================================
// Card Header
// ============================================================================

export interface CardHeaderProps extends ViewProps {
  children: React.ReactNode;
}

export function CardHeader({style, children, ...props}: CardHeaderProps) {
  const colors = useColors();

  return (
    <View style={[styles.header, {borderBottomColor: colors.divider}, style]} {...props}>
      {children}
    </View>
  );
}

// ============================================================================
// Card Content
// ============================================================================

export interface CardContentProps extends ViewProps {
  children: React.ReactNode;
}

export function CardContent({style, children, ...props}: CardContentProps) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

// ============================================================================
// Card Footer
// ============================================================================

export interface CardFooterProps extends ViewProps {
  children: React.ReactNode;
}

export function CardFooter({style, children, ...props}: CardFooterProps) {
  const colors = useColors();

  return (
    <View style={[styles.footer, {borderTopColor: colors.divider}, style]} {...props}>
      {children}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    paddingVertical: spacing[2],
  },
  footer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing[4],
    paddingTop: spacing[4],
  },
  header: {
    borderBottomWidth: 1,
    marginBottom: spacing[4],
    paddingBottom: spacing[4],
  },
});
