import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

import Home from './pages/Home/Home';
import SignIn from './pages/SignIn/SignIn';
import SignUp from './pages/SignUp/SignUp';
import Settings from './pages/Settings/Settings';
import Training from './pages/Training/Training';
import Documents from './pages/Documents/Documents';
import Reports from './pages/Reports/Reports';
import Admin from './pages/Admin/Admin';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import Contabil from './pages/Contabil/Contabil';
import ContabilDashboard from './pages/ContabilDashboard/ContabilDashboard';
import Receptionist from './pages/Receptionist/Receptionist';
import Generator from './pages/Generator/Generator';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import ChatWidget from './components/ChatWidget/ChatWidget';

import { useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

/* Guard de rol — cere ca user-ul logat sa aiba unul din rolurile listate. */
function RoleGuard({
  allowed,
  userRole,
  children,
}: {
  allowed: string[];
  userRole: string | undefined;
  children: React.ReactNode;
}) {
  const r = (userRole || '').toLowerCase();
  if (!allowed.map((a) => a.toLowerCase()).includes(r)) {
    return <Navigate to="/home" />;
  }
  return <>{children}</>;
}

function App() {
  const location = useLocation();
  const { isLoggedIn, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-x-hidden flex justify-center items-center">
        <p>Se încarcă...</p>
      </div>
    );
  }

  // Admin/super_admin → AdminDashboard, contabil → ContabilDashboard,
  // receptionist → Receptionist (cu tab Overview integrat), restul → Home (landing)
  const role = (user?.role || '').toLowerCase();
  const isAdmin = isLoggedIn && (role === 'admin' || role === 'super_admin');
  const isContabil = isLoggedIn && role === 'contabil';
  const isReceptionist = isLoggedIn && role === 'receptionist';

  const dashboardForRole =
    isAdmin ? <AdminDashboard />
    : isContabil ? <ContabilDashboard />
    : isReceptionist ? <Receptionist />
    : null;
  const homeElement = dashboardForRole || <Home isLoggedIn={isLoggedIn} />;
  const homeAuthElement = isLoggedIn ? (dashboardForRole || <Home isLoggedIn={true} />) : <Navigate to="/signin" />;

  return (
    <LanguageProvider>
      <ErrorBoundary>
        <div className="min-h-screen relative overflow-x-hidden">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={homeElement} />
            <Route path="/home" element={homeAuthElement} />
            <Route path="/signin" element={isLoggedIn ? <Navigate to="/home" /> : <SignIn />} />
            <Route path="/signup" element={isLoggedIn ? <Navigate to="/home" /> : <SignUp />} />
            <Route path="/settings" element={isLoggedIn ? <Settings /> : <Navigate to="/signin" />} />
            <Route path="/training" element={isLoggedIn ? <Training /> : <Navigate to="/signin" />} />
            <Route path="/documents" element={isLoggedIn ? <Documents /> : <Navigate to="/signin" />} />
            <Route path="/reports" element={isLoggedIn ? <Reports /> : <Navigate to="/signin" />} />
            <Route path="/generator" element={isLoggedIn ? <Generator /> : <Navigate to="/signin" />} />
            <Route
              path="/admin"
              element={
                isLoggedIn ? (
                  <RoleGuard allowed={['admin', 'super_admin']} userRole={user?.role}>
                    <Admin />
                  </RoleGuard>
                ) : (
                  <Navigate to="/signin" />
                )
              }
            />
            <Route
              path="/contabil"
              element={
                isLoggedIn ? (
                  <RoleGuard allowed={['contabil']} userRole={user?.role}>
                    <Contabil />
                  </RoleGuard>
                ) : (
                  <Navigate to="/signin" />
                )
              }
            />
            <Route
              path="/receptionist"
              element={
                isLoggedIn ? (
                  <RoleGuard allowed={['receptionist']} userRole={user?.role}>
                    <Receptionist />
                  </RoleGuard>
                ) : (
                  <Navigate to="/signin" />
                )
              }
            />
          </Routes>
          {/* Djarvis (chat AI cu legislatie RM) — DOAR pentru clienti.
              Admin/contabil/receptionist nu il vad — ei au alte instrumente. */}
          {isLoggedIn && role === 'client' && <ChatWidget />}
        </div>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

export default App;
