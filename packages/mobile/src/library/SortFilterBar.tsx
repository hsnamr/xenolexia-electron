/**
 * Sort & Filter Bar - Sorting and filtering controls for library
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import {Text, Button} from '@components/ui';
import type {BookFormat, ProficiencyLevel} from '@/types';
import type {BookSort, BookFilter} from '@xenolexia/shared/services/StorageService/repositories';

// ============================================================================
// Types
// ============================================================================

interface SortFilterBarProps {
  sort: BookSort;
  filter: BookFilter | null;
  onSortChange: (sort: BookSort) => void;
  onFilterChange: (filter: BookFilter | null) => void;
  bookCount?: number;
}

type SortOption = {
  label: string;
  value: BookSort['by'];
};

type FilterCategory = 'status' | 'format' | 'proficiency';

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS: SortOption[] = [
  {label: 'Recently Read', value: 'lastReadAt'},
  {label: 'Recently Added', value: 'addedAt'},
  {label: 'Title', value: 'title'},
  {label: 'Author', value: 'author'},
  {label: 'Progress', value: 'progress'},
];

const STATUS_FILTERS = [
  {label: 'All', value: null},
  {label: 'In Progress', value: 'inProgress'},
  {label: 'Not Started', value: 'notStarted'},
  {label: 'Completed', value: 'completed'},
];

const FORMAT_FILTERS: Array<{label: string; value: BookFormat | null}> = [
  {label: 'All Formats', value: null},
  {label: 'EPUB', value: 'epub'},
  {label: 'TXT', value: 'txt'},
  {label: 'MOBI', value: 'mobi'},
  {label: 'FB2', value: 'fb2'},
];

const PROFICIENCY_FILTERS: Array<{label: string; value: ProficiencyLevel | null}> = [
  {label: 'All Levels', value: null},
  {label: 'Beginner', value: 'beginner'},
  {label: 'Intermediate', value: 'intermediate'},
  {label: 'Advanced', value: 'advanced'},
];

// ============================================================================
// Icons
// ============================================================================

function SortIcon({color, size = 18}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M6 12h12M9 18h6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FilterIcon({color, size = 18}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({color, size = 16}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({color, size = 18}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// Component
// ============================================================================

export function SortFilterBar({
  sort,
  filter,
  onSortChange,
  onFilterChange,
  bookCount,
}: SortFilterBarProps): React.JSX.Element {
  const colors = useColors();
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const currentSortLabel =
    SORT_OPTIONS.find(o => o.value === sort.by)?.label || 'Sort';

  const hasActiveFilters = filter !== null && Object.keys(filter).length > 0;
  const activeFilterCount = filter
    ? Object.values(filter).filter(v => v !== undefined).length
    : 0;

  const handleSortSelect = useCallback(
    (by: BookSort['by']) => {
      // Toggle order if same sort is selected
      const newOrder = sort.by === by && sort.order === 'desc' ? 'asc' : 'desc';
      onSortChange({by, order: newOrder});
      setShowSortModal(false);
    },
    [sort, onSortChange],
  );

  const handleFilterApply = useCallback(
    (newFilter: BookFilter | null) => {
      onFilterChange(newFilter);
      setShowFilterModal(false);
    },
    [onFilterChange],
  );

  return (
    <View style={styles.container}>
      {/* Sort Button */}
      <TouchableOpacity
        style={[styles.button, {backgroundColor: colors.surfaceHover}]}
        onPress={() => setShowSortModal(true)}
        activeOpacity={0.7}
      >
        <SortIcon color={colors.textSecondary} />
        <Text variant="labelSmall" color="secondary" style={styles.buttonText}>
          {currentSortLabel}
        </Text>
        <ChevronDownIcon color={colors.textTertiary} />
      </TouchableOpacity>

      {/* Filter Button */}
      <TouchableOpacity
        style={[
          styles.button,
          {backgroundColor: hasActiveFilters ? colors.primaryLight : colors.surfaceHover},
        ]}
        onPress={() => setShowFilterModal(true)}
        activeOpacity={0.7}
      >
        <FilterIcon color={hasActiveFilters ? colors.primary : colors.textSecondary} />
        <Text
          variant="labelSmall"
          customColor={hasActiveFilters ? colors.primary : colors.textSecondary}
          style={styles.buttonText}
        >
          Filter
        </Text>
        {activeFilterCount > 0 && (
          <View style={[styles.badge, {backgroundColor: colors.primary}]}>
            <Text variant="labelSmall" customColor={colors.onPrimary}>
              {activeFilterCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Book Count */}
      {bookCount !== undefined && (
        <Text variant="bodySmall" color="tertiary" style={styles.count}>
          {bookCount} {bookCount === 1 ? 'book' : 'books'}
        </Text>
      )}

      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        currentSort={sort}
        onSelect={handleSortSelect}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentFilter={filter}
        onApply={handleFilterApply}
      />
    </View>
  );
}

// ============================================================================
// Sort Modal
// ============================================================================

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  currentSort: BookSort;
  onSelect: (by: BookSort['by']) => void;
}

