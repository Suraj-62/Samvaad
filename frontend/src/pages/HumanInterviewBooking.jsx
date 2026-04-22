import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookHumanInterview, fetchPublicAvailableSlots } from '../services/api';
import { useEffect } from 'react';

export default function HumanInterviewBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config;
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const [formData, setFormData] = useState({
    name: config?.userName || userInfo.name || '',
    email: userInfo.email || '',
    role: config?.role || '',
    topic: config?.topic || 'Technical Round',
    selectedDate: '',
    selectedTime: '10:00'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);

  // Available Slots State
  const [availableSlots, setAvailableSlots] = useState({}); // { date: [times] }
  const [loadingSlots, setLoadingSlots] = useState(true);

  useEffect(() => {
    const getSlots = async () => {
      try {
        const res = await fetchPublicAvailableSlots();
        if (res.success) {
          setAvailableSlots(res.slots);
        }
      } catch (err) {
        console.error("Failed to fetch slots", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    getSlots();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await bookHumanInterview(formData);
      if (res.success) {
        setSuccess(true);
        setBookingResult(res);
      } else {
        setError('Failed to book interview. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh', padding: '2rem 0' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        
        {/* Progress Background */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)' }}>
           <div style={{ width: success ? '100%' : '50%', height: '100%', background: 'var(--purple-glow)', transition: 'width 0.5s ease' }}></div>
        </div>

        {!success ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
              </div>
              <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: '#fff' }}>Human Interview Registration</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Sign up to be matched with a human interviewer.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="input-field" 
                  placeholder="e.g. Rahul Sharma" 
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Gmail Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  className="input-field" 
                  placeholder="your-email@gmail.com" 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Target Role</label>
                  <input 
                    type="text" 
                    name="role"
                    value={formData.role} 
                    onChange={handleChange}
                    className="input-field" 
                    placeholder="e.g. Java Developer"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Interview Mode</label>
                  <select 
                    name="topic" 
                    value={formData.topic} 
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="Technical Round">Technical Round</option>
                    <option value="HR Round">HR Round</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Select Date</label>
                  <select 
                    name="selectedDate"
                    value={formData.selectedDate} 
                    onChange={(e) => setFormData({...formData, selectedDate: e.target.value, selectedTime: availableSlots[e.target.value]?.[0] || ''})}
                    className="input-field" 
                    required
                  >
                    <option value="">-- Choose Date --</option>
                    {Object.keys(availableSlots).map(date => (
                      <option key={date} value={date}>{new Date(date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Select Time</label>
                  <select 
                    name="selectedTime" 
                    value={formData.selectedTime} 
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={!formData.selectedDate}
                  >
                    {!formData.selectedDate ? (
                      <option>Pick a date first</option>
                    ) : (
                      availableSlots[formData.selectedDate]?.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {Object.keys(availableSlots).length === 0 && !loadingSlots && (
                <div style={{ color: '#f59e0b', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                  ⚠️ No slots available currently. Please check back later or contact support.
                </div>
              )}

              {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '1.25rem', marginTop: '1rem', fontSize: '1.1rem' }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Registering...
                  </span>
                ) : 'Register & Book Slot'}
              </button>
            </form>
          </>
        ) : (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '1rem 0' }}>
             <div style={{ display: 'inline-flex', padding: '15px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', marginBottom: '1.5rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </div>
             <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>Registration Successful!</h2>
             <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
               We've sent a meeting link to <strong style={{ color: '#fff' }}>{formData.email}</strong>.<br/>
               Your slot has been scheduled for:<br/>
               <span style={{ color: 'var(--purple-glow)', fontWeight: 'bold' }}>{bookingResult?.slot}</span>
             </p>

             <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem', textAlign: 'left' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '1rem' }}><strong>Meeting ID:</strong> <span style={{ color: '#60a5fa', fontFamily: 'monospace', letterSpacing: '1px' }}>{bookingResult?.meetingId}</span></p>
                <p style={{ margin: '0 0 15px 0', fontSize: '1rem' }}><strong>Password:</strong> <span style={{ color: '#60a5fa', fontFamily: 'monospace', letterSpacing: '1px' }}>{bookingResult?.meetingPassword}</span></p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 15px 0', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                  You can join using the link below, or check your email for details.
                </p>
                <button 
                  onClick={() => navigate('/human-mock', { state: { config: { mode: 'human', role: 'candidate' }, meeting: bookingResult } })}
                  className="btn-outline" 
                  style={{ width: '100%', borderColor: 'var(--purple-glow)', color: 'var(--purple-glow)' }}
                >
                  Join Room Now
                </button>
             </div>

             <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={() => navigate('/dashboard')} className="btn-primary">
                  Back to Dashboard
                </button>
             </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-spinner { display: inline-block; }
      `}</style>
    </div>
  );
}
