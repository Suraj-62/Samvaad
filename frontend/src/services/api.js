import axios from 'axios';

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) return envUrl.endsWith('/api') ? envUrl.slice(0, -4) : envUrl;
  return window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
};

export const BACKEND_URL = getBackendUrl();
const API_BASE_URL = `${BACKEND_URL}/api/interview`;

export const bookHumanInterview = async (details) => {
  const response = await axios.post(`${API_BASE_URL}/book-human`, details);
  return response.data;
};

export const fetchBookings = async (email) => {
  const response = await axios.get(`${API_BASE_URL}/bookings/${email}`);
  return response.data;
};

export const verifyMeeting = async (meetingId, meetingPassword) => {
  const response = await axios.post(`${API_BASE_URL}/verify-meeting`, { meetingId, meetingPassword });
  return response.data;
};

export const fetchAllBookings = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/all-bookings`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

export const confirmBooking = async (token, id) => {
  const response = await axios.put(`${API_BASE_URL}/confirm-booking/${id}`, {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

export const rejectBooking = async (token, id) => {
  const response = await axios.put(`${API_BASE_URL}/reject-booking/${id}`, {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

// Availability APIs
export const addAvailability = async (token, data) => {
  const response = await axios.post(`${API_BASE_URL}/availability`, data, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

export const fetchInterviewerAvailability = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/availability`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

export const deleteAvailability = async (token, id) => {
  const response = await axios.delete(`${API_BASE_URL}/availability/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

export const fetchPublicAvailableSlots = async () => {
  const response = await axios.get(`${API_BASE_URL}/available-slots`);
  return response.data;
};

export const createInstantMeeting = async (token, data) => {
  const response = await axios.post(`${API_BASE_URL}/create-instant`, data, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

export const createGroupDiscussion = async (token, data) => {
  const response = await axios.post(`${API_BASE_URL}/create-group`, data, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};
