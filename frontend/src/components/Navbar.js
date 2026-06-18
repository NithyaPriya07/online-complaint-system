import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'ADMIN') return '/admin-dashboard';
    if (user.role === 'AGENT') return '/agent-dashboard';
    return '/dashboard';
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <span style={{ fontSize: '1.8rem' }}>🛡️</span>
        <span className="gradient-text">ResolveFlow</span>
      </Link>
      <ul className="nav-links">
        <li className="nav-item">
          <Link to="/">Home</Link>
        </li>
        {user ? (
          <>
            <li className="nav-item">
              <Link to={getDashboardLink()}>Dashboard</Link>
            </li>
            <li className="nav-item" style={{ marginLeft: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: user.role === 'ADMIN' ? 'violet' : user.role === 'AGENT' ? 'cyan' : 'lime' }} />
                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600' }}>
                  {user.name} ({user.role})
                </span>
              </div>
            </li>
            <li className="nav-item">
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li className="nav-item">
              <Link to="/login">Login</Link>
            </li>
            <li className="nav-item">
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                Get Started
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
