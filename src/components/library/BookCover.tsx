/**
 * Book Cover - Displays book cover with loading states and fallback
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';

import {useColors} from '@/theme';
import {borderRadius, spacing} from '@/theme/tokens';
import {Text} from '@components/ui';
import {ImageService} from '@services/ImageService';
import type {ThumbnailSize} from '@services/ImageService';

// ============================================================================
// Types
// ============================================================================

interface BookCoverProps {
  /** Book ID for fetching cached cover */
  bookId?: string;
  /** Direct path to cover image */
  coverPath?: string | null;
  /** Book title (used for placeholder) */
  title?: string;
  /** Thumbnail size */
  size?: ThumbnailSize;
  /** Container width */
  width?: number | string;
  /** Aspect ratio (default 0.65 - typical book cover) */
  aspectRatio?: number;
  /** Border radius */
  borderRadius?: number;
  /** Show loading indicator */
  showLoading?: boolean;
  /** Custom placeholder background color */
  placeholderColor?: string;
}

type LoadState = 'loading' | 'loaded' | 'error';

// ============================================================================
// Component
// ============================================================================

export function BookCover({
  bookId,
  coverPath,
  title = 'Book',
  size = 'medium',
  width = '100%',
  aspectRatio = 0.65,
  borderRadius: customBorderRadius,
  showLoading = true,
  placeholderColor,
}: BookCoverProps): React.JSX.Element {
  const colors = useColors();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const finalBorderRadius = customBorderRadius ?? borderRadius.lg;
  const bgColor = placeholderColor ?? colors.surfaceHover;

  // Load cover image
  useEffect(() => {
    let mounted = true;

    async function loadCover() {
      setLoadState('loading');

      try {
        let uri: string | null = null;

        // Try direct path first
        if (coverPath) {
          uri = coverPath;
        }
        // Try to get from ImageService by bookId
        else if (bookId) {
          const imageService = ImageService.getInstance();
          await imageService.initialize();

          // Try thumbnail first for better performance
          uri = await imageService.getCoverThumbnail(bookId, size);

          // Fall back to full cover
          if (!uri) {
            uri = await imageService.getCoverPath(bookId);
          }
        }

        if (!mounted) return;

        if (uri) {
          setImageUri(uri);
          setLoadState('loaded');
        } else {
          setLoadState('error');
        }
      } catch (error) {
        if (mounted) {
          setLoadState('error');
        }
      }
    }

    loadCover();

    return () => {
      mounted = false;
    };
  }, [bookId, coverPath, size]);

  // Fade in animation when image loads
  const handleImageLoad = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Get initials from title
  const getInitials = useCallback((text: string): string => {
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          width,
          aspectRatio,
          borderRadius: finalBorderRadius,
          backgroundColor: bgColor,
        },
      ]}
    >
      {/* Loading State */}
      {loadState === 'loading' && showLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Placeholder / Error State */}
      {(loadState === 'error' || loadState === 'loading') && (
        <View
          style={[
            styles.placeholder,
            {backgroundColor: colors.primaryLight},
          ]}
        >
          <View style={[styles.initialsCircle, {backgroundColor: colors.primary}]}>
            <Text variant="headlineSmall" customColor={colors.onPrimary}>
              {getInitials(title)}
            </Text>
          </View>
          <Text
            variant="labelSmall"
            customColor={colors.primary}
            center
            numberOfLines={3}
            style={styles.placeholderTitle}
          >
            {title}
          </Text>
        </View>
      )}

      {/* Loaded Image */}
      {loadState === 'loaded' && imageUri && (
        <Animated.Image
          source={{uri: imageUri}}
          style={[styles.image, {opacity: fadeAnim}]}
          resizeMode="cover"
          onLoad={handleImageLoad}
          onError={() => setLoadState('error')}
        />
      )}
    </View>
  );
}

// ============================================================================
// Skeleton Component for Loading
// ============================================================================

interface BookCoverSkeletonProps {
  width?: number | string;
  aspectRatio?: number;
}

export function BookCoverSkeleton({
  width = '100%',
  aspectRatio = 0.65,
}: BookCoverSkeletonProps): React.JSX.Element {
  const colors = useColors();
  const [pulseAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          aspectRatio,
          backgroundColor: colors.surfaceHover,
          opacity: pulseAnim,
        },
      ]}
    />
  );
}

// ============================================================================
// Grid of Skeleton Covers
// ============================================================================

interface BookCoverGridSkeletonProps {
  count?: number;
  columns?: number;
}

export function BookCoverGridSkeleton({
  count = 4,
  columns = 2,
}: BookCoverGridSkeletonProps): React.JSX.Element {
  return (
    <View style={[styles.skeletonGrid, {gap: spacing[4]}]}>
      {Array.from({length: count}).map((_, index) => (
        <View key={index} style={{flex: 1 / columns}}>
          <BookCoverSkeleton />
          <View style={styles.skeletonTextContainer}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonAuthor} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  initialsCircle: {
    alignItems: 'center',
    borderRadius: 50,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  loadingContainer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  placeholder: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    padding: spacing[4],
    width: '100%',
  },
  placeholderTitle: {
    marginTop: spacing[3],
  },
  skeleton: {
    borderRadius: borderRadius.lg,
  },
  skeletonAuthor: {
    backgroundColor: '#E2E8F0',
    borderRadius: borderRadius.sm,
    height: 12,
    marginTop: spacing[1],
    width: '60%',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonTextContainer: {
    paddingTop: spacing[2],
  },
  skeletonTitle: {
    backgroundColor: '#E2E8F0',
    borderRadius: borderRadius.sm,
    height: 16,
    width: '80%',
  },
});
