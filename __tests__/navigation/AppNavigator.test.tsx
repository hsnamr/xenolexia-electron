/**
 * Navigation Smoke Tests
 * Verifies that navigation structure renders without crashing
 */

import React from 'react';
import {render, screen} from '../test-utils';
import {AppNavigator} from '@navigation/AppNavigator';
import {useUserStore} from '@stores/userStore';

// Mock the screens to avoid rendering full component trees
jest.mock('@screens/Library/LibraryScreen', () => ({
  LibraryScreen: () => null,
}));
jest.mock('@screens/Vocabulary/VocabularyScreen', () => ({
  VocabularyScreen: () => null,
}));
jest.mock('@screens/Statistics/StatisticsScreen', () => ({
  StatisticsScreen: () => null,
}));
jest.mock('@screens/Profile/ProfileScreen', () => ({
  ProfileScreen: () => null,
}));
jest.mock('@screens/Reader/ReaderScreen', () => ({
  ReaderScreen: () => null,
}));
jest.mock('@screens/Settings/SettingsScreen', () => ({
  SettingsScreen: () => null,
}));
jest.mock('@screens/Onboarding/OnboardingScreen', () => ({
  OnboardingScreen: () => null,
}));
jest.mock('@screens/BookDiscovery/BookDiscoveryScreen', () => ({
  BookDiscoveryScreen: () => null,
}));

describe('AppNavigator', () => {
  beforeEach(() => {
    // Reset user store with onboarding completed
    useUserStore.setState({
      preferences: {
        defaultSourceLanguage: 'en',
        defaultTargetLanguage: 'el',
        defaultProficiencyLevel: 'beginner',
        defaultWordDensity: 0.3,
        readerSettings: {
          theme: 'light',
          fontFamily: 'Georgia',
          fontSize: 18,
          lineHeight: 1.6,
          marginHorizontal: 24,
          marginVertical: 24,
          textAlign: 'left',
          brightness: 1.0,
        },
        hasCompletedOnboarding: true,
        notificationsEnabled: true,
        dailyGoal: 15,
      },
      isLoading: false,
    });
  });

  describe('Initial Render', () => {
    it('renders without crashing when onboarding is completed', () => {
      expect(() => {
        render(<AppNavigator />);
      }).not.toThrow();
    });

    it('renders without crashing when onboarding is not completed', () => {
      useUserStore.setState(state => ({
        preferences: {
          ...state.preferences,
          hasCompletedOnboarding: false,
        },
      }));

      expect(() => {
        render(<AppNavigator />);
      }).not.toThrow();
    });
  });

  describe('Tab Navigation', () => {
    it('has all main tabs available', async () => {
      render(<AppNavigator />);

      // The tab bar should have 4 tabs: Library, Words, Stats, Profile
      // We check by looking for the tab labels
      expect(await screen.findByText('Library')).toBeTruthy();
      expect(await screen.findByText('Words')).toBeTruthy();
      expect(await screen.findByText('Stats')).toBeTruthy();
      expect(await screen.findByText('Profile')).toBeTruthy();
    });
  });
});
