import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createGroupDiscussion, BACKEND_URL } from '../services/api';

export default function DashboardHub() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || '{}'));
  const [activeTab, setActiveTab] = useState('overview');
  const [humanBookings, setHumanBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Real Data State
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgScore: 0,
    accuracy: 0,
    history: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Profile Form State
  const [editName, setEditName] = useState(userInfo.name || '');
  const [profileFile, setProfileFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userInfo.profilePic ? (userInfo.profilePic.startsWith('data:') ? userInfo.profilePic : `${BACKEND_URL}/${userInfo.profilePic.replace('\\', '/')}`) : '');
  const [updating, setUpdating] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [message, setMessage] = useState('');

  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');

  // Group Discussion State
  const [groupTopic, setGroupTopic] = useState('');
  const [friendEmails, setFriendEmails] = useState(['']);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [groupSuccess, setGroupSuccess] = useState('');

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setGroupError('');
    setGroupSuccess('');
    
    const validEmails = friendEmails.filter(email => email.trim() !== '');
    if (validEmails.length === 0) {
      setGroupError('Please enter at least one friend\'s email.');
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await createGroupDiscussion(userInfo.token, {
        topic: groupTopic || 'Group Discussion',
        emails: validEmails
      });
      if (res.success) {
        setGroupSuccess('Invitations sent successfully!');
        setGroupTopic('');
        setFriendEmails(['']);
        setTimeout(() => setGroupSuccess(''), 5000);
      }
    } catch (err) {
      setGroupError(err.response?.data?.error || 'Failed to create group discussion');
    } finally {
      setCreatingGroup(false);
    }
  };

  const addEmailField = () => {
    if (friendEmails.length < 5) {
      setFriendEmails([...friendEmails, '']);
    }
  };

  const updateEmail = (index, value) => {
    const newEmails = [...friendEmails];
    newEmails[index] = value;
    setFriendEmails(newEmails);
  };

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (!userInfo.token) {
      navigate('/login');
      return;
    }
    
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview/stats`, {
          headers: { 'Authorization': `Bearer ${userInfo.token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoadingStats(false);
      }
    };
    const fetchBookingsData = async () => {
      try {
        const { fetchBookings } = await import('../services/api');
        const data = await fetchBookings(userInfo.email);
        if (data.success) {
          setHumanBookings(data.bookings.filter(b => b.status === 'pending' || b.status === 'confirmed'));
        }
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchStats();
    fetchBookingsData();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userInfo, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('name', editName);
      if (profileFile) {
        formData.append('profilePic', profileFile);
      }
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');

      localStorage.setItem('userInfo', JSON.stringify(data));
      setUserInfo(data);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this interview?")) return;
    
    try {
      const { cancelBooking } = await import('../services/api');
      const res = await cancelBooking(userInfo.token, id);
      if (res.success) {
        setHumanBookings(prev => prev.filter(b => b._id !== id));
        setSuccessMsg('Interview cancelled successfully. The slot is now free.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error("Cancel failed", err);
      alert("Failed to cancel interview");
    }
  };

  const skills = [
    { name: 'Communication', level: stats.avgScore || 0, color: '#10b981' },
    { name: 'Technical Depth', level: Math.max(0, stats.avgScore - 5), color: '#3b82f6' },
    { name: 'Behavioral', level: Math.max(0, stats.avgScore + 8), color: '#f59e0b' },
    { name: 'Confidence', level: Math.max(0, stats.avgScore - 12), color: '#ef4444' }
  ];

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* MOBILE HEADER */}
      <div className="mobile-header" style={{ display: 'none', position: 'fixed', top: 0, left: 0, width: '100%', background: 'rgba(11, 11, 11, 0.95)', backdropFilter: 'blur(15px)', padding: '1rem', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--accent-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" /></svg>
          </div>
          <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '800' }}>SAMVAAD</span>
        </div>
        <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: previewUrl ? `url(${previewUrl}) center/cover` : 'var(--accent-color)', border: '1px solid rgba(255,255,255,0.1)' }}></div>
      </div>

      {/* SIDEBAR */}
      <div className="sidebar" style={{ 
        width: '260px', 
        background: 'rgba(11, 11, 11, 0.98)', 
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--glass-border)',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 0.5rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 10v3" />
              <path d="M6 6v11" />
              <path d="M10 3v18" />
              <path d="M14 8v7" />
              <path d="M18 5v13" />
              <path d="M22 10v3" />
            </svg>
          </div>
          <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800' }}>SAMVAAD</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SidebarLink icon="grid" label="Dashboard" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarLink icon="users" label="Mock Rooms" active={false} onClick={() => navigate('/human-mock-dashboard')} />
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <SidebarLink icon="log-out" label="Sign Out" active={false} onClick={handleLogout} />
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'rgba(11, 11, 11, 0.95)', backdropFilter: 'blur(20px)', padding: '0.8rem 1.5rem', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000, borderTop: '1px solid var(--glass-border)' }}>
         <div onClick={() => setActiveTab('overview')} style={{ textAlign: 'center', color: activeTab === 'overview' ? 'var(--accent-color)' : '#94a3b8' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', marginTop: '4px' }}>HOME</div>
         </div>
         <div onClick={() => navigate('/human-mock-dashboard')} style={{ textAlign: 'center', color: '#94a3b8' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', marginTop: '4px' }}>ROOMS</div>
         </div>
         <div onClick={() => setActiveTab('profile')} style={{ textAlign: 'center', color: activeTab === 'profile' ? '#db2777' : '#94a3b8' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', marginTop: '4px' }}>PROFILE</div>
         </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content" style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto', position: 'relative' }}>
        <div className="ambient-glow glow-1" style={{ width: '500px', height: '500px', top: '-10%', right: '-10%', opacity: 0.1, background: 'var(--accent-color)', filter: 'blur(100px)' }}></div>

        {/* HEADER AREA */}
        <div className="desktop-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '2.8rem', marginBottom: '0.5rem', fontWeight: '800' }}>
              {activeTab === 'profile' ? 'Profile Settings' : `Welcome back, ${userInfo.name}`}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              {activeTab === 'profile' ? 'Manage your account details and profile picture.' : (loadingStats ? 'Loading your stats...' : `You've completed ${stats.totalSessions} sessions so far. Keep it up!`)}
            </p>
            {successMsg && (
              <div style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 {successMsg}
              </div>
            )}
          </div>
          
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '1.2rem', 
                background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem 0.5rem 1.2rem', 
                borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '700' }}>{userInfo.name}</div>
                <div style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{userInfo.role || 'STUDENT'}</div>
              </div>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '50%', 
                background: previewUrl ? `url(${previewUrl}) center/cover` : 'linear-gradient(135deg, #db2777, #701a75)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: '#fff', fontSize: '1.2rem', fontWeight: '800', 
                border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden'
              }}>
                {!previewUrl && userInfo.name?.charAt(0)}
              </div>
            </div>

            {isDropdownOpen && (
              <div style={{ 
                position: 'absolute', top: '110%', right: '0', width: '220px', 
                background: 'rgba(11, 11, 11, 0.98)', backdropFilter: 'blur(20px)',
                borderRadius: '16px', border: '1px solid var(--glass-border)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.6)', padding: '0.8rem',
                zIndex: 1000
              }}>
                <div onClick={() => { setActiveTab('profile'); setIsDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"></path><path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Edit Profile</span>
                </div>
                <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', borderRadius: '10px', color: '#ef4444', cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* TIER 1: STATS */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <StatBox title="Sessions" value={stats.totalSessions} icon="play" color="var(--accent-color)" />
              <StatBox title="Avg Score" value={`${stats.avgScore}%`} icon="award" color="#10b981" />
              <StatBox title="Accuracy" value={`${stats.accuracy}%`} icon="zap" color="#f59e0b" />
            </div>

            {/* TIER 2: GROUP DISCUSSION (CENTERPIECE) */}
            <div className="glass-panel gd-panel" style={{ 
              padding: '2.5rem', 
              border: '1px solid var(--glass-border)', 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(11, 11, 11, 0.5) 100%)',
              display: 'grid',
              gridTemplateColumns: '1fr 1.5fr',
              gap: '3rem',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
               <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(245, 158, 11, 0.1)', filter: 'blur(60px)', borderRadius: '50%' }}></div>
               
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                       <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', color: '#fff' }}>Group Discussion</h2>
                  </div>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
                    Collaborate with friends or colleagues in a real-time mock discussion. 
                    Practice moderation, consensus building, and articulation.
                  </p>
                  
                  <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Quick Tip</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Invite up to 5 members to join your private discussion room.</p>
                  </div>

                  <button 
                    onClick={() => navigate('/human-join')} 
                    className="btn-outline"
                    style={{ width: 'fit-content', padding: '0.8rem 2rem', fontSize: '0.95rem', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
                  >
                    Join Existing Discussion
                  </button>
               </div>

               <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="input-group">
                     <label className="input-label">Discussion Topic</label>
                     <input 
                       type="text" 
                       className="input-field" 
                       placeholder="e.g. AI Ethics in 2024" 
                       value={groupTopic}
                       onChange={(e) => setGroupTopic(e.target.value)}
                     />
                  </div>

                  <div className="input-group">
                     <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        Invite Friends (Emails)
                        <span style={{ color: 'var(--accent-color)' }}>{friendEmails.length}/5</span>
                     </label>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                        {friendEmails.map((email, idx) => (
                           <input 
                              key={idx}
                              type="email" 
                              className="input-field" 
                              placeholder={`Email #${idx+1}`} 
                              value={email}
                              onChange={(e) => updateEmail(idx, e.target.value)}
                              style={{ padding: '0.7rem 1rem', fontSize: '0.85rem' }}
                              required={idx === 0}
                           />
                        ))}
                        {friendEmails.length < 5 && (
                           <button 
                             type="button" 
                             onClick={addEmailField}
                             style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px dashed var(--accent-color)', color: 'var(--accent-color)', borderRadius: '12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', transition: 'all 0.3s' }}
                           >
                              + Add Member
                           </button>
                        )}
                     </div>
                  </div>

                  {groupError && <div className="error-alert" style={{ margin: 0, fontSize: '0.85rem' }}>{groupError}</div>}
                  {groupSuccess && <div className="success-alert" style={{ margin: 0, fontSize: '0.85rem' }}>{groupSuccess}</div>}

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={creatingGroup}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                     {creatingGroup ? 'Sending Invites...' : 'Start Group Discussion'}
                  </button>
               </form>
            </div>

            {/* TIER 3: HISTORY & SKILLS */}
            <div className="bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2.5rem' }}>
              
              {/* RECENT HISTORY (MOVED DOWN) */}
              <div className="glass-panel" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.5rem' }}>Recent History</h3>
                  <button onClick={() => navigate('/configurator')} className="btn-outline" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>New Session</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {stats.history.length > 0 ? stats.history.map((item, idx) => (
                    <HistoryItem key={idx} role={item.role} date={item.date} score={item.score} status={item.status} />
                  )) : (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                       <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No interview history found.</p>
                       <button onClick={() => navigate('/configurator')} className="btn-primary">Start Your First Session</button>
                    </div>
                  )}
                </div>
              </div>

              {/* SKILLS & RESUME */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                  <h3 style={{ marginBottom: '2rem', fontSize: '1.4rem' }}>Performance Analysis</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                    {skills.map(skill => (
                      <div key={skill.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{skill.name}</span>
                          <span style={{ color: '#fff', fontWeight: '800' }}>{skill.level}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{ width: `${skill.level}%`, height: '100%', background: skill.color, borderRadius: '100px', transition: 'width 1s' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div style={{ width: '40px', height: '40px', background: userInfo.hasResume ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={userInfo.hasResume ? "#10b981" : "#f59e0b"} strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#fff' }}>Resume Status</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{userInfo.hasResume ? 'Updated and Active' : 'Missing Resume'}</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('profile')} className="btn-outline" style={{ width: '100%', fontSize: '0.85rem' }}>
                    {userInfo.hasResume ? 'Update Resume' : 'Upload Resume Now'}
                  </button>
                </div>
              </div>

              {/* UPCOMING MEETINGS (NEW SECTION) */}
              <div className="glass-panel bookings-panel" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                   <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Upcoming Interviews</h3>
                   <div style={{ padding: '4px 12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-color)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '800' }}>
                     {humanBookings.length} ACTIVE
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {loadingBookings ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Loading meetings...</p>
                  ) : humanBookings.length > 0 ? (
                    humanBookings.map((booking) => (
                      <div key={booking._id} className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <div style={{ color: '#fff', fontWeight: '700', marginBottom: '4px' }}>{booking.domain} Interview</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{booking.slot}</div>
                            <div style={{ marginTop: '8px' }}>
                               <span style={{ 
                                 padding: '3px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', 
                                 background: booking.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                 color: booking.status === 'confirmed' ? '#10b981' : '#f59e0b',
                                 textTransform: 'uppercase'
                               }}>
                                 {booking.status}
                               </span>
                            </div>
                         </div>
                         <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={() => navigate('/human-mock', { state: { config: { mode: 'human', role: 'candidate' }, meeting: booking } })}
                              className="btn-outline" 
                              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: '#10b981', color: '#10b981' }}
                            >
                              Join Room
                            </button>
                            <button 
                              onClick={() => handleCancelBooking(booking._id)}
                              className="btn-outline" 
                              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}
                            >
                              Cancel
                            </button>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '16px' }}>
                       <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No upcoming human interviews.</p>
                       <button onClick={() => navigate('/book-human')} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '700', marginTop: '10px' }}>Book One Now →</button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="glass-panel animate-fade-in profile-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
            <form onSubmit={handleUpdateProfile} className="profile-form" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                 <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                    <div style={{ 
                      width: '100%', height: '100%', borderRadius: '24px', 
                      background: previewUrl ? `url(${previewUrl}) center/cover` : 'rgba(255,255,255,0.05)', 
                      border: '2px solid #db2777',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}>
                      {!previewUrl && <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="1.5"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"></path><path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>}
                    </div>
                    <label htmlFor="profile-upload" style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                      <input id="profile-upload" type="file" hidden accept="image/*" onChange={handleFileChange} />
                    </label>
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" className="input-field" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>

                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input type="email" className="input-field" value={userInfo.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Email cannot be changed.</p>
                </div>

                
                <div className="input-group">
                  <label className="input-label">Update Resume (PDF)</label>
                  <input type="file" className="input-field" accept=".pdf" onChange={(e) => setResumeFile(e.target.files[0])} />
                  {userInfo.hasResume && (
                    <div style={{ marginTop: '10px' }}>
                      <a 
                        href={userInfo.resumePath?.startsWith('data:') ? userInfo.resumePath : `${BACKEND_URL}/${userInfo.resumePath?.replace('\\', '/')}`} 
                        download="resume.pdf"
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        View Current Resume
                      </a>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary" disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setActiveTab('overview')} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styleBlock = `
  @media (max-width: 1024px) {
    .main-content { padding: 2rem !important; }
    .bottom-grid { grid-template-columns: 1fr !important; }
    .gd-panel { grid-template-columns: 1fr !important; gap: 2rem !important; }
  }

  @media (max-width: 768px) {
    .sidebar, .desktop-header { display: none !important; }
    .mobile-header, .bottom-nav { display: flex !important; }
    .main-content { padding: 6rem 1.5rem 6rem 1.5rem !important; }
    .stats-grid { grid-template-columns: 1fr !important; }
    .emails-grid { grid-template-columns: 1fr !important; }
    .profile-form { grid-template-columns: 1fr !important; gap: 2rem !important; }
    h1 { font-size: 2rem !important; }
    .gd-panel h2 { font-size: 1.5rem !important; }
    .bookings-panel { order: -1; }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = styleBlock;
  document.head.appendChild(style);
}

const HistoryItem = ({ role, date, score, status }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-color)' }}></div>
      <div>
        <div style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{role}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{date}</div>
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ color: 'var(--accent-color)', fontWeight: '800', fontSize: '1.1rem' }}>{score}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{status}</div>
    </div>
  </div>
);

const SidebarLink = ({ icon, label, active, onClick }) => {
  const getIcon = (name) => {
    switch(name) {
      case 'grid': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
      case 'play': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
      case 'users': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
      case 'log-out': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
      default: return null;
    }
  };

  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', width: '100%', background: active ? 'rgba(180, 83, 9, 0.15)' : 'transparent', border: 'none', borderRadius: '12px', color: active ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.3s' }}>
      {getIcon(icon)}
      <span style={{ fontWeight: active ? '700' : '600', fontSize: '0.95rem' }}>{label}</span>
    </button>
  );
};

const StatBox = ({ title, value, icon, color }) => (
  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
       {icon === 'play' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
       {icon === 'award' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>}
       {icon === 'zap' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>}
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{title}</p>
      <h3 style={{ fontSize: '1.6rem', margin: 0, color: '#fff', fontWeight: '800' }}>{value}</h3>
    </div>
  </div>
);
