import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function SignIn() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // student or interviewer
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [experience, setExperience] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [resume, setResume] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        console.log('Attempting login for:', email);
        // Login API
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        console.log('Login response status:', res.status);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        
        localStorage.setItem('userInfo', JSON.stringify(data));
        console.log('Login successful, navigating...');
        
        if (data.role === 'admin') navigate('/admin');
        else if (data.role === 'interviewer') navigate('/interviewer-dashboard');
        else navigate('/dashboard');
        
      } else {
        console.log('Attempting registration for:', email, 'Role:', role);
        // Register API
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', role);
        if (resume) {
          console.log('Attaching resume:', resume.name);
          formData.append('resume', resume);
        }
        
        if (role === 'interviewer') {
          formData.append('experience', experience);
          formData.append('jobRole', jobRole);
        }

        const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
          method: 'POST',
          body: formData,
        });
        console.log('Registration response status:', res.status);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        
        if (role === 'interviewer') {
          setSuccess('Registration successful! Please wait for admin approval. We have sent you an email.');
          setIsLogin(true);
        } else {
          console.log('Student registration successful, navigating...');
          localStorage.setItem('userInfo', JSON.stringify(data));
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google login failed');

      localStorage.setItem('userInfo', JSON.stringify(data));
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'interviewer') navigate('/interviewer-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(`Password reset link sent to ${forgotEmail}`);
      setShowForgot(false);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background elements */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>
      
      <div className="auth-split-wrapper animate-fade-in">
        {/* Left Side: Branding & Info */}
        <div className="auth-visual-side">
          <div className="auth-scanning-line"></div>
          <div className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10v3" />
                <path d="M6 6v11" />
                <path d="M10 3v18" />
                <path d="M14 8v7" />
                <path d="M18 5v13" />
                <path d="M22 10v3" />
              </svg>
            </div>
            <span className="logo-text">Samvaad</span>
          </div>
          
          <div className="auth-visual-content">
            <h1 className="text-gradient">Prepare for your <br/> next big break.</h1>
            <p>Join over 10,000+ candidates who have sharpened their interview skills with our AI-powered feedback system.</p>
            
            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <div className="feature-dot"></div>
                <span>Real-time behavioral analysis</span>
              </div>
              <div className="auth-feature-item">
                <div className="feature-dot"></div>
                <span>Hyper-realistic AI interviewers</span>
              </div>
              <div className="auth-feature-item">
                <div className="feature-dot"></div>
                <span>Human-led mock sessions</span>
              </div>
            </div>
          </div>

          <div className="auth-footer-stats">
            <div className="auth-stat">
              <h4>98%</h4>
              <p>Success Rate</p>
            </div>
            <div className="auth-stat">
              <h4>24/7</h4>
              <p>Availability</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="auth-form-side">
          <div className="glass-panel auth-panel">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '0.5rem', fontWeight: '800' }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {isLogin ? 'Enter your credentials to access your dashboard.' : 'Start your journey to becoming interview-ready today.'}
              </p>
            </div>

            {error && <div className="error-alert">{error}</div>}
            {success && <div className="success-alert">{success}</div>}

            {!isLogin && (
              <div className="role-toggle-group">
                <button 
                  type="button" 
                  onClick={() => setRole('student')} 
                  className={`role-btn ${role === 'student' ? 'active' : ''}`}
                >
                  Student
                </button>
                <button 
                  type="button" 
                  onClick={() => setRole('interviewer')} 
                  className={`role-btn ${role === 'interviewer' ? 'active' : ''}`}
                >
                  Interviewer
                </button>
              </div>
            )}

            {showForgot ? (
              <div className="animate-fade-in">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: '800' }}>Reset Password</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your email to receive a password reset link.</p>
                </div>
                <form onSubmit={handleForgotSubmit} className="auth-form">
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input type="email" className="input-field" placeholder="name@company.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary auth-submit" disabled={forgotLoading}>
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => setShowForgot(false)} className="btn-outline" style={{ width: '100%', marginTop: '0.5rem' }}>Back to Login</button>
                </form>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="auth-form">
                  {!isLogin && (
                    <div className="input-group">
                      <label className="input-label">Full Name</label>
                      <input type="text" className="input-field" placeholder="e.g. Suraj Mishra" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                  )}
                  
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input type="email" className="input-field" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>

                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', opacity: 0.8 }}
                          title={showPassword ? "Hide Password" : "Show Password"}
                        >
                          {showPassword ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          )}
                        </button>
                      </div>
                      {isLogin && <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.75rem', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '600' }}>Forgot?</button>}
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="input-field" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                  </div>

                  {!isLogin && role === 'interviewer' && (
                    <div className="interviewer-fields animate-fade-in">
                      <div className="input-group">
                        <label className="input-label">Years of Experience</label>
                        <input type="number" className="input-field" placeholder="e.g. 5" value={experience} onChange={(e) => setExperience(e.target.value)} required min="0" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Current Job Role</label>
                        <input type="text" className="input-field" placeholder="e.g. Senior Software Engineer" value={jobRole} onChange={(e) => setJobRole(e.target.value)} required />
                      </div>
                    </div>
                  )}

                  {!isLogin && (
                    <div className="input-group animate-fade-in" style={{ marginTop: '1rem' }}>
                      <label className="input-label">Resume (PDF)</label>
                      <input 
                        type="file" 
                        className="input-field file-input" 
                        accept=".pdf" 
                        onChange={(e) => setResume(e.target.files[0])} 
                        style={{ padding: '10px' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '4px', fontWeight: '600' }}>
                        ✨ AI will use your resume to prepare specific questions.
                      </p>
                    </div>
                  )}
                  
                  <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Get Started')}
                    {!loading && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    )}
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '1rem' }}>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>or continue with</span>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Login Failed')}
                    theme="filled_black"
                    shape="pill"
                    width="100%"
                  />
                </div>

                <div className="auth-switch">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    type="button"
                    onClick={() => setIsLogin(!isLogin)} 
                  >
                    {isLogin ? 'Sign Up' : 'Log In'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
