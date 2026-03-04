/* ============================================
   MAIN.TSX - Punctul de intrare al aplicației

   Aici:
   1. Importăm React și ReactDOM
   2. Importăm BrowserRouter pentru rutare
   3. Importăm stilurile globale
   4. Montăm aplicația în elementul #root

   BrowserRouter înconjoară App pentru a permite
   navigarea între pagini (SignIn, SignUp, Home).
   ============================================ */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

/* Importăm stilurile globale (reset, variabile, animații) */
import './index.css';

/* Importăm componenta principală */
import App from './App.tsx';

/* Montăm aplicația în DOM */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter permite folosirea rutelor în aplicație */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
