/**
 * Book Context Menu - Long-press actions for books
 */

import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import {useColors} from '@/theme';
import {spacing, borderRadius} from '@/theme/tokens';
import {Text} from '@components/ui';
import type {Book} from '@/types';

// ============================================================================
// Types
// ============================================================================

interface BookContextMenuProps {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
  onViewDetails: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onShare?: (book: Book) => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

// ============================================================================
// Icons
// ============================================================================

function InfoIcon({color, size = 22}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M12 16v-4m0-4h.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EditIcon({color, size = 22}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShareIcon({color, size = 22}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrashIcon({color, size = 22}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// Menu Item Component
// ============================================================================

function MenuItem({
  icon,
  label,
  onPress,
  destructive = false,
}: MenuItemProps): React.JSX.Element {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text
        variant="bodyMedium"
        customColor={destructive ? colors.error : colors.text}
        style={styles.menuLabel}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// Component
// ============================================================================

export function BookContextMenu({
  visible,
  book,
  onClose,
  onViewDetails,
  onEdit,
  onDelete,
  onShare,
}: BookContextMenuProps): React.JSX.Element {
  const colors = useColors();

  if (!book) return <></>;

  const handleDelete = () => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${book.title}"? This will remove the book from your library but won't delete the original file.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(book);
            onClose();
          },
        },
      ],
    );
  };

  const handleViewDetails = () => {
    onViewDetails(book);
    onClose();
  };

  const handleEdit = () => {
    onEdit(book);
    onClose();
  };

  const handleShare = () => {
    onShare?.(book);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.menuContainer, {backgroundColor: colors.surface}]}>
          {/* Book Info Header */}
          <View style={[styles.header, {borderBottomColor: colors.border}]}>
            <Text variant="titleSmall" numberOfLines={2}>
              {book.title}
            </Text>
            <Text variant="bodySmall" color="secondary" numberOfLines={1}>
              {book.author}
            </Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            <MenuItem
              icon={<InfoIcon color={colors.text} />}
              label="View Details"
              onPress={handleViewDetails}
            />
            <MenuItem
              icon={<EditIcon color={colors.text} />}
              label="Edit Book"
              onPress={handleEdit}
            />
            {onShare && (
              <MenuItem
                icon={<ShareIcon color={colors.text} />}
                label="Share"
                onPress={handleShare}
              />
            )}
            <View style={[styles.divider, {backgroundColor: colors.border}]} />
            <MenuItem
              icon={<TrashIcon color={colors.error} />}
              label="Delete from Library"
              onPress={handleDelete}
              destructive
            />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginVertical: spacing[2],
  },
  header: {
    borderBottomWidth: 1,
    padding: spacing[4],
  },
  menuContainer: {
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing[4],
    maxWidth: 320,
    overflow: 'hidden',
    width: '100%',
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  menuItems: {
    paddingVertical: spacing[2],
  },
  menuLabel: {
    flex: 1,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
});
