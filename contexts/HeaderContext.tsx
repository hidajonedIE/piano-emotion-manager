import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface HeaderConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  showBackButton?: boolean;
  rightAction?: ReactNode;
}

interface HeaderContextType {
  headerConfig: HeaderConfig;
  setHeaderConfig: (config: HeaderConfig) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    title: 'Inicio',
    icon: 'house.fill',
  });

  return (
    <HeaderContext.Provider value={{ headerConfig, setHeaderConfig }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}
