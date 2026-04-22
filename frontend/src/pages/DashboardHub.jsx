import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createGroupDiscussion } from '../services/api';

export default function DashboardHub() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || '{}'));
  const [activeTab, setActiveTab] = useState('overview');
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
  const [previewUrl, setPreviewUrl] = useState(userInfo.profilePic ? `http://localhost:5000/${userInfo.profilePic.replace('\\', '/')}` : '');
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
        const res = await fetch('http://localhost:5000/api/interview/stats', {
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
    fetchStats();
    
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

      const res = await fetch('http://localhost:5000/api/auth/profile', {
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

  const skills = [
    { name: 'Communication', level: stats.avgScore || 0, color: '#10b981' },
    { name: 'Technical Depth', level: Math.max(0, stats.avgScore - 5), color: '#3b82f6' },
    { name: 'Behavioral', level: Math.max(0, stats.avgScore + 8), color: '#f59e0b' },
    { name: 'Confidence', level: Math.max(0, stats.avgScore - 12), color: '#ef4444' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050505', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ 
        width: '260px', 
        background: 'rgba(15, 10, 5, 0.95)', 
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(217, 119, 6, 0.1)',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 0.5rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(180, 83, 9, 0.3)' }}>
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

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto', position: 'relative' }}>
        <div className="ambient-glow glow-1" style={{ width: '500px', height: '500px', top: '-10%', right: '-10%', opacity: 0.1 }}></div>

        {/* HEADER AREA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
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
                background: 'rgba(15, 10, 5, 0.95)', backdropFilter: 'blur(20px)',
                borderRadius: '16px', border: '1px solid rgba(217, 119, 6, 0.2)',
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
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <StatBox title="Sessions" value={stats.totalSessions} icon="play" color="var(--accent-color)" />
                <StatBox title="Avg Score" value={`${stats.avgScore}%`} icon="award" color="#10b981" />
                <StatBox title="Accuracy" value={`${stats.accuracy}%`} icon="zap" color="#f59e0b" />
              </div>

              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Recent History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {stats.history.length > 0 ? stats.history.map((item, idx) => (
                    <HistoryItem key={idx} role={item.role} date={item.date} score={item.score} status={item.status} />
                  )) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No interview history found. Start your first session!</p>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(180deg, rgba(180, 83, 9, 0.1) 0%, transparent 100%)' }}>
                 <h3 style={{ marginBottom: '1.5rem' }}>Ready to Practice?</h3>
                 <button onClick={() => navigate('/configurator')} className="btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }}>Book Mock Interview</button>
                 
                 <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={userInfo.hasResume ? "#10b981" : "#f59e0b"} strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Resume Status</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{userInfo.hasResume ? '✓ Resume Uploaded' : 'No Resume Uploaded'}</span>
                      {userInfo.hasResume && <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>ACTIVE</span>}
                    </div>
                 </div>
              </div>

              <div className="glass-panel" style={{ padding: '2.5rem' }}>
                <h3 style={{ marginBottom: '2rem', fontSize: '1.4rem' }}>Skill Matrix</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                  {skills.map(skill => (
                    <div key={skill.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{skill.name}</span>
                        <span style={{ color: '#fff', fontWeight: '800' }}>{skill.level}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${skill.level}%`, height: '100%', background: skill.color, borderRadius: '10px', transition: 'width 1s' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <div>
                       <h3 style={{ margin: 0 }}>Group Discussion</h3>
                       <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Invite up to 5 friends to prepare together.</p>
                    </div>
                 </div>

                 <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div className="input-group">
                       <label className="input-label" style={{ fontSize: '0.75rem' }}>Discussion Topic</label>
                       <input 
                         type="text" 
                         className="input-field" 
                         placeholder="e.g. System Design Basics" 
                         value={groupTopic}
                         onChange={(e) => setGroupTopic(e.target.value)}
                         style={{ padding: '0.8rem 1rem', fontSize: '0.9rem' }}
                       />
                    </div>

                    <div className="input-group">
                       <label className="input-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                          Friend Emails
                          <span style={{ color: 'var(--text-secondary)' }}>{friendEmails.length}/5</span>
                       </label>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {friendEmails.map((email, idx) => (
                             <input 
                                key={idx}
                                type="email" 
                                className="input-field" 
                                placeholder={`friend${idx+1}@gmail.com`} 
                                value={email}
                                onChange={(e) => updateEmail(idx, e.target.value)}
                                style={{ padding: '0.8rem 1rem', fontSize: '0.9rem' }}
                                required={idx === 0}
                             />
                          ))}
                       </div>
                       {friendEmails.length < 5 && (
                          <button 
                            type="button" 
                            onClick={addEmailField}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '8px', fontWeight: '700', padding: 0, textAlign: 'left' }}
                          >
                             + Add Another Friend
                          </button>
                       )}
                    </div>

                    {groupError && <div style={{ color: '#ef4444', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.6rem', borderRadius: '8px' }}>{groupError}</div>}
                    {groupSuccess && <div style={{ color: '#10b981', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem', borderRadius: '8px' }}>{groupSuccess}</div>}

                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={creatingGroup}
                      style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}
                    >
                       {creatingGroup ? 'Sending Invites...' : 'Create Group & Invite'}
                    </button>
                 </form>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
            <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
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
                        href={`http://localhost:5000/${userInfo.resumePath?.replace('\\', '/')}`} 
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
