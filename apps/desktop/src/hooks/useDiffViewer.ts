/**
 * Hook for managing diff viewer state
 */

import { useState, useCallback } from 'react';

export interface FileDiff {
  filePath: string;
  oldContent: string;
  newContent: string;
  unifiedDiff: string;
  lineChanges: {
    added: number;
    removed: number;
    modified: number;
  };
}

export interface DiffViewerState {
  isOpen: boolean;
  diff: FileDiff | null;
  filePath: string | null;
  onApply?: () => Promise<void>;
  onReject?: () => void;
}

export function useDiffViewer() {
  const [state, setState] = useState<DiffViewerState>({
    isOpen: false,
    diff: null,
    filePath: null
  });

  const showDiff = useCallback((
    diff: FileDiff,
    filePath: string,
    onApply?: () => Promise<void>,
    onReject?: () => void
  ) => {
    setState({
      isOpen: true,
      diff,
      filePath,
      onApply,
      onReject
    });
  }, []);

  const closeDiff = useCallback(() => {
    setState({
      isOpen: false,
      diff: null,
      filePath: null
    });
  }, []);

  const handleApply = useCallback(async () => {
    if (state.onApply) {
      await state.onApply();
      closeDiff();
    }
  }, [state.onApply, closeDiff]);

  const handleReject = useCallback(() => {
    if (state.onReject) {
      state.onReject();
    }
    closeDiff();
  }, [state.onReject, closeDiff]);

  return {
    ...state,
    showDiff,
    closeDiff,
    handleApply,
    handleReject
  };
}

