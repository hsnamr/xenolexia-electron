/**
 * Platform Detection - Electron version
 * Replaces react-native Platform
 */

export const Platform = {
  OS: process.platform === 'darwin' ? 'macos' : 
      process.platform === 'win32' ? 'windows' : 'linux',
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
  Version: process.platform,
  select: <T>(obj: { [key: string]: T }): T | undefined => {
    const os = process.platform === 'darwin' ? 'macos' : 
               process.platform === 'win32' ? 'windows' : 'linux';
    return obj[os] || obj.default;
  },
};
