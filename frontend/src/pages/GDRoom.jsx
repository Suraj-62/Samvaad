import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { completeMeeting } from '../services/api';

export default function GDRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { meeting, userName } = location.state || {};

  const [peers, setPeers] = useState({}); // { peerId: { stream, name, role } }
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [timer, setTimer] = useState(0);
  const [myPeerId, setMyPeerId] = useState('');

  const streamRef = useRef(null);
  const localVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const callsRef = useRef({});

  const roomId = meeting?.meetingId || 'gd-room';
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  useEffect(() => {
    if (!meeting) {
      navigate('/dashboard');
      return;
    }

    // Determine my role and Peer ID
    let myRole = 'Participant';
    let myIdSuffix = `guest-${Math.floor(Math.random() * 1000)}`;

    if (meeting.host?.email === userInfo.email || meeting.host?.name === userName) {
      myRole = 'Host';
      myIdSuffix = 'host';
    } else {
      const pIndex = meeting.participants.findIndex(p => p.email === userInfo.email);
      if (pIndex !== -1) {
        myIdSuffix = `part-${pIndex}`;
      } else {
        // If not found by email, try to find an empty slot or just be a guest
        // We will just be a random guest to allow people to join if they aren't strictly invited by email
        myIdSuffix = `part-${Math.floor(Math.random() * 1000)}`;
      }
    }

    const computedMyPeerId = `${roomId}-${myIdSuffix}`;
    setMyPeerId(computedMyPeerId);

    // List of all possible known peer IDs to try connecting to
    const possiblePeerIds = [
      `${roomId}-host`,
      `${roomId}-part-0`,
      `${roomId}-part-1`,
      `${roomId}-part-2`,
      `${roomId}-part-3`,
      `${roomId}-part-4`
    ];

    const script = document.createElement('script');
    script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
    script.async = true;
    script.onload = () => initPeer(computedMyPeerId, possiblePeerIds, myRole);
    document.body.appendChild(script);

    async function initPeer(myId, possibleIds, role) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const peer = new window.Peer(myId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
              { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" }
            ]
          }
        });

        peerInstance.current = peer;

        const handleNewStream = (remoteId, remoteStream, remoteName, remoteRole) => {
          if (!remoteStream) return;
          setPeers(prev => {
            // Only update if something actually changed to prevent blinking/re-renders
            const current = prev[remoteId];
            if (current && current.stream === remoteStream && current.name === remoteName && current.role === remoteRole) {
              return prev;
            }
            return {
              ...prev,
              [remoteId]: { 
                stream: remoteStream, 
                name: remoteName || current?.name || 'Participant', 
                role: remoteRole || current?.role || 'Participant' 
              }
            };
          });
        };

        const setupDataConnection = (conn) => {
          conn.on('open', () => {
            conn.send({ type: 'identity', name: userName, role: role });
            // If I am the host, I help others discover each other
            if (role === 'Host') {
              const otherPeerIds = Object.keys(callsRef.current).filter(id => id !== conn.peer);
              conn.send({ type: 'peer-list', peers: otherPeerIds });
            }
          });
          conn.on('data', (data) => {
            if (data.type === 'identity') {
              setPeers(prev => ({
                ...prev,
                [conn.peer]: { ...prev[conn.peer], name: data.name, role: data.role }
              }));
            }
            if (data.type === 'peer-list' && data.peers) {
              data.peers.forEach(pid => {
                if (pid !== myId && !callsRef.current[pid]) {
                  initiateCall(pid);
                }
              });
            }
          });
        };

        const initiateCall = (targetId) => {
          // To prevent double calling/blinking, only the peer with the smaller ID initiates the call
          if (myId >= targetId) return; 
          if (callsRef.current[targetId]) return;

          const conn = peer.connect(targetId);
          if (conn) setupDataConnection(conn);

          const call = peer.call(targetId, stream, { metadata: { userName, role } });
          if (call) {
            callsRef.current[targetId] = call;
            call.on('stream', (remoteStream) => {
              handleNewStream(targetId, remoteStream, null, null);
            });
            call.on('close', () => cleanupPeer(targetId));
            call.on('error', () => cleanupPeer(targetId));
          }
        };

        const cleanupPeer = (remoteId) => {
          delete callsRef.current[remoteId];
          setPeers(prev => {
            const newPeers = { ...prev };
            delete newPeers[remoteId];
            return newPeers;
          });
        };

        peer.on('open', (id) => {
          console.log('Peer Opened:', id);
          
          // Connect to known participants and host
          possibleIds.forEach(tid => {
            if (tid !== myId) initiateCall(tid);
          });

          const connectInterval = setInterval(() => {
            possibleIds.forEach(tid => {
              if (tid !== myId && !callsRef.current[tid]) initiateCall(tid);
            });
          }, 5000);
          window._connectInterval = connectInterval;
        });

        peer.on('connection', (conn) => {
          setupDataConnection(conn);
        });

        peer.on('call', (call) => {
          const callerId = call.peer;
          call.answer(stream);
          callsRef.current[callerId] = call;

          call.on('stream', (remoteStream) => {
            handleNewStream(callerId, remoteStream, call.metadata?.userName, call.metadata?.role);
          });
          call.on('close', () => cleanupPeer(callerId));
          call.on('error', () => cleanupPeer(callerId));
        });

        peer.on('error', (err) => {
          console.warn('Peer error:', err);
          if (err.type === 'unavailable-id') {
            const retryId = `${roomId}-guest-${Math.floor(Math.random() * 10000)}`;
            initPeer(retryId, possibleIds, role);
          }
        });

      } catch (err) {
        console.error("WebRTC Error:", err);
        alert("Camera/Microphone access is required for Group Discussion.");
      }
    }

    const interval = setInterval(() => setTimer(t => t + 1), 1000);

    return () => {
      clearInterval(interval);
      if (window._connectInterval) clearInterval(window._connectInterval);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (peerInstance.current) peerInstance.current.destroy();
      if (document.body.contains(script)) document.body.removeChild(script);
      
      // Cleanup ObjectURLs if any, though we are using srcObject directly
      Object.values(callsRef.current).forEach(call => call.close());
    };
  }, [meeting, navigate, roomId, userName, userInfo.email]);

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

  const handleEnd = async () => {
     try {
       // Only host can complete meeting? Or anyone can leave. Let's just navigate away.
       // We can complete if we are the host.
       if (myPeerId.includes('-host') && meeting?.meetingId) {
         await completeMeeting(meeting.meetingId);
       }
     } catch (err) {
       console.error("Failed to end meeting:", err);
     }
     navigate('/dashboard', { state: { message: 'Left Group Discussion.' } });
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Video component to handle streams dynamically
  const VideoTrack = ({ stream, name, role, isLocal }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      let isMounted = true;
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        
        // Explicitly call play() to handle some browser policies
        const playVideo = async () => {
          try {
            await videoRef.current.play();
          } catch (err) {
            console.warn("Autoplay prevented, waiting for interaction:", name);
            // If autoplay fails, we can show a UI hint or just wait
          }
        };
        
        if (isMounted) playVideo();
      }
      return () => { isMounted = false; };
    }, [stream, name]);

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
         <video 
           ref={videoRef} 
           autoPlay 
           playsInline 
           muted={isLocal} 
           style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }} 
         />
         <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(11, 11, 11, 0.75)', padding: '0.4rem 1rem', borderRadius: '10px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: role === 'Host' ? '#db2777' : '#10b981', boxShadow: role === 'Host' ? '0 0 10px #db2777' : '0 0 10px #10b981' }}></div>
            <span style={{ fontWeight: '700', fontSize: '0.8rem', color: '#fff' }}>{name} {isLocal && '(You)'}</span>
         </div>
         
         {!isLocal && (
            <button 
              onClick={() => videoRef.current?.play()}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '5px', borderRadius: '50%', cursor: 'pointer', opacity: 0.6 }}
              title="Click if video doesn't start"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"></path></svg>
            </button>
         )}
      </div>
    );
  };

  if (!meeting) return null;

  const activePeers = Object.entries(peers).filter(([_, data]) => data.stream);
  const totalGridItems = 1 + activePeers.length;

  let gridTemplateColumns = '1fr';
  if (totalGridItems === 2) gridTemplateColumns = '1fr 1fr';
  else if (totalGridItems >= 3 && totalGridItems <= 4) gridTemplateColumns = '1fr 1fr';
  else if (totalGridItems >= 5) gridTemplateColumns = '1fr 1fr 1fr';

  return (
    <div className="meeting-page" style={{ height: '100vh', width: '100vw', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', color: '#fff', overflow: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Header */}
      <div className="meeting-header" style={{ padding: '0.75rem 2rem', background: 'rgba(11,11,11,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div className="logo-box" style={{ width: '38px', height: '38px', background: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              GD: {meeting.topic}
              <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 10px #ef4444' }}></div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#10b981' }}>ID: {roomId}</span> 
              <span>•</span>
              <span>{formatTime(timer)}</span>
              <span>•</span>
              <span>{totalGridItems} Active</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <button onClick={() => window.location.reload()} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Reconnect</button>
           <button onClick={handleEnd} className="btn-primary end-btn" style={{ background: '#ef4444', border: 'none', padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: '700' }}>Leave Session</button>
        </div>
      </div>

      <div className="meeting-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.5rem', position: 'relative' }}>
        
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '60%', background: 'rgba(16, 185, 129, 0.03)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>

        <div style={{ 
            flex: 1, 
            display: 'grid', 
            gridTemplateColumns, 
            gap: '1.5rem', 
            zIndex: 1,
            maxHeight: 'calc(100vh - 180px)',
            alignItems: 'center',
            justifyItems: 'center',
            alignContent: 'center'
        }}>
           
           <div style={{ width: '100%', height: '100%', maxHeight: '100%', aspectRatio: '16/9' }}>
               <VideoTrack 
                 stream={streamRef.current} 
                 name={userName} 
                 role={myPeerId.includes('-host') ? 'Host' : 'Participant'} 
                 isLocal={true} 
               />
           </div>

           {activePeers.map(([id, data]) => (
               <div key={id} style={{ width: '100%', height: '100%', maxHeight: '100%', aspectRatio: '16/9' }}>
                  <VideoTrack 
                    stream={data.stream} 
                    name={data.name} 
                    role={data.role} 
                    isLocal={false} 
                  />
               </div>
           ))}
        </div>

        <div className="controls-bar glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', zIndex: 10, width: 'fit-content', margin: '0 auto', borderRadius: '100px' }}>
            <button onClick={toggleMute} style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {isMuted ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path></svg> 
                       : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>}
            </button>
            <button onClick={toggleCamera} style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: isCameraOff ? '#ef4444' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {isCameraOff ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                           : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>}
            </button>
        </div>

      </div>
    </div>
  );
}
