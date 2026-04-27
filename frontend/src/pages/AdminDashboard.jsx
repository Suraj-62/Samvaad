import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || '{}'));
  const [platformStats, setPlatformStats] = useState({ totalInterviews: 0, totalGDs: 0 });

  // Profile Form State
  const [editName, setEditName] = useState(userInfo.name || '');
  const [profileFile, setProfileFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userInfo.profilePic ? (userInfo.profilePic.startsWith('data:') ? userInfo.profilePic : `${BACKEND_URL}/${userInfo.profilePic.replace('\\', '/')}`) : '');
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (!userInfo.token || userInfo.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAllUsers();
    fetchPlatformStats();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/users`, {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/interview/admin-stats`, {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPlatformStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/approve/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (!res.ok) throw new Error('Failed to approve');
      setUsers(users.map(u => u._id === id ? { ...u, isApproved: true } : u));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleBlockToggle = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/users/${id}/block`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to block/unblock');
      setUsers(users.map(u => u._id === id ? { ...u, isBlocked: data.isBlocked } : u));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("CRITICAL: Permanent deletion is irreversible. Proceed?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert('Error: ' + err.message);
    }
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
    setError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('name', editName);
      if (profileFile) {
        formData.append('profilePic', profileFile);
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
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const students = users.filter(u => u.role === 'student');
  const allInterviewers = users.filter(u => u.role === 'interviewer');
  const approvedInterviewers = allInterviewers.filter(u => u.isApproved);
  const pendingInterviewers = allInterviewers.filter(u => !u.isApproved);

  const monthlyData = [40, 25, 60, 45, 90, 70, 85]; 
  const distribution = [students.length, allInterviewers.length];

  if (loading && users.length === 0) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--accent-color)' }}>
      <div className="float-anim">Initializing Control Center...</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'Outfit', sans-serif", overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <div style={{ 
        width: sidebarOpen ? '280px' : '80px', 
        background: 'rgba(11, 11, 11, 0.98)', 
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--glass-border)',
        padding: '2rem 1rem',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 0.5rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 10v3" />
              <path d="M6 6v11" />
              <path d="M10 3v18" />
              <path d="M14 8v7" />
              <path d="M18 5v13" />
              <path d="M22 10v3" />
            </svg>
          </div>
          {sidebarOpen && <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800', letterSpacing: '1px' }}>SAMVAAD</span>}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SidebarLink icon="grid" label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} sidebarOpen={sidebarOpen} />
          <SidebarLink icon="users" label="Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} sidebarOpen={sidebarOpen} count={students.length} />
          <SidebarLink icon="briefcase" label="Interviewers" active={activeTab === 'interviewers'} onClick={() => setActiveTab('interviewers')} sidebarOpen={sidebarOpen} count={approvedInterviewers.length} />
          <SidebarLink icon="clock" label="Pending" active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} sidebarOpen={sidebarOpen} count={pendingInterviewers.length} countColor="#ef4444" />
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0' }}></div>
          <SidebarLink icon="user" label="My Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} sidebarOpen={sidebarOpen} />
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <SidebarLink icon="log-out" label="Logout" active={false} onClick={handleLogout} sidebarOpen={sidebarOpen} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '2.5rem 4rem', overflowY: 'auto', position: 'relative' }}>
        <div className="ambient-glow glow-1" style={{ width: '600px', height: '600px', top: '-10%', right: '-10%', opacity: 0.1, background: 'var(--accent-color)', filter: 'blur(100px)' }}></div>
        
        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '2.4rem', marginBottom: '0.5rem', fontWeight: '800' }}>Admin Control</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage your ecosystem and monitor platform health.</p>
          </div>
          
          {/* PROFILE DROPDOWN TRIGGER */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '1.2rem', 
                background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem 0.5rem 1.2rem', 
                borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', transition: 'all 0.3s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={e => !isDropdownOpen && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            >
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>{userInfo.name}</p>
                <p style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: '700', margin: 0, textTransform: 'uppercase' }}>Super Admin</p>
              </div>
              <div style={{ 
                width: '44px', height: '44px', borderRadius: '50%', 
                background: previewUrl ? `url(${previewUrl}) center/cover` : 'linear-gradient(135deg, #db2777, #701a75)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: '#fff', fontWeight: '800', border: '2px solid rgba(255,255,255,0.1)',
                overflow: 'hidden'
              }}>
                {!previewUrl && userInfo.name.charAt(0)}
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="3" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            {/* DROPDOWN MENU */}
            {isDropdownOpen && (
              <div style={{ 
                position: 'absolute', top: '110%', right: '0', width: '200px', 
                background: 'rgba(15, 10, 5, 0.95)', backdropFilter: 'blur(20px)',
                borderRadius: '16px', border: '1px solid rgba(217, 119, 6, 0.2)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.6)', padding: '0.8rem',
                zIndex: 1000, animation: 'fadeIn 0.3s ease'
              }}>
                <div 
                  onClick={() => { setActiveTab('profile'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', borderRadius: '100px', color: '#fff', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(180, 83, 9, 0.15)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"></path><path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Edit Profile</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }}></div>
                <div 
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', borderRadius: '100px', color: '#ef4444', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '2rem', backdropFilter: 'blur(10px)', textAlign: 'center' }}>{error}</div>}
        {successMessage && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '2rem', backdropFilter: 'blur(10px)', textAlign: 'center' }}>{successMessage}</div>}

        {/* CONTENT SECTIONS */}
        <div className="animate-fade-in">
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <StatCard title="Total Users" value={users.length} icon="users" color="#3b82f6" trend="TOTAL" />
                <StatCard title="Total Interviews" value={platformStats.totalInterviews} icon="briefcase" color="#10b981" trend="COMPLETED" />
                <StatCard title="Total GD Rounds" value={platformStats.totalGDs} icon="users" color="#f59e0b" trend="COMPLETED" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem' }}>User Growth Trend</h3>
                  </div>
                  <BarChart data={monthlyData} color="var(--accent-color)" />
                </div>
                
                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                  <h3 style={{ marginBottom: '2rem', fontSize: '1.4rem' }}>User Distribution</h3>
                  <DoughnutChart values={distribution} labels={['Students', 'Interviewers']} colors={['#10b981', '#f59e0b']} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>Recent Activity</h3>
                  <Table data={users.slice(0, 5)} compact={true} onBlock={handleBlockToggle} onDelete={handleDelete} />
                </div>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>System Status</h3>
                  <StatusItem label="Cloud Infrastructure" status="Operational" color="#10b981" />
                  <StatusItem label="AI Engine (Gemini)" status="Optimal" color="#10b981" />
                  <StatusItem label="TTS Node (ElevenLabs)" status="Online" color="#10b981" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h2 style={{ marginBottom: '2rem' }}>Student Directory</h2>
              <Table data={students} onBlock={handleBlockToggle} onDelete={handleDelete} />
            </div>
          )}

          {activeTab === 'interviewers' && (
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h2 style={{ marginBottom: '2rem' }}>Interviewer Network</h2>
              <Table data={approvedInterviewers} isInterviewer={true} onBlock={handleBlockToggle} onDelete={handleDelete} />
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h2 style={{ marginBottom: '2rem' }}>Approval Queue</h2>
              {pendingInterviewers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                  <p>All caught up! No pending approvals.</p>
                </div>
              ) : (
                <Table data={pendingInterviewers} isInterviewer={true} isPending={true} onApprove={handleApprove} onDelete={handleDelete} />
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
              <h2 style={{ marginBottom: '2.5rem', textAlign: 'center' }}>Super Admin Settings</h2>
              <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                   <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                      <div style={{ 
                        width: '100%', height: '100%', borderRadius: '24px', 
                        background: previewUrl ? `url(${previewUrl}) center/cover` : 'rgba(255,255,255,0.05)', 
                        border: '2px solid var(--accent-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                      }}>
                        {!previewUrl && <span style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--accent-color)' }}>{userInfo.name?.charAt(0)}</span>}
                      </div>
                      <label htmlFor="admin-profile-upload" style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        <input id="admin-profile-upload" type="file" hidden accept="image/*" onChange={handleFileChange} />
                      </label>
                   </div>
                   <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Click the icon to upload a new avatar</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="input-group">
                    <label className="input-label">Admin Name</label>
                    <input type="text" className="input-field" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Registered Email</label>
                    <input type="email" className="input-field" value={userInfo.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '6px' }}>Super Admin email is fixed for security.</p>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={updating}>
                      {updating ? 'Updating...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => setActiveTab('overview')} className="btn-outline" style={{ flex: 1 }}>
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// VISUAL COMPONENTS

const BarChart = ({ data, color }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', gap: '12px', padding: '0 10px' }}>
      {data.map((val, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '100%', 
            height: `${(val / max) * 100}%`, 
            background: `linear-gradient(to top, ${color}20, ${color})`, 
            borderRadius: '6px 6px 0 0',
            transition: 'height 1s ease-out'
          }}></div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>D{i+1}</span>
        </div>
      ))}
    </div>
  );
};

const DoughnutChart = ({ values, labels, colors }) => {
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <div style={{ position: 'relative', width: '160px', height: '160px', borderRadius: '50%', background: `conic-gradient(${colors[0]} 0% ${(values[0]/total)*100}%, ${colors[1]} ${(values[0]/total)*100}% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '110px', height: '110px', background: '#050505', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>{total}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>USERS</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
        {labels.map((label, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: colors[i] }}></div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// UI COMPONENTS

const SidebarLink = ({ icon, label, active, onClick, sidebarOpen, count, countColor }) => {
  const getIcon = (name) => {
    switch(name) {
      case 'grid': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
      case 'users': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
      case 'user': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
      case 'briefcase': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
      case 'clock': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
      case 'log-out': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
      default: return null;
    }
  };

  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', width: '100%', background: active ? 'rgba(180, 83, 9, 0.15)' : 'transparent', border: 'none', borderRadius: '12px', color: active ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.3s' }}>
      {getIcon(icon)}
      {sidebarOpen && <span style={{ fontWeight: active ? '700' : '600', fontSize: '0.95rem', flex: 1, textAlign: 'left' }}>{label}</span>}
      {sidebarOpen && count !== undefined && (
        <span style={{ background: countColor || 'rgba(255,255,255,0.05)', color: active ? '#fff' : 'var(--text-secondary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>{count}</span>
      )}
    </button>
  );
};

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="glass-panel" style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        <SidebarLink icon={icon} active={true} sidebarOpen={false} onClick={() => {}} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: trend === 'Action' ? '#ef4444' : '#10b981', background: trend === 'Action' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '100px' }}>{trend}</span>
    </div>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>{title}</p>
    <h3 style={{ fontSize: '2rem', margin: 0, color: '#fff', fontWeight: '800' }}>{value}</h3>
  </div>
);

