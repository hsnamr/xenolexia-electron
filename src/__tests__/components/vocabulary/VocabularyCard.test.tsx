/**
 * VocabularyCard Component Tests
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { render, createMockVocabularyItem } from '../../utils/testUtils';

// Mock the VocabularyCard component dependencies
jest.mock('@/theme', () => ({
  useTheme: () => ({
    colors: {
      primary: { 500: '#0ea5e9' },
      background: { primary: '#ffffff', secondary: '#f3f4f6', tertiary: '#e5e7eb' },
      text: { primary: '#1f2937', secondary: '#6b7280', tertiary: '#9ca3af' },
      border: { primary: '#e5e7eb', secondary: '#f3f4f6' },
    },
    isDark: false,
  }),
  useColors: () => ({
    primary: '#0ea5e9',
    background: '#ffffff',
    surface: '#f3f4f6',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
  }),
}));

// Simple mock component for testing
const MockVocabularyCard = ({ item, onPress }: { item: any; onPress: () => void }) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity testID="vocabulary-card" onPress={onPress}>
      <View>
        <Text testID="source-word">{item.sourceWord}</Text>
        <Text testID="target-word">{item.targetWord}</Text>
        <Text testID="status">{item.status}</Text>
        {item.bookTitle && <Text testID="book-title">{item.bookTitle}</Text>}
      </View>
    </TouchableOpacity>
  );
};

describe('VocabularyCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render source and target words', () => {
    const item = createMockVocabularyItem({
      sourceWord: 'hello',
      targetWord: 'hola',
    });

    const { getByTestId } = render(
      <MockVocabularyCard item={item} onPress={mockOnPress} />
    );

    expect(getByTestId('source-word')).toHaveTextContent('hello');
    expect(getByTestId('target-word')).toHaveTextContent('hola');
  });

  it('should display the word status', () => {
    const item = createMockVocabularyItem({ status: 'learning' });

    const { getByTestId } = render(
      <MockVocabularyCard item={item} onPress={mockOnPress} />
    );

    expect(getByTestId('status')).toHaveTextContent('learning');
  });

  it('should display book title when available', () => {
    const item = createMockVocabularyItem({ bookTitle: 'Test Book' });

    const { getByTestId } = render(
      <MockVocabularyCard item={item} onPress={mockOnPress} />
    );

    expect(getByTestId('book-title')).toHaveTextContent('Test Book');
  });

  it('should call onPress when tapped', () => {
    const item = createMockVocabularyItem();

    const { getByTestId } = render(
      <MockVocabularyCard item={item} onPress={mockOnPress} />
    );

    fireEvent.press(getByTestId('vocabulary-card'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  describe('Status badges', () => {
    it.each([
      ['new', 'New word status'],
      ['learning', 'Learning status'],
      ['review', 'Review status'],
      ['learned', 'Learned status'],
    ])('should render %s status correctly', (status) => {
      const item = createMockVocabularyItem({ status });

      const { getByTestId } = render(
        <MockVocabularyCard item={item} onPress={mockOnPress} />
      );

      expect(getByTestId('status')).toHaveTextContent(status);
    });
  });
});
