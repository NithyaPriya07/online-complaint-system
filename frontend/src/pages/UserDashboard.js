import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ComplaintContext } from '../context/ComplaintContext';
import { AuthContext } from '../context/AuthContext';
import DashboardStats from '../components/DashboardStats';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const { complaints, fetchComplaints, createComplaint, loading } = useContext(ComplaintContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sanitation');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!title || !description || !category) {
      return toast.error('Please complete all form fields');
    }

    setSubmitting(true);
    try {
      await createComplaint({ title, category, description });
      toast.success('Complaint submitted successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Technical');
      
      // Close modal
      setModalOpen(false);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
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
            Welcome back, <span className="gradient-text">{user?.name}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Track and manage your submitted service requests</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-primary"
          style={{ marginLeft: 'auto', padding: '0.8rem 1.6rem' }}
        >
          ➕ Submit New Complaint
        </button>
      </header>

      {/* Stats Cards */}
      <DashboardStats stats={calculateStats()} />

      {/* Complaints List Table */}
      <div className="glass-container" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.2rem', fontSize: '1.25rem' }}>My Filed Complaints</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Loading complaints data...
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '3rem' }}>📁</span>
            <p style={{ marginTop: '1rem' }}>You haven't filed any complaints yet.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              File Your First Complaint
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Agent Assigned</th>
                  <th>Submitted Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint._id}>
                    <td style={{ fontWeight: '600' }}>{complaint.title}</td>
                    <td>{complaint.category}</td>
                    <td>
                      <span className={getStatusBadgeClass(complaint.status)}>
                        {complaint.status}
                      </span>
                    </td>
                    <td>
                      {complaint.agent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>👤</span> {complaint.agent.name}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      {new Date(complaint.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <Link to={`/complaints/${complaint._id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Complaint Modal Popup */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              ×
            </button>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }} className="gradient-text">
              Submit Complaint
            </h3>
            
            <form onSubmit={handleCreateComplaint}>
              <div className="form-group">
                <label className="form-label">Complaint Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Server unreachable, Billing error"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <option value="Sanitation">Sanitation</option>
                  <option value="Utilities">Utilities (Water, Power)</option>
                  <option value="Roads">Roads & Streets</option>
                  <option value="Other">Other Issues</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="5"
                  placeholder="Provide comprehensive details of the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'File Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
