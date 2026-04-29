import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import NotificationHost from '@/components/Shared/NotificationHost';

type NotificationToast = {
  id: number;
  message: string;
};

type NotificationContextValue = {
  showSuccess: (message: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export function useNotificationContext() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider.');
  }

  return context;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const toastIdRef = useRef(0);
  const [toast, setToast] = useState<NotificationToast | null>(null);

  // v1 keeps the API intentionally small and success-focused.
  // Showing a new toast replaces the current one instead of queuing.
  const showSuccess = useCallback((message: string) => {
    toastIdRef.current += 1;
    setToast({
      id: toastIdRef.current,
      message,
    });
  }, []);

  const hideToast = useCallback((toastId: number) => {
    setToast((currentToast) => {
      if (!currentToast || currentToast.id !== toastId) {
        return currentToast;
      }

      return null;
    });
  }, []);

  const value = useMemo(
    () => ({
      showSuccess,
    }),
    [showSuccess]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationHost toast={toast} onHide={hideToast} />
    </NotificationContext.Provider>
  );
}
