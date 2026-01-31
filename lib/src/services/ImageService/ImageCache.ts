/**
 * Image Cache
 *
 * Two-layer caching system:
 * 1. Memory cache (LRU) for fast access
 * 2. Disk cache for persistence
 */

import type {CacheEntry, CacheOptions, CacheStats} from './types';
import { getAppDataPath, mkdir, fileExists, writeFile, readFileAsText, unlink, readFileAsBase64 } from '../../utils/FileSystem.electron';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB
const DEFAULT_MAX_ENTRIES = 1000;
const DEFAULT_TTL = 0; // Never expire
const CACHE_DIR_NAME = 'image_cache';
const MANIFEST_FILE = 'manifest.json';

// ============================================================================
// LRU Memory Cache
// ============================================================================

class LRUCache<T> {
  private cache: Map<string, T> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    // Remove if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// Image Cache Class
// ============================================================================

export class ImageCache {
  private static instance: ImageCache;
  private options: Required<CacheOptions>;
  private cacheDir: string;
  private manifest: Map<string, CacheEntry> = new Map();
  private memoryCache: LRUCache<string> = new LRUCache(50);
  private initialized: boolean = false;
  private stats: CacheStats = {
    count: 0,
    totalSize: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
  };

  private constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize ?? DEFAULT_MAX_SIZE,
      maxEntries: options.maxEntries ?? DEFAULT_MAX_ENTRIES,
      defaultTTL: options.defaultTTL ?? DEFAULT_TTL,
      directory: options.directory ?? CACHE_DIR_NAME,
    };
    // Will be set during initialization
    this.cacheDir = '';
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: CacheOptions): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache(options);
    }
    return ImageCache.instance;
  }

  /**
   * Initialize cache (create directory, load manifest)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Set cache directory path
      const appDataPath = await getAppDataPath();
      this.cacheDir = `${appDataPath}/${this.options.directory}`;
      
      // Create cache directory if it doesn't exist
      const exists = await fileExists(this.cacheDir);
      if (!exists) {
        await mkdir(this.cacheDir, { recursive: true });
      }

      // Load manifest
      await this.loadManifest();

      // Clean expired entries
      await this.cleanExpired();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ImageCache:', error);
      throw error;
    }
  }

  /**
   * Get cached image path
   */
  async get(key: string): Promise<string | null> {
    await this.ensureInitialized();

    // Check memory cache first
    const memoryHit = this.memoryCache.get(key);
    if (memoryHit) {
      this.stats.hits++;
      this.updateHitRate();
      return memoryHit;
    }

    // Check disk cache
    const entry = this.manifest.get(key);
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      await this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if file exists
    const exists = await fileExists(entry.path);
    if (!exists) {
      await this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access time
    entry.lastAccessedAt = Date.now();

    // Add to memory cache
    this.memoryCache.set(key, entry.path);

    this.stats.hits++;
    this.updateHitRate();
    return entry.path;
  }

  /**
   * Store image in cache
   */
  async set(
    key: string,
    sourcePath: string,
    options: {ttl?: number; move?: boolean} = {},
  ): Promise<string> {
    await this.ensureInitialized();

    const {ttl = this.options.defaultTTL, move = false} = options;

    // Generate cache file path
    const extension = this.getExtension(sourcePath);
    const cachePath = `${this.cacheDir}/${key}${extension}`;

    // Copy file to cache (Electron doesn't have moveFile, so we copy then delete source if move=true)
    const sourceBuffer = await readFileAsBase64(sourcePath);
    const binaryString = atob(sourceBuffer);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    await writeFile(cachePath, bytes.buffer);
    
    // If move was requested, delete source
    if (move) {
      try {
        await unlink(sourcePath);
      } catch (error) {
        console.warn('Failed to delete source file after move:', error);
      }
    }

    // Get file size (from buffer length)
    const size = bytes.length;

    // Create entry
    const entry: CacheEntry = {
      path: cachePath,
      source: sourcePath,
      key,
      size,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      expiresAt: ttl > 0 ? Date.now() + ttl : 0,
    };

    // Check if we need to evict
    await this.ensureSpace(size);

    // Add to manifest
    this.manifest.set(key, entry);
    this.stats.count = this.manifest.size;
    this.stats.totalSize += size;

    // Add to memory cache
    this.memoryCache.set(key, cachePath);

    // Save manifest
    await this.saveManifest();

    return cachePath;
  }

  /**
   * Store base64 image in cache
   */
  async setBase64(
    key: string,
    base64Data: string,
    mimeType: string = 'image/jpeg',
    options: {ttl?: number} = {},
  ): Promise<string> {
    await this.ensureInitialized();

    const {ttl = this.options.defaultTTL} = options;

    // Determine extension from mime type
    const extension = this.mimeToExtension(mimeType);
    const cachePath = `${this.cacheDir}/${key}${extension}`;

    // Write base64 to file
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    await writeFile(cachePath, bytes.buffer, 'base64');

    // Get file size (from buffer length)
    const size = bytes.length;

    // Create entry
    const entry: CacheEntry = {
      path: cachePath,
      source: 'base64',
      key,
      size,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      expiresAt: ttl > 0 ? Date.now() + ttl : 0,
    };

    // Check if we need to evict
    await this.ensureSpace(size);

    // Add to manifest
    this.manifest.set(key, entry);
    this.stats.count = this.manifest.size;
    this.stats.totalSize += size;

    // Add to memory cache
    this.memoryCache.set(key, cachePath);

    // Save manifest
    await this.saveManifest();

    return cachePath;
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    await this.ensureInitialized();

    if (this.memoryCache.has(key)) {
      return true;
    }

    const entry = this.manifest.get(key);
    if (!entry) return false;

    // Check expiration
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cached item
   */
  async delete(key: string): Promise<boolean> {
    await this.ensureInitialized();

    const entry = this.manifest.get(key);
    if (!entry) return false;

    // Remove file
    try {
      const exists = await fileExists(entry.path);
      if (exists) {
        await unlink(entry.path);
      }
    } catch (error) {
      console.warn(`Failed to delete cache file: ${entry.path}`, error);
    }

    // Update stats
    this.stats.totalSize -= entry.size;

    // Remove from manifest and memory
    this.manifest.delete(key);
    this.memoryCache.delete(key);
    this.stats.count = this.manifest.size;

    // Save manifest
    await this.saveManifest();

    return true;
  }

  /**
   * Clear all cached items
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    try {
      // Delete cache directory
      const exists = await RNFS.exists(this.cacheDir);
      if (exists) {
        await RNFS.unlink(this.cacheDir);
      }

      // Recreate directory
      await RNFS.mkdir(this.cacheDir);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }

    // Reset state
    this.manifest.clear();
    this.memoryCache.clear();
    this.stats = {
      count: 0,
      totalSize: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {...this.stats};
  }

  /**
   * Prune cache to target size
   */
  async prune(targetSize?: number): Promise<number> {
    await this.ensureInitialized();

    const target = targetSize ?? this.options.maxSize * 0.8; // Default to 80%
    let freedSpace = 0;

    if (this.stats.totalSize <= target) {
      return 0;
    }

    // Sort by last access time (oldest first)
    const entries = Array.from(this.manifest.entries()).sort(
      ([, a], [, b]) => a.lastAccessedAt - b.lastAccessedAt,
    );

    // Delete oldest until under target
    for (const [key, entry] of entries) {
      if (this.stats.totalSize <= target) {
        break;
      }

      await this.delete(key);
      freedSpace += entry.size;
    }

    return freedSpace;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async loadManifest(): Promise<void> {
    const manifestPath = `${this.cacheDir}/${MANIFEST_FILE}`;

    try {
      const exists = await fileExists(manifestPath);
      if (!exists) {
        return;
      }

      const content = await readFileAsText(manifestPath);
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        for (const entry of data) {
          this.manifest.set(entry.key, entry);
          this.stats.totalSize += entry.size;
        }
        this.stats.count = this.manifest.size;
      }
    } catch (error) {
      console.warn('Failed to load cache manifest:', error);
      // Start fresh
      this.manifest.clear();
    }
  }

  private async saveManifest(): Promise<void> {
    const manifestPath = `${this.cacheDir}/${MANIFEST_FILE}`;

    try {
      const data = Array.from(this.manifest.values());
      await writeFile(manifestPath, JSON.stringify(data), 'utf8');
    } catch (error) {
      console.warn('Failed to save cache manifest:', error);
    }
  }

  private async cleanExpired(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.manifest) {
      if (entry.expiresAt > 0 && now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key);
    }
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    // Check entry count
    while (this.manifest.size >= this.options.maxEntries) {
      await this.evictOldest();
    }

    // Check total size
    while (this.stats.totalSize + requiredSize > this.options.maxSize) {
      const evicted = await this.evictOldest();
      if (!evicted) break; // No more entries to evict
    }
  }

  private async evictOldest(): Promise<boolean> {
    if (this.manifest.size === 0) return false;

    // Find oldest entry
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.manifest) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      await this.delete(oldestKey);
      return true;
    }

    return false;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private getExtension(path: string): string {
    const match = path.match(/\.[^.]+$/);
    return match ? match[0].toLowerCase() : '.jpg';
  }

  private mimeToExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };
    return map[mimeType.toLowerCase()] || '.jpg';
  }
}
