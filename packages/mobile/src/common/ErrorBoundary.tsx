/**
 * Error Boundary - Catches JavaScript errors and displays fallback UI
 *
 * Usage:
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Default Fallback Component
// ============================================================================

interface DefaultFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  showDetails?: boolean;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  onRetry,
  showDetails = false,
}: DefaultFallbackProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Error Icon */}
        <Text style={styles.icon}>⚠️</Text>

        {/* Title */}
        <Text style={styles.title}>Something went wrong</Text>

        {/* Description */}
        <Text style={styles.description}>
          We're sorry, but something unexpected happened. Please try again or restart the app.
        </Text>

        {/* Retry Button */}
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        {/* Error Details (for development) */}
        {showDetails && error && (
          <ScrollView style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Error Details:</Text>
            <Text style={styles.detailsText}>{error.message}</Text>
            {errorInfo?.componentStack && (
              <>
                <Text style={styles.detailsTitle}>Component Stack:</Text>
                <Text style={styles.detailsText}>{errorInfo.componentStack}</Text>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Error Boundary Class
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default fallback
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          showDetails={this.props.showDetails ?? __DEV__}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Screen Error Boundary (pre-configured for full screens)
// ============================================================================

interface ScreenErrorBoundaryProps {
  children: ReactNode;
  screenName?: string;
}

export function ScreenErrorBoundary({
  children,
  screenName,
}: ScreenErrorBoundaryProps): React.JSX.Element {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log with screen context
    console.error(`Error in ${screenName || 'Screen'}:`, error.message);
    // Here you could send to error tracking service
  };

  return (
    <ErrorBoundary onError={handleError} showDetails={__DEV__}>
      {children}
    </ErrorBoundary>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  description: {
    color: '#6b7280',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginTop: 24,
    maxHeight: 200,
    padding: 12,
    width: '100%',
  },
  detailsText: {
    color: '#374151',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  detailsTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#1f2937',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
});
