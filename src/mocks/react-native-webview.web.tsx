/**
 * Web mock for react-native-webview
 * Uses an iframe for web
 */

import React, {forwardRef, useImperativeHandle, useRef} from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';

export interface WebViewMessageEvent {
  nativeEvent: {
    data: string;
  };
}

export interface WebViewProps {
  source?: {uri?: string; html?: string};
  style?: StyleProp<ViewStyle>;
  onMessage?: (event: WebViewMessageEvent) => void;
  onLoad?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: unknown) => void;
  injectedJavaScript?: string;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  originWhitelist?: string[];
  scrollEnabled?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
}

export interface WebViewRef {
  injectJavaScript: (script: string) => void;
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
}

const WebView = forwardRef<WebViewRef, WebViewProps>((props, ref) => {
  const {
    source,
    style,
    onMessage,
    onLoad,
    onLoadEnd,
    injectedJavaScript,
  } = props;

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useImperativeHandle(ref, () => ({
    injectJavaScript: (script: string) => {
      try {
        iframeRef.current?.contentWindow?.postMessage(
          {type: 'injectJS', script},
          '*',
        );
      } catch (e) {
        console.warn('Failed to inject JavaScript:', e);
      }
    },
    reload: () => {
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    },
    goBack: () => {
      try {
        iframeRef.current?.contentWindow?.history.back();
      } catch (e) {
        console.warn('Cannot go back:', e);
      }
    },
    goForward: () => {
      try {
        iframeRef.current?.contentWindow?.history.forward();
      } catch (e) {
        console.warn('Cannot go forward:', e);
      }
    },
  }));

  // Handle messages from iframe
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'webview-message' && onMessage) {
        onMessage({
          nativeEvent: {
            data: event.data.payload,
          },
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onMessage]);

  // Inject JavaScript after load
  const handleLoad = () => {
    onLoad?.();
    if (injectedJavaScript && iframeRef.current?.contentWindow) {
      try {
        // Try to inject the script
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          const script = doc.createElement('script');
          script.textContent = injectedJavaScript;
          doc.body?.appendChild(script);
        }
      } catch (e) {
        console.warn('Could not inject JavaScript (cross-origin restriction):', e);
      }
    }
    onLoadEnd?.();
  };

  if (source?.html) {
    return (
      <View style={style}>
        <iframe
          ref={iframeRef}
          srcDoc={source.html}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          onLoad={handleLoad}
          sandbox="allow-scripts allow-same-origin"
        />
      </View>
    );
  }

  if (source?.uri) {
    return (
      <View style={style}>
        <iframe
          ref={iframeRef}
          src={source.uri}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          onLoad={handleLoad}
        />
      </View>
    );
  }

  return <View style={style} />;
});

WebView.displayName = 'WebView';

export {WebView};
export default WebView;
