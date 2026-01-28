/**
 * Empty Library - Shown when no books are imported
 */

import React from 'react';

import {View, StyleSheet} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import {spacing} from '@/theme/tokens';

import {EmptyState} from '@components/common';
import {Button} from '@components/ui';

import {ImportBookButton} from './ImportBookButton';

import type {RootStackParamList} from '@/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

type EmptyLibraryNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function EmptyLibrary(): React.JSX.Element {
  const navigation = useNavigation<EmptyLibraryNavigationProp>();

  return (
    <EmptyState
      icon="📚"
      title="Your Library is Empty"
      description="Import a book from your device or browse free ebooks online to start your language learning journey."
    >
      <View style={styles.buttonContainer}>
        <ImportBookButton variant="large" />

        <Button
          variant="outline"
          size="lg"
          onPress={() => navigation.navigate('BookDiscovery', {})}
        >
          Browse Free Books
        </Button>
      </View>
    </EmptyState>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[6],
  },
});
