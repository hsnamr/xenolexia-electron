/**
 * Performance Utilities
 *
 * Tools for measuring and optimizing app performance
 */

// ============================================================================
// Performance Monitoring
// ============================================================================

interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private enabled: boolean = __DEV__;

  /**
   * Start measuring a named operation
   */
  start(name: string): void {
    if (!this.enabled) return;

    this.marks.set(name, {
      name,
      startTime: Date.now(),
    });
  }

  /**
   * End measuring and log duration
   */
  end(name: string): number | null {
    if (!this.enabled) return null;

    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`Performance mark "${name}" not found`);
      return null;
    }

    mark.endTime = Date.now();
    mark.duration = mark.endTime - mark.startTime;

    console.log(`⏱️ ${name}: ${mark.duration}ms`);

    return mark.duration;
  }

  /**
   * Measure an async operation
   */
  async measure<T>(name: string, operation: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await operation();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get all recorded marks
   */
  getMarks(): PerformanceMark[] {
    return Array.from(this.marks.values());
  }

  /**
   * Clear all marks
   */
  clear(): void {
    this.marks.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// Render Counter (for development)
// ============================================================================

const renderCounts: Map<string, number> = new Map();

/**
 * Count renders of a component (for debugging)
 *
 * Usage:
 * function MyComponent() {
 *   countRender('MyComponent');
 *   ...
 * }
 */
export function countRender(componentName: string): number {
  if (!__DEV__) return 0;

  const count = (renderCounts.get(componentName) || 0) + 1;
  renderCounts.set(componentName, count);

  if (count % 10 === 0) {
    console.log(`🔄 ${componentName} rendered ${count} times`);
  }

  return count;
}

/**
 * Get render counts for all tracked components
 */
export function getRenderCounts(): Record<string, number> {
  return Object.fromEntries(renderCounts);
}

/**
 * Reset render counts
 */
export function resetRenderCounts(): void {
  renderCounts.clear();
}

// ============================================================================
// Debounce / Throttle
// ============================================================================

/**
 * Debounce a function
 * Delays execution until after wait milliseconds have passed since last call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Throttle a function
 * Limits execution to at most once per wait milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastTime >= wait) {
      func(...args);
      lastTime = now;
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        func(...args);
        lastTime = Date.now();
        timeoutId = null;
      }, wait - (now - lastTime));
    }
  };
}

// ============================================================================
// Memory Usage (approximate)
// ============================================================================

/**
 * Log approximate memory usage
 * Note: This is a rough estimate and not accurate on all platforms
 */
export function logMemoryUsage(label: string = 'Memory'): void {
  if (!__DEV__) return;

  // React Native doesn't have performance.memory, so we use a placeholder
  console.log(`📊 ${label}: Memory tracking not available in React Native`);
}

// ============================================================================
// List Optimization Helpers
// ============================================================================

/**
 * Create a stable key extractor for FlatList
 */
export function createKeyExtractor<T extends { id: string }>(
  prefix: string = 'item'
): (item: T, index: number) => string {
  return (item: T, index: number) => {
    return item.id ? `${prefix}-${item.id}` : `${prefix}-${index}`;
  };
}

/**
 * Calculate optimal initialNumToRender based on screen height
 */
export function calculateInitialNumToRender(
  itemHeight: number,
  screenHeight: number,
  buffer: number = 5
): number {
  return Math.ceil(screenHeight / itemHeight) + buffer;
}

/**
 * Calculate optimal windowSize for FlatList
 * windowSize determines how many screens worth of content to render
 */
export function calculateWindowSize(
  screenHeight: number,
  itemHeight: number
): number {
  const itemsPerScreen = screenHeight / itemHeight;
  // Render 5 screens worth (2 before, current, 2 after)
  return Math.ceil(itemsPerScreen * 5);
}

// ============================================================================
// Image Optimization
// ============================================================================

/**
 * Calculate optimal image dimensions for given container
 */
export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  containerWidth: number,
  containerHeight?: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = containerWidth;
  let height = containerWidth / aspectRatio;

  if (containerHeight && height > containerHeight) {
    height = containerHeight;
    width = containerHeight * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  PerformanceMark,
};
