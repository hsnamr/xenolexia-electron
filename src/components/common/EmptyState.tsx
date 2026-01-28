/**
 * Empty State Component - Reusable empty/error states
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';

import {spacing} from '@/theme/tokens';
import {Text, Button} from '@components/ui';

export interface EmptyStateProps {
  /** Emoji or icon */
  icon?: string;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button text */
  actionText?: string;
  /** Primary action handler */
  onAction?: () => void;
  /** Secondary action text */
  secondaryActionText?: string;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Compact mode */
  compact?: boolean;
  /** Custom content (children) */
  children?: React.ReactNode;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  compact = false,
  children,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text variant="displaySmall" style={styles.icon}>
        {icon}
      </Text>

      <Text variant={compact ? 'titleLarge' : 'headlineMedium'} center style={styles.title}>
        {title}
      </Text>

      {description && (
        <Text variant="bodyMedium" color="secondary" center style={styles.description}>
          {description}
        </Text>
      )}

      {/* Custom children content */}
      {children}

      {/* Default action buttons */}
      {(actionText || secondaryActionText) && !children && (
        <View style={styles.actions}>
          {actionText && onAction && (
            <Button variant="primary" size="lg" onPress={onAction}>
              {actionText}
            </Button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <Button variant="outline" size="md" onPress={onSecondaryAction}>
              {secondaryActionText}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Preset Empty States
// ============================================================================

export function EmptySearchResults({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}): React.JSX.Element {
  return (
    <EmptyState
      icon="🔍"
      title="No Results Found"
      description={query ? `No matches for "${query}"` : 'Try a different search term'}
      actionText={onClear ? 'Clear Search' : undefined}
      onAction={onClear}
      compact
    />
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again later',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}): React.JSX.Element {
  return (
    <EmptyState
      icon="⚠️"
      title={title}
      description={description}
      actionText={onRetry ? 'Try Again' : undefined}
      onAction={onRetry}
    />
  );
}

export function NoConnectionState({
  onRetry,
}: {
  onRetry?: () => void;
}): React.JSX.Element {
  return (
    <EmptyState
      icon="📡"
      title="No Connection"
      description="Please check your internet connection and try again"
      actionText={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
    />
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[6],
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[16],
  },
  containerCompact: {
    paddingVertical: spacing[8],
  },
  description: {
    lineHeight: 24,
    marginTop: spacing[2],
  },
  icon: {
    marginBottom: spacing[4],
  },
  title: {
    marginTop: spacing[2],
  },
});
