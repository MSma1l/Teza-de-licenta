/* ============================================
   APP.TSX - Componenta principală a aplicației

   Gestionează rutele (paginile) aplicației:
   - "/" → Pagina Home (înainte de logare)
   - "/home" → Pagina Home (după logare)
   - "/signin" → Pagina de logare
   - "/signup" → Pagina de înregistrare
   - "/settings" → Pagina de setări

   Folosește AuthContext pentru starea de autentificare.
   ============================================ */

import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

/* Importăm paginile aplicației */
import Home from './pages/Home/Home';
import SignIn from './pages/SignIn/SignIn';
import SignUp from './pages/SignUp/SignUp';
import Settings from './pages/Settings/Settings';

/* Importăm hook-ul de autentificare */
import { useAuth } from './context/AuthContext';

/* Stiluri specifice App-ului */
import './App.css';

function App() {
  const location = useLocation();
  const { isLoggedIn, loading } = useAuth();

  /* Afișăm un indicator de încărcare cât se verifică token-ul */
  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes location={location} key={location.pathname}>
        {/* Ruta "/" - Pagina Home */}
        <Route
          path="/"
          element={<Home isLoggedIn={isLoggedIn} />}
        />

        {/* Ruta "/home" - Pagina Home (redirect dacă nu e logat) */}
        <Route
          path="/home"
          element={isLoggedIn ? <Home isLoggedIn={true} /> : <Navigate to="/signin" />}
        />

        {/* Ruta "/signin" - redirect la /home dacă deja logat */}
        <Route
          path="/signin"
          element={isLoggedIn ? <Navigate to="/home" /> : <SignIn />}
        />

        {/* Ruta "/signup" - redirect la /home dacă deja logat */}
        <Route
          path="/signup"
          element={isLoggedIn ? <Navigate to="/home" /> : <SignUp />}
        />

        {/* Ruta "/settings" - necesită autentificare */}
        <Route
          path="/settings"
          element={isLoggedIn ? <Settings /> : <Navigate to="/signin" />}
        />
      </Routes>
    </div>
  );
}

export default App;
