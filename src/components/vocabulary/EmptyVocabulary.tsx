/**
 * Empty Vocabulary - Shown when no words are saved
 */

import React from 'react';

import {EmptyState} from '@components/common';

interface EmptyVocabularyProps {
  hasFilter: boolean;
}

export function EmptyVocabulary({hasFilter}: EmptyVocabularyProps): React.JSX.Element {
  if (hasFilter) {
    return (
      <EmptyState
        icon="🔍"
        title="No Matches Found"
        description="Try adjusting your search or filters to find the words you're looking for."
        compact
      />
    );
  }

  return (
    <EmptyState
      icon="📝"
      title="No Words Saved Yet"
      description="As you read, tap on foreign words and save them to build your vocabulary list. You'll be able to review them here using spaced repetition."
    />
  );
}
