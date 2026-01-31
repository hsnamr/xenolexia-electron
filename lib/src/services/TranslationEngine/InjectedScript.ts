/**
 * Injected Script - JavaScript injected into WebView for foreign word interaction
 *
 * This module generates the JavaScript that runs inside the WebView to:
 * - Track scroll progress
 * - Handle taps on foreign words
 * - Handle long-press for more options
 * - Apply reader settings dynamically
 * - Extract context sentences
 */

// ============================================================================
// Types
// ============================================================================

export interface InjectedScriptOptions {
  /** Whether to enable haptic feedback on tap */
  enableHaptics?: boolean;
  /** Long press duration in milliseconds */
  longPressDuration?: number;
  /** Progress update throttle in milliseconds */
  progressThrottle?: number;
  /** Number of words for context sentence extraction */
  contextWords?: number;
}

// ============================================================================
// Script Generator
// ============================================================================

/**
 * Generate the JavaScript to inject into the WebView
 */
export function generateInjectedScript(options: InjectedScriptOptions = {}): string {
  const {
    longPressDuration = 500,
    progressThrottle = 100,
    contextWords = 10,
  } = options;

  return `
(function() {
  'use strict';

  // ============================================================================
  // Constants
  // ============================================================================
  
  const LONG_PRESS_DURATION = ${longPressDuration};
  const PROGRESS_THROTTLE = ${progressThrottle};
  const CONTEXT_WORDS = ${contextWords};
  
  // ============================================================================
  // State
  // ============================================================================
  
  let scrollTimeout = null;
  let longPressTimer = null;
  let longPressTarget = null;
  let isLongPress = false;
  let lastProgress = -1;
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  /**
   * Send message to React Native
   */
  function sendMessage(type, payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
    }
  }
  
  /**
   * Extract context sentence around a word element
   */
  function extractContext(element) {
    // Get the parent paragraph or containing block
    let container = element.parentElement;
    while (container && !['P', 'DIV', 'SECTION', 'ARTICLE', 'SPAN'].includes(container.tagName)) {
      container = container.parentElement;
    }
    
    if (!container) {
      return element.textContent;
    }
    
    const text = container.textContent || '';
    const wordText = element.textContent || '';
    const wordIndex = text.indexOf(wordText);
    
    if (wordIndex === -1) {
      return text.substring(0, 100);
    }
    
    // Extract words around the target word
    const words = text.split(/\\s+/);
    const targetWord = wordText.trim();
    
    let targetIndex = -1;
    for (let i = 0; i < words.length; i++) {
      if (words[i].includes(targetWord)) {
        targetIndex = i;
        break;
      }
    }
    
    if (targetIndex === -1) {
      return text.substring(0, 100);
    }
    
    const start = Math.max(0, targetIndex - CONTEXT_WORDS);
    const end = Math.min(words.length, targetIndex + CONTEXT_WORDS + 1);
    
    let context = words.slice(start, end).join(' ');
    
    // Add ellipsis if truncated
    if (start > 0) context = '...' + context;
    if (end < words.length) context = context + '...';
    
    return context;
  }
  
  /**
   * Get position of element for popup placement
   */
  function getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
    };
  }
  
  /**
   * Add visual feedback to tapped word
   */
  function addTapFeedback(element) {
    element.classList.add('foreign-word--tapped');
    setTimeout(() => {
      element.classList.remove('foreign-word--tapped');
    }, 200);
  }
  
  // ============================================================================
  // Progress Tracking
  // ============================================================================
  
  function updateProgress() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
    const normalizedProgress = Math.min(100, Math.max(0, progress));
    
    // Only send if progress changed significantly
    if (Math.abs(normalizedProgress - lastProgress) >= 0.5 || normalizedProgress === 0 || normalizedProgress === 100) {
      lastProgress = normalizedProgress;
      
      // Update progress bar
      const indicator = document.getElementById('progress-indicator');
      if (indicator) {
        indicator.style.width = normalizedProgress + '%';
      }
      
      sendMessage('progress', {
        progress: normalizedProgress,
        scrollY: window.scrollY,
        scrollHeight: scrollHeight,
      });
    }
  }
  
  window.addEventListener('scroll', function() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(updateProgress, PROGRESS_THROTTLE);
  });
  
  // ============================================================================
  // Word Tap Handling
  // ============================================================================
  
  function handleWordTap(element, isLongPressAction) {
    addTapFeedback(element);
    
    const foreignWord = element.textContent;
    const originalWord = element.dataset.original;
    const wordId = element.dataset.wordId;
    const pronunciation = element.dataset.pronunciation;
    const partOfSpeech = element.dataset.pos || 'unknown';
    const context = extractContext(element);
    const position = getElementPosition(element);
    
    sendMessage(isLongPressAction ? 'wordLongPress' : 'wordTap', {
      foreignWord,
      originalWord,
      wordId,
      pronunciation,
      partOfSpeech,
      context,
      position,
    });
  }
  
  // Click handler for mouse/pointer events
  document.addEventListener('click', function(e) {
    // Ignore if this was a long press
    if (isLongPress) {
      isLongPress = false;
      return;
    }
    
    const target = e.target;
    if (target && target.classList && target.classList.contains('foreign-word')) {
      e.preventDefault();
      e.stopPropagation();
      handleWordTap(target, false);
    }
  });

  // ============================================================================
  // Hover Support (Desktop)
  // ============================================================================
  
  let hoverTimeout = null;
  let hoveredElement = null;
  
  document.addEventListener('mouseenter', function(e) {
    const target = e.target;
    if (target && target.classList && target.classList.contains('foreign-word')) {
      hoveredElement = target;
      // Show popup after short delay
      hoverTimeout = setTimeout(function() {
        if (hoveredElement === target) {
          handleWordTap(target, false);
        }
      }, 300); // 300ms delay before showing on hover
    }
  }, true); // Use capture phase to catch events early
  
  document.addEventListener('mouseleave', function(e) {
    const target = e.target;
    if (target && target.classList && target.classList.contains('foreign-word')) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      hoveredElement = null;
      // Send message to hide popup
      sendMessage('wordHoverEnd', {});
    }
  }, true);
  
  // ============================================================================
  // Long Press Handling
  // ============================================================================
  
  document.addEventListener('touchstart', function(e) {
    const target = e.target;
    if (target && target.classList && target.classList.contains('foreign-word')) {
      longPressTarget = target;
      isLongPress = false;
      
      longPressTimer = setTimeout(function() {
        isLongPress = true;
        if (longPressTarget) {
          handleWordTap(longPressTarget, true);
          longPressTarget = null;
        }
      }, LONG_PRESS_DURATION);
    }
  }, { passive: true });
  
  document.addEventListener('touchend', function(e) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressTarget = null;
  }, { passive: true });
  
  document.addEventListener('touchmove', function(e) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressTarget = null;
    isLongPress = false;
  }, { passive: true });
  
  document.addEventListener('touchcancel', function(e) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressTarget = null;
    isLongPress = false;
  }, { passive: true });
  
  // ============================================================================
  // Reader Settings
  // ============================================================================
  
  window.applyReaderSettings = function(settings) {
    const root = document.documentElement;
    
    if (settings.fontSize) {
      root.style.setProperty('--font-size', settings.fontSize + 'px');
    }
    if (settings.fontFamily) {
      root.style.setProperty('--font-family', settings.fontFamily);
    }
    if (settings.lineHeight) {
      root.style.setProperty('--line-height', settings.lineHeight);
    }
    if (settings.textAlign) {
      root.style.setProperty('--text-align', settings.textAlign);
    }
    if (settings.marginHorizontal) {
      root.style.setProperty('--margin-h', settings.marginHorizontal + 'px');
    }
  };
  
  /**
   * Scroll to a specific Y position
   */
  window.scrollToPosition = function(y) {
    window.scrollTo({ top: y, behavior: 'instant' });
    setTimeout(updateProgress, 50);
  };
  
  /**
   * Scroll to an element by ID
   */
  window.scrollToElement = function(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  /**
   * Highlight a specific word temporarily
   */
  window.highlightWord = function(wordId) {
    const elements = document.querySelectorAll('[data-word-id="' + wordId + '"]');
    elements.forEach(el => {
      el.classList.add('foreign-word--highlighted');
      setTimeout(() => {
        el.classList.remove('foreign-word--highlighted');
      }, 2000);
    });
  };
  
  /**
   * Mark a word as known (remove foreign styling)
   */
  window.markWordAsKnown = function(wordId) {
    const elements = document.querySelectorAll('[data-word-id="' + wordId + '"]');
    elements.forEach(el => {
      el.classList.remove('foreign-word');
      el.classList.add('foreign-word--known');
    });
  };
  
  // ============================================================================
  // Initialization
  // ============================================================================
  
  // Initial progress update
  setTimeout(updateProgress, 100);
  
  // Notify React Native that content is ready
  sendMessage('contentReady', {
    scrollHeight: document.documentElement.scrollHeight,
    contentHeight: document.body.scrollHeight,
  });
})();
  `.trim();
}

