/**
 * Stat Card - Displays a single statistic
 */

import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import {Text} from '@components/ui';

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  color: string;
}

const {width} = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with padding and gap

export function StatCard({icon, value, label, color}: StatCardProps): React.JSX.Element {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceHover,
          borderLeftColor: color,
        },
      ]}
    >
      <Text variant="headlineMedium" style={styles.icon}>
        {icon}
      </Text>
      <Text variant="headlineLarge" customColor={color} style={styles.value}>
        {value}
      </Text>
      <Text variant="bodySmall" color="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    width: cardWidth,
  },
  icon: {
    marginBottom: spacing[2],
  },
  value: {
    fontWeight: '700',
    marginBottom: spacing[1],
  },
});
