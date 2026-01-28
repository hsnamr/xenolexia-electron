/**
 * Notification Settings Screen - Configure reminders and alerts
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@theme/index';
import { useUserStore } from '@stores/userStore';

// ============================================================================
// Component
// ============================================================================

export function NotificationSettingsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { preferences, updatePreferences } = useUserStore();

  // Local state for notification settings (would be persisted in a real app)
  const [readingReminder, setReadingReminder] = useState(true);
  const [reviewReminder, setReviewReminder] = useState(true);
  const [streakReminder, setStreakReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00');

  const dynamicStyles = {
    container: { backgroundColor: colors.background.primary },
    section: { backgroundColor: colors.background.secondary },
    label: { color: colors.text.primary },
    value: { color: colors.text.secondary },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <TextDisplay text="←" style={[styles.backText, { color: colors.primary[500] }]} />
        </TouchableOpacity>
        <TextDisplay text="Notifications" style={[styles.title, { color: colors.text.primary }]} />
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View style={styles.sectionContainer}>
          <View style={[styles.section, dynamicStyles.section]}>
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <TextDisplay text="Enable Notifications" style={[styles.rowLabel, dynamicStyles.label]} />
                <TextDisplay
                  text="Receive reminders and alerts"
                  style={[styles.rowHint, { color: colors.text.tertiary }]}
                />
              </View>
              <Switch
                value={preferences.notificationsEnabled}
                onValueChange={(value) => updatePreferences({ notificationsEnabled: value })}
                trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Reminder Types */}
        <View style={[styles.sectionContainer, { opacity: preferences.notificationsEnabled ? 1 : 0.5 }]}>
          <TextDisplay text="REMINDER TYPES" style={[styles.sectionTitle, { color: colors.text.tertiary }]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <View style={styles.row}>
              <TextDisplay text="📖" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <TextDisplay text="Daily Reading" style={[styles.rowLabel, dynamicStyles.label]} />
                <TextDisplay
                  text="Reminder to reach your daily goal"
                  style={[styles.rowHint, { color: colors.text.tertiary }]}
                />
              </View>
              <Switch
                value={readingReminder}
                onValueChange={setReadingReminder}
                disabled={!preferences.notificationsEnabled}
                trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

            <View style={styles.row}>
              <TextDisplay text="🎴" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <TextDisplay text="Vocabulary Review" style={[styles.rowLabel, dynamicStyles.label]} />
                <TextDisplay
                  text="Reminder when cards are due for review"
                  style={[styles.rowHint, { color: colors.text.tertiary }]}
                />
              </View>
              <Switch
                value={reviewReminder}
                onValueChange={setReviewReminder}
                disabled={!preferences.notificationsEnabled}
                trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

            <View style={styles.row}>
              <TextDisplay text="🔥" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <TextDisplay text="Streak Protection" style={[styles.rowLabel, dynamicStyles.label]} />
                <TextDisplay
                  text="Reminder to maintain your reading streak"
                  style={[styles.rowHint, { color: colors.text.tertiary }]}
                />
              </View>
              <Switch
                value={streakReminder}
                onValueChange={setStreakReminder}
                disabled={!preferences.notificationsEnabled}
                trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Timing */}
        <View style={[styles.sectionContainer, { opacity: preferences.notificationsEnabled ? 1 : 0.5 }]}>
          <TextDisplay text="TIMING" style={[styles.sectionTitle, { color: colors.text.tertiary }]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <TouchableOpacity
              style={styles.row}
              disabled={!preferences.notificationsEnabled}
              onPress={() => {
                // Would open time picker in real app
              }}
            >
              <TextDisplay text="⏰" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <TextDisplay text="Reminder Time" style={[styles.rowLabel, dynamicStyles.label]} />
                <TextDisplay
                  text="When to send daily reminders"
                  style={[styles.rowHint, { color: colors.text.tertiary }]}
                />
              </View>
              <TextDisplay
                text={reminderTime}
                style={[styles.timeValue, { color: colors.primary[500] }]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <TextDisplay
            text="💡 Notifications help you build consistent learning habits. You can customize or disable them at any time."
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
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
  },
  rowHint: {
    fontSize: 13,
    marginTop: 2,
  },
  rowIcon: {
    fontSize: 22,
    width: 28,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
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
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
