import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function HumanMockInterview() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config;
  const meeting = location.state?.meeting;
  
  const [scores, setScores] = useState({ technical: 0, communication: 0, confidence: 0 });
  const [role, setRole] = useState(config?.role || 'candidate');

  const interviewerVideoRef = useRef(null);
  const candidateVideoRef = useRef(null);
  const streamRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState('Wait for the interviewer to begin...');
  const [timer, setTimer] = useState(0);
  
  const questionBank = [
    "Tell me about a challenging project you've worked on.",
    "How do you handle conflict in a team?",
    "Explain the concept of closures in Javascript.",
    "What is your greatest professional achievement?",
    "Why do you want to work at this company?",
    "Describe a time you failed and what you learned."
  ];

  useEffect(() => {
    if (!config && !meeting) {
      navigate('/dashboard');
      return;
    }
    
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        
        // In a real P2P, we would only set local stream to one of these
        // For simulation, we'll set it to our own role's video
        if (role === 'interviewer' && interviewerVideoRef.current) {
          interviewerVideoRef.current.srcObject = stream;
        } else if (role === 'candidate' && candidateVideoRef.current) {
          candidateVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Media access denied:", err);
      }
    }
    setupMedia();

    const interval = setInterval(() => setTimer(t => t + 1), 1000);

    return () => {
      clearInterval(interval);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, [config, meeting, navigate, role]);

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsCameraOff(!isCameraOff);
    }
  };

  const handleEnd = () => {
     navigate('/dashboard', { state: { message: 'Interview session ended successfully.' } });
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!config && !meeting) return null;

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#020617', margin: '-2rem', display: 'flex', flexDirection: 'column', color: '#fff', overflow: 'hidden' }}>
      
      {/* HUD Header */}
      <div style={{ padding: '0.75rem 2rem', background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="logo-icon" style={{ width: '32px', height: '32px', color: 'var(--purple-glow)' }}>
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" />
             </svg>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Human Mock Session 
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '100px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>LIVE</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Meeting ID: {meeting?.meetingId || 'Local-Dev'} • {formatTime(timer)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
           <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
              <button onClick={() => setRole('interviewer')} style={{ padding: '0.5rem 1rem', background: role === 'interviewer' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Interviewer</button>
              <button onClick={() => setRole('candidate')} style={{ padding: '0.5rem 1rem', background: role === 'candidate' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Candidate</button>
           </div>
           <button onClick={handleEnd} className="btn-orange" style={{ padding: '0.5rem 1.5rem', background: '#ef4444', fontWeight: 'bold' }}>Leave Session</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', padding: '1rem', gap: '1rem', overflow: 'hidden' }}>
        
        {/* Video Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', minHeight: 0 }}>
             {/* Left Video (Interviewer) */}
             <div style={{ position: 'relative', background: '#000', borderRadius: '24px', overflow: 'hidden', border: role === 'interviewer' ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)', boxShadow: role === 'interviewer' ? '0 0 30px rgba(139, 92, 246, 0.2)' : 'none' }}>
                <video ref={interviewerVideoRef} autoPlay playsInline muted={role === 'interviewer'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.6rem 1.2rem', borderRadius: '12px', backdropFilter: 'blur(8px)', fontSize: '0.9rem', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)' }}>
                   Interviewer {role === 'interviewer' && '(You)'}
                </div>
                {role === 'interviewer' && <div className="scanning-bar"></div>}
                {role !== 'interviewer' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                   <div style={{ textAlign: 'center' }}>
                      <div className="pulse" style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%', margin: '0 auto 10px' }}></div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Waiting for Interviewer...</span>
                   </div>
                </div>}
             </div>

             {/* Right Video (Candidate) */}
             <div style={{ position: 'relative', background: '#000', borderRadius: '24px', overflow: 'hidden', border: role === 'candidate' ? '2px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)', boxShadow: role === 'candidate' ? '0 0 30px rgba(6, 182, 212, 0.2)' : 'none' }}>
                <video ref={candidateVideoRef} autoPlay playsInline muted={role === 'candidate'} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.6rem 1.2rem', borderRadius: '12px', backdropFilter: 'blur(8px)', fontSize: '0.9rem', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)' }}>
                   Candidate {role === 'candidate' && '(You)'}
                </div>
                {role === 'candidate' && <div className="scanning-bar" style={{ animationDelay: '2s' }}></div>}
             </div>
          </div>

          {/* Controls & Question */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <div className="glass-panel" style={{ flex: 1, padding: '1.25rem', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ color: '#06b6d4', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>Current Question</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#fff' }}>"{activeQuestion}"</div>
             </div>
             
             <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={toggleMute} style={{ width: '50px', height: '50px', borderRadius: '12px', border: 'none', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', transition: 'all 0.3s' }}>
                   {isMuted ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> 
                           : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>}
                </button>
                <button onClick={toggleCamera} style={{ width: '50px', height: '50px', borderRadius: '12px', border: 'none', background: isCameraOff ? '#ef4444' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', transition: 'all 0.3s' }}>
                   {isCameraOff ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>}
                </button>
             </div>
          </div>
        </div>

        {/* AI Sidebar (Only for Interviewer) */}
        {role === 'interviewer' && (
           <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                 <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#8b5cf6', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    Question Bank
                 </h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {questionBank.map((q, i) => (
                      <button 
                        key={i} 
                        onClick={() => setActiveQuestion(q)}
                        style={{ textAlign: 'left', background: activeQuestion === q ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', border: activeQuestion === q ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.05)', color: activeQuestion === q ? '#fff' : '#94a3b8', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        {q}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#06b6d4', marginBottom: '1.25rem' }}>Live Assessment</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                     {Object.keys(scores).map(key => (
                       <div key={key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                             <span style={{ textTransform: 'capitalize', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>{key}</span>
                             <span style={{ fontSize: '0.75rem', color: '#06b6d4' }}>{scores[key]}/10</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                             {[1,2,3,4,5,6,7,8,9,10].map(val => (
                               <div 
                                 key={val} 
                                 onClick={() => setScores({...scores, [key]: val})}
                                 style={{ flex: 1, height: '6px', borderRadius: '2px', background: scores[key] >= val ? '#06b6d4' : 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
                               ></div>
                             ))}
                          </div>
                       </div>
                     ))}
                  </div>
              </div>
           </div>
        )}
      </div>

      <style>{`
        .scanning-bar {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 4px;
          background: linear-gradient(to bottom, transparent, rgba(6, 182, 212, 0.5), transparent);
          animation: scan 3s linear infinite;
          z-index: 5;
        }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .pulse {
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
