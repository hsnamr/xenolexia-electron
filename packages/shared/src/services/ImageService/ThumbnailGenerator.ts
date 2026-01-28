/**
 * Thumbnail Generator
 *
 * Generates thumbnails for book covers and other images.
 * Uses react-native-image-resizer for image manipulation.
 *
 * Note: In a production app, you'd use a library like react-native-image-resizer.
 * This implementation provides a stubbed version that works with the cache system.
 */

import type {
  ImageDimensions,
  ResizeOptions,
  ThumbnailOptions,
  ThumbnailSize,
} from './types';
import {THUMBNAIL_SIZES} from './types';
import {ImageCache} from './ImageCache';
import { getAppDataPath, mkdir, fileExists, readFileAsBase64, writeFile } from '../../utils/FileSystem.electron';

// ============================================================================
// Constants
// ============================================================================

const THUMBNAILS_DIR = 'thumbnails';

// ============================================================================
// Thumbnail Generator Class
// ============================================================================

export class ThumbnailGenerator {
  private static instance: ThumbnailGenerator;
  private cache: ImageCache;
  private thumbnailsDir: string;
  private initialized: boolean = false;

  private constructor() {
    this.cache = ImageCache.getInstance();
    // Will be set during initialization
    this.thumbnailsDir = '';
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ThumbnailGenerator {
    if (!ThumbnailGenerator.instance) {
      ThumbnailGenerator.instance = new ThumbnailGenerator();
    }
    return ThumbnailGenerator.instance;
  }

  /**
   * Initialize thumbnail generator
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.cache.initialize();

      // Set thumbnails directory path
      const appDataPath = await getAppDataPath();
      this.thumbnailsDir = `${appDataPath}/${THUMBNAILS_DIR}`;

      const exists = await fileExists(this.thumbnailsDir);
      if (!exists) {
        await mkdir(this.thumbnailsDir, { recursive: true });
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ThumbnailGenerator:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for an image
   */
  async generateThumbnail(
    sourcePath: string,
    options: ThumbnailOptions = {},
  ): Promise<string> {
    await this.ensureInitialized();

    const {size = 'medium', quality = 80, format = 'jpeg'} = options;
    const dimensions = THUMBNAIL_SIZES[size];

    // Generate cache key
    const cacheKey = this.generateCacheKey(sourcePath, size);

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate thumbnail
    const thumbnailPath = await this.resizeImage(sourcePath, {
      width: dimensions.width,
      height: dimensions.height,
      quality,
      format,
      mode: 'cover',
    });

    // Store in cache
    const cachedPath = await this.cache.set(cacheKey, thumbnailPath, {move: true});

    return cachedPath;
  }

  /**
   * Generate thumbnails for all sizes
   */
  async generateAllSizes(sourcePath: string): Promise<Record<ThumbnailSize, string>> {
    await this.ensureInitialized();

    const results: Partial<Record<ThumbnailSize, string>> = {};
    const sizes: ThumbnailSize[] = ['small', 'medium', 'large'];

    for (const size of sizes) {
      results[size] = await this.generateThumbnail(sourcePath, {size});
    }

    return results as Record<ThumbnailSize, string>;
  }

  /**
   * Get thumbnail path if it exists
   */
  async getThumbnail(
    sourcePath: string,
    size: ThumbnailSize = 'medium',
  ): Promise<string | null> {
    await this.ensureInitialized();

    const cacheKey = this.generateCacheKey(sourcePath, size);
    return this.cache.get(cacheKey);
  }

  /**
   * Delete thumbnails for an image
   */
  async deleteThumbnails(sourcePath: string): Promise<void> {
    await this.ensureInitialized();

    const sizes: ThumbnailSize[] = ['small', 'medium', 'large'];

    for (const size of sizes) {
      const cacheKey = this.generateCacheKey(sourcePath, size);
      await this.cache.delete(cacheKey);
    }
  }

  /**
   * Resize an image
   *
   * Note: In production, use react-native-image-resizer:
   * import ImageResizer from 'react-native-image-resizer';
   * const result = await ImageResizer.createResizedImage(
   *   sourcePath, width, height, format, quality, 0, undefined, false, { mode }
   * );
   * return result.uri;
   *
   * For now, we copy the image and trust the cache system.
   */
  private async resizeImage(
    sourcePath: string,
    options: ResizeOptions,
  ): Promise<string> {
    const {format = 'jpeg'} = options;
    const extension = format === 'png' ? '.png' : '.jpg';
    const tempPath = `${this.thumbnailsDir}/temp_${Date.now()}${extension}`;

    // In a real implementation, we'd resize here using react-native-image-resizer
    // For now, just copy the original
    // TODO: Add actual image resizing with react-native-image-resizer

    // Copy source to temp (read and write)
    const sourceBuffer = await readFileAsBase64(sourcePath);
    const binaryString = atob(sourceBuffer);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    await writeFile(tempPath, bytes.buffer);

    return tempPath;
  }

  /**
   * Get dimensions of an image
   *
   * Note: In production, use react-native-image-size or similar
   */
  async getImageDimensions(imagePath: string): Promise<ImageDimensions | null> {
    try {
      // Check if file exists
      const exists = await fileExists(imagePath);
      if (!exists) {
        return null;
      }

      // TODO: Use react-native-image-size to get actual dimensions
      // For now, return default dimensions
      return {width: 300, height: 450};
    } catch (error) {
      console.warn('Failed to get image dimensions:', error);
      return null;
    }
  }

  /**
   * Calculate scaled dimensions while maintaining aspect ratio
   */
  calculateScaledDimensions(
    original: ImageDimensions,
    target: ImageDimensions,
    mode: 'contain' | 'cover' = 'contain',
  ): ImageDimensions {
    const aspectRatio = original.width / original.height;
    const targetAspectRatio = target.width / target.height;

    let newWidth: number;
    let newHeight: number;

    if (mode === 'contain') {
      // Scale to fit within target bounds
      if (aspectRatio > targetAspectRatio) {
        newWidth = target.width;
        newHeight = target.width / aspectRatio;
      } else {
        newHeight = target.height;
        newWidth = target.height * aspectRatio;
      }
    } else {
      // Scale to cover target bounds
      if (aspectRatio > targetAspectRatio) {
        newHeight = target.height;
        newWidth = target.height * aspectRatio;
      } else {
        newWidth = target.width;
        newHeight = target.width / aspectRatio;
      }
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private generateCacheKey(sourcePath: string, size: ThumbnailSize): string {
    // Create a simple hash from the path
    const hash = this.simpleHash(sourcePath);
    return `thumb_${size}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
