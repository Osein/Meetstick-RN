import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {palette} from '@/theme/colors';

type GlobalLoadingState = {
  visible: boolean;
  message?: string;
};

type LoadingContextValue = {
  state: GlobalLoadingState;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export const LoadingProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [activeCount, setActiveCount] = useState(0);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const showLoading = useCallback((nextMessage?: string) => {
    setActiveCount(prev => prev + 1);
    if (nextMessage) {
      setMessage(nextMessage);
    }
  }, []);

  const hideLoading = useCallback(() => {
    setActiveCount(prev => {
      const next = Math.max(0, prev - 1);
      if (next === 0) {
        setMessage(undefined);
      }
      return next;
    });
  }, []);

  const value = useMemo<LoadingContextValue>(
    () => ({
      state: {
        visible: activeCount > 0,
        message
      },
      showLoading,
      hideLoading
    }),
    [activeCount, message, showLoading, hideLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {activeCount > 0 ? (
        <View
          pointerEvents="auto"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,0.28)',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <View
            style={{
              minWidth: 140,
              borderRadius: 12,
              backgroundColor: '#fff',
              paddingVertical: 16,
              paddingHorizontal: 20,
              alignItems: 'center',
              gap: 10
            }}
          >
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={{fontSize: 14, color: palette.textPrimary}}>{message || 'Yükleniyor...'}</Text>
          </View>
        </View>
      ) : null}
    </LoadingContext.Provider>
  );
};

export const useGlobalLoading = (): LoadingContextValue => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within LoadingProvider');
  }
  return context;
};
