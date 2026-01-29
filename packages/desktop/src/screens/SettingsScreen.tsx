/**
 * Settings Screen - Desktop version with dictionary management
 */

import React, {useState, useCallback, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useUserStore} from '@xenolexia/shared/stores/userStore';
import {useLibraryStore} from '@xenolexia/shared/stores/libraryStore';
import {useVocabularyStore} from '@xenolexia/shared/stores/vocabularyStore';
import {SUPPORTED_LANGUAGES, getLanguageInfo, type Language, type ProficiencyLevel} from '@xenolexia/shared/types';
import {Button, Card} from '../components/ui';
import {
  generateExportContent,
  getSuggestedFilename,
  getSaveDialogFilters,
  type ExportFormat,
} from '../utils/exportVocabulary';
import './SettingsScreen.css';

interface DictionaryPair {
  sourceLanguage: Language;
  targetLanguage: Language;
  installed: boolean;
}

export function SettingsScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const {preferences, updatePreferences, resetPreferences, loadPreferences} = useUserStore();
  const {books, removeBook} = useLibraryStore();
  const {vocabulary, initialize: initVocabulary} = useVocabularyStore();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showDictionaryManager, setShowDictionaryManager] = useState(false);
  const [showBookManager, setShowBookManager] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [dictionaries, setDictionaries] = useState<DictionaryPair[]>(() => {
    // Initialize with default dictionary
    return [{
      sourceLanguage: preferences.defaultSourceLanguage,
      targetLanguage: preferences.defaultTargetLanguage,
      installed: true,
    }];
  });

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);
  useEffect(() => {
    initVocabulary();
  }, [initVocabulary]);

  const sourceLang = getLanguageInfo(preferences.defaultSourceLanguage);
  const targetLang = getLanguageInfo(preferences.defaultTargetLanguage);

  const handleResetSettings = useCallback(() => {
    if (window.confirm('This will reset all settings to their defaults. Your books and vocabulary will not be affected.')) {
      resetPreferences();
      alert('Settings have been reset to defaults.');
    }
  }, [resetPreferences]);

  const handleAddDictionary = useCallback((source: Language, target: Language) => {
    const exists = dictionaries.some(
      d => d.sourceLanguage === source && d.targetLanguage === target
    );
    if (!exists) {
      setDictionaries([...dictionaries, {sourceLanguage: source, targetLanguage: target, installed: true}]);
    }
  }, [dictionaries]);

  const handleRemoveDictionary = useCallback((source: Language, target: Language) => {
    if (dictionaries.length === 1) {
      alert('You must have at least one dictionary installed.');
      return;
    }
    if (window.confirm(`Remove dictionary ${getLanguageInfo(source)?.name} → ${getLanguageInfo(target)?.name}?`)) {
      setDictionaries(dictionaries.filter(
        d => !(d.sourceLanguage === source && d.targetLanguage === target)
      ));
    }
  }, [dictionaries]);

  const handleDeleteBook = useCallback(async (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (book && window.confirm(`Delete "${book.title}"? This cannot be undone.`)) {
      try {
        await removeBook(bookId);
      } catch (error) {
        console.error('Failed to delete book:', error);
        alert('Failed to delete book');
      }
    }
  }, [books, removeBook]);

  const handleExport = useCallback(async () => {
    if (!window.electronAPI?.showSaveDialog || !window.electronAPI?.writeFile) {
      alert('Export is only available in the desktop app.');
      return;
    }
    if (vocabulary.length === 0) {
      alert('No vocabulary to export.');
      return;
    }
    setIsExporting(true);
    try {
      const defaultPath = getSuggestedFilename(exportFormat);
      const filePath = await window.electronAPI.showSaveDialog({
        title: 'Export vocabulary',
        defaultPath,
        filters: getSaveDialogFilters(exportFormat),
      });
      if (!filePath) {
        setIsExporting(false);
        return;
      }
      const content = generateExportContent(vocabulary, exportFormat);
      await window.electronAPI.writeFile(filePath, content);
      alert(`Exported ${vocabulary.length} words to ${filePath}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. See console for details.');
    } finally {
      setIsExporting(false);
    }
  }, [vocabulary, exportFormat]);

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button onClick={() => navigate(-1)} className="settings-back-button">
          ← Back
        </button>
        <h1>Settings</h1>
        <div style={{width: '80px'}} />
      </div>

      <div className="settings-content">
        {/* Learning Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">LEARNING</h2>
          <Card variant="outlined" padding="md" className="settings-section-card">
            {/* Languages */}
            <button
              className="settings-row"
              onClick={() => setShowLanguagePicker(true)}
            >
              <span className="settings-row-icon">🌍</span>
              <div className="settings-row-content">
                <span className="settings-row-label">Languages</span>
                <span className="settings-row-value">
                  {sourceLang?.flag} {sourceLang?.name} → {targetLang?.flag} {targetLang?.name}
                </span>
              </div>
              <span className="settings-row-chevron">›</span>
            </button>

            <div className="settings-divider" />

            {/* Proficiency Level */}
            <div className="settings-row">
              <span className="settings-row-icon">📊</span>
              <div className="settings-row-content">
                <span className="settings-row-label">Proficiency Level</span>
                <span className="settings-row-value">
                  {preferences.defaultProficiencyLevel.charAt(0).toUpperCase() + preferences.defaultProficiencyLevel.slice(1)}
                </span>
              </div>
              <select
                className="settings-select"
                value={preferences.defaultProficiencyLevel}
                onChange={(e) => updatePreferences({defaultProficiencyLevel: e.target.value as ProficiencyLevel})}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="settings-divider" />

            {/* Word Density */}
            <div className="settings-row">
              <span className="settings-row-icon">📝</span>
              <div className="settings-row-content">
                <span className="settings-row-label">Word Density</span>
                <span className="settings-row-value">
                  {Math.round(preferences.defaultWordDensity * 100)}% of words replaced
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={preferences.defaultWordDensity}
                onChange={(e) => updatePreferences({defaultWordDensity: parseFloat(e.target.value)})}
                className="settings-slider"
              />
              <span className="settings-value-badge">
                {Math.round(preferences.defaultWordDensity * 100)}%
              </span>
            </div>

            <div className="settings-divider" />

            {/* Daily Goal */}
            <div className="settings-row">
              <span className="settings-row-icon">🎯</span>
              <div className="settings-row-content">
                <span className="settings-row-label">Daily Reading Goal</span>
                <span className="settings-row-value">Set a daily reading target</span>
              </div>
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={preferences.dailyGoal}
                onChange={(e) => updatePreferences({dailyGoal: parseInt(e.target.value) || 15})}
                className="settings-number-input"
              />
              <span className="settings-value-badge">min</span>
            </div>
          </Card>
        </div>

        {/* Export Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">EXPORT</h2>
          <Card variant="outlined" padding="md" className="settings-section-card">
            <div className="settings-row">
              <span className="settings-row-icon">📤</span>
              <div className="settings-row-content">
                <span className="settings-row-label">Export vocabulary</span>
                <span className="settings-row-value">
                  {vocabulary.length} word{vocabulary.length !== 1 ? 's' : ''} • Choose format and save to file
                </span>
              </div>
            </div>
            <div className="settings-export-row">
              <select
                className="settings-select"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              >
                <option value="json">JSON (full backup)</option>
                <option value="csv">CSV (spreadsheet)</option>
                <option value="anki">Anki (flashcards)</option>
              </select>
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={isExporting || vocabulary.length === 0}
              >
                {isExporting ? 'Exporting…' : 'Export and save…'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Dictionaries Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">DICTIONARIES</h2>
          <Card variant="outlined" padding="md" className="settings-section-card">
            <button
              className="settings-row"
              onClick={() => setShowDictionaryManager(true)}
            >
              <span className="settings-row-icon">📚</span>
              <div className="settings-row-content">
                <span className="settings-row-label">Manage Dictionaries</span>
                <span className="settings-row-value">
                  {dictionaries.length} dictionary pair{dictionaries.length !== 1 ? 's' : ''} installed
                </span>
              </div>
              <span className="settings-row-chevron">›</span>
            </button>
          </Card>
        </div>

        {/* Books Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">BOOKS</h2>
          <Card variant="outlined" padding="md" className="settings-section-card">
            <button
              className="settings-row"
              onClick={() => setShowBookManager(true)}
            >
              <span className="settings-row-icon">📖</span>
              <div className="settings-row-content">
                <span className="settings-row-label">Manage Books</span>
                <span className="settings-row-value">
                  {books.length} book{books.length !== 1 ? 's' : ''} in library
                </span>
              </div>
              <span className="settings-row-chevron">›</span>
            </button>
          </Card>
        </div>

        {/* About Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">ABOUT</h2>
          <Card variant="outlined" padding="md" className="settings-section-card">
            <button
              className="settings-row"
              onClick={() => navigate('/about')}
            >
              <span className="settings-row-icon">ℹ️</span>
              <div className="settings-row-content">
                <span className="settings-row-label">About Xenolexia</span>
                <span className="settings-row-value">Version, licenses, contact</span>
              </div>
              <span className="settings-row-chevron">›</span>
            </button>
          </Card>
        </div>

        {/* Reset Section */}
        <div className="settings-section">
          <Card variant="outlined" padding="md" className="settings-section-card">
            <button className="settings-row settings-row-danger" onClick={handleResetSettings}>
              <span className="settings-row-icon">🔄</span>
              <div className="settings-row-content">
                <span className="settings-row-label">Reset Settings</span>
                <span className="settings-row-value">Restore default settings</span>
              </div>
            </button>
          </Card>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <p className="settings-footer-text">Xenolexia v1.0.0</p>
          <p className="settings-footer-text">Made with 📚 for language learners</p>
        </div>
      </div>

      {/* Language Picker Modal */}
      {showLanguagePicker && (
        <LanguagePickerModal
          currentSource={preferences.defaultSourceLanguage}
          currentTarget={preferences.defaultTargetLanguage}
          onSelect={(source, target) => {
            updatePreferences({
              defaultSourceLanguage: source,
              defaultTargetLanguage: target,
            });
            setShowLanguagePicker(false);
          }}
          onClose={() => setShowLanguagePicker(false)}
        />
      )}

      {/* Dictionary Manager Modal */}
      {showDictionaryManager && (
        <DictionaryManagerModal
          dictionaries={dictionaries}
          onAdd={handleAddDictionary}
          onRemove={handleRemoveDictionary}
          onClose={() => setShowDictionaryManager(false)}
        />
      )}

      {/* Book Manager Modal */}
      {showBookManager && (
        <BookManagerModal
          books={books}
          onDelete={handleDeleteBook}
          onClose={() => setShowBookManager(false)}
        />
      )}
    </div>
  );
}

// Language Picker Modal
interface LanguagePickerModalProps {
  currentSource: Language;
  currentTarget: Language;
  onSelect: (source: Language, target: Language) => void;
  onClose: () => void;
}

function LanguagePickerModal({currentSource, currentTarget, onSelect, onClose}: LanguagePickerModalProps): React.JSX.Element {
  const [source, setSource] = useState<Language>(currentSource);
  const [target, setTarget] = useState<Language>(currentTarget);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Languages</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="language-picker-row">
            <label>Source Language:</label>
            <select
              className="language-select"
              value={source}
              onChange={(e) => setSource(e.target.value as Language)}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
          <div className="language-picker-row">
            <label>Target Language (Learning):</label>
            <select
              className="language-select"
              value={target}
              onChange={(e) => setTarget(e.target.value as Language)}
            >
              {SUPPORTED_LANGUAGES.filter(lang => lang.code !== source).map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSelect(source, target)}>Save</Button>
        </div>
      </div>
    </div>
  );
}

// Dictionary Manager Modal
interface DictionaryManagerModalProps {
  dictionaries: DictionaryPair[];
  onAdd: (source: Language, target: Language) => void;
  onRemove: (source: Language, target: Language) => void;
  onClose: () => void;
}

function DictionaryManagerModal({dictionaries, onAdd, onRemove, onClose}: DictionaryManagerModalProps): React.JSX.Element {
  const [newSource, setNewSource] = useState<Language>('en');
  const [newTarget, setNewTarget] = useState<Language>('el');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Dictionaries</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="dictionary-list">
            {dictionaries.map((dict, index) => {
              const sourceInfo = getLanguageInfo(dict.sourceLanguage);
              const targetInfo = getLanguageInfo(dict.targetLanguage);
              return (
                <div key={index} className="dictionary-item">
                  <span className="dictionary-label">
                    {sourceInfo?.flag} {sourceInfo?.name} → {targetInfo?.flag} {targetInfo?.name}
                  </span>
                  {dictionaries.length > 1 && (
                    <button
                      className="dictionary-remove"
                      onClick={() => onRemove(dict.sourceLanguage, dict.targetLanguage)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="dictionary-add">
            <h3>Add Dictionary</h3>
            <div className="language-picker-row">
              <label>Source:</label>
              <select
                className="language-select"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value as Language)}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="language-picker-row">
              <label>Target:</label>
              <select
                className="language-select"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value as Language)}
              >
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== newSource).map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                onAdd(newSource, newTarget);
                setNewSource('en');
                setNewTarget('el');
              }}
            >
              Add Dictionary
            </Button>
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}

// Book Manager Modal
interface BookManagerModalProps {
  books: any[];
  onDelete: (bookId: string) => void;
  onClose: () => void;
}

function BookManagerModal({books, onDelete, onClose}: BookManagerModalProps): React.JSX.Element {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Books</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {books.length === 0 ? (
            <p className="book-manager-empty">No books in library</p>
          ) : (
            <div className="book-manager-list">
              {books.map(book => (
                <div key={book.id} className="book-manager-item">
                  <div className="book-manager-info">
                    <span className="book-manager-title">{book.title}</span>
                    <span className="book-manager-author">{book.author}</span>
                  </div>
                  <button
                    className="book-manager-delete"
                    onClick={() => onDelete(book.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
