/**
 * Main Application Navigator
 *
 * Implements:
 * - Native Stack Navigator for root routes
 * - Bottom Tab Navigator for main sections
 * - Deep linking support
 * - Custom screen transitions
 */

import React, {useCallback, useMemo} from 'react';

import {Platform, StyleSheet, View, Text} from 'react-native';

import {TabBarIcon} from '@components/common/TabBarIcon';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {BookDiscoveryScreen} from '@screens/BookDiscovery/BookDiscoveryScreen';
import {LibraryScreen} from '@screens/Library/LibraryScreen';
import {OnboardingScreen} from '@screens/Onboarding/OnboardingScreen';
import {ProfileScreen} from '@screens/Profile/ProfileScreen';
import {ReaderScreen} from '@screens/Reader/ReaderScreen';
import {StatisticsScreen} from '@screens/Statistics/StatisticsScreen';
import {VocabularyScreen} from '@screens/Vocabulary/VocabularyScreen';
import {ReviewScreen} from '@screens/Vocabulary/ReviewScreen';

import {useTheme} from '@/theme';
import {linkingConfig} from './linking';
import type {RootStackParamList, MainTabsParamList} from './types';

// Screens
import {
  SettingsScreen,
  LanguageSettingsScreen,
  DataManagementScreen,
  NotificationSettingsScreen,
  AboutScreen,
} from '@screens/Settings';

// Components

// Hooks

import {useUserStore} from '@xenolexia/shared/stores/userStore';

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

// ============================================================================
// Theme Configuration
// ============================================================================

const LightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0ea5e9',
    background: '#ffffff',
    card: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
    notification: '#ef4444',
  },
};

const DarkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#38bdf8',
    background: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    notification: '#f87171',
  },
};

const SepiaNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#b45309',
    background: '#fef3c7',
    card: '#fef3c7',
    text: '#78350f',
    border: '#fcd34d',
    notification: '#dc2626',
  },
};

// ============================================================================
// Placeholder Screens (to be implemented)
// ============================================================================

function PlaceholderScreen({title}: {title: string}) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{title}</Text>
      <Text style={styles.placeholderSubtext}>Coming Soon</Text>
    </View>
  );
}

// ============================================================================
// Tab Navigator
// ============================================================================

function MainTabs(): React.JSX.Element {
  const {isDark} = useTheme();

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderTopColor: isDark ? '#334155' : '#e5e7eb',
      paddingBottom: Platform.OS === 'ios' ? 24 : 8,
      paddingTop: 8,
      height: Platform.OS === 'ios' ? 88 : 64,
    }),
    [isDark]
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#38bdf8' : '#0ea5e9',
        tabBarInactiveTintColor: isDark ? '#64748b' : '#6b7280',
        tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({color, size, focused}) => (
            <TabBarIcon name="library" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Vocabulary"
        component={VocabularyScreen}
        options={{
          tabBarLabel: 'Words',
          tabBarIcon: ({color, size, focused}) => (
            <TabBarIcon name="vocabulary" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({color, size, focused}) => (
            <TabBarIcon name="stats" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({color, size, focused}) => (
            <TabBarIcon name="profile" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ============================================================================
// Root Navigator
// ============================================================================

export function AppNavigator(): React.JSX.Element {
  const {theme} = useTheme();
  const {preferences} = useUserStore();

  // Select navigation theme based on app theme
  const navigationTheme = useMemo(() => {
    switch (theme) {
      case 'dark':
        return DarkNavigationTheme;
      case 'sepia':
        return SepiaNavigationTheme;
      default:
        return LightNavigationTheme;
    }
  }, [theme]);

  // Determine initial route based on onboarding status
  const initialRouteName = preferences.hasCompletedOnboarding ? 'MainTabs' : 'Onboarding';

  // Navigation ready callback
  const onReady = useCallback(() => {
    // Hide splash screen here if using one
    // SplashScreen.hide();
    console.log('Navigation ready');
  }, []);

  return (
    <NavigationContainer
      theme={navigationTheme}
      linking={linkingConfig}
      onReady={onReady}
      fallback={<LoadingScreen />}
    >
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 250,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        {/* Onboarding */}
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            animation: 'fade',
            gestureEnabled: false,
          }}
        />

        {/* Main Tab Navigator */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            animation: 'fade',
          }}
        />

        {/* Reader - Full Screen Modal */}
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 300,
            gestureEnabled: false,
            presentation: 'fullScreenModal',
          }}
        />

        {/* Book Detail - Slide from right */}
        <Stack.Screen
          name="BookDetail"
          component={() => <PlaceholderScreen title="Book Details" />}
          options={{
            animation: 'slide_from_right',
          }}
        />

        {/* Book Discovery */}
        <Stack.Screen
          name="BookDiscovery"
          component={BookDiscoveryScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />

        {/* Vocabulary Detail */}
        <Stack.Screen
          name="VocabularyDetail"
          component={() => <PlaceholderScreen title="Word Details" />}
          options={{
            animation: 'slide_from_right',
          }}
        />

        {/* Vocabulary Quiz / Review */}
        <Stack.Screen
          name="VocabularyQuiz"
          component={ReviewScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }}
        />

        {/* Settings Stack */}
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="LanguageSettings"
          component={LanguageSettingsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="ReaderSettings"
          component={() => <PlaceholderScreen title="Reader Settings" />}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="DataManagement"
          component={DataManagementScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================================================
// Loading Screen (for navigation fallback)
// ============================================================================

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    flex: 1,
    justifyContent: 'center',
  },
  placeholderSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
  },
  placeholderText: {
    color: '#1f2937',
    fontSize: 24,
    fontWeight: '600',
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});

// ============================================================================
// Export navigation index
// ============================================================================

export * from './types';
export * from './linking';
