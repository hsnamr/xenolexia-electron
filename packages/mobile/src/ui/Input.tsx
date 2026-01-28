/**
 * Input Component - Themed text input with variants
 */

import React, {useState, useCallback} from 'react';

import {TextInput, TextInputProps, View, StyleSheet, TouchableOpacity} from 'react-native';

import {fontFamilies} from '@/theme/fonts';
import {useColors} from '@/theme/ThemeProvider';
import {spacing, borderRadius} from '@/theme/tokens';

import {Text} from './Text';

// ============================================================================
// Types
// ============================================================================

export type InputVariant = 'outlined' | 'filled' | 'underlined';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Visual variant */
  variant?: InputVariant;

  /** Size */
  size?: InputSize;

  /** Label above input */
  label?: string;

  /** Helper text below input */
  helperText?: string;

  /** Error message */
  error?: string;

  /** Left icon/element */
  leftElement?: React.ReactNode;

  /** Right icon/element */
  rightElement?: React.ReactNode;

  /** Full width */
  fullWidth?: boolean;

  /** Clearable - show clear button when has text */
  clearable?: boolean;

  /** Container style */
  containerStyle?: object;
}

// ============================================================================
// Size configurations
// ============================================================================

const sizeConfig = {
  sm: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: 14,
    borderRadius: borderRadius.md,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 16,
    borderRadius: borderRadius.lg,
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    fontSize: 18,
    borderRadius: borderRadius.xl,
    minHeight: 56,
  },
} as const;

// ============================================================================
// Component
// ============================================================================

export function Input({
  variant = 'outlined',
  size = 'md',
  label,
  helperText,
  error,
  leftElement,
  rightElement,
  fullWidth = true,
  clearable = false,
  containerStyle,
  value,
  onChangeText,
  editable = true,
  ...props
}: InputProps): React.JSX.Element {
  const colors = useColors();
  const config = sizeConfig[size];
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const hasValue = !!value && value.length > 0;

  // Get variant styles
  const getVariantStyles = useCallback(() => {
    const baseStyles = {
      backgroundColor: colors.background,
      borderColor: hasError ? colors.error : isFocused ? colors.primary : colors.border,
      borderWidth: 1,
      borderBottomWidth: 1,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: colors.surfaceHover,
          borderColor: hasError ? colors.error : isFocused ? colors.primary : 'transparent',
          borderWidth: 0,
          borderBottomWidth: 2,
        };
      case 'underlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderBottomWidth: 2,
          borderRadius: 0,
        };
      case 'outlined':
      default:
        return baseStyles;
    }
  }, [variant, hasError, isFocused, colors]);

  const variantStyles = getVariantStyles();

  // Handle clear
  const handleClear = useCallback(() => {
    onChangeText?.('');
  }, [onChangeText]);

  // Input container style
  const inputContainerStyle = [
    styles.inputContainer,
    {
      ...variantStyles,
      borderRadius: variant === 'underlined' ? 0 : config.borderRadius,
      minHeight: config.minHeight,
      paddingHorizontal: config.paddingHorizontal,
      opacity: editable ? 1 : 0.6,
    },
  ];

  // Input style
  const inputStyle = [
    styles.input,
    {
      fontSize: config.fontSize,
      color: colors.text,
      fontFamily: fontFamilies.sans,
    },
    leftElement && styles.inputWithLeftElement,
    (rightElement || (clearable && hasValue)) && styles.inputWithRightElement,
  ];

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, containerStyle]}>
      {/* Label */}
      {label && (
        <Text variant="labelMedium" color={hasError ? 'error' : 'secondary'} style={styles.label}>
          {label}
        </Text>
      )}

      {/* Input container */}
      <View style={inputContainerStyle}>
        {/* Left element */}
        {leftElement && <View style={styles.leftElement}>{leftElement}</View>}

        {/* Text input */}
        <TextInput
          style={inputStyle}
          value={value}
          onChangeText={onChangeText}
          onFocus={e => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={colors.placeholder}
          editable={editable}
          {...props}
        />

        {/* Clear button */}
        {clearable && hasValue && editable && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text variant="bodyMedium" color="tertiary">
              ✕
            </Text>
          </TouchableOpacity>
        )}

        {/* Right element */}
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>

      {/* Helper text / Error */}
      {(helperText || error) && (
        <Text
          variant="bodySmall"
          color={hasError ? 'error' : 'secondary'}
          style={styles.helperText}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export function SearchInput(props: InputProps) {
  return (
    <Input
      variant="filled"
      placeholder="Search..."
      clearable
      leftElement={<Text color="tertiary">🔍</Text>}
      {...props}
    />
  );
}

export function PasswordInput(props: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      secureTextEntry={!showPassword}
      rightElement={
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text color="tertiary">{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      }
      {...props}
    />
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  clearButton: {
    padding: spacing[1],
  },
  container: {
    marginBottom: spacing[4],
  },
  fullWidth: {
    width: '100%',
  },
  helperText: {
    marginTop: spacing[1],
    paddingHorizontal: spacing[1],
  },
  input: {
    flex: 1,
    padding: 0,
  },
  inputContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  inputWithLeftElement: {
    marginLeft: spacing[2],
  },
  inputWithRightElement: {
    marginRight: spacing[2],
  },
  label: {
    marginBottom: spacing[1.5],
  },
  leftElement: {
    marginRight: spacing[2],
  },
  rightElement: {
    marginLeft: spacing[2],
  },
});
