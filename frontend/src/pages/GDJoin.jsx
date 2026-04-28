import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyMeeting } from '../services/api';

export default function GDJoin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [meetingId, setMeetingId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [meetingData, setMeetingData] = useState(null);
  const [userName, setUserName] = useState('');
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || '{}'));

  useEffect(() => {
    if (userInfo?.name) setUserName(userInfo.name);
  }, [userInfo?.name]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mid = params.get('mid');
    const pwd = params.get('pwd');
    
    if (mid) setMeetingId(mid);
    if (pwd) setPassword(pwd);

    if (mid && pwd) {
      handleVerify(null, mid, pwd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleVerify = async (e, idOverride = null, pwdOverride = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const targetId = idOverride || meetingId;
    const targetPwd = pwdOverride || password;

    try {
      const res = await verifyMeeting(targetId, targetPwd);
      if (res.success) {
        if (!res.meeting.host) {
          setError('This looks like a 1-on-1 interview, not a Group Discussion. Please use the Human Interview Join instead.');
          return;
        }
        setMeetingData(res.meeting);
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

  const handleJoinRoom = () => {
    if (!userName.trim()) {
      setError('Please enter your name to join the discussion.');
      return;
    }
    navigate('/gd-room', { 
      state: { 
        meeting: meetingData,
        userName: userName.trim()
      } 
    });
  };

  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '3rem' }}>
        
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </button>

        {!meetingData ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
               <div style={{ display: 'inline-flex', padding: '15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
               </div>
               <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '0.5rem' }}>Group Discussion</h1>
               <p style={{ color: 'var(--text-secondary)' }}>Enter room credentials to enter the lobby.</p>
            </div>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

               {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>{error}</div>}

               <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', padding: '1rem' }}>
                 {loading ? 'Verifying...' : 'Enter Lobby'}
               </button>
            </form>
          </>
        ) : (
          <div className="animate-fade-in">
             <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.5rem' }}>Lobby: {meetingData.topic}</h2>
                <p style={{ color: '#10b981', fontWeight: '700' }}>Credentials Verified</p>
             </div>

             <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                   <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '800', marginBottom: '0.5rem' }}>Host</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: '600' }}>
                     <div style={{ width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '50%' }}></div>
                     {meetingData.host?.name || 'Unknown Host'}
                   </div>
                </div>
                <div>
                   <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '800', marginBottom: '0.5rem' }}>Invited Participants</div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {meetingData.participants.map((p, idx) => (
                       <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                         <div style={{ width: '6px', height: '6px', background: '#475569', borderRadius: '50%' }}></div>
                         {p.email}
                       </div>
                     ))}
                   </div>
                </div>
             </div>

             <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Your Display Name</label>
                <input 
                  type="text" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  className="input-field" 
                  placeholder="Enter your name" 
                  required 
                />
             </div>

             {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

             <button onClick={handleJoinRoom} className="btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Join Discussion
             </button>
          </div>
        )}

      </div>
    </div>
  );
}
