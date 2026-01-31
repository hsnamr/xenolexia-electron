/**
 * Card Component - React DOM version
 */

import React from 'react';
import './Card.css';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function Card({
  variant = 'elevated',
  padding = 'md',
  rounded = 'lg',
  className = '',
  children,
  ...props
}: CardProps): React.JSX.Element {
  const classes = [
    'card',
    `card-${variant}`,
    `card-padding-${padding}`,
    `card-rounded-${rounded}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export interface PressableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  onClick?: () => void;
}

export function PressableCard({
  variant = 'elevated',
  padding = 'md',
  rounded = 'lg',
  className = '',
  children,
  onClick,
  ...props
}: PressableCardProps): React.JSX.Element {
  const classes = [
    'card',
    'card-pressable',
    `card-${variant}`,
    `card-padding-${padding}`,
    `card-rounded-${rounded}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} role="button" tabIndex={0} {...props}>
      {children}
    </div>
  );
}
