/**
 * EPUB Renderer - WebView-based EPUB content renderer
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import type { ReaderSettings, ForeignWordData, WordEntry, PartOfSpeech } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface WebViewMessage {
  type: 'progress' | 'wordTap' | 'wordLongPress' | 'wordHoverEnd' | 'contentReady';
  progress?: number;
  scrollY?: number;
  scrollHeight?: number;
  foreignWord?: string;
  originalWord?: string;
  pronunciation?: string | null;
  partOfSpeech?: string;
  wordId?: string;
  position?: { x: number; y: number };
}

export interface EPUBRendererProps {
  html: string;
  settings: ReaderSettings;
  onProgressChange?: (progress: number) => void;
  onWordTap?: (word: ForeignWordData) => void;
  onWordLongPress?: (word: ForeignWordData) => void;
  onWordHoverEnd?: () => void;
  onContentReady?: (scrollHeight: number) => void;
  initialScrollY?: number;
}

// ============================================================================
// EPUB Renderer Component
// ============================================================================

export function EPUBRenderer({
  html,
  settings,
  onProgressChange,
  onWordTap,
  onWordLongPress,
  onContentReady,
  initialScrollY,
}: EPUBRendererProps): React.JSX.Element {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContentReady, setIsContentReady] = useState(false);

  // Apply settings when they change
  useEffect(() => {
    if (webViewRef.current && isContentReady) {
      const settingsScript = `
        window.applyReaderSettings(${JSON.stringify({
          fontSize: settings.fontSize,
          fontFamily: settings.fontFamily,
          lineHeight: settings.lineHeight,
          textAlign: settings.textAlign,
          marginHorizontal: settings.marginHorizontal,
        })});
        true;
      `;
      webViewRef.current.injectJavaScript(settingsScript);
    }
  }, [settings, isContentReady]);

  // Scroll to initial position when content is ready
  useEffect(() => {
    if (webViewRef.current && isContentReady && initialScrollY) {
      const scrollScript = `window.scrollToPosition(${initialScrollY}); true;`;
      webViewRef.current.injectJavaScript(scrollScript);
    }
  }, [isContentReady, initialScrollY]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'progress':
          if (onProgressChange && message.progress !== undefined) {
            onProgressChange(message.progress);
          }
          break;

        case 'wordTap':
        case 'wordLongPress':
          if (message.foreignWord && message.originalWord) {
            const wordData: ForeignWordData = {
              originalWord: message.originalWord,
              foreignWord: message.foreignWord,
              startIndex: 0,
              endIndex: 0,
              wordEntry: {
                id: message.wordId || '',
                sourceWord: message.originalWord,
                targetWord: message.foreignWord,
                sourceLanguage: 'en',
                targetLanguage: 'el',
                proficiencyLevel: 'beginner',
                frequencyRank: 0,
                partOfSpeech: (message.partOfSpeech as PartOfSpeech) || 'other',
                variants: [],
                pronunciation: message.pronunciation || undefined,
              },
            };

            if (message.type === 'wordTap') {
              onWordTap?.(wordData);
            } else {
              onWordLongPress?.(wordData);
            }
          }
          break;

        case 'contentReady':
          setIsContentReady(true);
          setIsLoading(false);
          if (onContentReady && message.scrollHeight) {
            onContentReady(message.scrollHeight);
          }
          break;
      }
    } catch (error) {
      console.warn('Failed to parse WebView message:', error);
    }
  }, [onProgressChange, onWordTap, onWordLongPress, onWordHoverEnd, onContentReady]);

  // Get background color based on theme
  const backgroundColor = 
    settings.theme === 'dark' ? '#1a1a2e' :
    settings.theme === 'sepia' ? '#f4ecd8' : '#ffffff';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={[styles.webView, { backgroundColor }]}
        originWhitelist={['*']}
        onMessage={handleMessage}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
        decelerationRate="normal"
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        textInteractionEnabled={true}
        allowsInlineMediaPlayback={true}
        // Disable zoom to prevent accidental scaling
        scalesPageToFit={false}
        // Prevent link navigation
        onShouldStartLoadWithRequest={(request) => {
          // Only allow initial load
          return request.url === 'about:blank' || request.url.startsWith('data:');
        }}
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
});
