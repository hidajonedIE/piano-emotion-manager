import { useState, useCallback } from 'react';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarState {
  visible: boolean;
  message: string;
  type: SnackbarType;
}

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showSnackbar = useCallback((message: string, type: SnackbarType = 'info') => {
    setSnackbar({
      visible: true,
      message,
      type,
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    showSnackbar,
    hideSnackbar,
    snackbar,
  };
}
