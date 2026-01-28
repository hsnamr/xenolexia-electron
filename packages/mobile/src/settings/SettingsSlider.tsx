/**
 * Settings Slider - Interactive slider component using gesture handler
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableOpacity,
  Text,
  LayoutChangeEvent,
} from 'react-native';

// ============================================================================
// Types
// ============================================================================

interface SettingsSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
  showButtons?: boolean;
  disabled?: boolean;
  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
}

// ============================================================================
// Settings Slider Component
// ============================================================================

export function SettingsSlider({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step,
  showButtons = true,
  disabled = false,
  trackColor = '#e5e7eb',
  fillColor = '#0ea5e9',
  thumbColor = '#0ea5e9',
}: SettingsSliderProps): React.JSX.Element {
  const trackWidth = useRef(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Calculate percentage for visual representation
  const percentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  // Update animated value when percentage changes
  React.useEffect(() => {
    animatedValue.setValue(percentage);
  }, [percentage, animatedValue]);

  // Handle track layout to get width
  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    trackWidth.current = event.nativeEvent.layout.width;
  }, []);

  // Convert position to value
  const positionToValue = useCallback(
    (position: number): number => {
      const ratio = Math.max(0, Math.min(1, position / trackWidth.current));
      const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
      // Round to nearest step
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(minimumValue, Math.min(maximumValue, steppedValue));
    },
    [minimumValue, maximumValue, step]
  );

  // Pan responder for thumb dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        // Optional: Add haptic feedback here
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition =
          (percentage / 100) * trackWidth.current + gestureState.dx;
        const newValue = positionToValue(newPosition);
        if (newValue !== value) {
          onValueChange(newValue);
        }
      },
      onPanResponderRelease: () => {
        // Optional: Add haptic feedback here
      },
    })
  ).current;

  // Handle track press to jump to position
  const handleTrackPress = useCallback(
    (event: any) => {
      if (disabled) return;
      const { locationX } = event.nativeEvent;
      const newValue = positionToValue(locationX);
      onValueChange(newValue);
    },
    [disabled, positionToValue, onValueChange]
  );

  // Increment/decrement handlers
  const handleDecrement = useCallback(() => {
    const newValue = Math.max(minimumValue, value - step);
    onValueChange(newValue);
  }, [value, minimumValue, step, onValueChange]);

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(maximumValue, value + step);
    onValueChange(newValue);
  }, [value, maximumValue, step, onValueChange]);

  return (
    <View style={styles.container}>
      {showButtons && (
        <TouchableOpacity
          onPress={handleDecrement}
          style={[styles.button, disabled && styles.buttonDisabled]}
          disabled={disabled || value <= minimumValue}>
          <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
            −
          </Text>
        </TouchableOpacity>
      )}

      <View
        style={[styles.trackContainer, !showButtons && styles.trackContainerFull]}
        onLayout={handleTrackLayout}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleTrackPress}
          style={[styles.track, { backgroundColor: trackColor }]}>
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: fillColor,
                width: animatedValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </TouchableOpacity>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.thumb,
            {
              backgroundColor: thumbColor,
              left: animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
            disabled && styles.thumbDisabled,
          ]}>
          <View style={styles.thumbInner} />
        </Animated.View>
      </View>

      {showButtons && (
        <TouchableOpacity
          onPress={handleIncrement}
          style={[styles.button, disabled && styles.buttonDisabled]}
          disabled={disabled || value >= maximumValue}>
          <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
            +
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 28,
  },
  buttonTextDisabled: {
    color: '#9ca3af',
  },
  trackContainer: {
    flex: 1,
    height: 44,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  trackContainerFull: {
    marginHorizontal: 0,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -14,
    top: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  thumbDisabled: {
    opacity: 0.5,
  },
});
