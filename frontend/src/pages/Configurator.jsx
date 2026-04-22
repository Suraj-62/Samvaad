import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../services/api';

export default function Configurator() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mode: 'human',
    type: 'basic',
    role: 'Software Engineer',
    topic: 'React & Frontend',
    difficulty: 'Medium',
    skills: '',
    projects: ''
  });
  const [userInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || '{}'));
  const [resumeFile, setResumeFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [resumeText, setResumeText] = useState(userInfo.resumeText || '');
  const [showTextFallback, setShowTextFallback] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStart = async (e) => {
    e.preventDefault();
    const config = { ...formData };
    
    // Inject user name
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.name) {
      config.userName = userInfo.name;
    }

    if (config.type === 'resume') {
      if (resumeFile && !resumeText) {
        setIsParsing(true);
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('resume', resumeFile);
          
          const res = await fetch(`${BACKEND_URL}/api/interview/parse-resume`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${userInfo.token}` },
            body: formDataUpload,
          });
          const data = await res.json();
          
          if (data.success) {
            const updatedUserInfo = { ...userInfo, hasResume: true, resumeText: data.text };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            setResumeText(data.text);
          }
          if (!res.ok) throw new Error(data.message || 'Failed to parse resume');
          
          config.candidateProfile = data.text;
        } catch (err) {
          console.error("Resume parsing failed", err);
          setShowTextFallback(true);
          setIsParsing(false);
          return;
        }
      } else if (resumeText) {
        config.candidateProfile = resumeText;
      }
    }

    setIsParsing(false);
    navigate('/human-booking', { state: { config } });
  };

  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', marginTop: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '650px', width: '100%' }}>
        
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: '500', fontSize: '1rem' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </button>

        <h1 style={{ textAlign: 'center', color: '#fff', fontSize: '2.5rem' }}>
          Interview Setup
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          Configure your mock interview session below.
        </p>
      
        <form onSubmit={handleStart}>
          <div className="input-group delay-100 animate-fade-in">
            <label className="input-label">Interview Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="input-field">
              <option value="basic">Basic (Standard questions)</option>
              <option value="resume">Resume Based (Skills & Projects)</option>
              <option value="hr">HR / Behavioral</option>
            </select>
          </div>

          <div className="input-group delay-100 animate-fade-in">
            <label className="input-label">Job Role</label>
            <input type="text" name="role" value={formData.role} onChange={handleChange} className="input-field" placeholder="e.g. Frontend Developer" required />
          </div>

          {formData.type === 'resume' && (
            <>
              <div className="input-group delay-200 animate-fade-in">
                <label className="input-label">Upload Resume (PDF)</label>
                {userInfo.hasResume && !resumeFile && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid #10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '600' }}>Using your registered resume</span>
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <input 
                    type="file" 
                    id="resume-upload"
                    accept=".pdf" 
                    onChange={(e) => setResumeFile(e.target.files[0])} 
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="resume-upload"
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', 
                      background: resumeFile ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.03)', 
                      border: resumeFile ? '2px solid #10b981' : '1px dashed rgba(255,255,255,0.2)',
                      borderRadius: '16px', cursor: 'pointer', color: resumeFile ? '#10b981' : 'var(--text-secondary)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: resumeFile ? '0 0 20px rgba(16, 185, 129, 0.1)' : 'none'
                    }}
                  >
                    {resumeFile ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700' }}>{resumeFile ? '✓ Resume Uploaded' : 'Click to Upload Resume'}</span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{resumeFile ? resumeFile.name : 'Professional PDF format recommended'}</span>
                    </div>
                  </label>
                </div>
              </div>

              {showTextFallback && (
                <div className="input-group animate-fade-in" style={{ marginTop: '1rem' }}>
                  <label className="input-label" style={{ color: '#f59e0b' }}>⚠️ Automatic parsing failed. Please paste your resume text below:</label>
                  <textarea 
                    className="input-field" 
                    style={{ minHeight: '150px', fontSize: '0.9rem', borderColor: '#f59e0b' }}
                    placeholder="Paste your skills, experience, and projects from your resume here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    required
                  ></textarea>
                </div>
              )}
            </>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} disabled={isParsing}>
            {isParsing ? (
              <span className="float-anim">Analyzing...</span>
            ) : (
              <>
                Continue to Booking
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
