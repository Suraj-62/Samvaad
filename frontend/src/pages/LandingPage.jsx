import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Ambient glowing orbs */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>
      <div className="ambient-glow glow-3"></div>
      
      {/* 1. Navbar */}
      <nav className="landing-nav animate-fade-in">
        <div className="logo-section">
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
        
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#pricing">Pricing</a>
          <button className="btn-orange" style={{ padding: '0.5rem 1.5rem' }} onClick={() => navigate('/login')}>
            Start Free
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="hero-section">
        <div className="hero-text-side animate-fade-in delay-100">
          <div className="hero-pill">
            <span></span> v2.0 - Expert Interview Panels are live
          </div>
          <h1 className="hero-title">
            Master your interviews with <br/> <span className="text-gradient">Professional Feedback</span>
          </h1>
          <p className="hero-subtitle">
            Experience hyper-realistic Human mock interviews with industry experts. Get actionable insights, expert feedback, and behavioral analysis to land your dream job.
          </p>
          
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Start Mock Interview
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
            <button className="btn-outline" onClick={() => navigate('/login')}>
              View Demo
            </button>
          </div>
        </div>
        
        {/* CSS Mockup of Dashboard */}
        <div className="hero-visual-side animate-fade-in delay-300">
          <div className="dashboard-mock float-anim">
            <div className="dashboard-header">
              <div className="mac-dot dot-red"></div>
              <div className="mac-dot dot-yellow"></div>
              <div className="mac-dot dot-green"></div>
            </div>
            <div className="dashboard-body">
              <div className="mock-sidebar">
                <div className="mock-sidebar-item" style={{ background: 'var(--highlight-color)', opacity: 0.3 }}></div>
                <div className="mock-sidebar-item"></div>
                <div className="mock-sidebar-item"></div>
                <div className="mock-sidebar-item" style={{ marginTop: 'auto' }}></div>
              </div>
              <div className="mock-content">
                <div className="mock-card">
                  <div className="mock-line w-full"></div>
                  <div className="mock-line w-3-4"></div>
                  <div className="mock-line w-1-2"></div>
                </div>
                <div className="mock-card" style={{ flex: 1 }}>
                  <div style={{ color: 'var(--highlight-color)', fontSize: '0.8rem', fontWeight: 'bold' }}>Session Active...</div>
                  <div className="mock-waveform">
                    {[...Array(15)].map((_, i) => <div key={i} className="mock-bar"></div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="floating-stat stat-1 float-anim" style={{ animationDelay: '1s' }}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div className="stat-text">
              <h5>98/100</h5>
              <p>Technical Rating</p>
            </div>
          </div>
          
          <div className="floating-stat stat-2 float-anim" style={{ animationDelay: '2s' }}>
            <div className="stat-icon" style={{ color: 'var(--purple-glow)', background: 'rgba(139,92,246,0.1)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
            </div>
            <div className="stat-text">
              <h5>Real-time</h5>
              <p>Behavioral Insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Step-by-Step Guide */}
      <section id="how-it-works" className="steps-section">
        <div className="section-header animate-fade-in">
          <h2>Crack your interview in <span className="text-gradient">3 simple steps</span></h2>
        </div>
        <div className="steps-grid">
          <div className="step-card animate-fade-in delay-100">
            <div className="step-number">1</div>
            <h3>Upload Resume</h3>
            <p>Our platform analyzes your experience to match you with the right interviewers.</p>
          </div>
          <div className="step-card animate-fade-in delay-200">
            <div className="step-number">2</div>
            <h3>Simulate Interview</h3>
            <p>Face a realistic Human mock interview with industry experts.</p>
          </div>
          <div className="step-card animate-fade-in delay-300">
            <div className="step-number">3</div>
            <h3>Expert Feedback</h3>
            <p>Receive a comprehensive breakdown of your performance from your interviewer.</p>
          </div>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section id="features" className="features-section">
        <div className="section-header animate-fade-in">
          <h2>Powerful capabilities built for <br/> ambitious candidates.</h2>
        </div>
        
        <div className="feature-grid">
          <div className="feature-card animate-fade-in delay-100">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 12L2.32 15.21"></path><path d="M12 12l9.68-3.21"></path></svg>
            </div>
            <h3>Role-Specific Panels</h3>
            <p>Interviewers from top companies evaluate you based on real-world industry standards.</p>
          </div>
          
          <div className="feature-card animate-fade-in delay-200">
            <div className="feature-icon" style={{ color: 'var(--purple-glow)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <h3>Comprehensive Evaluation</h3>
            <p>Receive immediate, actionable feedback on technical accuracy and communication skills.</p>
          </div>
          
          <div className="feature-card animate-fade-in delay-300">
            <div className="feature-icon" style={{ color: '#22c55e' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </div>
            <h3>Expert Mock Support</h3>
            <p>Schedule sessions with industry experts for a truly realistic experience.</p>
          </div>
        </div>
      </section>

      {/* 5. Testimonials */}
      <section className="testimonials-section">
        <div className="section-header animate-fade-in">
          <h2>Trusted by candidates from <span className="text-gradient">Top Companies</span></h2>
        </div>
        <div className="testimonial-grid">
          <div className="testimonial-card animate-fade-in delay-100">
            <div className="user-info">
              <div className="user-avatar" style={{ background: '#3b82f6' }}></div>
              <div className="user-details">
                <h4>Aditya Sharma</h4>
                <p>Placed at Google</p>
              </div>
            </div>
            <p className="testimonial-text">"The mock interview felt so real. The feedback on my communication was a game-changer for my actual interview."</p>
          </div>
          <div className="testimonial-card animate-fade-in delay-200">
            <div className="user-info">
              <div className="user-avatar" style={{ background: '#8b5cf6' }}></div>
              <div className="user-details">
                <h4>Priya Verma</h4>
                <p>Placed at Microsoft</p>
              </div>
            </div>
            <p className="testimonial-text">"Human mock interviews helped me bridge the gap between technical knowledge and presentation. Highly recommended!"</p>
          </div>
          <div className="testimonial-card animate-fade-in delay-300">
            <div className="user-info">
              <div className="user-avatar" style={{ background: '#10b981' }}></div>
              <div className="user-details">
                <h4>Rahul Iyer</h4>
                <p>Placed at Amazon</p>
              </div>
            </div>
            <p className="testimonial-text">"The detailed report is what sets Samvaad apart. It literally highlights where I was lacking and where I was confident."</p>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header animate-fade-in">
          <h2>Choose your <span className="text-gradient">Path to Success</span></h2>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card animate-fade-in delay-100">
            <h3>Starter</h3>
            <div className="price-tag">Free <span>/ Forever</span></div>
            <ul className="pricing-features">
              <li><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> 1 Human Mock Interview</li>
              <li><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> Peer Review System</li>
              <li><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> Community Support</li>
            </ul>
            <button className="btn-outline w-full" onClick={() => navigate('/login')}>Get Started</button>
          </div>
          <div className="pricing-card popular animate-fade-in delay-200">
            <div className="hero-pill" style={{ marginBottom: '1rem' }}>Most Popular</div>
            <h3>Pro</h3>
            <div className="price-tag">$0 <span>/ Limited Time</span></div>
            <ul className="pricing-features">
              <li><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> Unlimited Peer Mock Sessions</li>
              <li><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> Expert Interview Panel</li>
              <li><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> Priority Scheduling</li>
              <li><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> Resume Optimization Guide</li>
            </ul>
            <button className="btn-primary w-full" onClick={() => navigate('/login')}>Upgrade Now</button>
          </div>
        </div>
      </section>

      {/* 7. Contact Section */}
      <section className="contact-section">
        <div className="contact-card animate-fade-in">
          <div className="contact-info">
            <h2>Get in <span className="text-gradient">Touch</span></h2>
            <p>Have questions or need support? We're here to help you succeed.</p>
            <div className="contact-methods">
              <a href="mailto:samvad602@gmail.com" className="contact-item">
                <div className="contact-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                samvad602@gmail.com
              </a>
              <a href="https://www.linkedin.com/in/suraj-kumar-mishra-30112527b" target="_blank" rel="noopener noreferrer" className="contact-item">
                <div className="contact-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </div>
                LinkedIn: Suraj Kumar Mishra
              </a>
              <div className="contact-item">
                <div className="contact-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                Phone: +91 XXXXX XXXXX
              </div>
            </div>
          </div>
          <div className="hero-visual-side" style={{ flex: 0.8 }}>
             {/* Simple Glass Illustration for Contact */}
             <div className="dashboard-mock" style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="logo-icon" style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                </div>
                <h3>Let's talk!</h3>
                <p style={{ fontSize: '0.9rem' }}>We usually respond within 24 hours.</p>
             </div>
          </div>
        </div>
      </section>

      {/* 8. Footer CTA */}
      <footer className="premium-footer">
        <div className="footer-content">
          <h2>Ready to unlock your potential?</h2>
          <p>Join thousands of candidates who cracked their dream companies with Samvaad.</p>
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}>
            Get Started for Free
          </button>
        </div>
        
        <div className="footer-bottom">
          <div className="logo-section" style={{ opacity: 0.7 }}>
            <span className="logo-text" style={{ fontSize: '1.2rem' }}>Samvaad</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="mailto:samvad602@gmail.com">Email</a>
            <a href="https://www.linkedin.com/in/suraj-kumar-mishra-30112527b" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            © {new Date().getFullYear()} Samvaad. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
