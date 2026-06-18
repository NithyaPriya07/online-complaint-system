import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ComplaintContext } from '../context/ComplaintContext';
import { AuthContext } from '../context/AuthContext';
import DashboardStats from '../components/DashboardStats';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { complaints, fetchComplaints, updateComplaint, loading } = useContext(ComplaintContext);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(true);

  const loadAdminData = async () => {
    setLoadingStats(true);
    try {
      // Fetch complaints
      await fetchComplaints();

      // Fetch agents
      const agentsRes = await axios.get('http://localhost:5000/api/agents');
      setAgents(agentsRes.data.data);

      // Fetch analytics stats
      const statsRes = await axios.get('http://localhost:5000/api/agents/stats');
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('Error loading admin details:', err);
      toast.error('Failed to retrieve system analytics');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line
  }, []);

  const handleAssignAgent = async (complaintId, agentId) => {
    if (!agentId) return;
    try {
      await updateComplaint(complaintId, { agentId });
      toast.success('Agent assigned successfully!');
      loadAdminData(); // Refresh all stats & lists
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign agent');
    }
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
            System Console: <span className="gradient-text">{user?.name}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>System overview, agent assignment desk, and analytics</p>
        </div>
      </header>

      {/* Stats Cards */}
      <DashboardStats stats={stats.summary} />

      {/* Analytics Breakdown Row */}
      <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="glass-container">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>📌 Category Share</h3>
          {loadingStats ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          ) : !stats.categoryStats || stats.categoryStats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No category data available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {stats.categoryStats.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500' }}>{item._id}</span>
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                    {item.count} tickets
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-container">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>⭐ Quality & Satisfaction</h3>
          {loadingStats ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', height: '100%', paddingBottom: '1rem' }}>
              <div style={{ fontSize: '3rem', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '50%', color: 'hsl(38, 92%, 50%)' }}>
                ⭐
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                  {stats.feedback?.averageRating || 'N/A'}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Average user rating (out of {stats.feedback?.count || 0} reviews)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3">
        {/* Main Complaints Management Table */}
        <div className="glass-container" style={{ gridColumn: 'span 2', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.2rem', fontSize: '1.25rem' }}>All System Complaints</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Loading complaints database...
            </div>
          ) : complaints.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No complaints filed on the platform yet.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint) => (
                    <tr key={complaint._id}>
                      <td style={{ fontWeight: '600' }}>{complaint.title}</td>
                      <td>{complaint.user?.name}</td>
                      <td>
                        <span className={getStatusBadgeClass(complaint.status)}>
                          {complaint.status}
                        </span>
                      </td>
                      <td>
                        {complaint.status === 'Pending' ? (
                          <select
                            onChange={(e) => handleAssignAgent(complaint._id, e.target.value)}
                            defaultValue=""
                            className="form-control"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', background: 'var(--bg-secondary)', maxWidth: '140px' }}
                          >
                            <option value="" disabled>Choose Agent</option>
                            {agents.map((ag) => (
                              <option key={ag.agent._id} value={ag.agent._id}>
                                {ag.agent.name}
                              </option>
                            ))}
                          </select>
                        ) : complaint.agent ? (
                          <span>👤 {complaint.agent.name}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <Link to={`/complaints/${complaint._id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Agents Status Side Panel */}
        <div className="glass-container" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.2rem', fontSize: '1.25rem' }}>👩‍💻 Agent Roster</h3>
          {loadingStats ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading roster...</p>
          ) : agents.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '2rem 0' }}>No registered support agents found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {agents.map((ag) => (
                <div
                  key={ag._id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '0.8rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{ag.agent?.name}</span>
                    <span style={{ fontSize: '0.75rem', color: ag.status === 'Available' ? 'hsl(142, 70%, 45%)' : 'hsl(0, 0%, 50%)' }}>
                      ● {ag.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Email: {ag.agent?.email}</span>
                    <span>{ag.assignedComplaints?.length || 0} active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
