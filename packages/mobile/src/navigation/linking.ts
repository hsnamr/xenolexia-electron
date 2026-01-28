/**
 * Deep Linking Configuration for Xenolexia
 *
 * Enables:
 * - Universal links (iOS) and App Links (Android)
 * - Custom URL scheme: xenolexia://
 * - Path-based routing
 */

import type {LinkingOptions} from '@react-navigation/native';

import type {RootStackParamList} from './types';

/**
 * URL scheme for the app
 * - Custom: xenolexia://
 * - Universal: https://xenolexia.app (when configured)
 */
export const URL_PREFIXES = [
  'xenolexia://',
  'https://xenolexia.app',
  'https://*.xenolexia.app',
];

/**
 * Deep linking configuration
 */
export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: URL_PREFIXES,

  config: {
    // Initial route when no deep link matches
    initialRouteName: 'MainTabs',

    screens: {
      // ===== Onboarding =====
      Onboarding: 'onboarding',

      // ===== Main Tabs =====
      MainTabs: {
        path: '',
        screens: {
          Library: 'library',
          Vocabulary: {
            path: 'vocabulary',
            parse: {
              filter: (filter: string) => filter as 'all' | 'learning' | 'mastered' | 'new',
            },
          },
          Statistics: 'stats',
          Profile: 'profile',
        },
      },

      // ===== Reader =====
      // Deep link: xenolexia://book/abc123
      // With location: xenolexia://book/abc123?location=epubcfi(/6/4)
      Reader: {
        path: 'book/:bookId',
        parse: {
          bookId: (bookId: string) => bookId,
          initialLocation: (location: string) => decodeURIComponent(location),
        },
        stringify: {
          bookId: (bookId: string) => bookId,
          initialLocation: (location: string) => encodeURIComponent(location),
        },
      },

      // ===== Book Detail =====
      // Deep link: xenolexia://book/abc123/detail
      BookDetail: {
        path: 'book/:bookId/detail',
        parse: {
          bookId: (bookId: string) => bookId,
        },
      },

      // ===== Book Discovery =====
      // Deep link: xenolexia://discover
      // With search: xenolexia://discover?q=shakespeare
      BookDiscovery: {
        path: 'discover',
        parse: {
          searchQuery: (query: string) => decodeURIComponent(query),
        },
        stringify: {
          searchQuery: (query: string) => encodeURIComponent(query),
        },
      },

      // ===== Vocabulary Detail =====
      // Deep link: xenolexia://word/xyz789
      VocabularyDetail: {
        path: 'word/:wordId',
        parse: {
          wordId: (wordId: string) => wordId,
        },
      },

      // ===== Vocabulary Quiz =====
      // Deep link: xenolexia://quiz
      VocabularyQuiz: 'quiz',

      // ===== Settings =====
      Settings: 'settings',
      LanguageSettings: 'settings/language',
      ReaderSettings: 'settings/reader',
      NotificationSettings: 'settings/notifications',
      DataManagement: 'settings/data',
      About: 'about',
    },
  },

  /**
   * Custom function to get the initial URL
   * Useful for handling notifications or other app entry points
   */
  // async getInitialURL() {
  //   // Check if app was opened from a notification
  //   // const url = await Linking.getInitialURL();
  //   // return url;
  // },

  /**
   * Custom function to subscribe to URL changes
   */
  // subscribe(listener) {
  //   // Listen for incoming links
  //   // const subscription = Linking.addEventListener('url', ({url}) => listener(url));
  //   // return () => subscription.remove();
  // },
};

/**
 * Generate a deep link URL for a specific route
 */
export function generateDeepLink(
  route: keyof RootStackParamList,
  params?: Record<string, string>
): string {
  let path = '';

  switch (route) {
    case 'Reader':
      path = `book/${params?.bookId || ''}`;
      if (params?.initialLocation) {
        path += `?location=${encodeURIComponent(params.initialLocation)}`;
      }
      break;
    case 'BookDetail':
      path = `book/${params?.bookId || ''}/detail`;
      break;
    case 'BookDiscovery':
      path = 'discover';
      if (params?.searchQuery) {
        path += `?q=${encodeURIComponent(params.searchQuery)}`;
      }
      break;
    case 'VocabularyDetail':
      path = `word/${params?.wordId || ''}`;
      break;
    case 'Settings':
      path = 'settings';
      break;
    default:
      path = route.toLowerCase();
  }

  return `xenolexia://${path}`;
}

/**
 * Example deep links:
 *
 * - Open app: xenolexia://
 * - Go to library: xenolexia://library
 * - Open a book: xenolexia://book/abc123
 * - Open book at location: xenolexia://book/abc123?location=epubcfi(/6/4)
 * - Search books: xenolexia://discover?q=shakespeare
 * - View word: xenolexia://word/xyz789
 * - Settings: xenolexia://settings
 * - Language settings: xenolexia://settings/language
 */
