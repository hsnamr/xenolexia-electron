/**
 * Image Service
 *
 * Main service for image operations including:
 * - Loading and caching images
 * - Generating thumbnails
 * - Managing cover images
 * - Placeholder generation
 */

import RNFS from 'react-native-fs';

import type {
  ImageSource,
  ImageLoadResult,
  ThumbnailSize,
  PlaceholderOptions,
  CacheStats,
} from './types';
import {ImageCache} from './ImageCache';
import {ThumbnailGenerator} from './ThumbnailGenerator';

// ============================================================================
// Constants
// ============================================================================

const COVERS_DIR = 'covers';

// Placeholder SVG templates
const PLACEHOLDER_TEMPLATES = {
  book: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180">
    <rect width="120" height="180" fill="#BG_COLOR#"/>
    <path d="M30 45 L30 135 L90 135 L90 45 L75 45 L75 90 L67.5 82.5 L60 90 L60 45 Z" 
          fill="#FG_COLOR#" opacity="0.6"/>
  </svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#BG_COLOR#"/>
    <circle cx="50" cy="35" r="20" fill="#FG_COLOR#" opacity="0.6"/>
    <path d="M20 90 Q20 60 50 60 Q80 60 80 90" fill="#FG_COLOR#" opacity="0.6"/>
  </svg>`,
  generic: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#BG_COLOR#"/>
    <rect x="25" y="25" width="50" height="50" rx="5" fill="#FG_COLOR#" opacity="0.6"/>
  </svg>`,
};

// ============================================================================
// Image Service Class
// ============================================================================

export class ImageService {
  private static instance: ImageService;
  private cache: ImageCache;
  private thumbnailGenerator: ThumbnailGenerator;
  private coversDir: string;
  private initialized: boolean = false;

  private constructor() {
    this.cache = ImageCache.getInstance();
    this.thumbnailGenerator = ThumbnailGenerator.getInstance();
    this.coversDir = `${RNFS.DocumentDirectoryPath}/${COVERS_DIR}`;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * Initialize image service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.cache.initialize();
      await this.thumbnailGenerator.initialize();

      const exists = await RNFS.exists(this.coversDir);
      if (!exists) {
        await RNFS.mkdir(this.coversDir);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ImageService:', error);
      throw error;
    }
  }

  // ============================================================================
  // Image Loading
  // ============================================================================

  /**
   * Load an image from various sources
   */
  async loadImage(source: ImageSource): Promise<ImageLoadResult> {
    await this.ensureInitialized();

    try {
      let uri: string | undefined;

      if (source.uri) {
        // Local file
        const exists = await RNFS.exists(source.uri);
        if (exists) {
          uri = source.uri;
        }
      } else if (source.base64 && source.mimeType) {
        // Base64 data - cache it
        const cacheKey = `base64_${Date.now()}`;
        uri = await this.cache.setBase64(cacheKey, source.base64, source.mimeType);
      } else if (source.url) {
        // Remote URL - download and cache
        uri = await this.downloadAndCache(source.url);
      }

      if (!uri) {
        return {status: 'error', error: 'Invalid image source'};
      }

      return {status: 'loaded', uri};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Load failed';
      return {status: 'error', error: errorMessage};
    }
  }

  /**
   * Download and cache an image from URL
   */
  async downloadAndCache(url: string): Promise<string | null> {
    await this.ensureInitialized();

    // Check cache first
    const cacheKey = this.urlToCacheKey(url);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Download file
      const extension = this.getExtensionFromUrl(url) || '.jpg';
      const tempPath = `${RNFS.CachesDirectoryPath}/download_${Date.now()}${extension}`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: tempPath,
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error(`Download failed with status ${downloadResult.statusCode}`);
      }

