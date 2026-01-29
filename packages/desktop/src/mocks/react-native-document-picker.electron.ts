/**
 * Stub for react-native-document-picker (Electron uses showOpenDialog instead).
 * Kept so shared ImportService can be bundled without resolving the RN package.
 */

export const types = {
  allFiles: '*/*',
  plainText: 'text/plain',
  epub: 'application/epub+zip',
};

export const pick = async (): Promise<never[]> => {
  return [];
};
