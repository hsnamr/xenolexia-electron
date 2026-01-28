// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'test',
    select: jest.fn((obj) => obj.test || obj.default),
  },
}));

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/test/documents',
  readFile: jest.fn(),
  writeFile: jest.fn(),
  exists: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
  readDir: jest.fn(),
  stat: jest.fn(),
  copyFile: jest.fn(),
  moveFile: jest.fn(),
}));

// Mock react-native-document-picker
jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(),
  types: {
    epub: 'epub',
    plainText: 'plainText',
    allFiles: 'allFiles',
  },
}));

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
