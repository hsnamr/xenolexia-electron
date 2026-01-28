/**
 * Navigation Hooks - Type-safe navigation utilities
 */

import {useCallback} from 'react';
import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';

import type {
  RootStackNavigationProp,
  MainTabsNavigationProp,
  ReaderScreenRouteProp,
  BookDetailRouteProp,
  VocabularyDetailRouteProp,
  BookDiscoveryRouteProp,
  RootStackParamList,
} from './types';

// ============================================================================
// Navigation Hooks
// ============================================================================

/**
 * Type-safe hook for root stack navigation
 */
export function useRootNavigation() {
  return useNavigation<RootStackNavigationProp>();
}

/**
 * Type-safe hook for tab navigation (with access to root stack)
 */
export function useTabNavigation() {
  return useNavigation<MainTabsNavigationProp>();
}

// ============================================================================
// Route Hooks
// ============================================================================

/**
 * Get Reader screen route params
 */
export function useReaderRoute() {
  return useRoute<ReaderScreenRouteProp>();
}

/**
 * Get Book Detail screen route params
 */
export function useBookDetailRoute() {
  return useRoute<BookDetailRouteProp>();
}

/**
 * Get Vocabulary Detail screen route params
 */
export function useVocabularyDetailRoute() {
  return useRoute<VocabularyDetailRouteProp>();
}

/**
 * Get Book Discovery screen route params
 */
export function useBookDiscoveryRoute() {
  return useRoute<BookDiscoveryRouteProp>();
}

// ============================================================================
// Navigation Action Hooks
// ============================================================================

/**
 * Hook for common navigation actions
 */
export function useNavigationActions() {
  const navigation = useRootNavigation();

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const goToLibrary = useCallback(() => {
    navigation.navigate('MainTabs', {screen: 'Library'});
  }, [navigation]);

  const goToVocabulary = useCallback(
    (filter?: 'all' | 'learning' | 'mastered' | 'new') => {
      navigation.navigate('MainTabs', {screen: 'Vocabulary', params: {filter}});
    },
    [navigation]
  );

  const goToStats = useCallback(() => {
    navigation.navigate('MainTabs', {screen: 'Statistics'});
  }, [navigation]);

  const goToProfile = useCallback(() => {
    navigation.navigate('MainTabs', {screen: 'Profile'});
  }, [navigation]);

  const goToSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const openReader = useCallback(
    (bookId: string, initialLocation?: string) => {
      navigation.navigate('Reader', {bookId, initialLocation});
    },
    [navigation]
  );

  const openBookDetail = useCallback(
    (bookId: string) => {
      navigation.navigate('BookDetail', {bookId});
    },
    [navigation]
  );

  const openBookDiscovery = useCallback(
    (searchQuery?: string) => {
      navigation.navigate('BookDiscovery', {searchQuery});
    },
    [navigation]
  );

  const openWordDetail = useCallback(
    (wordId: string) => {
      navigation.navigate('VocabularyDetail', {wordId});
    },
    [navigation]
  );

  const startQuiz = useCallback(
    (wordIds?: string[]) => {
      navigation.navigate('VocabularyQuiz', {wordIds});
    },
    [navigation]
  );

  const resetToOnboarding = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Onboarding'}],
      })
    );
  }, [navigation]);

  const resetToMainTabs = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'MainTabs'}],
      })
    );
  }, [navigation]);

  return {
    goBack,
    goToLibrary,
    goToVocabulary,
    goToStats,
    goToProfile,
    goToSettings,
    openReader,
    openBookDetail,
    openBookDiscovery,
    openWordDetail,
    startQuiz,
    resetToOnboarding,
    resetToMainTabs,
  };
}

// ============================================================================
// Screen State Hook
// ============================================================================

/**
 * Get the current screen name
 */
export function useCurrentScreen(): keyof RootStackParamList | undefined {
  const route = useRoute();
  return route.name as keyof RootStackParamList;
}
