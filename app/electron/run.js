/**
 * Electron main process entry point.
 * Registers tsx so main.js can require() TypeScript modules (e.g. shared DatabaseService).
 */
require('tsx/cjs');
require('./main.js');
