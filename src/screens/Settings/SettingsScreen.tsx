/**
 * Settings Screen - Complete app configuration
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@theme/index';
import { useUserStore } from '@stores/userStore';
import { getLanguageInfo, SUPPORTED_LANGUAGES } from '@types/index';
import type { RootStackParamList, Language, ProficiencyLevel } from '@types/index';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================================================
// Component
// ============================================================================

export function SettingsScreen(): React.JSX.Element {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { colors } = useTheme();
  const { preferences, updatePreferences, resetPreferences } = useUserStore();

  const sourceLang = getLanguageInfo(preferences.defaultSourceLanguage);
  const targetLang = getLanguageInfo(preferences.defaultTargetLanguage);

  // Navigation handlers
  const handleNavigate = useCallback((screen: keyof RootStackParamList) => {
    navigation.navigate(screen as never);
  }, [navigation]);

  // Destructive actions
  const handleResetSettings = useCallback(() => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their defaults. Your books and vocabulary will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetPreferences?.();
            Alert.alert('Done', 'Settings have been reset to defaults.');
          },
        },
      ]
    );
  }, [resetPreferences]);

  // Dynamic styles
  const dynamicStyles = {
    container: { backgroundColor: colors.background.primary },
    header: { borderBottomColor: colors.border.secondary },
    section: { backgroundColor: colors.background.secondary },
    sectionTitle: { color: colors.text.tertiary },
    rowLabel: { color: colors.text.primary },
    rowValue: { color: colors.text.secondary },
    rowIcon: { color: colors.text.tertiary },
    divider: { backgroundColor: colors.border.secondary },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <TextDisplay text="←" style={[styles.backText, { color: colors.primary[500] }]} />
        </TouchableOpacity>
        <TextDisplay text="Settings" style={[styles.title, { color: colors.text.primary }]} />
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Learning Section */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="LEARNING" style={[styles.sectionTitle, dynamicStyles.sectionTitle]} />
          <View style={[styles.section, dynamicStyles.section]}>
            {/* Languages */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigate('LanguageSettings')}
            >
              <TextDisplay text="🌍" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Languages" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text={`${sourceLang?.flag} ${sourceLang?.name} → ${targetLang?.flag} ${targetLang?.name}`}
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <TextDisplay text="›" style={[styles.rowChevron, dynamicStyles.rowIcon]} />
            </TouchableOpacity>

            <View style={[styles.divider, dynamicStyles.divider]} />

            {/* Proficiency Level */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigate('LanguageSettings')}
            >
              <TextDisplay text="📊" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Proficiency Level" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text={preferences.defaultProficiencyLevel.charAt(0).toUpperCase() + preferences.defaultProficiencyLevel.slice(1)}
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <TextDisplay text="›" style={[styles.rowChevron, dynamicStyles.rowIcon]} />
            </TouchableOpacity>

            <View style={[styles.divider, dynamicStyles.divider]} />

            {/* Word Density */}
            <View style={styles.row}>
              <TextDisplay text="📝" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Word Density" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text={`${Math.round(preferences.defaultWordDensity * 100)}% of words replaced`}
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <TextDisplay
                text={`${Math.round(preferences.defaultWordDensity * 100)}%`}
                style={[styles.rowValueBadge, { color: colors.primary[500] }]}
              />
            </View>

            <View style={[styles.divider, dynamicStyles.divider]} />

            {/* Daily Goal */}
            <View style={styles.row}>
              <TextDisplay text="🎯" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Daily Reading Goal" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text="Set a daily reading target"
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <TextDisplay
                text={`${preferences.dailyGoal} min`}
                style={[styles.rowValueBadge, { color: colors.primary[500] }]}
              />
            </View>
          </View>
        </View>

        {/* Reader Section */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="READER" style={[styles.sectionTitle, dynamicStyles.sectionTitle]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigate('ReaderSettings')}
            >
              <TextDisplay text="📖" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Reader Defaults" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text="Theme, font, size, spacing"
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <TextDisplay text="›" style={[styles.rowChevron, dynamicStyles.rowIcon]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="NOTIFICATIONS" style={[styles.sectionTitle, dynamicStyles.sectionTitle]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <View style={styles.row}>
              <TextDisplay text="🔔" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Daily Reminders" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text="Get reminded to read and review"
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <Switch
                value={preferences.notificationsEnabled}
                onValueChange={(value) => updatePreferences({ notificationsEnabled: value })}
                trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigate('NotificationSettings')}
            >
              <TextDisplay text="⏰" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Notification Settings" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text="Schedule, sounds, badges"
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <TextDisplay text="›" style={[styles.rowChevron, dynamicStyles.rowIcon]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="DATA" style={[styles.sectionTitle, dynamicStyles.sectionTitle]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigate('DataManagement')}
            >
              <TextDisplay text="💾" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Data Management" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text="Export, import, clear data"
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <TextDisplay text="›" style={[styles.rowChevron, dynamicStyles.rowIcon]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="ABOUT" style={[styles.sectionTitle, dynamicStyles.sectionTitle]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigate('About')}
            >
              <TextDisplay text="ℹ️" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="About Xenolexia" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text="Version, licenses, contact"
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <TextDisplay text="›" style={[styles.rowChevron, dynamicStyles.rowIcon]} />
            </TouchableOpacity>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <TouchableOpacity style={styles.row} onPress={() => {}}>
              <TextDisplay text="⭐" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Rate Xenolexia" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text="Help us by leaving a review"
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <TextDisplay text="›" style={[styles.rowChevron, dynamicStyles.rowIcon]} />
            </TouchableOpacity>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <TouchableOpacity style={styles.row} onPress={() => {}}>
              <TextDisplay text="📤" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Share Xenolexia" style={[styles.rowLabel, dynamicStyles.rowLabel]} />
                <TextDisplay
                  text="Tell your friends about us"
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
              <TextDisplay text="›" style={[styles.rowChevron, dynamicStyles.rowIcon]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Reset Section */}
        <View style={styles.sectionContainer}>
          <View style={[styles.section, dynamicStyles.section]}>
            <TouchableOpacity style={styles.row} onPress={handleResetSettings}>
              <TextDisplay text="🔄" style={styles.rowIconEmoji} />
              <View style={styles.rowContent}>
                <TextDisplay text="Reset Settings" style={[styles.rowLabel, { color: '#f59e0b' }]} />
                <TextDisplay
                  text="Restore default settings"
                  style={[styles.rowValue, dynamicStyles.rowValue]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TextDisplay
            text="Xenolexia v1.0.0"
            style={[styles.footerText, { color: colors.text.tertiary }]}
          />
          <TextDisplay
            text="Made with 📚 for language learners"
            style={[styles.footerText, { color: colors.text.tertiary }]}
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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginLeft: 56,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 24,
  },
  footerText: {
    fontSize: 13,
    marginBottom: 4,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowChevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
  },
  rowIconEmoji: {
    fontSize: 22,
    width: 28,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 13,
    marginTop: 2,
  },
  rowValueBadge: {
    fontSize: 15,
    fontWeight: '600',
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
