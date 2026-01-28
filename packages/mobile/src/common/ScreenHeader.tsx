/**
 * Screen Header - Consistent header component for screens
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';

import {useColors} from '@/theme';
import {spacing} from '@/theme/tokens';
import {Text} from '@components/ui';
import {ChevronLeftIcon} from './TabBarIcon';

export interface ScreenHeaderProps {
  /** Screen title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Show back button */
  showBack?: boolean;
  /** Back button handler */
  onBack?: () => void;
  /** Right side element */
  rightElement?: React.ReactNode;
  /** Large title style */
  large?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightElement,
  large = true,
}: ScreenHeaderProps): React.JSX.Element {
  const colors = useColors();

  return (
    <View style={[styles.container, {borderBottomColor: colors.divider}]}>
      {/* Left side */}
      <View style={styles.left}>
        {showBack && onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ChevronLeftIcon color={colors.primary} size={24} />
          </TouchableOpacity>
        )}
      </View>

      {/* Center / Title area */}
      <View style={[styles.titleContainer, large && styles.titleContainerLarge]}>
        <Text variant={large ? 'headlineLarge' : 'titleLarge'}>{title}</Text>
        {subtitle && (
          <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right side */}
      <View style={styles.right}>{rightElement}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginRight: spacing[2],
    padding: spacing[1],
  },
  container: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  left: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  right: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  subtitle: {
    marginTop: spacing[0.5],
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  titleContainerLarge: {
    alignItems: 'flex-start',
  },
});
