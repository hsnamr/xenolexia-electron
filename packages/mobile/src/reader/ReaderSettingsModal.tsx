/**
 * Reader Settings Modal - Comprehensive reading customization
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  Switch,
  Animated,
} from 'react-native';
import { useReaderStore } from '@xenolexia/shared/stores/readerStore';
import { SettingsSlider } from '@components/settings/SettingsSlider';
import { SettingsSelect } from '@components/settings/SettingsSelect';
import {
  READER_FONTS,
  READER_THEMES,
  ReaderStyleService,
} from '@xenolexia/shared/services/ReaderStyleService';
import type { ReaderTheme } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface ReaderSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const TEXT_ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'justify', label: 'Justify' },
];

const PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

// ============================================================================
// Reader Settings Modal
// ============================================================================

export function ReaderSettingsModal({
  visible,
  onClose,
}: ReaderSettingsModalProps): React.JSX.Element {
  const { settings, currentBook, updateSettings } = useReaderStore();
  const [activeTab, setActiveTab] = useState<'appearance' | 'reading'>('appearance');
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  // Animate tab change
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'appearance' ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [activeTab, slideAnim]);

  // Save settings on close
  const handleClose = useCallback(async () => {
    // Save global settings
    await ReaderStyleService.saveSettings(settings);
    
    // Save book-specific settings if we have a book
    if (currentBook) {
      await ReaderStyleService.saveBookSettings(currentBook.id, {
        ...settings,
        wordDensity: settings.wordDensity,
      });
    }
    
    onClose();
  }, [settings, currentBook, onClose]);

  // Reset to defaults
  const handleResetDefaults = useCallback(async () => {
    updateSettings({
      theme: 'light',
      fontFamily: 'Georgia',
      fontSize: 18,
      lineHeight: 1.6,
      marginHorizontal: 24,
      textAlign: 'left',
      wordDensity: 0.3,
    });
  }, [updateSettings]);

  // Get theme colors for the modal based on current reader theme
  const themeColors = READER_THEMES[settings.theme];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          {/* Title */}
          <Text style={styles.title}>Reader Settings</Text>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'appearance' && styles.tabActive]}
              onPress={() => setActiveTab('appearance')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'appearance' && styles.tabTextActive,
                ]}>
                Appearance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reading' && styles.tabActive]}
              onPress={() => setActiveTab('reading')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'reading' && styles.tabTextActive,
                ]}>
                Reading
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}>
            {activeTab === 'appearance' ? (
              <AppearanceSettings
                settings={settings}
                updateSettings={updateSettings}
                themeColors={themeColors}
              />
            ) : (
              <ReadingSettings
                settings={settings}
                updateSettings={updateSettings}
              />
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetDefaults}>
              <Text style={styles.resetButtonText}>Reset Defaults</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// Appearance Settings Tab
// ============================================================================

interface SettingsTabProps {
  settings: any;
  updateSettings: (settings: any) => void;
  themeColors?: typeof READER_THEMES.light;
}

function AppearanceSettings({
  settings,
  updateSettings,
  themeColors,
}: SettingsTabProps): React.JSX.Element {
  const themes: { id: ReaderTheme; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'dark', label: 'Dark' },
  ];

  return (
    <>
      {/* Theme Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <View style={styles.themeRow}>
          {themes.map((theme) => {
            const colors = READER_THEMES[theme.id];
            const isSelected = settings.theme === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeOption,
                  { backgroundColor: colors.background },
                  isSelected && styles.themeOptionSelected,
                ]}
                onPress={() => updateSettings({ theme: theme.id })}>
                <Text style={[styles.themeLabel, { color: colors.text }]}>
                  Aa
                </Text>
                <Text style={[styles.themeName, { color: colors.textMuted }]}>
                  {theme.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Font Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Font Family</Text>
        <View style={styles.fontGrid}>
          {READER_FONTS.map((font) => {
            const isSelected = settings.fontFamily === font.id;
            return (
              <TouchableOpacity
                key={font.id}
                style={[
                  styles.fontOption,
                  isSelected && styles.fontOptionSelected,
                ]}
                onPress={() => updateSettings({ fontFamily: font.id })}>
                <Text
                  style={[
                    styles.fontSample,
                    { fontFamily: font.id === 'System' ? undefined : font.id },
                    isSelected && styles.fontSampleSelected,
                  ]}>
                  Aa
                </Text>
                <Text
                  style={[
                    styles.fontLabel,
                    isSelected && styles.fontLabelSelected,
                  ]}>
                  {font.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Font Size */}
      <View style={styles.section}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>Font Size</Text>
          <Text style={styles.sliderValue}>{settings.fontSize}pt</Text>
        </View>
        <SettingsSlider
          value={settings.fontSize}
          onValueChange={(value) => updateSettings({ fontSize: Math.round(value) })}
          minimumValue={12}
          maximumValue={32}
          step={1}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelSmall}>A</Text>
          <Text style={styles.sliderLabelLarge}>A</Text>
        </View>
      </View>

      {/* Line Spacing */}
      <View style={styles.section}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>Line Spacing</Text>
          <Text style={styles.sliderValue}>{settings.lineHeight.toFixed(1)}×</Text>
        </View>
        <SettingsSlider
          value={settings.lineHeight}
          onValueChange={(value) =>
            updateSettings({ lineHeight: Math.round(value * 10) / 10 })
          }
          minimumValue={1.0}
          maximumValue={2.5}
          step={0.1}
        />
      </View>

      {/* Margins */}
      <View style={styles.section}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>Margins</Text>
          <Text style={styles.sliderValue}>{settings.marginHorizontal}px</Text>
        </View>
        <SettingsSlider
          value={settings.marginHorizontal}
          onValueChange={(value) =>
            updateSettings({ marginHorizontal: Math.round(value) })
          }
          minimumValue={8}
          maximumValue={56}
          step={4}
        />
      </View>

      {/* Text Alignment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Alignment</Text>
        <SettingsSelect
          value={settings.textAlign}
          options={TEXT_ALIGN_OPTIONS}
          onSelect={(value) => updateSettings({ textAlign: value })}
        />
      </View>

      {/* Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preview</Text>
        <View
          style={[
            styles.previewContainer,
            { backgroundColor: themeColors?.background },
          ]}>
          <Text
            style={[
              styles.previewText,
              {
                color: themeColors?.text,
                fontFamily:
                  settings.fontFamily === 'System' ? undefined : settings.fontFamily,
                fontSize: Math.min(settings.fontSize, 16),
                lineHeight: Math.min(settings.fontSize, 16) * settings.lineHeight,
                textAlign: settings.textAlign,
                paddingHorizontal: Math.min(settings.marginHorizontal / 2, 16),
              },
            ]}>
            The quick brown fox jumps over the lazy{' '}
            <Text style={{ color: themeColors?.foreignWord, fontWeight: '500' }}>
              σκύλος
            </Text>
            . Reading in a foreign language has never been easier.
          </Text>
        </View>
      </View>
    </>
  );
}

// ============================================================================
// Reading Settings Tab
// ============================================================================

function ReadingSettings({
  settings,
  updateSettings,
}: SettingsTabProps): React.JSX.Element {
  return (
    <>
      {/* Proficiency Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Proficiency Level</Text>
        <Text style={styles.sectionDescription}>
          Controls the difficulty of words shown in the target language
        </Text>
        <SettingsSelect
          value={settings.proficiencyLevel || 'beginner'}
          options={PROFICIENCY_OPTIONS}
          onSelect={(value) => updateSettings({ proficiencyLevel: value })}
        />
      </View>

      {/* Word Density */}
      <View style={styles.section}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>Word Density</Text>
          <Text style={styles.sliderValue}>
            {Math.round((settings.wordDensity || 0.3) * 100)}%
          </Text>
        </View>
        <Text style={styles.sectionDescription}>
          Percentage of eligible words shown in the target language
        </Text>
        <SettingsSlider
          value={settings.wordDensity || 0.3}
          onValueChange={(value) =>
            updateSettings({ wordDensity: Math.round(value * 100) / 100 })
          }
          minimumValue={0.05}
          maximumValue={1.0}
          step={0.05}
        />
        <View style={styles.densityLabels}>
          <Text style={styles.densityLabel}>Fewer words</Text>
          <Text style={styles.densityLabel}>More words</Text>
        </View>
      </View>

      {/* Target Language Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Target Language</Text>
        <View style={styles.languageInfo}>
          <View style={styles.languageRow}>
            <Text style={styles.languageLabel}>Learning:</Text>
            <Text style={styles.languageValue}>
              {getLanguageName(settings.targetLanguage || 'el')}
            </Text>
          </View>
        </View>
        <Text style={styles.languageNote}>
          Change your target language in the main Settings screen
        </Text>
      </View>

      {/* Auto-save Progress */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.sectionTitle}>Auto-save Progress</Text>
            <Text style={styles.sectionDescription}>
              Automatically save your reading position
            </Text>
          </View>
          <Switch
            value={true}
            disabled
            trackColor={{ false: '#e5e7eb', true: '#86efac' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Show Progress Bar */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.sectionTitle}>Progress Bar</Text>
            <Text style={styles.sectionDescription}>
              Show reading progress at top of screen
            </Text>
          </View>
          <Switch
            value={true}
            disabled
            trackColor={{ false: '#e5e7eb', true: '#86efac' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>
    </>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    el: 'Greek',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ja: 'Japanese',
    zh: 'Chinese',
    ko: 'Korean',
    ar: 'Arabic',
  };
  return languages[code] || code.toUpperCase();
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelSmall: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sliderLabelLarge: {
    fontSize: 18,
    color: '#9ca3af',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  themeOptionSelected: {
    borderColor: '#0ea5e9',
  },
  themeLabel: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeName: {
    fontSize: 12,
  },
  fontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fontOption: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  fontOptionSelected: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  fontSample: {
    fontSize: 20,
    color: '#6b7280',
    marginBottom: 4,
  },
  fontSampleSelected: {
    color: '#0369a1',
  },
  fontLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  fontLabelSelected: {
    color: '#0369a1',
    fontWeight: '600',
  },
  previewContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewText: {
    textAlign: 'left',
  },
  densityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  densityLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  languageInfo: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  languageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  languageNote: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 40,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  doneButton: {
    flex: 2,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
