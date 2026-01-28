/**
 * Language Settings Screen - Configure source/target languages and proficiency
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@theme/index';
import { useUserStore } from '@xenolexia/shared/stores/userStore';
import { SUPPORTED_LANGUAGES, getLanguageInfo } from '@xenolexia/shared/types/index';
import type { Language, ProficiencyLevel } from '@xenolexia/shared/types/index';

// ============================================================================
// Component
// ============================================================================

export function LanguageSettingsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { preferences, updatePreferences } = useUserStore();

  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sourceLang = getLanguageInfo(preferences.defaultSourceLanguage);
  const targetLang = getLanguageInfo(preferences.defaultTargetLanguage);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSource = useCallback((code: Language) => {
    updatePreferences({ defaultSourceLanguage: code });
    setShowSourcePicker(false);
    setSearchQuery('');
  }, [updatePreferences]);

  const handleSelectTarget = useCallback((code: Language) => {
    updatePreferences({ defaultTargetLanguage: code });
    setShowTargetPicker(false);
    setSearchQuery('');
  }, [updatePreferences]);

  const handleSelectProficiency = useCallback((level: ProficiencyLevel) => {
    updatePreferences({ defaultProficiencyLevel: level });
  }, [updatePreferences]);

  const dynamicStyles = {
    container: { backgroundColor: colors.background.primary },
    section: { backgroundColor: colors.background.secondary },
    label: { color: colors.text.primary },
    value: { color: colors.text.secondary },
  };

  // Language picker modal
  const renderLanguagePicker = (
    title: string,
    selected: Language,
    onSelect: (code: Language) => void,
    excludeCode?: Language
  ) => (
    <View style={[styles.pickerModal, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.pickerHeader, { borderBottomColor: colors.border.secondary }]}>
        <TouchableOpacity
          onPress={() => {
            setShowSourcePicker(false);
            setShowTargetPicker(false);
            setSearchQuery('');
          }}
        >
          <TextDisplay text="Cancel" style={[styles.pickerCancel, { color: colors.text.secondary }]} />
        </TouchableOpacity>
        <TextDisplay text={title} style={[styles.pickerTitle, { color: colors.text.primary }]} />
        <View style={{ width: 60 }} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.background.secondary }]}>
        <TextDisplay text="🔍" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search languages..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      </View>

      <FlatList
        data={filteredLanguages.filter((l) => l.code !== excludeCode)}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.languageRow,
              selected === item.code && { backgroundColor: colors.primary[500] + '15' },
            ]}
            onPress={() => onSelect(item.code)}
          >
            <TextDisplay text={item.flag || '🌐'} style={styles.languageFlag} />
            <View style={styles.languageInfo}>
              <TextDisplay
                text={item.name}
                style={[
                  styles.languageName,
                  { color: selected === item.code ? colors.primary[500] : colors.text.primary },
                ]}
              />
              <TextDisplay text={item.nativeName} style={[styles.languageNative, { color: colors.text.tertiary }]} />
            </View>
            {selected === item.code && (
              <TextDisplay text="✓" style={[styles.checkmark, { color: colors.primary[500] }]} />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (showSourcePicker) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        {renderLanguagePicker(
          'Native Language',
          preferences.defaultSourceLanguage,
          handleSelectSource
        )}
      </SafeAreaView>
    );
  }

  if (showTargetPicker) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        {renderLanguagePicker(
          'Learning Language',
          preferences.defaultTargetLanguage,
          handleSelectTarget,
          preferences.defaultSourceLanguage
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <TextDisplay text="←" style={[styles.backText, { color: colors.primary[500] }]} />
        </TouchableOpacity>
        <TextDisplay text="Languages" style={[styles.title, { color: colors.text.primary }]} />
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Language Pair */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="LANGUAGE PAIR" style={[styles.sectionTitle, { color: colors.text.tertiary }]} />
          <View style={[styles.section, dynamicStyles.section]}>
            {/* Source Language */}
            <TouchableOpacity style={styles.row} onPress={() => setShowSourcePicker(true)}>
              <View style={styles.rowContent}>
                <TextDisplay text="Native Language" style={[styles.rowLabel, dynamicStyles.label]} />
                <TextDisplay text="The language you read in" style={[styles.rowHint, { color: colors.text.tertiary }]} />
              </View>
              <View style={styles.rowValue}>
                <TextDisplay text={sourceLang?.flag || ''} style={styles.langFlag} />
                <TextDisplay text={sourceLang?.name || ''} style={[styles.langName, { color: colors.text.primary }]} />
                <TextDisplay text="›" style={[styles.chevron, { color: colors.text.tertiary }]} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

            {/* Target Language */}
            <TouchableOpacity style={styles.row} onPress={() => setShowTargetPicker(true)}>
              <View style={styles.rowContent}>
                <TextDisplay text="Learning Language" style={[styles.rowLabel, dynamicStyles.label]} />
                <TextDisplay text="Words will be shown in this language" style={[styles.rowHint, { color: colors.text.tertiary }]} />
              </View>
              <View style={styles.rowValue}>
                <TextDisplay text={targetLang?.flag || ''} style={styles.langFlag} />
                <TextDisplay text={targetLang?.name || ''} style={[styles.langName, { color: colors.text.primary }]} />
                <TextDisplay text="›" style={[styles.chevron, { color: colors.text.tertiary }]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Proficiency Level */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="PROFICIENCY LEVEL" style={[styles.sectionTitle, { color: colors.text.tertiary }]} />
          <View style={[styles.section, dynamicStyles.section]}>
            {(['beginner', 'intermediate', 'advanced'] as ProficiencyLevel[]).map((level, index) => (
              <React.Fragment key={level}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />}
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleSelectProficiency(level)}
                >
                  <View style={styles.rowContent}>
                    <TextDisplay
                      text={level.charAt(0).toUpperCase() + level.slice(1)}
                      style={[styles.rowLabel, dynamicStyles.label]}
                    />
                    <TextDisplay
                      text={
                        level === 'beginner'
                          ? 'A1-A2 • Basic vocabulary'
                          : level === 'intermediate'
                          ? 'B1-B2 • Everyday vocabulary'
                          : 'C1-C2 • Complex vocabulary'
                      }
                      style={[styles.rowHint, { color: colors.text.tertiary }]}
                    />
                  </View>
                  {preferences.defaultProficiencyLevel === level && (
                    <TextDisplay text="✓" style={[styles.checkmark, { color: colors.primary[500] }]} />
                  )}
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <TextDisplay
            text="💡 You can change these settings at any time. Different books can have different language settings."
            style={[styles.infoText, { color: colors.text.tertiary }]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Simple text display component
function TextDisplay({ text, style }: { text: string; style?: any }) {
  const { Text } = require('react-native');
  return <Text style={style}>{text}</Text>;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    width: 48,
  },
  backText: {
    fontSize: 28,
    fontWeight: '300',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    marginLeft: 8,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  infoContainer: {
    padding: 24,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  langFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  langName: {
    fontSize: 15,
    fontWeight: '500',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageNative: {
    fontSize: 13,
    marginTop: 2,
  },
  languageRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  pickerCancel: {
    fontSize: 16,
  },
  pickerHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerModal: {
    flex: 1,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowHint: {
    fontSize: 13,
    marginTop: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowValue: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchContainer: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
