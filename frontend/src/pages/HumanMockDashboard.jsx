import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBookings } from '../services/api';

export default function HumanMockDashboard() {
  const navigate = useNavigate();
  const [userInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || '{}'));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userInfo.token) {
      navigate('/login');
      return;
    }

    const loadBookings = async () => {
      try {
        const res = await fetchBookings(userInfo.email);
        if (res.success) {
          setBookings(res.bookings);
        }
      } catch (err) {
        console.error("Failed to load bookings", err);
        setError('Failed to load your bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [userInfo, navigate]);

  return (
    <div className="app-container" style={{ padding: '3rem 4rem', minHeight: '100vh', background: '#050505', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>Mock Rooms</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage your peer-to-peer interview sessions.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/human-join')} className="btn-outline" style={{ padding: '0.8rem 1.5rem' }}>
            Join with ID
          </button>
          <button onClick={() => navigate('/human-booking')} className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>
            Book New Session
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2.5rem' }}>
        
        {/* Bookings List */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple-glow)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Your Scheduled Sessions
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
               <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--purple-glow)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
               <p>Loading sessions...</p>
            </div>
          ) : bookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
               {bookings.map((booking) => (
                 <div key={booking._id} style={{ 
                   display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                   padding: '1.5rem', background: 'rgba(255,255,255,0.02)', 
                   borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)',
                   transition: 'transform 0.3s',
                   cursor: 'default'
                 }} className="hover-lift">
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                       <div style={{ 
                         width: '60px', height: '60px', borderRadius: '16px', 
                         background: 'rgba(139, 92, 246, 0.1)', display: 'flex', 
                         alignItems: 'center', justifyContent: 'center', color: 'var(--purple-glow)' 
                       }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                       </div>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>{booking.domain || 'General Interview'}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{booking.slot}</div>
                          <div style={{ 
                            marginTop: '8px', display: 'inline-block', padding: '2px 10px', borderRadius: '100px', 
                            fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase',
                            background: booking.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : booking.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: booking.status === 'confirmed' ? '#10b981' : booking.status === 'pending' ? '#f59e0b' : '#ef4444',
                            border: `1px solid ${booking.status === 'confirmed' ? 'rgba(16, 185, 129, 0.2)' : booking.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                          }}>
                            {booking.status || 'pending'}
                          </div>
                       </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Meeting ID: <span style={{ color: '#fff', fontFamily: 'monospace' }}>{booking.meetingId}</span></div>
                       {booking.status === 'confirmed' ? (
                         <button 
                           onClick={() => navigate('/human-mock', { state: { config: { mode: 'human', role: 'candidate' }, meeting: booking } })}
                           className="btn-primary" 
                           style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}
                         >
                           Join Room
                         </button>
                       ) : (
                         <button 
                           disabled
                           style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'not-allowed', borderRadius: '8px' }}
                         >
                           {booking.status === 'rejected' ? 'Rejected' : 'Waiting...'}
                         </button>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
               <div style={{ fontSize: '3rem', marginBottom: '1.5rem', opacity: 0.3 }}>📭</div>
               <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No sessions scheduled</h4>
               <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Book your first peer-to-peer interview to get started.</p>
               <button onClick={() => navigate('/human-booking')} className="btn-outline">Schedule Now</button>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--purple-glow)' }}>How it works</h4>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.8' }}>
                <li>Schedule a slot with a human interviewer.</li>
                <li>Receive Meeting ID & Password via email.</li>
                <li>Join the room at the scheduled time.</li>
                <li>Conduct a live P2P interview session.</li>
                <li>Interviewer provides live feedback and scores.</li>
              </ul>
           </div>

           <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <h4 style={{ marginBottom: '1rem', color: '#06b6d4' }}>Interviewer Mode</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Want to conduct interviews? Use the "Join with ID" button and select the Interviewer role to access the scoring dashboard and question bank.
              </p>
           </div>
        </div>

      </div>

      <style>{`
        .hover-lift:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(139, 92, 246, 0.3) !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
