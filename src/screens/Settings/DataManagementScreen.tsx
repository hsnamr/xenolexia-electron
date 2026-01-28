/**
 * Data Management Screen - Export, import, and clear data
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@theme/index';
import { useLibraryStore } from '@stores/libraryStore';
import { useVocabularyStore } from '@stores/vocabularyStore';
import { useStatisticsStore } from '@stores/statisticsStore';
import { exportService } from '@services/ExportService';

// ============================================================================
// Component
// ============================================================================

export function DataManagementScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const { books, clearLibrary } = useLibraryStore();
  const { vocabulary, clearVocabulary } = useVocabularyStore();
  const { stats } = useStatisticsStore();

  const [isExporting, setIsExporting] = useState(false);

  // Calculate storage info
  const bookCount = books?.length || 0;
  const wordCount = vocabulary?.length || 0;

  // Export all data
  const handleExportAll = useCallback(async () => {
    setIsExporting(true);
    try {
      // Export vocabulary as JSON
      const result = await exportService.exportAndShare(vocabulary || [], {
        format: 'json',
        includeContext: true,
        includeSRSData: true,
        includeBookInfo: true,
      });

      if (result.success) {
        Alert.alert('Export Complete', `Exported ${result.itemCount} vocabulary items.`);
      } else if (result.error) {
        Alert.alert('Export Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Export Failed', 'An error occurred while exporting data.');
    } finally {
      setIsExporting(false);
    }
  }, [vocabulary]);

  // Clear vocabulary
  const handleClearVocabulary = useCallback(() => {
    Alert.alert(
      'Clear Vocabulary',
      `This will permanently delete all ${wordCount} saved words and their learning progress. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            clearVocabulary?.();
            Alert.alert('Done', 'All vocabulary has been cleared.');
          },
        },
      ]
    );
  }, [wordCount, clearVocabulary]);

  // Clear library
  const handleClearLibrary = useCallback(() => {
    Alert.alert(
      'Clear Library',
      `This will remove all ${bookCount} books from your library. Book files will be deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            clearLibrary?.();
            Alert.alert('Done', 'All books have been removed.');
          },
        },
      ]
    );
  }, [bookCount, clearLibrary]);

  // Clear all data
  const handleClearAll = useCallback(() => {
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete:\n\n• All books and reading progress\n• All vocabulary and learning progress\n• All statistics and streaks\n\nThis action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            clearLibrary?.();
            clearVocabulary?.();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  }, [clearLibrary, clearVocabulary]);

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
        <TextDisplay text="Data Management" style={[styles.title, { color: colors.text.primary }]} />
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Storage Info */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="STORAGE" style={[styles.sectionTitle, { color: colors.text.tertiary }]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <View style={styles.storageGrid}>
              <View style={styles.storageItem}>
                <TextDisplay text="📚" style={styles.storageIcon} />
                <TextDisplay text={bookCount.toString()} style={[styles.storageValue, { color: colors.text.primary }]} />
                <TextDisplay text="Books" style={[styles.storageLabel, { color: colors.text.tertiary }]} />
              </View>
              <View style={[styles.storageDivider, { backgroundColor: colors.border.secondary }]} />
              <View style={styles.storageItem}>
                <TextDisplay text="📝" style={styles.storageIcon} />
                <TextDisplay text={wordCount.toString()} style={[styles.storageValue, { color: colors.text.primary }]} />
                <TextDisplay text="Words" style={[styles.storageLabel, { color: colors.text.tertiary }]} />
              </View>
              <View style={[styles.storageDivider, { backgroundColor: colors.border.secondary }]} />
              <View style={styles.storageItem}>
                <TextDisplay text="⏱️" style={styles.storageIcon} />
                <TextDisplay
                  text={`${Math.floor((stats?.totalReadingTime || 0) / 60)}h`}
                  style={[styles.storageValue, { color: colors.text.primary }]}
                />
                <TextDisplay text="Read" style={[styles.storageLabel, { color: colors.text.tertiary }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Export Section */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="EXPORT" style={[styles.sectionTitle, { color: colors.text.tertiary }]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <TouchableOpacity
              style={styles.row}
              onPress={handleExportAll}
              disabled={isExporting}
            >
              <TextDisplay text="📤" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <TextDisplay text="Export All Data" style={[styles.rowLabel, dynamicStyles.label]} />
                <TextDisplay
                  text="Create a backup of vocabulary and settings"
                  style={[styles.rowHint, { color: colors.text.tertiary }]}
                />
              </View>
              {isExporting ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <TextDisplay text="›" style={[styles.chevron, { color: colors.text.tertiary }]} />
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

            <TouchableOpacity style={styles.row} onPress={() => Alert.alert('Coming Soon', 'Import functionality will be available in a future update.')}>
              <TextDisplay text="📥" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <TextDisplay text="Import Backup" style={[styles.rowLabel, dynamicStyles.label]} />
                <TextDisplay
                  text="Restore data from a backup file"
                  style={[styles.rowHint, { color: colors.text.tertiary }]}
                />
              </View>
              <TextDisplay text="›" style={[styles.chevron, { color: colors.text.tertiary }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Clear Data Section */}
        <View style={styles.sectionContainer}>
          <TextDisplay text="CLEAR DATA" style={[styles.sectionTitle, { color: '#ef4444' }]} />
          <View style={[styles.section, dynamicStyles.section]}>
            <TouchableOpacity
              style={styles.row}
              onPress={handleClearVocabulary}
              disabled={wordCount === 0}
            >
              <TextDisplay text="🗑️" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <TextDisplay
                  text="Clear Vocabulary"
                  style={[styles.rowLabel, { color: wordCount > 0 ? '#f59e0b' : colors.text.tertiary }]}
                />
                <TextDisplay
                  text={wordCount > 0 ? `Delete all ${wordCount} saved words` : 'No vocabulary to clear'}
                  style={[styles.rowHint, { color: colors.text.tertiary }]}
                />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

            <TouchableOpacity
              style={styles.row}
              onPress={handleClearLibrary}
              disabled={bookCount === 0}
            >
              <TextDisplay text="📚" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <TextDisplay
                  text="Clear Library"
                  style={[styles.rowLabel, { color: bookCount > 0 ? '#f59e0b' : colors.text.tertiary }]}
                />
                <TextDisplay
                  text={bookCount > 0 ? `Remove all ${bookCount} books` : 'No books to clear'}
                  style={[styles.rowHint, { color: colors.text.tertiary }]}
                />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

            <TouchableOpacity style={styles.row} onPress={handleClearAll}>
              <TextDisplay text="⚠️" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <TextDisplay text="Clear All Data" style={[styles.rowLabel, { color: '#ef4444' }]} />
                <TextDisplay
                  text="Delete everything and start fresh"
                  style={[styles.rowHint, { color: colors.text.tertiary }]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Warning */}
        <View style={styles.warningContainer}>
          <TextDisplay
            text="⚠️ Deleted data cannot be recovered. Export a backup before clearing data."
            style={[styles.warningText, { color: colors.text.tertiary }]}
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
  chevron: {
    fontSize: 20,
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
  storageDivider: {
    height: '50%',
    width: 1,
  },
  storageGrid: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  storageIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  storageItem: {
    alignItems: 'center',
    flex: 1,
  },
  storageLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  storageValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  warningContainer: {
    padding: 24,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
