import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ComplaintContext } from '../context/ComplaintContext';
import { toast } from 'react-toastify';

const FeedbackPage = () => {
  const { id } = useParams();
  const { currentComplaint, fetchComplaintById, submitFeedback, updateComplaint, loading } = useContext(ComplaintContext);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchComplaintById(id).catch(() => {
      toast.error('Failed to load complaint data');
      navigate('/');
    });
    // eslint-disable-next-line
  }, [id]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!rating) {
      return toast.error('Please choose a star rating');
    }

    setSubmitting(true);
    try {
      // 1. Submit rating & comment
      await submitFeedback({
        complaintId: id,
        rating,
        comments,
      });

      // 2. Set complaint status to Closed
      await updateComplaint(id, { status: 'Closed' });

      toast.success('Thank you! Ticket closed and feedback submitted successfully.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !currentComplaint) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 100px)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading feedback panel...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', padding: '1.5rem' }}>
      <div className="glass-container" style={{ width: '100%', maxWidth: '480px' }}>
        <Link to={`/complaints/${id}`} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '1.5rem' }}>
          ← Back to Details
        </Link>
        
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }} className="gradient-text">Share Your Feedback</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Your feedback helps us maintain high support standards.
        </p>

        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid var(--border-card)' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{currentComplaint.title}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Assigned Agent: {currentComplaint.agent?.name || 'Unassigned'}
          </p>
        </div>

        <form onSubmit={handleSubmitFeedback}>
          <div className="form-group" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <label className="form-label" style={{ marginBottom: '1rem' }}>Overall Satisfaction Rating</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '2.5rem',
                    cursor: 'pointer',
                    color: star <= rating ? 'hsl(38, 92%, 50%)' : 'rgba(255, 255, 255, 0.15)',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseEnter={(e) => { e.target.style.transform = 'scale(1.25)'; }}
                  onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Comments & Suggestions (Optional)</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Tell us what you liked, or where we can improve..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }} disabled={submitting}>
            {submitting ? 'Submitting & Closing Ticket...' : 'Submit Feedback & Close Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;
