/**
 * Import Book Button - Triggers file picker for importing books
 */

import React, {useCallback, useState} from 'react';
import {StyleSheet, TouchableOpacity, Alert, Platform} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {useColors} from '@/theme';
import {borderRadius} from '@/theme/tokens';
import {Button} from '@components/ui';
import {PlusIcon} from '@components/common/TabBarIcon';
import {ImportService} from '@services/ImportService';
import type {ImportProgress, SelectedFile} from '@services/ImportService';
import {useLibraryStore} from '@stores/libraryStore';
import {useUserStore} from '@stores/userStore';
import type {RootStackParamList} from '@/types';

import {ImportProgressModal} from './ImportProgressModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================================================
// Types
// ============================================================================

interface ImportBookButtonProps {
  variant?: 'small' | 'large';
  onImportComplete?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ImportBookButton({
  variant = 'small',
  onImportComplete,
}: ImportBookButtonProps): React.JSX.Element {
  const colors = useColors();
  const navigation = useNavigation<NavigationProp>();
  const {addBook} = useLibraryStore();
  const {preferences} = useUserStore();

  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  const showAlert = useCallback((title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, [{text: 'OK', onPress: onOk}]);
    }
  }, []);

  const handleImport = useCallback(async () => {
    try {
      // Step 0: Ensure file system access (web only)
      if (Platform.OS === 'web') {
        const hasAccess = await ImportService.hasFileSystemAccess();
        if (!hasAccess) {
          // Prompt user to select a directory for storing books
          const message = 'Xenolexia needs access to a folder to store your books.\n\n' +
            'Please select or create a folder (e.g., "Xenolexia Books" in your Documents).';
          
          if (Platform.OS === 'web') {
            const proceed = window.confirm(message + '\n\nClick OK to choose a folder.');
            if (!proceed) return;
          }

          const granted = await ImportService.requestFileSystemAccess();
          if (!granted) {
            showAlert('Access Required', 'A folder is required to store your books. Please try again and select a folder.');
            return;
          }
        }
      }

      // Step 1: Select file
      setProgress({
        status: 'selecting',
        fileName: '',
        progress: 0,
        currentStep: 'Selecting file...',
      });
      setIsImporting(true);

      const file = await ImportService.selectFile();

      if (!file) {
        // User cancelled
        setIsImporting(false);
        setProgress(null);
        return;
      }

      setSelectedFile(file);
      setProgress({
        status: 'copying',
        fileName: file.name,
        progress: 5,
        currentStep: 'Preparing import...',
      });

      // Step 2: Import the book
      const result = await ImportService.importBook(file, {
        extractCover: true,
        parseMetadata: true,
        onProgress: setProgress,
      });

      if (result.success && result.bookId && result.metadata) {
        const newBook = {
          id: result.bookId,
          title: result.metadata.title,
          author: result.metadata.author,
          coverPath: result.metadata.coverPath || null,
          filePath: result.filePath!,
          format: result.metadata.format,
          fileSize: result.metadata.fileSize,
          addedAt: new Date(),
          lastReadAt: null,
          languagePair: {
            sourceLanguage: preferences.defaultSourceLanguage,
            targetLanguage: preferences.defaultTargetLanguage,
          },
          proficiencyLevel: preferences.defaultProficiencyLevel,
          wordDensity: preferences.defaultWordDensity,
          progress: 0,
          currentLocation: null,
          currentChapter: 0,
          totalChapters: result.metadata.totalChapters || 0,
          currentPage: 0,
          totalPages: result.metadata.estimatedPages || 0,
          readingTimeMinutes: 0,
          isDownloaded: true,
        };

        // Add book to library store (await to ensure it completes)
        try {
          await addBook(newBook);
          console.log('[ImportBookButton] Book added to library:', newBook.id, newBook.title);
        } catch (addError) {
          console.error('[ImportBookButton] Failed to add book to library:', addError);
          // Continue anyway - the file is imported, just might not persist in DB
        }

        // Close the modal
        setIsImporting(false);
        setProgress(null);
        setSelectedFile(null);

        // Notify parent
        onImportComplete?.();

        // Show success and navigate to reader
        showAlert(
          'Import Successful',
          `"${result.metadata.title}" has been added to your library.`,
          () => {
            // Navigate to reader after user acknowledges
            navigation.navigate('Reader', {bookId: result.bookId!});
          }
        );
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Import failed';

      console.error('[ImportBookButton] Import error:', error);

      setProgress({
        status: 'error',
        fileName: selectedFile?.name || 'Unknown file',
        progress: 0,
        currentStep: 'Import failed',
        error: errorMessage,
      });

      showAlert('Import Failed', errorMessage);
    }
  }, [addBook, preferences, selectedFile, onImportComplete, navigation, showAlert]);

  const handleDismiss = useCallback(() => {
    setIsImporting(false);
    setProgress(null);
    setSelectedFile(null);
  }, []);

  const handleCancel = useCallback(async () => {
    // Cancel import and clean up
    if (selectedFile) {
      // TODO: Cancel ongoing import if possible
    }
    handleDismiss();
  }, [selectedFile, handleDismiss]);

  // Render based on variant
  if (variant === 'large') {
    return (
      <>
        <Button variant="primary" size="lg" onPress={handleImport}>
          Import Book
        </Button>

        <ImportProgressModal
          visible={isImporting}
          progress={progress}
          onCancel={handleCancel}
          onDismiss={handleDismiss}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.smallButton, {backgroundColor: colors.primary}]}
        onPress={handleImport}
        activeOpacity={0.8}>
        <PlusIcon color={colors.onPrimary} size={20} />
      </TouchableOpacity>

      <ImportProgressModal
        visible={isImporting}
        progress={progress}
        onCancel={handleCancel}
        onDismiss={handleDismiss}
      />
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  smallButton: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
