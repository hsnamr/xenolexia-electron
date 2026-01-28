/**
 * AsyncStorage - Electron version using electron-store
 * Replaces @react-native-async-storage/async-storage
 */

// Dynamic import to avoid requiring electron-store at module load time
let storeInstance: any = null;

async function getStore() {
  if (!storeInstance) {
    try {
      // Try to use electron-store if available
      const Store = require('electron-store');
      storeInstance = new Store();
    } catch (error) {
      // Fallback to in-memory storage if electron-store is not available
      console.warn('electron-store not available, using in-memory storage');
      const memoryStore: Record<string, string> = {};
      storeInstance = {
        get: (key: string, defaultValue: any) => memoryStore[key] ?? defaultValue,
        set: (key: string, value: any) => { memoryStore[key] = value; },
        delete: (key: string) => { delete memoryStore[key]; },
        clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
      };
    }
  }
  return storeInstance;
}

export const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const store = await getStore();
    const value = store.get(key, null);
    return value !== null ? String(value) : null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const store = await getStore();
    store.set(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    const store = await getStore();
    store.delete(key);
  },

  clear: async (): Promise<void> => {
    const store = await getStore();
    store.clear();
  },

  getAllKeys: async (): Promise<string[]> => {
    const store = await getStore();
    // electron-store doesn't have getAllKeys, so we'll return empty array
    // In a real implementation, you might want to track keys separately
    return [];
  },

  multiGet: async (keys: string[]): Promise<Array<[string, string | null]>> => {
    const store = await getStore();
    return keys.map(key => [key, store.get(key, null)]);
  },

  multiSet: async (keyValuePairs: Array<[string, string]>): Promise<void> => {
    const store = await getStore();
    keyValuePairs.forEach(([key, value]) => {
      store.set(key, value);
    });
  },

  multiRemove: async (keys: string[]): Promise<void> => {
    const store = await getStore();
    keys.forEach(key => store.delete(key));
  },
};
