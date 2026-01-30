/**
 * Database Service - Local database connection and management
 *
 * Uses LowDB (JSON file) for Electron (no native modules).
 * Provides the same API for repositories; renderer uses IPC stub.
 */

// Export Electron version (single source; no duplicate implementation)
export * from './DatabaseService.electron';
export { databaseService } from './DatabaseService.electron';
