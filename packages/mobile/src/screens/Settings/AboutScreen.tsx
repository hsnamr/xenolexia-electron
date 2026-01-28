/**
 * About Screen - App info, credits, and links
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@theme/index';

// ============================================================================
// Constants
// ============================================================================

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

const LINKS = {
  privacy: 'https://xenolexia.app/privacy',
  terms: 'https://xenolexia.app/terms',
  support: 'mailto:support@xenolexia.app',
  github: 'https://github.com/xenolexia/xenolexia-react',
};

const ACKNOWLEDGMENTS = [
  { name: 'React Native', url: 'https://reactnative.dev' },
  { name: 'Zustand', url: 'https://zustand-demo.pmnd.rs' },
  { name: 'React Navigation', url: 'https://reactnavigation.org' },
  { name: 'LibreTranslate', url: 'https://libretranslate.com' },
  { name: 'FrequencyWords', url: 'https://github.com/hermitdave/FrequencyWords' },
];

// ============================================================================
// Component
// ============================================================================

export function AboutScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

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
        <TextDisplay text="About" style={[styles.title, { color: colors.text.primary }]} />
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary[500] }]}>
            <TextDisplay text="📚" style={styles.appIconEmoji} />
          </View>
          <TextDisplay text="Xenolexia" style={[styles.appName, { color: colors.text.primary }]} />
          <TextDisplay
            text={`Version ${APP_VERSION} (${BUILD_NUMBER})`}
            style={[styles.appVersion, { color: colors.text.tertiary }]}
          />
          <TextDisplay
            text="Learn languages through reading"
            style={[styles.appTagline, { color: colors.text.secondary }]}
          />
        </View>

        {/* Description */}
        <View style={[styles.descriptionCard, dynamicStyles.section]}>
          <TextDisplay
            text="Xenolexia helps you learn foreign languages naturally by replacing words in the books you read. As you encounter words in context, you build vocabulary without traditional flashcard memorization."
            style={[styles.descriptionText, { color: colors.text.secondary }]}
          />
        </View>

        {/* Links Section */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="LINKS" style={[styles.sectionTitle, { color: colors.text.tertiary }]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleOpenLink(LINKS.privacy)}
            >
              <TextDisplay text="🔒" style={styles.rowIcon} />
              <TextDisplay text="Privacy Policy" style={[styles.rowLabel, dynamicStyles.label]} />
              <TextDisplay text="›" style={[styles.chevron, { color: colors.text.tertiary }]} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => handleOpenLink(LINKS.terms)}
            >
              <TextDisplay text="📜" style={styles.rowIcon} />
              <TextDisplay text="Terms of Service" style={[styles.rowLabel, dynamicStyles.label]} />
              <TextDisplay text="›" style={[styles.chevron, { color: colors.text.tertiary }]} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => handleOpenLink(LINKS.support)}
            >
              <TextDisplay text="💬" style={styles.rowIcon} />
              <TextDisplay text="Contact Support" style={[styles.rowLabel, dynamicStyles.label]} />
              <TextDisplay text="›" style={[styles.chevron, { color: colors.text.tertiary }]} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => handleOpenLink(LINKS.github)}
            >
              <TextDisplay text="💻" style={styles.rowIcon} />
              <TextDisplay text="Source Code" style={[styles.rowLabel, dynamicStyles.label]} />
              <TextDisplay text="›" style={[styles.chevron, { color: colors.text.tertiary }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Acknowledgments */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="ACKNOWLEDGMENTS" style={[styles.sectionTitle, { color: colors.text.tertiary }]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <View style={styles.acknowledgeContent}>
              <TextDisplay
                text="Built with these amazing open source projects:"
                style={[styles.acknowledgeIntro, { color: colors.text.secondary }]}
              />
              {ACKNOWLEDGMENTS.map((item, index) => (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => handleOpenLink(item.url)}
                  style={styles.acknowledgeItem}
                >
                  <TextDisplay
                    text={`• ${item.name}`}
                    style={[styles.acknowledgeName, { color: colors.primary[500] }]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Credits */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="CREDITS" style={[styles.sectionTitle, { color: colors.text.tertiary }]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <View style={styles.creditsContent}>
              <TextDisplay
                text="Designed and developed with 📚 for language learners everywhere."
                style={[styles.creditsText, { color: colors.text.secondary }]}
              />
              <TextDisplay
                text="Special thanks to the open source community and all our early testers."
                style={[styles.creditsText, { color: colors.text.tertiary }]}
              />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TextDisplay
            text="© 2024 Xenolexia"
            style={[styles.footerText, { color: colors.text.tertiary }]}
          />
          <TextDisplay
            text="Made with ❤️"
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
  acknowledgeContent: {
    padding: 16,
  },
  acknowledgeIntro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  acknowledgeItem: {
    paddingVertical: 4,
  },
  acknowledgeName: {
    fontSize: 14,
  },
  appIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  appIconEmoji: {
    fontSize: 40,
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 15,
    marginTop: 8,
  },
  appVersion: {
    fontSize: 14,
  },
  backButton: {
    padding: 8,
    width: 48,
  },
  backText: {
    fontSize: 28,
    fontWeight: '300',
  },
  chevron: {
    fontSize: 20,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  creditsContent: {
    padding: 16,
  },
  creditsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginLeft: 48,
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
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
  },
  rowLabel: {
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
