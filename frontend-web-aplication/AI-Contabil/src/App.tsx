/* ============================================
   APP.TSX - Componenta principală a aplicației

   Gestionează rutele (paginile) aplicației:
   - "/" → Pagina Home (înainte de logare)
   - "/home" → Pagina Home (după logare)
   - "/signin" → Pagina de logare
   - "/signup" → Pagina de înregistrare

   Navigarea între pagini se face cu animații
   de tranziție (fade + slide).

   NOTĂ: Momentan isLoggedIn este hardcodat.
   În viitor va fi gestionat de un context/store.
   ============================================ */

import { Routes, Route, useLocation } from 'react-router-dom';

/* Importăm paginile aplicației */
import Home from './pages/Home/Home';
import SignIn from './pages/SignIn/SignIn';
import SignUp from './pages/SignUp/SignUp';

/* Stiluri specifice App-ului */
import './App.css';

function App() {
  /* Hook-ul useLocation ne dă locația curentă (URL-ul paginii)
     Îl folosim ca key pe Routes pentru a re-renda la schimbarea paginii */
  const location = useLocation();

  return (
    /* Container-ul principal cu animație de tranziție */
    <div className="app">
      {/* Routes - definim toate rutele aplicației
          key={location.pathname} face ca la fiecare schimbare
          de pagină să se re-rendeze cu animație */}
      <Routes location={location} key={location.pathname}>
        {/* Ruta "/" - Pagina Home ÎNAINTE de logare
            Afișează navbar cu Sign In / Sign Up */}
        <Route
          path="/"
          element={<Home isLoggedIn={false} />}
        />

        {/* Ruta "/home" - Pagina Home DUPĂ logare
            Afișează navbar cu Notificări + Avatar + Chat bubble */}
        <Route
          path="/home"
          element={<Home isLoggedIn={true} />}
        />

        {/* Ruta "/signin" - Pagina de LOGARE */}
        <Route
          path="/signin"
          element={<SignIn />}
        />

        {/* Ruta "/signup" - Pagina de ÎNREGISTRARE */}
        <Route
          path="/signup"
          element={<SignUp />}
        />
      </Routes>
    </div>
  );
}

export default App;
