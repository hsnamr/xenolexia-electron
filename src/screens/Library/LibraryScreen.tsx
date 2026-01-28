/**
 * Library Screen - Displays user's book collection
 */

import React, {useState, useCallback} from 'react';
import {View, StyleSheet, FlatList, RefreshControl, TouchableOpacity} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import type {Book, RootStackParamList} from '@/types';

import {useLibraryStore} from '@stores/libraryStore';
import {BookCard} from '@components/library/BookCard';
import {EmptyLibrary} from '@components/library/EmptyLibrary';
import {ImportBookButton} from '@components/library/ImportBookButton';
import {ScreenHeader, LoadingBookGrid} from '@components/common';
import {SearchInput, Text} from '@components/ui';

type LibraryNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function LibraryScreen(): React.JSX.Element {
  const navigation = useNavigation<LibraryNavigationProp>();
  const colors = useColors();
  const {books, isLoading, refreshBooks, removeBook} = useLibraryStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter books by search query
  const filteredBooks = books.filter(
    book =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshBooks();
    setIsRefreshing(false);
  }, [refreshBooks]);

  const handleBookPress = useCallback(
    (book: Book) => {
      navigation.navigate('Reader', {bookId: book.id});
    },
    [navigation]
  );

  const handleDeleteBook = useCallback(
    async (bookId: string) => {
      try {
        await removeBook(bookId);
      } catch (error) {
        console.error('Failed to delete book:', error);
      }
    },
    [removeBook]
  );

  const handleBrowseBooks = useCallback(() => {
    navigation.navigate('BookDiscovery', {});
  }, [navigation]);

  const HeaderButtons = useCallback(() => (
    <View style={headerStyles.container}>
      <TouchableOpacity
        style={[headerStyles.discoverButton, {backgroundColor: colors.primaryLight}]}
        onPress={handleBrowseBooks}
        activeOpacity={0.8}>
        <Text variant="labelMedium" customColor={colors.primary}>🔍</Text>
      </TouchableOpacity>
      <ImportBookButton />
    </View>
  ), [colors, handleBrowseBooks]);

  const renderBook = useCallback(
    ({item}: {item: Book}) => (
      <BookCard
        book={item}
        onPress={() => handleBookPress(item)}
        onDelete={handleDeleteBook}
      />
    ),
    [handleBookPress, handleDeleteBook]
  );

  const keyExtractor = useCallback((item: Book) => item.id, []);

  const renderHeader = () => (
    <View style={styles.searchContainer}>
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search your library..."
        containerStyle={styles.searchInput}
      />
    </View>
  );

  const showEmptyState = filteredBooks.length === 0 && !isLoading;
  const showNoResults = showEmptyState && searchQuery.length > 0 && books.length > 0;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]} edges={['top']}>
      <ScreenHeader
        title="Library"
        subtitle={books.length > 0 ? `${books.length} books` : undefined}
        rightElement={<HeaderButtons />}
      />

      {isLoading && books.length === 0 ? (
        <LoadingBookGrid count={6} />
      ) : books.length === 0 ? (
        <EmptyLibrary />
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderBook}
          keyExtractor={keyExtractor}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            showNoResults ? (
              <View style={styles.noResults}>
                <EmptyLibrary />
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[4],
  },
  noResults: {
    marginTop: spacing[8],
  },
  row: {
    gap: spacing[4],
  },
  searchContainer: {
    paddingBottom: spacing[4],
    paddingTop: spacing[2],
  },
  searchInput: {
    marginBottom: 0,
  },
});

const headerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  discoverButton: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
