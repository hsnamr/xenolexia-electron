/**
 * Export Modal - Options for exporting vocabulary
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useTheme } from '@theme/index';
import { exportService, ExportFormat } from '@services/ExportService';
import type { VocabularyItem } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  vocabulary: VocabularyItem[];
}

interface FormatOption {
  id: ExportFormat;
  name: string;
  icon: string;
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'csv',
    name: 'CSV',
    icon: '📊',
    description: 'Spreadsheet format for Excel, Google Sheets',
  },
  {
    id: 'anki',
    name: 'Anki',
    icon: '🎴',
    description: 'Flashcard format for Anki import',
  },
  {
    id: 'json',
    name: 'JSON',
    icon: '📦',
    description: 'Full backup with all metadata',
  },
];

// ============================================================================
// Component
// ============================================================================

export function ExportModal({
  visible,
  onClose,
  vocabulary,
}: ExportModalProps): React.JSX.Element {
  const { colors } = useTheme();

  // State
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [includeContext, setIncludeContext] = useState(true);
  const [includeSRSData, setIncludeSRSData] = useState(true);
  const [includeBookInfo, setIncludeBookInfo] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (vocabulary.length === 0) {
      Alert.alert('No Words', 'You have no vocabulary words to export.');
      return;
    }

    setIsExporting(true);

    try {
      const result = await exportService.exportAndShare(vocabulary, {
        format: selectedFormat,
        includeContext,
        includeSRSData,
        includeBookInfo,
      });

      if (result.success) {
        Alert.alert(
          'Export Complete',
          `Successfully exported ${result.itemCount} words to ${result.fileName}`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else if (result.error) {
        Alert.alert('Export Failed', result.error);
      }
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsExporting(false);
    }
  }, [vocabulary, selectedFormat, includeContext, includeSRSData, includeBookInfo, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.container, { backgroundColor: colors.background.primary }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
            <TextDisplay
              text="Export Vocabulary"
              style={[styles.headerTitle, { color: colors.text.primary }]}
            />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <TextDisplay
                text="✕"
                style={[styles.closeButtonText, { color: colors.text.secondary }]}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Word Count */}
            <View style={[styles.wordCount, { backgroundColor: colors.background.secondary }]}>
              <TextDisplay
                text={`${vocabulary.length} words`}
                style={[styles.wordCountText, { color: colors.text.primary }]}
              />
              <TextDisplay
                text="will be exported"
                style={[styles.wordCountSubtext, { color: colors.text.tertiary }]}
              />
            </View>

            {/* Format Selection */}
            <View style={styles.section}>
              <TextDisplay
                text="Export Format"
                style={[styles.sectionTitle, { color: colors.text.secondary }]}
              />

              <View style={styles.formatOptions}>
                {FORMAT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.formatOption,
                      {
                        backgroundColor:
                          selectedFormat === option.id
                            ? colors.primary[500] + '15'
                            : colors.background.secondary,
                        borderColor:
                          selectedFormat === option.id
                            ? colors.primary[500]
                            : colors.border.primary,
                      },
                    ]}
                    onPress={() => setSelectedFormat(option.id)}
                    activeOpacity={0.7}
                  >
                    <TextDisplay text={option.icon} style={styles.formatIcon} />
                    <View style={styles.formatContent}>
                      <TextDisplay
                        text={option.name}
                        style={[
                          styles.formatName,
                          {
                            color:
                              selectedFormat === option.id
                                ? colors.primary[500]
                                : colors.text.primary,
                          },
                        ]}
                      />
                      <TextDisplay
                        text={option.description}
                        style={[styles.formatDescription, { color: colors.text.tertiary }]}
                      />
                    </View>
                    {selectedFormat === option.id && (
                      <View style={[styles.checkmark, { backgroundColor: colors.primary[500] }]}>
                        <TextDisplay text="✓" style={styles.checkmarkText} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Options */}
            <View style={styles.section}>
              <TextDisplay
                text="Include in Export"
                style={[styles.sectionTitle, { color: colors.text.secondary }]}
              />

              <OptionToggle
                label="Context sentences"
                description="Include the sentence where you found each word"
                enabled={includeContext}
                onToggle={() => setIncludeContext(!includeContext)}
              />

              <OptionToggle
                label="Book information"
                description="Include which book each word came from"
                enabled={includeBookInfo}
                onToggle={() => setIncludeBookInfo(!includeBookInfo)}
              />

              <OptionToggle
                label="Learning data"
                description="Include review count, intervals, and ease factors"
                enabled={includeSRSData}
                onToggle={() => setIncludeSRSData(!includeSRSData)}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border.secondary }]}>
            <TouchableOpacity
              style={[
                styles.exportButton,
                { backgroundColor: colors.primary[500] },
                isExporting && styles.exportButtonDisabled,
              ]}
              onPress={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <TextDisplay text="📤" style={styles.exportButtonIcon} />
                  <TextDisplay
                    text="Export & Share"
                    style={styles.exportButtonText}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Option Toggle sub-component
function OptionToggle({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.optionToggle, { backgroundColor: colors.background.secondary }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.optionContent}>
        <TextDisplay
          text={label}
          style={[styles.optionLabel, { color: colors.text.primary }]}
        />
        <TextDisplay
          text={description}
          style={[styles.optionDescription, { color: colors.text.tertiary }]}
        />
      </View>
      <View
        style={[
          styles.toggle,
          {
            backgroundColor: enabled ? colors.primary[500] : colors.background.tertiary,
          },
        ]}
      >
        <View
          style={[
            styles.toggleKnob,
            {
              backgroundColor: '#ffffff',
              transform: [{ translateX: enabled ? 16 : 0 }],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
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
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  checkmark: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  content: {
    maxHeight: 400,
  },
  contentContainer: {
    padding: 20,
  },
  exportButton: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  exportButtonIcon: {
    fontSize: 18,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    padding: 16,
  },
  formatContent: {
    flex: 1,
    marginLeft: 12,
  },
  formatDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  formatIcon: {
    fontSize: 24,
  },
  formatName: {
    fontSize: 15,
    fontWeight: '600',
  },
  formatOption: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 14,
  },
  formatOptions: {},
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionToggle: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  toggle: {
    borderRadius: 12,
    height: 24,
    padding: 2,
    width: 40,
  },
  toggleKnob: {
    borderRadius: 10,
    height: 20,
    width: 20,
  },
  wordCount: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  wordCountSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  wordCountText: {
    fontSize: 24,
    fontWeight: '700',
  },
});
