/**
 * Database Service - SQLite database connection and management
 *
 * Uses better-sqlite3 for Electron (synchronous API).
 * Provides connection management, migrations, and query helpers.
 *
 * This file exports the Electron version. For React Native, use a different implementation.
 */

// Export Electron version (single source; no duplicate implementation)
export * from './DatabaseService.electron';
export { databaseService } from './DatabaseService.electron';
