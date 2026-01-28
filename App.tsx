/**
 * Xenolexia - Learn languages through the stories you love
 *
 * @format
 */

import React from 'react';

import {StatusBar} from 'react-native';

import {AppNavigator} from '@navigation/AppNavigator';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider, useIsDark} from '@/theme';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

/**
 * Theme-aware status bar
 */
function ThemedStatusBar() {
  const isDark = useIsDark();
  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor="transparent"
      translucent
    />
  );
}

/**
 * Main App with all providers
 */
function AppContent(): React.JSX.Element {
  return (
    <>
      <ThemedStatusBar />
      <AppNavigator />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default App;
