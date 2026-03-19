import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

import Home from './pages/Home/Home';
import SignIn from './pages/SignIn/SignIn';
import SignUp from './pages/SignUp/SignUp';
import Settings from './pages/Settings/Settings';

import { useAuth } from './context/AuthContext';

function App() {
  const location = useLocation();
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-x-hidden flex justify-center items-center">
        <p>Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
        <Route path="/home" element={isLoggedIn ? <Home isLoggedIn={true} /> : <Navigate to="/signin" />} />
        <Route path="/signin" element={isLoggedIn ? <Navigate to="/home" /> : <SignIn />} />
        <Route path="/signup" element={isLoggedIn ? <Navigate to="/home" /> : <SignUp />} />
        <Route path="/settings" element={isLoggedIn ? <Settings /> : <Navigate to="/signin" />} />
      </Routes>
    </div>
  );
}

export default App;
