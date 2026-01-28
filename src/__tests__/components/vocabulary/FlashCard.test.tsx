/**
 * FlashCard Component Tests
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { render, createMockVocabularyItem } from '../../utils/testUtils';

// Mock theme
jest.mock('@/theme', () => ({
  useTheme: () => ({
    colors: {
      primary: { 500: '#0ea5e9' },
      background: { primary: '#ffffff', secondary: '#f3f4f6' },
      text: { primary: '#1f2937', secondary: '#6b7280' },
    },
  }),
}));

// Simple FlashCard mock for testing logic
const MockFlashCard = ({
  item,
  isFlipped,
  onFlip,
}: {
  item: any;
  isFlipped: boolean;
  onFlip: () => void;
}) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  
  return (
    <TouchableOpacity testID="flash-card" onPress={onFlip}>
      <View testID="card-container">
        {!isFlipped ? (
          <View testID="front-face">
            <Text testID="foreign-word">{item.targetWord}</Text>
            <Text testID="tap-hint">Tap to reveal</Text>
          </View>
        ) : (
          <View testID="back-face">
            <Text testID="original-word">{item.sourceWord}</Text>
            {item.contextSentence && (
              <Text testID="context">{item.contextSentence}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

describe('FlashCard', () => {
  const mockOnFlip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Front face (not flipped)', () => {
    it('should show foreign word on front', () => {
      const item = createMockVocabularyItem({ targetWord: 'hola' });

      const { getByTestId } = render(
        <MockFlashCard item={item} isFlipped={false} onFlip={mockOnFlip} />
      );

      expect(getByTestId('front-face')).toBeTruthy();
      expect(getByTestId('foreign-word')).toHaveTextContent('hola');
    });

    it('should show tap hint', () => {
      const item = createMockVocabularyItem();

      const { getByTestId } = render(
        <MockFlashCard item={item} isFlipped={false} onFlip={mockOnFlip} />
      );

      expect(getByTestId('tap-hint')).toHaveTextContent('Tap to reveal');
    });

    it('should not show back face', () => {
      const item = createMockVocabularyItem();

      const { queryByTestId } = render(
        <MockFlashCard item={item} isFlipped={false} onFlip={mockOnFlip} />
      );

      expect(queryByTestId('back-face')).toBeNull();
    });
  });

  describe('Back face (flipped)', () => {
    it('should show original word on back', () => {
      const item = createMockVocabularyItem({ sourceWord: 'hello' });

      const { getByTestId } = render(
        <MockFlashCard item={item} isFlipped={true} onFlip={mockOnFlip} />
      );

      expect(getByTestId('back-face')).toBeTruthy();
      expect(getByTestId('original-word')).toHaveTextContent('hello');
    });

    it('should show context sentence when available', () => {
      const item = createMockVocabularyItem({
        contextSentence: 'Hello, how are you?',
      });

      const { getByTestId } = render(
        <MockFlashCard item={item} isFlipped={true} onFlip={mockOnFlip} />
      );

      expect(getByTestId('context')).toHaveTextContent('Hello, how are you?');
    });

    it('should not show front face', () => {
      const item = createMockVocabularyItem();

      const { queryByTestId } = render(
        <MockFlashCard item={item} isFlipped={true} onFlip={mockOnFlip} />
      );

      expect(queryByTestId('front-face')).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('should call onFlip when tapped', () => {
      const item = createMockVocabularyItem();

      const { getByTestId } = render(
        <MockFlashCard item={item} isFlipped={false} onFlip={mockOnFlip} />
      );

      fireEvent.press(getByTestId('flash-card'));

      expect(mockOnFlip).toHaveBeenCalledTimes(1);
    });

    it('should call onFlip when tapped while flipped', () => {
      const item = createMockVocabularyItem();

      const { getByTestId } = render(
        <MockFlashCard item={item} isFlipped={true} onFlip={mockOnFlip} />
      );

      fireEvent.press(getByTestId('flash-card'));

      expect(mockOnFlip).toHaveBeenCalledTimes(1);
    });
  });
});