      // Cache the downloaded file
      const cachedPath = await this.cache.set(cacheKey, tempPath, {move: true});
      return cachedPath;
    } catch (error) {
      console.error('Failed to download image:', error);
      return null;
    }
  }

  // ============================================================================
  // Cover Image Management
  // ============================================================================

  /**
   * Get cover image path for a book
   */
  async getCoverPath(bookId: string): Promise<string | null> {
    await this.ensureInitialized();

    const coverPath = `${this.coversDir}/${bookId}/cover.jpg`;
    const exists = await RNFS.exists(coverPath);
    return exists ? coverPath : null;
  }

  /**
   * Get cover thumbnail for a book
   */
  async getCoverThumbnail(
    bookId: string,
    size: ThumbnailSize = 'medium',
  ): Promise<string | null> {
    await this.ensureInitialized();

    const coverPath = await this.getCoverPath(bookId);
    if (!coverPath) {
      return null;
    }

    return this.thumbnailGenerator.getThumbnail(coverPath, size);
  }

  /**
   * Generate cover thumbnail for a book
   */
  async generateCoverThumbnail(
    bookId: string,
    size: ThumbnailSize = 'medium',
  ): Promise<string | null> {
    await this.ensureInitialized();

    const coverPath = await this.getCoverPath(bookId);
    if (!coverPath) {
      return null;
    }

    return this.thumbnailGenerator.generateThumbnail(coverPath, {size});
  }

  /**
   * Generate all cover thumbnails for a book
   */
  async generateAllCoverThumbnails(
    bookId: string,
  ): Promise<Record<ThumbnailSize, string> | null> {
    await this.ensureInitialized();

    const coverPath = await this.getCoverPath(bookId);
    if (!coverPath) {
      return null;
    }

    return this.thumbnailGenerator.generateAllSizes(coverPath);
  }

  /**
   * Store cover image for a book
   */
  async storeCover(bookId: string, sourcePath: string): Promise<string> {
    await this.ensureInitialized();

    const bookCoverDir = `${this.coversDir}/${bookId}`;
    const coverPath = `${bookCoverDir}/cover.jpg`;

    // Create directory
    const exists = await RNFS.exists(bookCoverDir);
    if (!exists) {
      await RNFS.mkdir(bookCoverDir);
    }

    // Copy cover
    await RNFS.copyFile(sourcePath, coverPath);

    // Pre-generate thumbnails
    try {
      await this.thumbnailGenerator.generateAllSizes(coverPath);
    } catch (error) {
      console.warn('Failed to generate cover thumbnails:', error);
    }

    return coverPath;
  }

  /**
   * Store cover from base64 data
   */
  async storeCoverBase64(
    bookId: string,
    base64Data: string,
    mimeType: string = 'image/jpeg',
  ): Promise<string> {
    await this.ensureInitialized();

    const bookCoverDir = `${this.coversDir}/${bookId}`;
    const extension = this.mimeToExtension(mimeType);
    const coverPath = `${bookCoverDir}/cover${extension}`;

    // Create directory
    const exists = await RNFS.exists(bookCoverDir);
    if (!exists) {
      await RNFS.mkdir(bookCoverDir);
    }

    // Write cover
    await RNFS.writeFile(coverPath, base64Data, 'base64');

    // Pre-generate thumbnails
    try {
      await this.thumbnailGenerator.generateAllSizes(coverPath);
    } catch (error) {
      console.warn('Failed to generate cover thumbnails:', error);
    }

    return coverPath;
  }

  /**
   * Delete cover and thumbnails for a book
   */
  async deleteCover(bookId: string): Promise<void> {
    await this.ensureInitialized();

    const bookCoverDir = `${this.coversDir}/${bookId}`;
    const coverPath = `${bookCoverDir}/cover.jpg`;

    // Delete thumbnails
    try {
      await this.thumbnailGenerator.deleteThumbnails(coverPath);
    } catch (error) {
      console.warn('Failed to delete thumbnails:', error);
    }

    // Delete cover directory
    const exists = await RNFS.exists(bookCoverDir);
    if (exists) {
      await RNFS.unlink(bookCoverDir);
    }
  }

  // ============================================================================
  // Placeholder Generation
  // ============================================================================

  /**
   * Generate a placeholder SVG for missing images
   */
  generatePlaceholderSVG(options: PlaceholderOptions = {}): string {
    const {
      type = 'book',
      backgroundColor = '#E2E8F0',
      foregroundColor = '#64748B',
    } = options;

    const template = PLACEHOLDER_TEMPLATES[type] || PLACEHOLDER_TEMPLATES.generic;

    return template
      .replace(/#BG_COLOR#/g, backgroundColor)
      .replace(/#FG_COLOR#/g, foregroundColor);
  }

  /**
   * Generate placeholder as base64 data URI
   */
  generatePlaceholderDataUri(options: PlaceholderOptions = {}): string {
    const svg = this.generatePlaceholderSVG(options);
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Get initials placeholder for a book (uses title initials)
   */
  generateInitialsPlaceholder(
    text: string,
    options: Omit<PlaceholderOptions, 'type' | 'text'> = {},
  ): string {
    const {backgroundColor = '#0EA5E9', foregroundColor = '#FFFFFF'} = options;

    // Get first two initials
    const words = text.trim().split(/\s+/);
    const initials =
      words.length >= 2
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : text.substring(0, 2).toUpperCase();

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180">
      <rect width="120" height="180" fill="${backgroundColor}"/>
      <text x="60" y="100" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" 
            font-size="48" font-weight="bold" fill="${foregroundColor}">${initials}</text>
    </svg>`;

    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Prune cache to free space
   */
  async pruneCache(targetSize?: number): Promise<number> {
    return this.cache.prune(targetSize);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private urlToCacheKey(url: string): string {
    // Create a simple hash from the URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `url_${Math.abs(hash).toString(36)}`;
  }

  private getExtensionFromUrl(url: string): string | null {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.[^.]+$/);
      return match ? match[0].toLowerCase() : null;
    } catch {
      return null;
    }
  }

  private mimeToExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    return map[mimeType.toLowerCase()] || '.jpg';
  }
}
