import React from 'react';

import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';

import {AboutScreen} from './screens/AboutScreen';
import {BookDiscoveryScreen} from './screens/BookDiscoveryScreen';
import {LibraryScreen} from './screens/LibraryScreen';
import {ReaderScreen} from './screens/ReaderScreen';
import {ReviewScreen} from './screens/ReviewScreen';
import {SettingsScreen} from './screens/SettingsScreen';
import {StatisticsScreen} from './screens/StatisticsScreen';
import {VocabularyScreen} from './screens/VocabularyScreen';
import './App.css';

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryScreen />} />
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
    </BrowserRouter>
  );
}

export default App;
