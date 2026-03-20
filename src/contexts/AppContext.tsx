import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppSettings {
  moduloAgendamentos: boolean;
  moduloProdutos: boolean;
  moduloEstoque: boolean;
  moduloIA: boolean;
  logoUrl: string;
}

interface AppContextType {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('barberpro-settings');
    return saved ? JSON.parse(saved) : {
      moduloAgendamentos: true,
      moduloProdutos: true,
      moduloEstoque: true,
      moduloIA: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('barberpro-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
