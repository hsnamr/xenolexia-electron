// Electron / Node environment (no React Native)
// Platform detection for tests
if (typeof process === 'undefined') global.process = {platform: 'linux'};

// Mock window.electronAPI when in Node (for code paths that check for Electron)
if (typeof window === 'undefined') {
  global.window = {};
  global.window.electronAPI = undefined;
}

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock JSZip
jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    loadAsync: jest.fn(),
    file: jest.fn(),
  }));
});

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
