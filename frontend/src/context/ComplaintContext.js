import React, { createContext, useState } from 'react';
import axios from 'axios';

export const ComplaintContext = createContext();

const COMPLAINT_API_URL = 'http://localhost:5000/api/complaints';
const FEEDBACK_API_URL = 'http://localhost:5000/api/feedback';

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]);
  const [currentComplaint, setCurrentComplaint] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch complaints
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await axios.get(COMPLAINT_API_URL);
      setComplaints(res.data.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch complaint by ID
  const fetchComplaintById = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${COMPLAINT_API_URL}/${id}`);
      setCurrentComplaint(res.data.data);
      return res.data.data;
    } catch (err) {
      console.error('Error fetching complaint details:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create complaint
  const createComplaint = async (complaintData) => {
    try {
      const res = await axios.post(COMPLAINT_API_URL, complaintData);
      setComplaints([res.data.data, ...complaints]);
      return res.data.data;
    } catch (err) {
      console.error('Error creating complaint:', err);
      throw err;
    }
  };

  // Update complaint status or details
  const updateComplaint = async (id, updateData) => {
    try {
      const res = await axios.put(`${COMPLAINT_API_URL}/${id}`, updateData);
      
      // Update local state lists
      setComplaints(complaints.map(c => c._id === id ? res.data.data : c));
      
      // Update current selected complaint
      if (currentComplaint && currentComplaint._id === id) {
        setCurrentComplaint(res.data.data);
      }
      return res.data.data;
    } catch (err) {
      console.error('Error updating complaint:', err);
      throw err;
    }
  };

  // Submit feedback
  const submitFeedback = async (feedbackData) => {
    try {
      const res = await axios.post(FEEDBACK_API_URL, feedbackData);
      return res.data;
    } catch (err) {
      console.error('Error submitting feedback:', err);
      throw err;
    }
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        currentComplaint,
        loading,
        fetchComplaints,
        fetchComplaintById,
        createComplaint,
        updateComplaint,
        submitFeedback,
        setCurrentComplaint,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};
