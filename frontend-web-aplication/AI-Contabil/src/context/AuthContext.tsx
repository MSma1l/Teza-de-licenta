/* ============================================
   CONTEXT AUTENTIFICARE - Web

   Gestionează starea de autentificare:
   - user: datele utilizatorului logat
   - isLoggedIn: dacă utilizatorul este logat
   - loading: dacă se verifică token-ul
   - login(): funcție de logare
   - register(): funcție de înregistrare
   - logout(): funcție de delogare
   ============================================ */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../api/authApi';
import type { UserData, LoginData, RegisterData } from '../api/authApi';
import { clearTokens, saveTokens } from '../api/apiClient';

interface AuthContextValue {
  user: UserData | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<string>;
  logout: () => void;
  /** Folosit pentru login prin QR - primeste tokens deja generate de server. */
  setSession: (accessToken: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  loading: true,
  login: async () => {},
  register: async () => '',
  logout: () => {},
  setSession: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSavedToken();
  }, []);

  async function checkSavedToken() {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    // Niciun token stocat - nu suntem logati
    if (!accessToken && !refreshToken) {
      setLoading(false);
      return;
    }

    try {
      // apiRequest va incerca automat refresh la 401 daca refresh_token exista
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      // Daca si refresh-ul a esuat, sesiunea e moarta
      clearTokens();
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (data: LoginData) => {
    const userData = await loginUser(data);
    setUser(userData);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    await registerUser(data);
    return 'Contul a fost creat cu succes!';
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  /** Folosit pentru login QR - tokens vin direct de la server prin polling. */
  const setSession = useCallback(async (accessToken: string, refreshToken: string) => {
    saveTokens(accessToken, refreshToken);
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      clearTokens();
      throw new Error('Sesiune invalida');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        login,
        register,
        logout,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
