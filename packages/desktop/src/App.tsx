import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {LibraryScreen} from './screens/LibraryScreen';
import {ReaderScreen} from './screens/ReaderScreen';
import {VocabularyScreen} from './screens/VocabularyScreen';
import {BookDiscoveryScreen} from './screens/BookDiscoveryScreen';
import {AboutScreen} from './screens/AboutScreen';
import {StatisticsScreen} from './screens/StatisticsScreen';
import {SettingsScreen} from './screens/SettingsScreen';
import './App.css';

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryScreen />} />
        <Route path="/reader/:bookId" element={<ReaderScreen />} />
        <Route path="/vocabulary" element={<VocabularyScreen />} />
        <Route path="/vocabulary/:wordId" element={<VocabularyScreen />} />
        <Route path="/vocabulary/review" element={<div>Review Screen - Coming Soon</div>} />
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
