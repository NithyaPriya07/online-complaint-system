import React, { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ComplaintContext } from '../context/ComplaintContext';
import { AuthContext } from '../context/AuthContext';
import DashboardStats from '../components/DashboardStats';

const AgentDashboard = () => {
  const { user } = useContext(AuthContext);
  const { complaints, fetchComplaints, loading } = useContext(ComplaintContext);

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line
  }, []);

  const calculateStats = () => {
    const stats = { total: complaints.length, pending: 0, inProgress: 0, resolved: 0, closed: 0 };
    complaints.forEach((c) => {
      if (c.status === 'Pending') stats.pending++;
      else if (c.status === 'In Progress') stats.inProgress++;
      else if (c.status === 'Resolved') stats.resolved++;
      else if (c.status === 'Closed') stats.closed++;
    });
    return stats;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Pending') return 'badge badge-pending';
    if (status === 'In Progress') return 'badge badge-progress';
    if (status === 'Resolved') return 'badge badge-resolved';
    return 'badge badge-closed';
  };

  return (
    <div style={{ padding: '2rem 5%', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem' }}>
            Agent Desk: <span className="gradient-text">{user?.name}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your assigned tickets and collaborate with clients</p>
        </div>
      </header>

      {/* Stats Cards */}
      <DashboardStats stats={calculateStats()} />

      {/* Complaints List Table */}
      <div className="glass-container" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.2rem', fontSize: '1.25rem' }}>Assigned Cases</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Loading assigned cases...
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '3rem' }}>🎉</span>
            <p style={{ marginTop: '1rem', fontWeight: '500' }}>Inbox Clean! No complaints currently assigned to you.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Pending complaints will be assigned by the administrator.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Submitted By</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint._id}>
                    <td style={{ fontWeight: '600' }}>{complaint.title}</td>
                    <td>
                      <div>{complaint.user?.name}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{complaint.user?.email}</span>
                    </td>
                    <td>{complaint.category}</td>
                    <td>
                      <span className={getStatusBadgeClass(complaint.status)}>
                        {complaint.status}
                      </span>
                    </td>
                    <td>
                      {new Date(complaint.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <Link to={`/complaints/${complaint._id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        Handle Issue
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;
