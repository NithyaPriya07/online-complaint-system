import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ComplaintProvider } from './context/ComplaintContext';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ComplaintDetails from './pages/ComplaintDetails';
import FeedbackPage from './pages/FeedbackPage';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Verifying login session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect role to their respective dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'AGENT') return <Navigate to="/agent-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ComplaintProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flexGrow: 1 }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected User Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['USER']}>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/feedback/:id"
                  element={
                    <ProtectedRoute allowedRoles={['USER']}>
                      <FeedbackPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Agent Routes */}
                <Route
                  path="/agent-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['AGENT']}>
                      <AgentDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Shared Complaint Details Route */}
                <Route
                  path="/complaints/:id"
                  element={
                    <ProtectedRoute allowedRoles={['USER', 'AGENT', 'ADMIN']}>
                      <ComplaintDetails />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <footer style={{ padding: '2rem 1rem', textAlign: 'center', borderTop: '1px solid var(--border-card)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} ResolveFlow Complaint Management System. All rights reserved.
            </footer>
          </div>
          <ToastContainer position="bottom-right" autoClose={4000} theme="dark" />
        </Router>
      </ComplaintProvider>
    </AuthProvider>
  );
}

export default App;
