import React, {useEffect, useState} from 'react';

import {BrowserRouter, Routes, Route, Navigate, useLocation} from 'react-router-dom';

import {useUserStore} from '@xenolexia/shared/stores/userStore';

import {AboutScreen} from './screens/AboutScreen';
import {BookDiscoveryScreen} from './screens/BookDiscoveryScreen';
import {LibraryScreen} from './screens/LibraryScreen';
import {OnboardingScreen} from './screens/OnboardingScreen';
import {ReaderScreen} from './screens/ReaderScreen';
import {ReviewScreen} from './screens/ReviewScreen';
import {SettingsScreen} from './screens/SettingsScreen';
import {StatisticsScreen} from './screens/StatisticsScreen';
import {VocabularyScreen} from './screens/VocabularyScreen';
import './App.css';

function OnboardingGuard({children}: {children: React.ReactNode}): React.JSX.Element {
  const {preferences, loadPreferences, isLoading} = useUserStore();
  const [loaded, setLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadPreferences().then(() => setLoaded(true));
  }, [loadPreferences]);

  if (!loaded || isLoading) {
    return (
      <div className="app-loading" style={{padding: 24, textAlign: 'center'}}>
        Loading...
      </div>
    );
  }

  const onOnboarding = location.pathname === '/onboarding';
  if (!preferences.hasCompletedOnboarding && !onOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<LibraryScreen />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/reader/:bookId" element={<ReaderScreen />} />
      <Route path="/vocabulary" element={<VocabularyScreen />} />
      <Route path="/vocabulary/:wordId" element={<VocabularyScreen />} />
      <Route path="/vocabulary/review" element={<ReviewScreen />} />
      <Route path="/discover" element={<BookDiscoveryScreen />} />
      <Route path="/about" element={<AboutScreen />} />
      <Route path="/statistics" element={<StatisticsScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <OnboardingGuard>
        <AppRoutes />
      </OnboardingGuard>
    </BrowserRouter>
  );
}

export default App;
