import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyMeeting } from '../services/api';

export default function HumanInterviewJoin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [meetingId, setMeetingId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mid = params.get('mid');
    if (mid) setMeetingId(mid);
  }, [location]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await verifyMeeting(meetingId, password);
      if (res.success) {
        navigate('/human-mock', { 
          state: { 
            config: { mode: 'human', role }, 
            meeting: res.meeting 
          } 
        });
      } else {
        setError('Invalid Meeting ID or Password.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to verify meeting. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '450px', width: '100%', padding: '3rem' }}>
        
        <button 
          onClick={() => navigate('/human-mock-dashboard')} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
           <div style={{ display: 'inline-flex', padding: '15px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
           </div>
           <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '0.5rem' }}>Join Room</h1>
           <p style={{ color: 'var(--text-secondary)' }}>Enter credentials to enter the interview.</p>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div className="input-group">
              <label className="input-label">Meeting ID</label>
              <input 
                type="text" 
                value={meetingId} 
                onChange={(e) => setMeetingId(e.target.value)} 
                className="input-field" 
                placeholder="e.g. 123-456-789" 
                required 
              />
           </div>

           <div className="input-group">
              <label className="input-label">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="input-field" 
                placeholder="Enter 6-digit password" 
                required 
              />
           </div>

           <div className="input-group">
              <label className="input-label">Join As</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <button 
                   type="button" 
                   onClick={() => setRole('candidate')}
                   style={{ 
                     padding: '0.8rem', borderRadius: '10px', cursor: 'pointer',
                     background: role === 'candidate' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.03)',
                     border: role === 'candidate' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.05)',
                     color: '#fff', transition: 'all 0.3s'
                   }}
                 >
                   Candidate
                 </button>
                 <button 
                   type="button" 
                   onClick={() => setRole('interviewer')}
                   style={{ 
                     padding: '0.8rem', borderRadius: '10px', cursor: 'pointer',
                     background: role === 'interviewer' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                     border: role === 'interviewer' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.05)',
                     color: '#fff', transition: 'all 0.3s'
                   }}
                 >
                   Interviewer
                 </button>
              </div>
           </div>

           {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>{error}</div>}

           <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', padding: '1rem' }}>
             {loading ? 'Verifying...' : 'Join Meeting'}
           </button>
        </form>

      </div>
    </div>
  );
}
