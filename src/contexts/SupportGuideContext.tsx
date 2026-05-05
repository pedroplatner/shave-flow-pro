import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SupportGuideContextType {
  open: boolean;
  openGuide: () => void;
  closeGuide: () => void;
}

const SupportGuideContext = createContext<SupportGuideContextType | null>(null);

const seenKey = (userId: string) => `support_seen_${userId}`;

export function SupportGuideProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem(seenKey(user.id));
    if (!seen) setOpen(true);
  }, [user]);

  const closeGuide = () => {
    if (user) localStorage.setItem(seenKey(user.id), '1');
    setOpen(false);
  };

  const openGuide = () => setOpen(true);

  return (
    <SupportGuideContext.Provider value={{ open, openGuide, closeGuide }}>
      {children}
    </SupportGuideContext.Provider>
  );
}

export const useSupportGuide = () => {
  const ctx = useContext(SupportGuideContext);
  if (!ctx) throw new Error('useSupportGuide must be used within SupportGuideProvider');
  return ctx;
};
