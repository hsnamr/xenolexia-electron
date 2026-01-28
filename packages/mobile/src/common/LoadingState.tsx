/**
 * Loading State Components - Skeletons and spinners
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, ActivityIndicator} from 'react-native';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import {Text} from '@components/ui';

// ============================================================================
// Loading Spinner
// ============================================================================

export interface LoadingSpinnerProps {
  /** Size of spinner */
  size?: 'small' | 'large';
  /** Loading message */
  message?: string;
  /** Full screen overlay */
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  message,
  fullScreen = false,
}: LoadingSpinnerProps): React.JSX.Element {
  const colors = useColors();

  const content = (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text variant="bodyMedium" color="secondary" style={styles.spinnerMessage}>
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, {backgroundColor: colors.background}]}>
        {content}
      </View>
    );
  }

  return content;
}

// ============================================================================
// Skeleton Components
// ============================================================================

export interface SkeletonProps {
  /** Width (number or percentage string) */
  width?: number | string;
  /** Height */
  height?: number;
  /** Border radius */
  radius?: number;
  /** Custom style */
  style?: object;
}

export function Skeleton({
  width = '100%',
  height = 20,
  radius = borderRadius.md,
  style,
}: SkeletonProps): React.JSX.Element {
  const colors = useColors();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ============================================================================
// Skeleton Presets
// ============================================================================

export function SkeletonText({lines = 3}: {lines?: number}): React.JSX.Element {
  return (
    <View style={styles.skeletonTextContainer}>
      {Array.from({length: lines}).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height={16}
          style={styles.skeletonTextLine}
        />
      ))}
    </View>
  );
}

export function SkeletonCard(): React.JSX.Element {
  const colors = useColors();

  return (
    <View style={[styles.skeletonCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
      <Skeleton width="100%" height={120} radius={borderRadius.md} />
      <View style={styles.skeletonCardContent}>
        <Skeleton width="80%" height={18} />
        <Skeleton width="50%" height={14} style={{marginTop: spacing[2]}} />
      </View>
    </View>
  );
}

export function SkeletonBookCard(): React.JSX.Element {
  return (
    <View style={styles.skeletonBookCard}>
      <Skeleton width="100%" height={180} radius={borderRadius.lg} />
      <Skeleton width="90%" height={16} style={{marginTop: spacing[2]}} />
      <Skeleton width="60%" height={14} style={{marginTop: spacing[1]}} />
    </View>
  );
}

export function SkeletonListItem(): React.JSX.Element {
  const colors = useColors();

  return (
    <View style={[styles.skeletonListItem, {borderBottomColor: colors.divider}]}>
      <Skeleton width={48} height={48} radius={borderRadius.lg} />
      <View style={styles.skeletonListItemContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={14} style={{marginTop: spacing[1]}} />
      </View>
    </View>
  );
}

export function SkeletonStatCard(): React.JSX.Element {
  const colors = useColors();

  return (
    <View style={[styles.skeletonStatCard, {backgroundColor: colors.surfaceHover}]}>
      <Skeleton width={40} height={40} radius={borderRadius.full} />
      <Skeleton width="60%" height={24} style={{marginTop: spacing[2]}} />
      <Skeleton width="40%" height={14} style={{marginTop: spacing[1]}} />
    </View>
  );
}

// ============================================================================
// Loading Grid/List
// ============================================================================

export function LoadingBookGrid({count = 4}: {count?: number}): React.JSX.Element {
  return (
    <View style={styles.loadingGrid}>
      {Array.from({length: count}).map((_, index) => (
        <SkeletonBookCard key={index} />
      ))}
    </View>
  );
}

export function LoadingList({count = 5}: {count?: number}): React.JSX.Element {
  return (
    <View>
      {Array.from({length: count}).map((_, index) => (
        <SkeletonListItem key={index} />
      ))}
    </View>
  );
}

export function LoadingStats(): React.JSX.Element {
  return (
    <View style={styles.loadingStatsGrid}>
      {Array.from({length: 4}).map((_, index) => (
        <SkeletonStatCard key={index} />
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  fullScreen: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    padding: spacing[4],
  },
  loadingStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    padding: spacing[4],
  },
  skeletonBookCard: {
    width: '47%',
  },
  skeletonCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  skeletonCardContent: {
    padding: spacing[4],
  },
  skeletonListItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  skeletonListItemContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  skeletonStatCard: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    width: '47%',
  },
  skeletonTextContainer: {
    gap: spacing[2],
  },
  skeletonTextLine: {
    marginBottom: spacing[2],
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  spinnerMessage: {
    marginTop: spacing[4],
  },
});
