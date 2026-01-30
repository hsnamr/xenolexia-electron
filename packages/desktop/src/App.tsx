import React, {useEffect, useState} from 'react';

import {BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate} from 'react-router-dom';

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
  const {preferences, loadPreferences} = useUserStore();
  const [loaded, setLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadPreferences()
      .then(() => setLoaded(true))
      .catch((err) => {
        console.error('Failed to load preferences:', err);
        setLoaded(true);
      });
  }, [loadPreferences]);

  // Only block on initial load; don't show Loading when Settings (or others) refresh preferences
  if (!loaded) {
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

/** Registers Electron menu actions so Help > About, Tools > Statistics/Settings work from any screen */
function MenuActionListener({children}: {children: React.ReactNode}): React.JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI?.onMenuAction) return;

    const handler = (_event: unknown, action: string) => {
      switch (action) {
        case 'menu-import-book':
          navigate('/', {state: {openImport: true}});
          break;
        case 'menu-search-books':
          navigate('/discover');
          break;
        case 'menu-statistics':
          navigate('/statistics');
          break;
        case 'menu-settings':
          navigate('/settings');
          break;
        case 'menu-about':
          navigate('/about');
          break;
        default:
          break;
      }
    };

    window.electronAPI.onMenuAction(handler);
    return () => {
      // IPC listeners are not removed by preload; no-op cleanup
    };
  }, [navigate]);

  return <>{children}</>;
}

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <MenuActionListener>
        <OnboardingGuard>
          <AppRoutes />
        </OnboardingGuard>
      </MenuActionListener>
    </BrowserRouter>
  );
}

export default App;
