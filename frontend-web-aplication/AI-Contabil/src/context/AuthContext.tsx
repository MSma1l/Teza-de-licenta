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
import { clearTokens } from '../api/apiClient';

interface AuthContextValue {
  user: UserData | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  loading: true,
  login: async () => {},
  register: async () => '',
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSavedToken();
  }, []);

  async function checkSavedToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch {
        clearTokens();
      }
    }
    setLoading(false);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
