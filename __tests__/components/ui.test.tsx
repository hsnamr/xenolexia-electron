/**
 * UI Components Smoke Tests
 * Verifies that all reusable UI components render correctly
 */

import React from 'react';
import {renderWithTheme, screen, fireEvent} from '../test-utils';
import {Text, Heading, Body, Caption} from '@components/ui/Text';
import {Button, PrimaryButton, OutlineButton} from '@components/ui/Button';
import {Card, PressableCard} from '@components/ui/Card';
import {Input, SearchInput} from '@components/ui/Input';

describe('UI Components', () => {
  describe('Text', () => {
    it('renders text content', () => {
      renderWithTheme(<Text>Hello World</Text>);
      expect(screen.getByText('Hello World')).toBeTruthy();
    });

    it('renders with different variants', () => {
      renderWithTheme(
        <>
          <Heading level={1}>Main Title</Heading>
          <Body>Body text content</Body>
          <Caption>Small caption</Caption>
        </>,
      );

      expect(screen.getByText('Main Title')).toBeTruthy();
      expect(screen.getByText('Body text content')).toBeTruthy();
      expect(screen.getByText('Small caption')).toBeTruthy();
    });
  });

  describe('Button', () => {
    it('renders button text', () => {
      renderWithTheme(<Button>Click Me</Button>);
      expect(screen.getByText('Click Me')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      renderWithTheme(<Button onPress={onPress}>Press</Button>);

      fireEvent.press(screen.getByText('Press'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      renderWithTheme(
        <Button onPress={onPress} disabled>
          Disabled
        </Button>,
      );

      fireEvent.press(screen.getByText('Disabled'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('renders loading state', () => {
      renderWithTheme(<Button loading>Loading</Button>);
      // Loading button should show activity indicator
      expect(screen.queryByText('Loading')).toBeNull();
    });

    it('renders button variants', () => {
      renderWithTheme(
        <>
          <PrimaryButton>Primary</PrimaryButton>
          <OutlineButton>Outline</OutlineButton>
        </>,
      );

      expect(screen.getByText('Primary')).toBeTruthy();
      expect(screen.getByText('Outline')).toBeTruthy();
    });
  });

  describe('Card', () => {
    it('renders card content', () => {
      renderWithTheme(
        <Card>
          <Text>Card content</Text>
        </Card>,
      );

      expect(screen.getByText('Card content')).toBeTruthy();
    });

    it('renders pressable card', () => {
      const onPress = jest.fn();
      renderWithTheme(
        <PressableCard onPress={onPress}>
          <Text>Pressable content</Text>
        </PressableCard>,
      );

      fireEvent.press(screen.getByText('Pressable content'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input', () => {
    it('renders input with placeholder', () => {
      renderWithTheme(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('calls onChangeText when text changes', () => {
      const onChangeText = jest.fn();
      renderWithTheme(
        <Input placeholder="Enter text" onChangeText={onChangeText} />,
      );

      fireEvent.changeText(
        screen.getByPlaceholderText('Enter text'),
        'New text',
      );
      expect(onChangeText).toHaveBeenCalledWith('New text');
    });

    it('renders search input variant', () => {
      renderWithTheme(<SearchInput placeholder="Search..." />);
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('renders with label', () => {
      renderWithTheme(<Input label="Email" placeholder="Enter email" />);
      expect(screen.getByText('Email')).toBeTruthy();
    });

    it('renders with error message', () => {
      renderWithTheme(
        <Input placeholder="Enter value" error="This field is required" />,
      );
      expect(screen.getByText('This field is required')).toBeTruthy();
    });
  });
});
