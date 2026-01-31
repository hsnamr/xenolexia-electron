/**
 * Image Service Types
 */

// ============================================================================
// Image Dimensions & Options
// ============================================================================

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ResizeOptions {
  /** Target width (maintains aspect ratio if height not specified) */
  width?: number;
  /** Target height (maintains aspect ratio if width not specified) */
  height?: number;
  /** Maximum dimension (scales to fit within this size) */
  maxSize?: number;
  /** Image quality for JPEG (0-100, default 80) */
  quality?: number;
  /** Output format */
  format?: 'jpeg' | 'png';
  /** Resize mode */
  mode?: 'contain' | 'cover' | 'stretch';
}

export interface ThumbnailOptions extends ResizeOptions {
  /** Size preset */
  size?: ThumbnailSize;
}

export type ThumbnailSize = 'small' | 'medium' | 'large';

export const THUMBNAIL_SIZES: Record<ThumbnailSize, ImageDimensions> = {
  small: {width: 80, height: 120},
  medium: {width: 120, height: 180},
  large: {width: 200, height: 300},
};

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry {
  /** Path to cached file */
  path: string;
  /** Original source path or URL */
  source: string;
  /** Cache key */
  key: string;
  /** Size in bytes */
  size: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last access timestamp */
  lastAccessedAt: number;
  /** Expiration timestamp (0 = never) */
  expiresAt: number;
}

export interface CacheStats {
  /** Total number of cached items */
  count: number;
  /** Total size in bytes */
  totalSize: number;
  /** Hit count since app start */
  hits: number;
  /** Miss count since app start */
  misses: number;
  /** Hit rate percentage */
  hitRate: number;
}

export interface CacheOptions {
  /** Maximum cache size in bytes (default 100MB) */
  maxSize?: number;
  /** Maximum number of entries (default 1000) */
  maxEntries?: number;
  /** Default TTL in milliseconds (0 = never expire) */
  defaultTTL?: number;
  /** Cache directory name */
  directory?: string;
}

// ============================================================================
// Image Loading Types
// ============================================================================

export type ImageLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface ImageLoadResult {
  status: ImageLoadStatus;
  uri?: string;
  error?: string;
  dimensions?: ImageDimensions;
}

export interface ImageSource {
  /** Local file path */
  uri?: string;
  /** Remote URL */
  url?: string;
  /** Base64 data */
  base64?: string;
  /** MIME type */
  mimeType?: string;
}

// ============================================================================
// Placeholder Types
// ============================================================================

export type PlaceholderType = 'book' | 'user' | 'generic';

export interface PlaceholderOptions {
  /** Type of placeholder */
  type?: PlaceholderType;
  /** Background color */
  backgroundColor?: string;
  /** Icon/text color */
  foregroundColor?: string;
  /** Text to display (e.g., initials) */
  text?: string;
  /** Icon name */
  icon?: string;
}
