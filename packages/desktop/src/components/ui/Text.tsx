/**
 * Text Component - React DOM version
 */

import React from 'react';
import './Text.css';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'displayLarge' | 'displayMedium' | 'headlineLarge' | 'headlineMedium' | 'headlineSmall' | 'titleLarge' | 'titleMedium' | 'titleSmall' | 'bodyLarge' | 'bodyMedium' | 'bodySmall' | 'labelLarge' | 'labelMedium' | 'labelSmall';
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success' | 'accent';
  customColor?: string;
  weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  serif?: boolean;
  mono?: boolean;
  center?: boolean;
  right?: boolean;
  uppercase?: boolean;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  children: React.ReactNode;
}

export function Text({
  variant = 'bodyMedium',
  color = 'primary',
  customColor,
  weight,
  serif,
  mono,
  center,
  right,
  uppercase,
  as,
  className = '',
  children,
  ...props
}: TextProps): React.JSX.Element {
  const Component = as || getDefaultComponent(variant);
  
  const classes = [
    'text',
    `text-${variant}`,
    `text-color-${color}`,
    weight && `text-weight-${weight}`,
    serif && 'text-serif',
    mono && 'text-mono',
    center && 'text-center',
    right && 'text-right',
    uppercase && 'text-uppercase',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const style: React.CSSProperties = customColor ? {color: customColor} : {};

  return (
    <Component className={classes} style={style} {...props}>
      {children}
    </Component>
  );
}

function getDefaultComponent(variant: string): keyof JSX.IntrinsicElements {
  if (variant.startsWith('display') || variant.startsWith('headline')) {
    return 'h1';
  }
  if (variant.startsWith('title')) {
    return 'h2';
  }
  return 'p';
}
