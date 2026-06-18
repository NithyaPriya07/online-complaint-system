import React, { useEffect, useContext, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ComplaintContext } from '../context/ComplaintContext';
import { AuthContext } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import { toast } from 'react-toastify';

const ComplaintDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { currentComplaint, fetchComplaintById, updateComplaint, loading } = useContext(ComplaintContext);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchComplaintById(id).catch(() => {
      toast.error('Failed to load complaint details');
      navigate('/');
    });
    // eslint-disable-next-line
  }, [id]);

  if (loading || !currentComplaint) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 100px)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Retrieving complaint details...</p>
      </div>
    );
  }

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await updateComplaint(currentComplaint._id, { status: newStatus });
      toast.success(`Complaint status set to ${newStatus}`);
      fetchComplaintById(currentComplaint._id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // Determine timeline steps based on status
  const getTimelineSteps = () => {
    const status = currentComplaint.status;
    const steps = [
      { label: 'Submitted', key: 'Pending', num: 1 },
      { label: 'Assigned', key: 'In Progress', num: 2 },
      { label: 'Resolved', key: 'Resolved', num: 3 },
      { label: 'Closed', key: 'Closed', num: 4 },
    ];

    let activeIndex = 1;
    if (status === 'In Progress') activeIndex = 2;
    else if (status === 'Resolved') activeIndex = 3;
    else if (status === 'Closed') activeIndex = 4;

    return { steps, activeIndex };
  };

  const { steps, activeIndex } = getTimelineSteps();
  const progressPercent = ((activeIndex - 1) / (steps.length - 1)) * 100;

  return (
    <div style={{ padding: '2rem 5%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header back link */}
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: '500' }}>
        ← Back to Dashboard
      </Link>

      <div className="grid grid-cols-3" style={{ alignItems: 'start' }}>
        {/* Left Side: Ticket Details & Timeline */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Info Card */}
          <div className="glass-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-progress" style={{ marginBottom: '0.5rem', background: 'rgba(255,255,255,0.06)' }}>
                  {currentComplaint.category}
                </span>
                <h2 style={{ fontSize: '1.75rem' }}>{currentComplaint.title}</h2>
              </div>
              <span className={`badge badge-${currentComplaint.status.toLowerCase().replace(' ', '')}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                {currentComplaint.status}
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
              {currentComplaint.description}
            </p>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div>
                <strong>Filed By:</strong> {currentComplaint.user?.name} ({currentComplaint.user?.email})
              </div>
              <div>
                <strong>Filed Date:</strong> {new Date(currentComplaint.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Progress Timeline Tracker */}
          <div className="glass-container">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📦 Resolution Timeline</h3>
            <div className="timeline">
              <div className="timeline-progress" style={{ width: `${progressPercent}%` }} />
              {steps.map((step) => {
                const isActive = step.num === activeIndex;
                const isCompleted = step.num < activeIndex;
                return (
                  <div
                    key={step.key}
                    className={`timeline-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  >
                    <div className="timeline-node">
                      {isCompleted ? '✓' : step.num}
                    </div>
                    <div className="timeline-label">{step.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Center Card */}
          <div className="glass-container">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>⚡ Action Center</h3>
            
            {/* Agent Actions */}
            {user?.role === 'AGENT' && currentComplaint.agent?._id === user.id && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                {currentComplaint.status === 'In Progress' && (
                  <button
                    onClick={() => handleUpdateStatus('Resolved')}
                    className="btn btn-primary"
                    disabled={updating}
                  >
                    Mark as Resolved
                  </button>
                )}
                {currentComplaint.status === 'Resolved' && (
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Ticket resolved. Awaiting user feedback/closure.
                  </p>
                )}
                {currentComplaint.status === 'Closed' && (
                  <p style={{ color: 'var(--text-muted)' }}>This complaint is closed.</p>
                )}
              </div>
            )}

            {/* User Actions */}
            {user?.role === 'USER' && currentComplaint.user?._id === user.id && (
              <div>
                {currentComplaint.status === 'Resolved' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      The agent has marked this complaint as resolved. Please provide feedback to close it.
                    </p>
                    <Link to={`/feedback/${currentComplaint._id}`} className="btn btn-primary">
                      Rate Service & Close Ticket
                    </Link>
                  </div>
                )}
                {currentComplaint.status === 'Closed' && (
                  <p style={{ color: 'var(--text-muted)' }}>Thank you! This complaint has been successfully resolved and closed.</p>
                )}
                {currentComplaint.status === 'Pending' && (
                  <p style={{ color: 'var(--text-secondary)' }}>Your complaint is pending agent assignment. Keep check for updates.</p>
                )}
                {currentComplaint.status === 'In Progress' && (
                  <p style={{ color: 'var(--text-secondary)' }}>An agent is currently looking into your ticket. You can chat with them below.</p>
                )}
              </div>
            )}

            {/* Admin Actions */}
            {user?.role === 'ADMIN' && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Override Status:</span>
                <select
                  value={currentComplaint.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="form-control"
                  style={{ background: 'var(--bg-secondary)', maxWidth: '160px', padding: '0.4rem' }}
                  disabled={updating}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Agent Info Card & Real-time Chat Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Agent details */}
          <div className="glass-container" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Assigned Handler</h4>
            {currentComplaint.agent ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '50%' }}>👨‍💻</span>
                <div>
                  <h4 style={{ fontSize: '1.05rem' }}>{currentComplaint.agent.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{currentComplaint.agent.email}</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2rem' }}>⏳</span>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '500' }}>Awaiting Agent Assignment</h4>
                  <p style={{ fontSize: '0.8rem' }}>Administration will assign shortly</p>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Chat Room */}
          {currentComplaint.agent ? (
            <ChatBox complaintId={currentComplaint._id} />
          ) : (
            <div className="glass-container" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Chat Offline</h4>
              <p style={{ fontSize: '0.8rem' }}>Chat features will activate once an agent is assigned.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetails;
