import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Vault from './pages/Vault';
import AdminDashboard from './pages/AdminDashboard';
import LegacyDashboard from './pages/LegacyDashboard';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import './index.css';

const getDashboardPath = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (user.role === 'Administrator') return '/admin-dashboard';
  if (user.role === 'Legacy Contact') return '/legacy-dashboard';
  return '/dashboard';
};

const PrivateRoute = ({ children }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
};

const RoleRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" />;

  return children;
};

const PublicRoute = ({ children }) => {
  return !localStorage.getItem('token') ? children : <Navigate to={getDashboardPath()} />;
};

function App() {
  return (
    <ThemeProvider>
      <ThemeToggle />
      <Router>
        <Routes>

          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route
            path="/dashboard"
            element={
              <RoleRoute roles={['Memory Owner']}>
                <Dashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/vault"
            element={
              <RoleRoute roles={['Memory Owner']}>
                <Vault />
              </RoleRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <RoleRoute roles={['Administrator']}>
                <AdminDashboard />
              </RoleRoute>
            }
          />

          <Route
            path="/legacy-dashboard"
            element={
              <RoleRoute roles={['Legacy Contact']}>
                <LegacyDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/unauthorized"
            element={
              <div className="auth-container">
                <div className="glass-panel auth-box">
                  <h2>Unauthorized Access</h2>
                  <p>You do not have permission to view this page.</p>
                </div>
              </div>
            }
          />
          <Route path="*" element={<Navigate to={getDashboardPath()} />} />
          
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
