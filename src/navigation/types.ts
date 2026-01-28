/**
 * Navigation Types - Comprehensive type definitions for app navigation
 */

import type {
  CompositeNavigationProp,
  CompositeScreenProps,
  RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp, BottomTabScreenProps} from '@react-navigation/bottom-tabs';

// Import base types from central types
import type {RootStackParamList, MainTabsParamList} from '@/types';

// Re-export for convenience
export type {RootStackParamList, MainTabsParamList};

// ============================================================================
// Navigation Props - For useNavigation hook
// ============================================================================

/**
 * Root Stack navigation prop
 */
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Main Tabs navigation prop (combined with stack for nested navigation)
 */
export type MainTabsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Individual screen navigation props
export type LibraryScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Library'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type VocabularyScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Vocabulary'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type StatisticsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Statistics'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ReaderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reader'>;
export type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;
export type BookDiscoveryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BookDiscovery'>;

// ============================================================================
// Route Props - For useRoute hook
// ============================================================================

export type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;
export type BookDetailRouteProp = RouteProp<RootStackParamList, 'BookDetail'>;
export type BookDiscoveryRouteProp = RouteProp<RootStackParamList, 'BookDiscovery'>;
export type VocabularyDetailRouteProp = RouteProp<RootStackParamList, 'VocabularyDetail'>;
export type VocabularyScreenRouteProp = RouteProp<MainTabsParamList, 'Vocabulary'>;

// ============================================================================
// Screen Props - Complete props (navigation + route combined)
// ============================================================================

// Root Stack screens
export type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
export type ReaderScreenProps = NativeStackScreenProps<RootStackParamList, 'Reader'>;
export type BookDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'BookDetail'>;
export type BookDiscoveryScreenProps = NativeStackScreenProps<RootStackParamList, 'BookDiscovery'>;
export type VocabularyDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'VocabularyDetail'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

// Tab screens (with composite props for accessing stack navigator)
export type LibraryScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Library'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type VocabularyScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Vocabulary'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type StatisticsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Statistics'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

// ============================================================================
// Type Augmentation for useNavigation/useRoute without explicit typing
// ============================================================================

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
