import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin-dashboard';
    if (user.role === 'AGENT') return '/agent-dashboard';
    return '/dashboard';
  };

  return (
    <div className="hero-section">
      <h1 className="hero-title">
        Resolve Issues <span className="gradient-text">Faster & Smarter</span>
      </h1>
      <p className="hero-subtitle">
        Welcome to ResolveFlow, a unified platform designed to simplify complaint handling, boost agent efficiency, and build transparency between users and admins.
      </p>
      
      <div className="hero-actions">
        {user ? (
          <Link to={getDashboardPath()} className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            Go to My Dashboard →
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
              Get Started Now
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
              Sign In
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-3" style={{ marginTop: '5rem', width: '100%', maxWidth: '1000px', textAlign: 'left' }}>
        <div className="glass-container">
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✏️</div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Easy Submission</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Submit technical, billing, or service complaints in seconds. Track statuses live with instant notifications.
          </p>
        </div>
        
        <div className="glass-container">
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤖</div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Smart Assignment</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Administrators assign issues to support agents based on categories. Real-time updates help resolve conflicts quickly.
          </p>
        </div>

        <div className="glass-container">
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Real-time Chat</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Communicate directly with your assigned agent. Share details, resolve bottlenecks, and give feedback upon completion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
