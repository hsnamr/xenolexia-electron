/**
 * Import Progress Modal
 *
 * Displays progress while importing a book file.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import {Text, Button} from '@components/ui';
import type {ImportProgress, ImportStatus} from '@services/ImportService';

// ============================================================================
// Types
// ============================================================================

interface ImportProgressModalProps {
  visible: boolean;
  progress: ImportProgress | null;
  onCancel?: () => void;
  onDismiss?: () => void;
}

// ============================================================================
// Status Config
// ============================================================================

const STATUS_CONFIG: Record<
  ImportStatus,
  {icon: string; color: 'primary' | 'success' | 'error'}
> = {
  idle: {icon: '📁', color: 'primary'},
  selecting: {icon: '🔍', color: 'primary'},
  copying: {icon: '📥', color: 'primary'},
  parsing: {icon: '📖', color: 'primary'},
  extracting_cover: {icon: '🖼️', color: 'primary'},
  saving: {icon: '💾', color: 'primary'},
  complete: {icon: '✅', color: 'success'},
  error: {icon: '❌', color: 'error'},
};

// ============================================================================
// Component
// ============================================================================

export function ImportProgressModal({
  visible,
  progress,
  onCancel,
  onDismiss,
}: ImportProgressModalProps): React.JSX.Element {
  const colors = useColors();

  if (!progress) return <></>;

  const statusConfig = STATUS_CONFIG[progress.status];
  const isComplete = progress.status === 'complete';
  const isError = progress.status === 'error';
  const isInProgress = !isComplete && !isError;

  const handleDismiss = () => {
    if (isComplete || isError) {
      onDismiss?.();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleDismiss}>
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Pressable
          style={[styles.container, {backgroundColor: colors.surface}]}
          onPress={e => e.stopPropagation()}>
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor:
                  statusConfig.color === 'success'
                    ? colors.successLight
                    : statusConfig.color === 'error'
                      ? colors.errorLight
                      : colors.primaryLight,
              },
            ]}>
            <Text style={styles.icon}>{statusConfig.icon}</Text>
          </View>

          {/* File Name */}
          <Text variant="titleMedium" style={styles.fileName} numberOfLines={1}>
            {progress.fileName}
          </Text>

          {/* Status Message */}
          <Text
            variant="bodyMedium"
            color={isError ? 'error' : 'secondary'}
            style={styles.statusText}>
            {progress.error || progress.currentStep}
          </Text>

          {/* Progress Bar */}
          {isInProgress && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {backgroundColor: colors.primaryLight},
                ]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${progress.progress}%`,
                    },
                  ]}
                />
              </View>
              <Text variant="labelSmall" color="secondary" style={styles.progressText}>
                {progress.progress}%
              </Text>
            </View>
          )}

          {/* Loading Indicator */}
          {isInProgress && (
            <ActivityIndicator
              color={colors.primary}
              size="small"
              style={styles.loader}
            />
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {isInProgress && onCancel && (
              <Button variant="ghost" onPress={onCancel}>
                Cancel
              </Button>
            )}

            {(isComplete || isError) && (
              <Button
                variant={isError ? 'outline' : 'primary'}
                onPress={onDismiss}>
                {isError ? 'Try Again' : 'Done'}
              </Button>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  actions: {
    marginTop: spacing[6],
    width: '100%',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing[6],
  },
  container: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    maxWidth: 320,
    padding: spacing[6],
    width: '100%',
  },
  fileName: {
    marginBottom: spacing[2],
    marginTop: spacing[4],
    textAlign: 'center',
  },
  icon: {
    fontSize: 32,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  loader: {
    marginTop: spacing[4],
  },
  progressBar: {
    borderRadius: borderRadius.full,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  progressContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
    width: '100%',
  },
  progressFill: {
    borderRadius: borderRadius.full,
    height: '100%',
  },
  progressText: {
    minWidth: 36,
    textAlign: 'right',
  },
  statusText: {
    textAlign: 'center',
  },
});