const StatusItem = ({ label, status, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</span>
    <span style={{ color: color, fontSize: '0.9rem', fontWeight: '700' }}>{status}</span>
  </div>
);

const Table = ({ data, isInterviewer = false, isPending = false, onBlock, onDelete, onApprove, compact = false }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <th style={{ padding: '1rem', textAlign: 'left' }}>User</th>
          {isInterviewer ? (
            <th style={{ padding: '1rem', textAlign: 'left' }}>Sessions Conducted</th>
          ) : (
            <th style={{ padding: '1rem', textAlign: 'left' }}>Int / GD Rounds</th>
          )}
          <th style={{ padding: '1rem', textAlign: 'left' }}>Resume</th>
          {!isPending && <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>}
          <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(user => (
          <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
            <td style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#fff' }}>{user.name.charAt(0)}</div>
                <div>
                  <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>{user.name}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>{user.email}</p>
                </div>
              </div>
            </td>
            <td style={{ padding: '1rem' }}>
              {isInterviewer ? (
                <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '800' }}>{user.interviewsConducted || 0} Sessions</div>
              ) : (
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#3b82f6', fontSize: '0.9rem', fontWeight: '800' }}>{user.interviewCount || 0}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>INTERVIEWS</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: '800' }}>{user.gdCount || 0}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>GD ROUNDS</div>
                  </div>
                </div>
              )}
            </td>
            <td style={{ padding: '1rem' }}>
              {user.resumePath ? (
                <a 
                  href={`${BACKEND_URL}/${user.resumePath.replace('\\', '/')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  View
                </a>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>None</span>
              )}
            </td>
            {!isPending && (
              <td style={{ padding: '1rem' }}>
                <span style={{ color: user.isBlocked ? '#ef4444' : '#10b981', fontSize: '0.75rem', fontWeight: '700' }}>{user.isBlocked ? 'BLOCKED' : 'ACTIVE'}</span>
              </td>
            )}
            <td style={{ padding: '1rem', textAlign: 'right' }}>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                {isPending ? (
                  <button onClick={() => onApprove(user._id)} style={{ background: 'var(--accent-color)', border: 'none', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Approve</button>
                ) : (
                  <button onClick={() => onBlock(user._id)} style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>{user.isBlocked ? 'Unblock' : 'Block'}</button>
                )}
                {!compact && <button onClick={() => onDelete(user._id)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