function SortModal({
  visible,
  onClose,
  currentSort,
  onSelect,
}: SortModalProps): React.JSX.Element {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
          <Text variant="titleMedium" style={styles.modalTitle}>
            Sort By
          </Text>

          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                currentSort.by === option.value && {
                  backgroundColor: colors.primaryLight,
                },
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Text
                variant="bodyMedium"
                customColor={
                  currentSort.by === option.value ? colors.primary : colors.text
                }
              >
                {option.label}
              </Text>
              {currentSort.by === option.value && (
                <View style={styles.sortDirection}>
                  <Text variant="labelSmall" customColor={colors.primary}>
                    {currentSort.order === 'asc' ? '↑' : '↓'}
                  </Text>
                  <CheckIcon color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// Filter Modal
// ============================================================================

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentFilter: BookFilter | null;
  onApply: (filter: BookFilter | null) => void;
}

function FilterModal({
  visible,
  onClose,
  currentFilter,
  onApply,
}: FilterModalProps): React.JSX.Element {
  const colors = useColors();
  const [localFilter, setLocalFilter] = useState<BookFilter>(currentFilter || {});

  const handleStatusChange = (value: string | null) => {
    if (value === null) {
      const {hasProgress, ...rest} = localFilter;
      setLocalFilter(rest);
    } else if (value === 'inProgress') {
      setLocalFilter({...localFilter, hasProgress: true});
    } else if (value === 'notStarted') {
      setLocalFilter({...localFilter, hasProgress: false});
    }
    // 'completed' would need a different approach - progress >= 100
  };

  const handleFormatChange = (value: BookFormat | null) => {
    if (value === null) {
      const {format, ...rest} = localFilter;
      setLocalFilter(rest);
    } else {
      setLocalFilter({...localFilter, format: value});
    }
  };

  const handleProficiencyChange = (value: ProficiencyLevel | null) => {
    if (value === null) {
      const {proficiency, ...rest} = localFilter;
      setLocalFilter(rest);
    } else {
      setLocalFilter({...localFilter, proficiency: value});
    }
  };

  const handleClear = () => {
    setLocalFilter({});
  };

  const handleApply = () => {
    const hasFilters = Object.keys(localFilter).length > 0;
    onApply(hasFilters ? localFilter : null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.filterModalOverlay}>
        <View style={[styles.filterModalContent, {backgroundColor: colors.surface}]}>
          <View style={styles.filterHeader}>
            <Text variant="titleMedium">Filters</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text variant="labelMedium" customColor={colors.primary}>
                Clear All
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterScroll}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text variant="labelMedium" color="secondary" style={styles.filterLabel}>
                Reading Status
              </Text>
              <View style={styles.filterChips}>
                {STATUS_FILTERS.map(option => {
                  const isSelected =
                    (option.value === null && localFilter.hasProgress === undefined) ||
                    (option.value === 'inProgress' && localFilter.hasProgress === true) ||
                    (option.value === 'notStarted' && localFilter.hasProgress === false);

                  return (
                    <TouchableOpacity
                      key={option.value || 'all'}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceHover,
                        },
                      ]}
                      onPress={() => handleStatusChange(option.value)}
                    >
                      <Text
                        variant="labelSmall"
                        customColor={isSelected ? colors.onPrimary : colors.text}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Format Filter */}
            <View style={styles.filterSection}>
              <Text variant="labelMedium" color="secondary" style={styles.filterLabel}>
                Format
              </Text>
              <View style={styles.filterChips}>
                {FORMAT_FILTERS.map(option => {
                  const isSelected =
                    (option.value === null && !localFilter.format) ||
                    localFilter.format === option.value;

                  return (
                    <TouchableOpacity
                      key={option.value || 'all'}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceHover,
                        },
                      ]}
                      onPress={() => handleFormatChange(option.value)}
                    >
                      <Text
                        variant="labelSmall"
                        customColor={isSelected ? colors.onPrimary : colors.text}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Proficiency Filter */}
            <View style={styles.filterSection}>
              <Text variant="labelMedium" color="secondary" style={styles.filterLabel}>
                Proficiency Level
              </Text>
              <View style={styles.filterChips}>
                {PROFICIENCY_FILTERS.map(option => {
                  const isSelected =
                    (option.value === null && !localFilter.proficiency) ||
                    localFilter.proficiency === option.value;

                  return (
                    <TouchableOpacity
                      key={option.value || 'all'}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceHover,
                        },
                      ]}
                      onPress={() => handleProficiencyChange(option.value)}
                    >
                      <Text
                        variant="labelSmall"
                        customColor={isSelected ? colors.onPrimary : colors.text}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <Button variant="outline" onPress={onClose} style={styles.filterButton}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleApply} style={styles.filterButton}>
              Apply Filters
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
  },
  button: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  buttonText: {
    marginRight: spacing[0.5],
  },
  chip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  count: {
    flex: 1,
    textAlign: 'right',
  },
  filterActions: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  filterButton: {
    flex: 1,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  filterHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  filterLabel: {
    marginBottom: spacing[2],
  },
  filterModalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  filterModalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterScroll: {
    padding: spacing[4],
  },
  filterSection: {
    marginBottom: spacing[6],
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing[4],
    maxWidth: 320,
    padding: spacing[2],
    width: '100%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  optionRow: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  sortDirection: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
});
