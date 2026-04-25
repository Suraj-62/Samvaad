import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../services/api';
import { fetchAllBookings, addAvailability, fetchInterviewerAvailability, deleteAvailability, confirmBooking, rejectBooking, createInstantMeeting } from '../services/api';

export default function InterviewerDashboard() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('userInfo');
      if (!saved || saved === 'undefined') return {};
      return JSON.parse(saved);
    } catch (e) {
      return {};
    }
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Profile Form State
  const [editName, setEditName] = useState(userInfo.name || '');
  const [profileFile, setProfileFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userInfo.profilePic ? (userInfo.profilePic.startsWith('data:') ? userInfo.profilePic : `${BACKEND_URL}/${userInfo.profilePic.replace('\\', '/')}`) : '');
  const [resumeFile, setResumeFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Availability State
  const [availability, setAvailability] = useState([]);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '10:00', endTime: '11:00' });
  const [addingSlot, setAddingSlot] = useState(false);

  // Instant Meeting State
  const [showInstantForm, setShowInstantForm] = useState(false);
  const [instantData, setInstantData] = useState({ name: '', email: '', domain: '' });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!userInfo.token || userInfo.role !== 'interviewer') {
      navigate('/login');
      return;
    }
    loadBookings(userInfo.token);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const loadBookings = async (token = userInfo.token) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchAllBookings(token);
      if (res.success) {
        setBookings(res.bookings);
      } else {
        throw new Error(res.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (token = userInfo.token) => {
    if (!token) return;
    try {
      const res = await fetchInterviewerAvailability(token);
      if (res.success) {
        setAvailability(res.availability);
      }
    } catch (err) {
      console.error("Failed to load availability", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'schedule') {
      loadAvailability();
    }
  }, [activeTab]);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setAddingSlot(true);
    try {
      const res = await addAvailability(userInfo.token, newSlot);
      if (res.success) {
        setSuccessMessage('Availability slot added!');
        setNewSlot({ ...newSlot, date: '' });
        loadAvailability();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(res.message || 'Failed to add slot');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding slot');
    } finally {
      setAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      const res = await deleteAvailability(userInfo.token, id);
      if (res.success) {
        loadAvailability();
      }
    } catch (err) {
      setError('Failed to delete slot');
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
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatAMPM = (timeStr) => {
    if (!timeStr) return '';
    let [hours, minutes] = timeStr.split(':');
    hours = parseInt(hours);
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleCreateInstant = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await createInstantMeeting(userInfo.token, instantData);
      if (res.success) {
        setSuccessMessage('Instant meeting generated! Email sent to student.');
        setInstantData({ name: '', email: '', domain: '' });
        setShowInstantForm(false);
        loadBookings();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate meeting');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      const res = await confirmBooking(userInfo.token, id);
      if (res.success) {
        setSuccessMessage('Booking confirmed! Student notified.');
        loadBookings();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to confirm booking');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      const res = await rejectBooking(userInfo.token, id);
      if (res.success) {
        setSuccessMessage('Booking rejected.');
        loadBookings();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to reject booking');
    }
  };

  const stats = {
    totalInterviews: bookings.length,
    upcomingToday: bookings.filter(b => b.slot?.includes('Today')).length,
    completed: bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length,
    rating: '4.8/5.0'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ 
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
              <path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" />
            </svg>
          </div>
          <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800' }}>INTERVIEWER</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SidebarLink icon="grid" label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarLink icon="users" label="Assigned Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} count={bookings.length} />
          <SidebarLink icon="clock" label="Schedule" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0' }}></div>
          <SidebarLink icon="user" label="My Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <SidebarLink icon="log-out" label="Logout" active={false} onClick={handleLogout} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto', position: 'relative' }}>
        <div className="ambient-glow glow-1" style={{ width: '500px', height: '500px', top: '-10%', right: '-10%', opacity: 0.1, background: 'var(--accent-color)', filter: 'blur(100px)' }}></div>

        {/* HEADER AREA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '2.8rem', marginBottom: '0.5rem', fontWeight: '800' }}>
              Welcome back, {userInfo.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              You have {bookings.length} student sessions assigned to you.
            </p>
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
                <div style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px' }}>EXPERTS</div>
              </div>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '50%', 
                background: userInfo.profilePic ? `url(${BACKEND_URL}/${userInfo.profilePic.replace('\\', '/')}) center/cover` : 'linear-gradient(135deg, #06b6d4, #0891b2)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: '#fff', fontSize: '1.2rem', fontWeight: '800', border: '2px solid rgba(255,255,255,0.1)' 
              }}>
                {!userInfo.profilePic && (userInfo.name?.charAt(0) || '?')}
              </div>
            </div>
            {isDropdownOpen && (
              <div style={{ position: 'absolute', top: '110%', right: '0', width: '200px', background: 'rgba(15, 10, 5, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '16px', border: '1px solid rgba(217, 119, 6, 0.2)', boxShadow: '0 15px 35px rgba(0,0,0,0.6)', padding: '0.8rem', zIndex: 1000 }}>
                <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', borderRadius: '10px', color: '#ef4444', cursor: 'pointer' }}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                   <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-alert" style={{ marginBottom: '2rem', textAlign: 'center' }}>{error}</div>}
        {successMessage && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{successMessage}</div>}

        {activeTab === 'overview' && (
          <div className="animate-fade-in">
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <StatBox title="Sessions" value={stats.totalInterviews} icon="play" color="var(--accent-color)" />
                <StatBox title="Today" value={stats.upcomingToday} icon="clock" color="#3b82f6" />
                <StatBox title="Completed" value={stats.completed} icon="award" color="#10b981" />
                <StatBox title="Rating" value={stats.rating} icon="zap" color="#f59e0b" />
             </div>

             <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem', background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>Instant Meeting</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Generate a meeting ID on the fly and invite a student.</p>
                   </div>
                   <button onClick={() => setShowInstantForm(!showInstantForm)} className="btn-primary" style={{ background: showInstantForm ? 'rgba(255,255,255,0.1)' : 'var(--accent-color)', border: showInstantForm ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                      {showInstantForm ? 'Cancel' : 'Generate Now'}
                   </button>
                </div>

                {showInstantForm && (
                  <form onSubmit={handleCreateInstant} style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end', animation: 'slideDown 0.3s ease' }}>
                    <div className="input-group">
                      <label className="input-label">Student Name</label>
                      <input type="text" className="input-field" value={instantData.name} onChange={(e) => setInstantData({...instantData, name: e.target.value})} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Student Email</label>
                      <input type="email" className="input-field" value={instantData.email} onChange={(e) => setInstantData({...instantData, email: e.target.value})} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Domain (Optional)</label>
                      <input type="text" className="input-field" value={instantData.domain} onChange={(e) => setInstantData({...instantData, domain: e.target.value})} placeholder="e.g. Frontend" />
                    </div>
                    <button type="submit" className="btn-primary" disabled={generating} style={{ height: '52px', padding: '0 2rem' }}>
                      {generating ? 'Generating...' : 'Create & Email'}
                    </button>
                  </form>
                )}
             </div>

              <div className="glass-panel" style={{ padding: '2.5rem' }}>
                <h3 style={{ marginBottom: '2rem' }}>Immediate Actions</h3>
                <StudentTable 
                  data={bookings.slice(0, 5)} 
                  onJoin={(b) => navigate('/human-mock', { state: { config: { mode: 'human', role: 'interviewer' }, meeting: b } })} 
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                />
              </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0 }}>Full Student Roster</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Showing {bookings.length} students</div>
             </div>
             <StudentTable 
               data={bookings} 
               onJoin={(b) => navigate('/human-mock', { state: { config: { mode: 'human', role: 'interviewer' }, meeting: b } })} 
               onConfirm={handleConfirm}
               onReject={handleReject}
             />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '3rem' }}>
             <h2 style={{ marginBottom: '2.5rem' }}>Manage My Availability</h2>
             
             {/* Add Slot Form */}
             <form onSubmit={handleAddSlot} style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end', marginBottom: '3rem', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="input-group" style={{ flex: '1 1 200px' }}>
                   <label className="input-label">Date</label>
                   <input 
                     type="date" 
                     className="input-field" 
                     value={newSlot.date} 
                     onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                     min={new Date().toISOString().split('T')[0]}
                     required 
                   />
                </div>
                <div className="input-group" style={{ flex: '1 1 120px' }}>
                   <label className="input-label">Start Time</label>
                   <input 
                     type="time" 
                     className="input-field" 
                     value={newSlot.startTime} 
                     onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                     required 
                   />
                </div>
                <div className="input-group" style={{ flex: '1 1 120px' }}>
                   <label className="input-label">End Time</label>
                   <input 
                     type="time" 
                     className="input-field" 
                     value={newSlot.endTime} 
                     onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                     required 
                   />
                </div>
                <button type="submit" className="btn-primary" disabled={addingSlot} style={{ height: '52px', padding: '0 2rem' }}>
                   {addingSlot ? 'Adding...' : 'Add Slot'}
                </button>
             </form>

             {/* Slots List */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.2rem' }}>
                {availability.length > 0 ? availability.map((slot) => (
                  <div key={slot._id} style={{ 
                    padding: '1.2rem', background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{slot.date}</div>
                      <div style={{ color: 'var(--accent-color)', fontWeight: '600' }}>{formatAMPM(slot.startTime)} - {formatAMPM(slot.endTime)}</div>
                      <div style={{ fontSize: '0.75rem', color: slot.isBooked ? '#10b981' : '#94a3b8', marginTop: '4px' }}>
                        {slot.isBooked ? '● Booked' : '○ Available'}
                      </div>
                    </div>
                    {!slot.isBooked && (
                      <button onClick={() => handleDeleteSlot(slot._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    )}
                  </div>
                )) : (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                    No availability slots added yet.
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
            <h2 style={{ marginBottom: '2.5rem', textAlign: 'center' }}>Interviewer Settings</h2>
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
                    <label htmlFor="interviewer-profile-upload" style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                      <input id="interviewer-profile-upload" type="file" hidden accept="image/*" onChange={handleFileChange} />
                    </label>
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" className="input-field" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>

                <div className="input-group">
                  <label className="input-label">Update Resume (PDF)</label>
                  <input type="file" className="input-field" accept=".pdf" onChange={(e) => setResumeFile(e.target.files[0])} />
                  {userInfo.resumePath && (
                    <div style={{ marginTop: '10px' }}>
                      <a 
                        href={`${BACKEND_URL}/${userInfo.resumePath?.replace('\\', '/')}`} 
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

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={updating}>
                    {updating ? 'Updating...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setActiveTab('overview')} className="btn-outline" style={{ flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const SidebarLink = ({ icon, label, active, onClick, count }) => {
  const getIcon = (name) => {
    switch(name) {
      case 'grid': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
      case 'users': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
      case 'clock': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
      case 'log-out': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
      default: return null;
    }
  };

  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', width: '100%', background: active ? 'rgba(180, 83, 9, 0.15)' : 'transparent', border: 'none', borderRadius: '12px', color: active ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.3s' }}>
      {getIcon(icon)}
      <span style={{ fontWeight: active ? '700' : '600', fontSize: '0.95rem', flex: 1, textAlign: 'left' }}>{label}</span>
      {count !== undefined && <span style={{ background: 'rgba(255,255,255,0.05)', color: active ? '#fff' : 'var(--text-secondary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>{count}</span>}
    </button>
  );
};

const StatBox = ({ title, value, icon, color }) => (
  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
       {icon === 'play' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
       {icon === 'award' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>}
       {icon === 'zap' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>}
       {icon === 'clock' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{title}</p>
      <h3 style={{ fontSize: '1.6rem', margin: 0, color: '#fff', fontWeight: '800' }}>{value}</h3>
    </div>
  </div>
);

const StudentTable = ({ data, onJoin, onConfirm, onReject }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Student</th>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Domain / Status</th>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Scheduled Slot</th>
          <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {data.map((booking) => (
          <tr key={booking._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
            <td style={{ padding: '1.2rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff' }}>{booking.name?.charAt(0) || '?'}</div>
                <div>
                   <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>{booking.name || 'Unknown'}</div>
                   <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{booking.email || 'No Email'}</div>
                </div>
              </div>
            </td>
            <td style={{ padding: '1rem' }}>
               <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>{booking.domain || 'N/A'}</div>
               <div style={{ 
                 marginTop: '4px', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', 
                 fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase',
                 background: booking.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                 color: booking.status === 'confirmed' ? '#10b981' : '#f59e0b'
               }}>
                 {booking.status}
               </div>
            </td>
            <td style={{ padding: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.9rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--purple-glow)" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {booking.slot}
               </div>
            </td>
            <td style={{ padding: '1rem', textAlign: 'right' }}>
               <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                 {booking.status === 'pending' ? (
                   <>
                     <button onClick={() => onConfirm(booking._id)} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                       Accept
                     </button>
                     <button onClick={() => onReject(booking._id)} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                       Reject
                     </button>
                   </>
                 ) : booking.status === 'confirmed' ? (
                   <button onClick={() => onJoin(booking)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                     Start Session
                   </button>
                 ) : (
                   <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Rejected</span>
                 )}
               </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