/**
 * Generate CSS for foreign word styling
 */
export function generateForeignWordStyles(): string {
  return `
    /* Foreign word base styles */
    .foreign-word {
      color: var(--foreign-color, #6366f1);
      text-decoration: underline;
      text-decoration-style: dotted;
      text-underline-offset: 3px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s, transform 0.1s;
      display: inline;
      border-radius: 2px;
      padding: 0 2px;
      margin: 0 -2px;
    }

    /* Tap feedback */
    .foreign-word--tapped {
      background-color: rgba(99, 102, 241, 0.3);
      transform: scale(1.05);
    }

    /* Long press feedback */
    .foreign-word--highlighted {
      background-color: rgba(99, 102, 241, 0.4);
      animation: pulse 0.5s ease-in-out infinite;
    }

    /* Known word (user marked as known) */
    .foreign-word--known {
      color: inherit;
      text-decoration: none;
      font-weight: inherit;
      cursor: default;
    }

    /* Pulse animation for highlighted words */
    @keyframes pulse {
      0%, 100% {
        background-color: rgba(99, 102, 241, 0.4);
      }
      50% {
        background-color: rgba(99, 102, 241, 0.2);
      }
    }

    /* Progress indicator */
    #progress-indicator {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--foreign-color, #6366f1), #8b5cf6);
      width: 0%;
      transition: width 0.1s ease-out;
      z-index: 1000;
    }
  `;
}

/**
 * Combine script and styles into a single injectable script
 */
export function getFullInjectedContent(options?: InjectedScriptOptions): {
  script: string;
  styles: string;
} {
  return {
    script: generateInjectedScript(options),
    styles: generateForeignWordStyles(),
  };
}

// Export default instance
export const injectedScript = generateInjectedScript();
export const foreignWordStyles = generateForeignWordStyles();
