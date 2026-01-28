/**
 * Button Component - Themed button with variants
 */

import React, {useCallback} from 'react';

import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

import {useColors} from '@/theme/ThemeProvider';
import {spacing, borderRadius} from '@/theme/tokens';

import {Text} from './Text';

// ============================================================================
// Types
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  /** Button text */
  children: string;

  /** Visual variant */
  variant?: ButtonVariant;

  /** Size */
  size?: ButtonSize;

  /** Full width */
  fullWidth?: boolean;

  /** Loading state */
  loading?: boolean;

  /** Left icon */
  leftIcon?: React.ReactNode;

  /** Right icon */
  rightIcon?: React.ReactNode;
}

// ============================================================================
// Size configurations
// ============================================================================

const sizeConfig = {
  sm: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    fontSize: 13,
    iconSize: 16,
    borderRadius: borderRadius.md,
  },
  md: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    fontSize: 15,
    iconSize: 20,
    borderRadius: borderRadius.lg,
  },
  lg: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3.5],
    fontSize: 17,
    iconSize: 24,
    borderRadius: borderRadius.xl,
  },
} as const;

// ============================================================================
// Component
// ============================================================================

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  onPress,
  ...props
}: ButtonProps): React.JSX.Element {
  const colors = useColors();
  const config = sizeConfig[size];

  // Get variant styles
  const getVariantStyles = useCallback(() => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDisabled ? colors.disabled : colors.primary,
          borderColor: 'transparent',
          textColor: isDisabled ? colors.disabledText : colors.onPrimary,
        };
      case 'secondary':
        return {
          backgroundColor: isDisabled ? colors.disabled : colors.primaryLight,
          borderColor: 'transparent',
          textColor: isDisabled ? colors.disabledText : colors.primary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: isDisabled ? colors.disabled : colors.border,
          textColor: isDisabled ? colors.disabledText : colors.text,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: isDisabled ? colors.disabledText : colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: isDisabled ? colors.disabled : colors.error,
          borderColor: 'transparent',
          textColor: isDisabled ? colors.disabledText : colors.textInverse,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: 'transparent',
          textColor: colors.onPrimary,
        };
    }
  }, [variant, disabled, loading, colors]);

  const variantStyles = getVariantStyles();

  // Container style
  const containerStyle = [
    styles.container,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderRadius: config.borderRadius,
      paddingHorizontal: config.paddingHorizontal,
      paddingVertical: config.paddingVertical,
    },
    variant === 'outline' && styles.outlined,
    fullWidth && styles.fullWidth,
    style,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      disabled={disabled || loading}
      onPress={onPress}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            variant="labelLarge"
            customColor={variantStyles.textColor}
            style={{fontSize: config.fontSize}}
          >
            {children}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export function PrimaryButton(props: ButtonProps) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: ButtonProps) {
  return <Button variant="secondary" {...props} />;
}

export function OutlineButton(props: ButtonProps) {
  return <Button variant="outline" {...props} />;
}

export function GhostButton(props: ButtonProps) {
  return <Button variant="ghost" {...props} />;
}

export function DangerButton(props: ButtonProps) {
  return <Button variant="danger" {...props} />;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  leftIcon: {
    marginRight: spacing[2],
  },
  outlined: {
    borderWidth: 1.5,
  },
  rightIcon: {
    marginLeft: spacing[2],
  },
});
