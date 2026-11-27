import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import EvaluationRubric from './EvaluationRubric';
import { fetchAgoraToken } from '../services/api';

const PLAY_OPTS = { fit: 'cover', mirror: true };
const REMOTE_PLAY_OPTS = { fit: 'cover' };

async function getAgoraRTC() {
  if (window.AgoraRTC) return window.AgoraRTC;
  for (let i = 0; i < 20; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (window.AgoraRTC) return window.AgoraRTC;
  }
  return window.AgoraRTC || null;
}

function isUsableToken(token) {
  if (!token || typeof token !== 'string') return null;
  if (token.startsWith('dev_token_') || token.startsWith('mock_token_')) return null;
  return token;
}

async function teardownCall(client, tracks) {
  try {
    if (tracks.video) {
      tracks.video.stop();
      tracks.video.close();
    }
  } catch (_) { /* ignore */ }
  try {
    if (tracks.audio) {
      tracks.audio.stop();
      tracks.audio.close();
    }
  } catch (_) { /* ignore */ }
  try {
    if (client) {
      await client.unpublish().catch(() => {});
      await client.leave();
    }
  } catch (_) { /* ignore */ }
}

export default function LiveAssessmentRoom({
  candidate,
  onLeaveCall,
  onSubmitEvaluation,
  onDraftUpdate,
  isSubmitting
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [localLive, setLocalLive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connecting to live video session...');

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const agoraClientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const sessionIdRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    if (!candidate) return undefined;

    const sessionId = ++sessionIdRef.current;
    let cancelled = false;
    let client = null;
    const tracks = { audio: null, video: null };

    async function initAgora() {
      const channel = candidate.channelName;
      if (!channel) {
        setStatusMessage('Missing video channel for this candidate.');
        return;
      }

      const AgoraRTC = await getAgoraRTC();
      if (!AgoraRTC) {
        setStatusMessage('Video SDK not loaded. Refresh the page and allow camera access.');
        return;
      }

      try {
        AgoraRTC.setLogLevel(3);
      } catch (_) { /* ignore */ }

      const uid = 100000 + Math.floor(Math.random() * 89999);
      setStatusMessage('Requesting camera, microphone and video token...');

      let tokenData;
      try {
        tokenData = await fetchAgoraToken(channel, uid, 'publisher');
      } catch (err) {
        if (!cancelled && sessionId === sessionIdRef.current) {
          setStatusMessage(`Could not fetch video token: ${err.message}`);
        }
        return;
      }

      if (cancelled || sessionId !== sessionIdRef.current) return;

      try {
        client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        agoraClientRef.current = client;

        client.on('user-published', async (user, mediaType) => {
          try {
            await client.subscribe(user, mediaType);
            if (mediaType === 'video') {
              const container = remoteVideoRef.current;
              if (container) {
                user.videoTrack.play(container, REMOTE_PLAY_OPTS);
              }
              setRemoteConnected(true);
              setStatusMessage('Candidate camera live');
            }
            if (mediaType === 'audio' && user.audioTrack) {
              try { user.audioTrack.setVolume(100); } catch (_) { /* ignore */ }
              user.audioTrack.play();
              const audioEl = document.getElementById('assessor-remote-audio');
              if (audioEl && user.audioTrack.getMediaStreamTrack) {
                audioEl.srcObject = new MediaStream([user.audioTrack.getMediaStreamTrack()]);
                audioEl.muted = false;
                audioEl.volume = 1;
                audioEl.play().catch(() => {});
              }
            }
          } catch (subErr) {
            console.warn('Failed to subscribe to candidate stream', subErr);
          }
        });

        client.on('user-unpublished', (_user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteConnected(false);
            setStatusMessage('Candidate camera paused. Waiting to reconnect...');
          }
        });

        client.on('user-left', () => {
          setRemoteConnected(false);
          setStatusMessage('Candidate left the room. Waiting to reconnect...');
        });

        const token = isUsableToken(tokenData.token);
        await client.join(tokenData.appId, channel, token, Number(tokenData.uid) || uid);

        if (cancelled || sessionId !== sessionIdRef.current) {
          await teardownCall(client, tracks);
          return;
        }

        try {
          try {
            tracks.audio = await AgoraRTC.createMicrophoneAudioTrack({
              AEC: true,
              ANS: true,
              AGC: true
            });
          } catch (micErr) {
            console.warn('Assessor microphone failed:', micErr);
            setStatusMessage('Allow microphone so the worker can hear you on the phone.');
          }

          try {
            tracks.video = await AgoraRTC.createCameraVideoTrack({
              encoderConfig: '720p_1',
              facingMode: 'user'
            });
          } catch (camErr) {
            console.warn('Assessor camera failed:', camErr);
          }

          localTracksRef.current = tracks;

          if (cancelled || sessionId !== sessionIdRef.current) {
            await teardownCall(client, tracks);
            return;
          }

          const localContainer = localVideoRef.current;
          if (localContainer && tracks.video) {
            tracks.video.play(localContainer, PLAY_OPTS);
            setLocalLive(true);
          }

          if (tracks.audio) {
            await client.publish([tracks.audio]);
          }
          if (tracks.video) {
            await client.publish([tracks.video]);
          }

          if (tracks.audio) {
            setStatusMessage(tracks.video
              ? 'Your camera and mic are live. Waiting for candidate...'
              : 'Your microphone is live. Allow camera to show video.');
          } else {
            setLocalLive(false);
            setStatusMessage('Allow camera & microphone in the browser so the worker can hear you.');
          }
        } catch (mediaErr) {
          console.warn('Assessor camera/mic failed:', mediaErr);
          setLocalLive(false);
          setStatusMessage(
            `Allow camera & microphone in the browser to appear on the worker's phone. ${mediaErr?.message || ''}`
          );
        }
      } catch (err) {
        console.warn('Agora setup error:', err);
        if (!cancelled) {
          setStatusMessage(`Video join failed: ${err.message || 'check Agora credentials'}`);
        }
      }
    }

    initAgora();

    return () => {
      cancelled = true;
      const clientToClose = client || agoraClientRef.current;
      const tracksToClose = {
        audio: tracks.audio || localTracksRef.current.audio,
        video: tracks.video || localTracksRef.current.video
      };
      teardownCall(clientToClose, tracksToClose);
      agoraClientRef.current = null;
      localTracksRef.current = { audio: null, video: null };
    };
  }, [candidate]);

  const toggleMic = () => {
    if (!localTracksRef.current.audio) return;
    const nextState = !isMicMuted;
    localTracksRef.current.audio.setEnabled(!nextState);
    setIsMicMuted(nextState);
  };

  const toggleCam = () => {
    if (!localTracksRef.current.video) return;
    const nextState = !isCamOff;
    localTracksRef.current.video.setEnabled(!nextState);
    setIsCamOff(nextState);
  };

  if (!candidate) {
    return (
      <section className="tab-panel active">
        <div className="empty-state">
          <div className="empty-icon">🎥</div>
          <h3>No live session yet</h3>
          <p>Join a worker from Instant Queue or Scheduled Appointments to start a two-way video assessment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="tab-panel active">
      <div className="room-layout">
        <div className="video-section">
          <div className="video-container">
            <div className="remote-player-wrapper">
              <audio id="assessor-remote-audio" autoPlay playsInline />
              <div
                id="assessor-remote-player"
                ref={remoteVideoRef}
                className="remote-video"
              />

              {!remoteConnected && (
                <div className="video-placeholder">
                  <div className="placeholder-avatar">👷</div>
                  <p className="placeholder-name">{candidate.userName || 'Worker Candidate'}</p>
                  <span className="placeholder-status">{statusMessage}</span>
                </div>
              )}

              <div className="call-overlay-header">
                <div className="room-id-tag">
                  <span className="room-dot"></span>
                  <span>LIVE ASSESSMENT</span>
                </div>
                <div className="call-timer-box">
                  {formatTimer(secondsRemaining)}
                </div>
              </div>
            </div>

            <div className={`local-pip-wrapper ${localLive ? 'is-live' : ''} ${isCamOff ? 'is-off' : ''}`}>
              <div
                id="assessor-local-player"
                ref={localVideoRef}
                className="local-video"
              />
              {!localLive && (
                <div className="pip-fallback">Your camera</div>
              )}
              {isCamOff && localLive && (
                <div className="pip-fallback">Camera off</div>
              )}
              <div className="pip-label">You (Assessor)</div>
            </div>
          </div>

          <div className="call-controls">
            <button className={`control-btn ${isMicMuted ? 'is-off' : ''}`} onClick={toggleMic} type="button">
              <span className="control-icon-svg">{isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}</span>
              <span className="control-text">{isMicMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button className={`control-btn ${isCamOff ? 'is-off' : ''}`} onClick={toggleCam} type="button">
              <span className="control-icon-svg">{isCamOff ? <VideoOff size={20} /> : <Video size={20} />}</span>
              <span className="control-text">{isCamOff ? 'Start Video' : 'Stop Video'}</span>
            </button>

            <button className="control-btn end-call" onClick={onLeaveCall} type="button">
              <span className="control-icon-svg"><PhoneOff size={20} /></span>
              <span className="control-text">End Call</span>
            </button>
          </div>

          <div className="candidate-quick-card">
            <div className="candidate-header">
              <div className="candidate-avatar">👷</div>
              <div>
                <h4 className="cand-name">{candidate.userName || 'Candidate'}</h4>
                <p className="cand-phone">{candidate.userPhone || ''}</p>
              </div>
              <span className="tag-role">
                {candidate.designationTitle || candidate.designation || 'Retail Specialist'}
              </span>
            </div>
            <div className="cand-tags">
              <span className="pill">
                {candidate.designationTitle || candidate.designation || 'Operations'}
              </span>
              <span className="pill">Language: {candidate.language || 'English'}</span>
              <span className="pill">15 min video session</span>
              {(candidate.categoryNames || candidate.categoryIds || []).slice(0, 3).map((c, i) => (
                <span key={i} className="pill">{c}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="scoring-section">
          <EvaluationRubric
            candidate={candidate}
            onSubmit={onSubmitEvaluation}
            onDraftUpdate={onDraftUpdate}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </section>
  );
}
