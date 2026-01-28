/**
 * Chapter Navigator - Table of contents navigation
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import {useReaderStore} from '@xenolexia/shared/stores/readerStore';

interface ChapterNavigatorProps {
  visible: boolean;
  onClose: () => void;
  bookId: string;
}

export function ChapterNavigator({
  visible,
  onClose,
  bookId,
}: ChapterNavigatorProps): React.JSX.Element {
  const {chapters, currentChapterIndex, goToChapter} = useReaderStore();

  const handleChapterSelect = (index: number) => {
    goToChapter(index);
    onClose();
  };

  const renderChapter = ({item, index}: {item: any; index: number}) => {
    const isCurrentChapter = index === currentChapterIndex;

    return (
      <TouchableOpacity
        style={[styles.chapterItem, isCurrentChapter && styles.chapterItemCurrent]}
        onPress={() => handleChapterSelect(index)}>
        <View style={styles.chapterNumber}>
          <Text style={[styles.chapterNumberText, isCurrentChapter && styles.currentText]}>
            {index + 1}
          </Text>
        </View>
        <Text
          style={[styles.chapterTitle, isCurrentChapter && styles.currentText]}
          numberOfLines={2}>
          {item.title}
        </Text>
        {isCurrentChapter && <Text style={styles.currentIndicator}>▸</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          
          <Text style={styles.title}>Chapters</Text>

          {chapters.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No chapters available</Text>
            </View>
          ) : (
            <FlatList
              data={chapters}
              renderItem={renderChapter}
              keyExtractor={(item, index) => item.id || index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

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
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  chapterItemCurrent: {
    backgroundColor: '#e0f2fe',
  },
  chapterNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  chapterTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  currentText: {
    color: '#0369a1',
    fontWeight: '600',
  },
  currentIndicator: {
    fontSize: 16,
    color: '#0ea5e9',
    marginLeft: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  closeButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});
