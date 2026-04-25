import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function HumanMockInterview() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config;
  const meeting = location.state?.meeting;
  
  const [role, setRole] = useState(config?.role || 'candidate');
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const streamRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [timer, setTimer] = useState(0);
  
  // Unique room ID based on meeting ID
  const roomId = meeting?.meetingId || 'samvaad-default-room';

  useEffect(() => {
    if (!config && !meeting) {
      navigate('/dashboard');
      return;
    }
    
    // Load PeerJS from CDN dynamically
    const script = document.createElement('script');
    script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
    script.async = true;
    script.onload = () => initPeer();
    document.body.appendChild(script);

    async function initPeer() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Create Peer with a predictable ID for the room
        // One will be the 'host' (interviewer) and one 'guest' (candidate)
        // Or we use the roomId + role to find each other
        const myPeerId = `${roomId}-${role}`;
        const otherPeerId = `${roomId}-${role === 'interviewer' ? 'candidate' : 'interviewer'}`;
        
        const peer = new window.Peer(myPeerId);
        peerInstance.current = peer;

        peer.on('open', (id) => {
          setPeerId(id);
          console.log('My peer ID is: ' + id);
          // Try to call the other person
          setTimeout(() => {
            const call = peer.call(otherPeerId, stream);
            if (call) {
              call.on('stream', (userRemoteStream) => {
                setRemoteStream(userRemoteStream);
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = userRemoteStream;
              });
            }
          }, 2000); // Wait for other to potentially open
        });

        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (userRemoteStream) => {
            setRemoteStream(userRemoteStream);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = userRemoteStream;
          });
        });

      } catch (err) {
        console.error("Media/Peer access denied:", err);
      }
    }

    const interval = setInterval(() => setTimer(t => t + 1), 1000);

    return () => {
      clearInterval(interval);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (peerInstance.current) peerInstance.current.destroy();
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [config, meeting, navigate, role, roomId]);

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
    <div className="meeting-page" style={{ height: '100vh', width: '100vw', background: 'var(--bg-primary)', margin: '-2rem', display: 'flex', flexDirection: 'column', color: '#fff', overflow: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* HUD Header */}
      <div className="meeting-header" style={{ padding: '1rem 2.5rem', background: 'rgba(11,11,11,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="logo-box" style={{ width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" /></svg>
          </div>
          <div>
            <div className="header-title" style={{ fontWeight: '800', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Live Interview 
              <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 10px #ef4444' }}></div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>ID: {roomId} • {formatTime(timer)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
           <div className="status-badge" style={{ color: remoteStream ? '#10b981' : '#f59e0b', fontSize: '0.9rem', fontWeight: '700', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)' }}>
             {remoteStream ? 'CONNECTED' : 'WAITING...'}
           </div>
           <button onClick={handleEnd} className="btn-primary end-btn" style={{ background: '#ef4444', border: 'none', padding: '0.8rem 1.5rem' }}>End</button>
        </div>
      </div>

      <div className="meeting-body" style={{ flex: 1, display: 'flex', padding: '2rem', gap: '2rem', position: 'relative' }}>
        
        {/* Background Decorative */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '60%', background: 'rgba(245, 158, 11, 0.03)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>

        {/* Main Video (Remote) */}
        <div className="remote-video-container" style={{ flex: 1.5, position: 'relative', background: '#000', borderRadius: '32px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', zIndex: 1 }}>
           <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
           
           {!remoteStream && (
             <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(11, 11, 11, 0.95)' }}>
                <div className="loader" style={{ width: '50px', height: '50px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }}></div>
                <h3 style={{ margin: 0 }}>Waiting for partner...</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', padding: '0 1rem' }}>ID: {roomId}</p>
             </div>
           )}

           <div className="name-tag" style={{ position: 'absolute', bottom: '2rem', left: '2rem', background: 'rgba(11, 11, 11, 0.8)', padding: '0.8rem 1.5rem', borderRadius: '16px', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: remoteStream ? '#10b981' : '#f59e0b' }}></div>
              <span style={{ fontWeight: '700' }}>{role === 'interviewer' ? 'Candidate' : 'Interviewer'}</span>
           </div>
        </div>

        {/* Side Panel: Local Video & Controls */}
        <div className="controls-panel" style={{ flex: 0.6, display: 'flex', flexDirection: 'column', gap: '2rem', zIndex: 1 }}>
           
           {/* Local Preview */}
           <div className="local-video-container" style={{ flex: 1, position: 'relative', background: '#000', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <div style={{ position: 'absolute', bottom: '1.2rem', left: '1.2rem', background: 'rgba(11, 11, 11, 0.7)', padding: '0.5rem 1rem', borderRadius: '12px', backdropFilter: 'blur(8px)', fontSize: '0.8rem', fontWeight: '700' }}>
                 You ({role})
              </div>
           </div>

           {/* Controls */}
           <div className="controls-bar glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
              <button onClick={toggleMute} style={{ width: '60px', height: '60px', borderRadius: '18px', border: 'none', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {isMuted ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path></svg> 
                         : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>}
              </button>
              <button onClick={toggleCamera} style={{ width: '60px', height: '60px', borderRadius: '18px', border: 'none', background: isCameraOff ? '#ef4444' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {isCameraOff ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>}
              </button>
           </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .loader { border-top-color: transparent; }
        
        @media (max-width: 768px) {
          .meeting-header { padding: 1rem !important; background: rgba(11, 11, 11, 0.95) !important; }
          .header-title { fontSize: 1.1rem !important; }
          .status-badge { display: none !important; }
          .meeting-body { 
            flex-direction: column !important; 
            padding: 1rem !important;
            gap: 1rem !important;
            overflow-y: auto !important;
          }
          .remote-video-container { 
            flex: none !important; 
            height: 50vh !important;
            min-height: 300px !important;
            border-radius: 20px !important;
          }
          .controls-panel { 
            flex: none !important;
            gap: 1rem !important;
          }
          .local-video-container { 
            height: 150px !important;
            width: 120px !important;
            position: fixed !important;
            bottom: 100px !important;
            right: 20px !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 20px rgba(0,0,0,0.5) !important;
          }
          .controls-bar {
            padding: 1rem !important;
            border-radius: 20px !important;
          }
          .controls-bar button {
            width: 50px !important;
            height: 50px !important;
          }
          .name-tag {
            bottom: 1rem !important;
            left: 1rem !important;
            padding: 0.5rem 1rem !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </div>
  );
}
