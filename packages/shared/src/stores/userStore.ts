/**
 * User Store - Manages user preferences and settings
 */

import {create} from 'zustand';
import type {UserPreferences, ReaderSettings} from '../types/index';

const defaultReaderSettings: ReaderSettings = {
  theme: 'light',
  fontFamily: 'Georgia',
  fontSize: 18,
  lineHeight: 1.6,
  marginHorizontal: 24,
  marginVertical: 24,
  textAlign: 'left',
  brightness: 1.0,
};

const defaultPreferences: UserPreferences = {
  defaultSourceLanguage: 'en',
  defaultTargetLanguage: 'el',
  defaultProficiencyLevel: 'beginner',
  defaultWordDensity: 0.3,
  readerSettings: defaultReaderSettings,
  hasCompletedOnboarding: false,
  notificationsEnabled: true,
  dailyGoal: 15,
};

interface UserState {
  preferences: UserPreferences;
  isLoading: boolean;

  // Actions
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateReaderSettings: (settings: Partial<ReaderSettings>) => void;
  resetPreferences: () => void;
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  preferences: defaultPreferences,
  isLoading: false,

  updatePreferences: (updates: Partial<UserPreferences>) => {
    set(state => ({
      preferences: {...state.preferences, ...updates},
    }));
    // Auto-save when preferences change
    get().savePreferences();
  },

  updateReaderSettings: (settings: Partial<ReaderSettings>) => {
    set(state => ({
      preferences: {
        ...state.preferences,
        readerSettings: {...state.preferences.readerSettings, ...settings},
      },
    }));
    get().savePreferences();
  },

  resetPreferences: () => {
    set({preferences: defaultPreferences});
    get().savePreferences();
  },

  loadPreferences: async () => {
    set({isLoading: true});
    try {
      // TODO: Load from AsyncStorage
      // const stored = await AsyncStorage.getItem('userPreferences');
      // if (stored) {
      //   set({ preferences: JSON.parse(stored) });
      // }
      set({isLoading: false});
    } catch (error) {
      console.error('Failed to load preferences:', error);
      set({isLoading: false});
    }
  },

  savePreferences: async () => {
    try {
      // TODO: Save to AsyncStorage
      // await AsyncStorage.setItem('userPreferences', JSON.stringify(get().preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  },
}));
