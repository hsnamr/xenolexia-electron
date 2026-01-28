/**
 * useAsync Hook - Handles async operations with loading/error states
 */

import {useState, useCallback} from 'react';

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseAsyncReturn<T, Args extends any[]> extends AsyncState<T> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

export function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState(prev => ({...prev, isLoading: true, error: null}));

      try {
        const result = await asyncFunction(...args);
        setState({data: result, isLoading: false, error: null});
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({data: null, isLoading: false, error: err});
        return null;
      }
    },
    [asyncFunction],
  );

  const reset = useCallback(() => {
    setState({data: null, isLoading: false, error: null});
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
