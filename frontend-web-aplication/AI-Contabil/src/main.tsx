/* ============================================
   MAIN.TSX - Punctul de intrare al aplicației

   Aici:
   1. Importăm React și ReactDOM
   2. Importăm BrowserRouter pentru rutare
   3. Importăm AuthProvider pentru context autentificare
   4. Importăm stilurile globale
   5. Montăm aplicația în elementul #root
   ============================================ */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

/* Importăm stilurile globale (reset, variabile, animații) */
import './index.css';

/* Importăm contextul de autentificare */
import { AuthProvider } from './context/AuthContext';

/* Importăm componenta principală */
import App from './App.tsx';

/* Montăm aplicația în DOM */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
