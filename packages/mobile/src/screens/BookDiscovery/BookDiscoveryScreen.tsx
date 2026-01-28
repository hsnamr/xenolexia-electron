/**
 * Book Discovery Screen - Search and download ebooks from online sources
 */

import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import {Text, SearchInput, Button} from '@components/ui';
import {Card} from '@components/ui/Card';
import {ScreenHeader} from '@components/common';

import type {RootStackParamList} from '@xenolexia/shared/types/index';
import {BookDownloadService, EBOOK_SOURCES} from '@xenolexia/shared/services/BookDownloadService';
import type {EbookSearchResult, EbookSource, SearchResponse, DownloadProgress} from '@xenolexia/shared/services/BookDownloadService';
import {useLibraryStore} from '@xenolexia/shared/stores/libraryStore';

type DiscoveryNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function BookDiscoveryScreen(): React.JSX.Element {
  const navigation = useNavigation<DiscoveryNavigationProp>();
  const colors = useColors();
  const {addBook, initialize: initializeLibrary} = useLibraryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<EbookSearchResult[]>([]);
  const [selectedSource, setSelectedSource] = useState<EbookSource['type']>('gutenberg');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize library store on mount
  useEffect(() => {
    initializeLibrary();
  }, [initializeLibrary]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setErrorMessage('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setHasSearched(true);

    try {
      const response: SearchResponse = await BookDownloadService.searchBooks(
        searchQuery,
        selectedSource
      );
      setResults(response.results);

      if (response.error && response.results.length === 0) {
        setErrorMessage(response.error);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Search failed. Please check your internet connection and try again.'
      );
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedSource]);

  const showAlert = useCallback((title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }, []);

  const handleDownload = useCallback(async (book: EbookSearchResult, promptForLocation: boolean = false) => {
    setDownloadingId(book.id);
    setDownloadProgress(0);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Ensure file system access on web
    if (Platform.OS === 'web') {
      const hasAccess = await BookDownloadService.hasFileSystemAccess();
      if (!hasAccess) {
        const message = 'Xenolexia needs access to a folder to save downloaded books.\n\n' +
          'Please select or create a folder (e.g., "Xenolexia Books" in your Documents).';
        
        const proceed = window.confirm(message + '\n\nClick OK to choose a folder.');
        if (!proceed) {
          setDownloadingId(null);
          return;
        }

        const granted = await BookDownloadService.requestFileSystemAccess();
        if (!granted) {
          showAlert('Access Required', 'A folder is required to save books. Please try again and select a folder.');
          setDownloadingId(null);
          return;
        }
      }
    }

    const onProgress = (progress: DownloadProgress) => {
      setDownloadProgress(progress.percentage);
    };

    try {
      const result = await BookDownloadService.downloadBook(book, onProgress, promptForLocation);

      if (result.success && result.book) {
        await addBook(result.book);
        setResults(prev => prev.filter(r => r.id !== book.id));
        navigation.navigate('Reader', {bookId: result.book.id});
      } else {
        setErrorMessage(result.error || 'Download failed');
        showAlert('Download Failed', result.error || 'An error occurred while downloading the book.');
      }
    } catch (error) {
      console.error('Download error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Download failed';
      setErrorMessage(errorMsg);
      showAlert('Download Error', errorMsg);
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  }, [addBook, showAlert, navigation]);

  const handleDownloadWithPicker = useCallback((book: EbookSearchResult) => {
    handleDownload(book, true);
  }, [handleDownload]);

  const handleSourceChange = useCallback((source: EbookSource['type']) => {
    setSelectedSource(source);
    setResults([]);
    setErrorMessage(null);
    setHasSearched(false);
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const isDownloading = (id: string) => downloadingId === id;

  const renderSourceTab = ({type, name}: EbookSource) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.sourceTab,
        {backgroundColor: selectedSource === type ? colors.primary : colors.surfaceHover},
      ]}
      onPress={() => handleSourceChange(type)}>
      <Text
        variant="labelMedium"
        customColor={selectedSource === type ? colors.onPrimary : colors.textSecondary}>
        {name}
      </Text>
    </TouchableOpacity>
  );

  const renderBookResult = ({item}: {item: EbookSearchResult}) => (
    <Card variant="filled" padding="md" rounded="lg" style={styles.resultCard}>
      <View style={styles.resultContent}>
        {item.coverUrl ? (
          <Image source={{uri: item.coverUrl}} style={styles.resultCover} />
        ) : (
          <View style={[styles.resultCoverPlaceholder, {backgroundColor: colors.primaryLight}]}>
            <Text variant="headlineLarge">📖</Text>
          </View>
        )}
        <View style={styles.resultInfo}>
          <Text variant="titleMedium" numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="bodyMedium" color="secondary" numberOfLines={1} style={styles.authorText}>
            {item.author}
          </Text>
          <Text variant="bodySmall" color="tertiary" style={styles.metaText}>
            {item.format.toUpperCase()} • {item.source}
            {item.language && ` • ${item.language.toUpperCase()}`}
          </Text>
          {item.description && (
            <Text variant="bodySmall" color="secondary" numberOfLines={2} style={styles.descriptionText}>
              {item.description}
            </Text>
          )}

          {/* Download Progress Bar */}
          {isDownloading(item.id) && downloadProgress > 0 && (
            <View style={styles.progressWrapper}>
              <View style={[styles.progressContainer, {backgroundColor: colors.surfaceHover}]}>
                <View style={[styles.progressBar, {width: `${downloadProgress}%`, backgroundColor: colors.primary}]} />
              </View>
              <Text variant="labelSmall" color="tertiary" style={styles.progressText}>
                {downloadProgress}%
              </Text>
            </View>
          )}

          {/* Download Buttons */}
          <View style={styles.buttonRow}>
            {isDownloading(item.id) ? (
              <View style={styles.downloadingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text variant="labelMedium" color="secondary" style={styles.downloadingText}>
                  {downloadProgress > 0 ? `${downloadProgress}%` : 'Starting...'}
                </Text>
              </View>
            ) : (
              <>
                <Button size="sm" onPress={() => handleDownload(item, false)}>
                  Add to Library
                </Button>
                {Platform.OS === 'web' && (
                  <Button size="sm" variant="outline" onPress={() => handleDownloadWithPicker(item)}>
                    Save As...
                  </Button>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Card>
  );

  const searchableSources = EBOOK_SOURCES.filter(s => s.searchEnabled);

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyLarge" color="secondary" style={styles.loadingText}>
            Searching {selectedSource}...
          </Text>
        </View>
      );
    }

    if (errorMessage && hasSearched) {
      return (
        <View style={styles.centerContainer}>
          <Text variant="headlineLarge" style={styles.emptyEmoji}>⚠️</Text>
          <Text variant="titleLarge" color="error" style={styles.emptyTitle}>
            Search Issue
          </Text>
          <Text variant="bodyMedium" color="secondary" style={styles.emptyDescription}>
            {errorMessage}
          </Text>
          <Button onPress={handleSearch} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.centerContainer}>
          <Text variant="headlineLarge" style={styles.emptyEmoji}>🔍</Text>
          <Text variant="titleLarge" style={styles.emptyTitle}>
            Find Free Ebooks
          </Text>
          <Text variant="bodyMedium" color="secondary" style={styles.emptyDescription}>
            Search millions of free, public domain books from Project Gutenberg, Standard Ebooks,
            and Open Library.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineLarge" style={styles.emptyEmoji}>📚</Text>
        <Text variant="titleLarge" style={styles.emptyTitle}>
          No Results Found
        </Text>
        <Text variant="bodyMedium" color="secondary" style={styles.emptyDescription}>
          Try different keywords or search in another source.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]} edges={['top']}>
      <ScreenHeader
        title="Discover Books"
        showBack
        onBack={handleBack}
        large={false}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for books..."
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          containerStyle={styles.searchInput}
        />
        <Button size="md" onPress={handleSearch} style={styles.searchButton}>
          Search
        </Button>
      </View>

      {/* Source Tabs */}
      <View style={styles.sourceTabs}>
        {searchableSources.map(renderSourceTab)}
      </View>

      {/* Success Message */}
      {successMessage && (
        <View style={[styles.successBanner, {backgroundColor: colors.success + '20', borderColor: colors.success}]}>
          <Text variant="bodyMedium" customColor={colors.success} style={styles.successText}>
            ✓ {successMessage}
          </Text>
          <TouchableOpacity onPress={() => setSuccessMessage(null)}>
            <Text variant="titleMedium" customColor={colors.success}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderBookResult}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authorText: {
    marginTop: spacing[0.5],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[10],
  },
  container: {
    flex: 1,
  },
  descriptionText: {
    marginTop: spacing[2],
  },
  downloadingIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  downloadingText: {
    marginLeft: spacing[2],
  },
  emptyDescription: {
    lineHeight: 24,
    textAlign: 'center',
  },
  emptyEmoji: {
    marginBottom: spacing[4],
  },
  emptyTitle: {
    marginBottom: spacing[2],
  },
  loadingText: {
    marginTop: spacing[3],
  },
  metaText: {
    marginTop: spacing[1],
  },
  progressBar: {
    borderRadius: borderRadius.full,
    height: '100%',
  },
  progressContainer: {
    borderRadius: borderRadius.full,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  progressText: {
    marginLeft: spacing[2],
    minWidth: 32,
  },
  progressWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing[2],
  },
  resultCard: {
    marginBottom: spacing[3],
  },
  resultContent: {
    flexDirection: 'row',
  },
  resultCover: {
    borderRadius: borderRadius.md,
    height: 120,
    width: 80,
  },
  resultCoverPlaceholder: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    height: 120,
    justifyContent: 'center',
    width: 80,
  },
  resultInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  resultsList: {
    padding: spacing[4],
  },
  retryButton: {
    marginTop: spacing[5],
  },
  searchButton: {
    marginLeft: spacing[2],
  },
  searchContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  sourceTab: {
    borderRadius: borderRadius['2xl'],
    marginRight: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  sourceTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  successBanner: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  successText: {
    flex: 1,
  },
});
