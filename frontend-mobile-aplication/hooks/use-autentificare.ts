import { useContext } from 'react';
import { ContextAutentificare } from '@/contexts/context-autentificare';

export function useAutentificare() {
  const context = useContext(ContextAutentificare);
  if (!context) {
    throw new Error('useAutentificare trebuie folosit in interiorul FurnizorAutentificare');
  }
  return context;
}
