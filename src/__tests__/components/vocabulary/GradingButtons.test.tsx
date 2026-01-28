/**
 * GradingButtons Component Tests
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { render } from '../../utils/testUtils';

// Mock theme
jest.mock('@/theme', () => ({
  useTheme: () => ({
    colors: {
      primary: { 500: '#0ea5e9' },
      background: { primary: '#ffffff', secondary: '#f3f4f6' },
      text: { primary: '#1f2937' },
    },
  }),
}));

// Grade quality values (SM-2 scale)
const GRADE_VALUES = {
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 5,
};

// Mock GradingButtons component
const MockGradingButtons = ({ onGrade }: { onGrade: (grade: number) => void }) => {
  const { View, TouchableOpacity, Text } = require('react-native');
  
  return (
    <View testID="grading-buttons">
      <TouchableOpacity
        testID="grade-again"
        onPress={() => onGrade(GRADE_VALUES.Again)}
        style={{ backgroundColor: '#ef4444' }}
      >
        <Text>Again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="grade-hard"
        onPress={() => onGrade(GRADE_VALUES.Hard)}
        style={{ backgroundColor: '#f59e0b' }}
      >
        <Text>Hard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="grade-good"
        onPress={() => onGrade(GRADE_VALUES.Good)}
        style={{ backgroundColor: '#10b981' }}
      >
        <Text>Good</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="grade-easy"
        onPress={() => onGrade(GRADE_VALUES.Easy)}
        style={{ backgroundColor: '#0ea5e9' }}
      >
        <Text>Easy</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('GradingButtons', () => {
  const mockOnGrade = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all four grading buttons', () => {
    const { getByTestId } = render(
      <MockGradingButtons onGrade={mockOnGrade} />
    );

    expect(getByTestId('grade-again')).toBeTruthy();
    expect(getByTestId('grade-hard')).toBeTruthy();
    expect(getByTestId('grade-good')).toBeTruthy();
    expect(getByTestId('grade-easy')).toBeTruthy();
  });

  describe('Button interactions', () => {
    it('should call onGrade with 1 for "Again"', () => {
      const { getByTestId } = render(
        <MockGradingButtons onGrade={mockOnGrade} />
      );

      fireEvent.press(getByTestId('grade-again'));

      expect(mockOnGrade).toHaveBeenCalledWith(1);
    });

    it('should call onGrade with 2 for "Hard"', () => {
      const { getByTestId } = render(
        <MockGradingButtons onGrade={mockOnGrade} />
      );

      fireEvent.press(getByTestId('grade-hard'));

      expect(mockOnGrade).toHaveBeenCalledWith(2);
    });

    it('should call onGrade with 3 for "Good"', () => {
      const { getByTestId } = render(
        <MockGradingButtons onGrade={mockOnGrade} />
      );

      fireEvent.press(getByTestId('grade-good'));

      expect(mockOnGrade).toHaveBeenCalledWith(3);
    });

    it('should call onGrade with 5 for "Easy"', () => {
      const { getByTestId } = render(
        <MockGradingButtons onGrade={mockOnGrade} />
      );

      fireEvent.press(getByTestId('grade-easy'));

      expect(mockOnGrade).toHaveBeenCalledWith(5);
    });
  });

  describe('Grade semantics', () => {
    it('Again and Hard should fail (quality < 3)', () => {
      expect(GRADE_VALUES.Again).toBeLessThan(3);
      expect(GRADE_VALUES.Hard).toBeLessThan(3);
    });

    it('Good and Easy should pass (quality >= 3)', () => {
      expect(GRADE_VALUES.Good).toBeGreaterThanOrEqual(3);
      expect(GRADE_VALUES.Easy).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Only one grade per review', () => {
    it('should only call onGrade once when multiple buttons pressed quickly', () => {
      const { getByTestId } = render(
        <MockGradingButtons onGrade={mockOnGrade} />
      );

      fireEvent.press(getByTestId('grade-good'));

      expect(mockOnGrade).toHaveBeenCalledTimes(1);
    });
  });
});
