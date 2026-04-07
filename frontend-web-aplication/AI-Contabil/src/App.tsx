import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

import Home from './pages/Home/Home';
import SignIn from './pages/SignIn/SignIn';
import SignUp from './pages/SignUp/SignUp';
import Settings from './pages/Settings/Settings';
import Training from './pages/Training/Training';
import Documents from './pages/Documents/Documents';
import Reports from './pages/Reports/Reports';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import ChatWidget from './components/ChatWidget/ChatWidget';

import { useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

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
    <LanguageProvider>
      <ErrorBoundary>
        <div className="min-h-screen relative overflow-x-hidden">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
            <Route path="/home" element={isLoggedIn ? <Home isLoggedIn={true} /> : <Navigate to="/signin" />} />
            <Route path="/signin" element={isLoggedIn ? <Navigate to="/home" /> : <SignIn />} />
            <Route path="/signup" element={isLoggedIn ? <Navigate to="/home" /> : <SignUp />} />
            <Route path="/settings" element={isLoggedIn ? <Settings /> : <Navigate to="/signin" />} />
            <Route path="/training" element={isLoggedIn ? <Training /> : <Navigate to="/signin" />} />
            <Route path="/documents" element={isLoggedIn ? <Documents /> : <Navigate to="/signin" />} />
            <Route path="/reports" element={isLoggedIn ? <Reports /> : <Navigate to="/signin" />} />
          </Routes>
          {isLoggedIn && <ChatWidget />}
        </div>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

export default App;
