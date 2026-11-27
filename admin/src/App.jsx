import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import InstantQueue from './components/InstantQueue';
import ScheduledAppointments from './components/ScheduledAppointments';
import LiveAssessmentRoom from './components/LiveAssessmentRoom';
import HistoryLog from './components/HistoryLog';
import LoginPage from './components/LoginPage';
import MonitorDashboard from './components/MonitorDashboard';
import MarketingDashboard from './components/MarketingDashboard';
import BoonApprovals from './components/BoonApprovals';
import { loadSession, saveSession, clearSession, defaultTabForRole } from './auth';
import {
  fetchDashboardData,
  fetchAllEvaluations,
  fetchMonitorStats,
  fetchPendingBoons,
  acceptInstantAssessment,
  submitEvaluation,
  createSignalingSocket
} from './services/api';
import { notifyDesktop, playAlertTone, stopAlertTone, unlockAlertAudio } from './utils/alertTone';

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const user = session?.user || null;

  const [activeTab, setActiveTab] = useState(() => defaultTabForRole(loadSession()?.user?.department));
  const [instantQueue, setInstantQueue] = useState([]);
  const [scheduledBookings, setScheduledBookings] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [monitor, setMonitor] = useState(null);
  const [pendingBoonCount, setPendingBoonCount] = useState(0);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [assessorStatus, setAssessorStatus] = useState('available');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const socketRef = useRef(null);
  const inCallRef = useRef(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const alertIncomingInstant = (cand) => {
    const name = cand?.userName || 'Worker';
    const role = cand?.designationTitle || 'Instant assessment';
    playAlertTone('instant', { repeats: 5, gapMs: 1500 });
    notifyDesktop('FRENVI · Instant assessment', `${name} is waiting — ${role}. Accept now.`);
    showToast(`⚡ Instant request: ${name} — Accept in Instant Queue`);
    if (!inCallRef.current) {
      setActiveTab('queue');
    }
  };

  const loadData = async () => {
    try {
      const data = await fetchDashboardData();
      if (data) {
        setInstantQueue(data.instantQueue || []);
        setScheduledBookings(data.scheduledBookings || []);
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err.message);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await fetchAllEvaluations();
      if (data) setHistoryRecords(data);
    } catch (err) {
      console.warn('History fetch error:', err.message);
    }
  };

  const loadMonitor = async () => {
    try {
      const data = await fetchMonitorStats();
      if (data) setMonitor(data);
    } catch (err) {
      console.warn('Monitor fetch error:', err.message);
    }
  };

  const loadPendingBoons = async () => {
    try {
      const data = await fetchPendingBoons();
      setPendingBoonCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.warn('Pending boons fetch error:', err.message);
    }
  };

  useEffect(() => {
    if (!user) return undefined;

    loadData();
    loadHistory();
    loadMonitor();
    loadPendingBoons();

    const socket = createSignalingSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Connected to FRENVI Socket Server:', socket.id);
    });

    socket.on('new_instant_assessment', (cand) => {
      alertIncomingInstant(cand);
      loadData();
      loadMonitor();
    });

    socket.on('new_scheduled_booking', (booking) => {
      playAlertTone('scheduled', { repeats: 2, gapMs: 1800 });
      notifyDesktop(
        'FRENVI · Scheduled assessment',
        `${booking?.userName || 'Candidate'} booked ${booking?.slotTime || 'a slot'}`
      );
      showToast(`📅 New scheduled booking: ${booking.userName || 'Candidate'}`);
      loadData();
      loadMonitor();
    });

    socket.on('booking_rescheduled', (booking) => {
      playAlertTone('scheduled', { repeats: 1 });
      showToast(`🔄 Booking rescheduled: ${booking?.userName || 'Candidate'}`);
      loadData();
      loadMonitor();
    });

    socket.on('new_boon_pending', () => {
      playAlertTone('boon', { repeats: 2, gapMs: 1400 });
      showToast('📦 New boon waiting for approval');
      loadPendingBoons();
    });

    const interval = setInterval(() => {
      loadData();
      loadMonitor();
      loadPendingBoons();
    }, 5000);

    return () => {
      clearInterval(interval);
      stopAlertTone();
      socket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    inCallRef.current = Boolean(activeCandidate);
    if (activeCandidate) stopAlertTone();
  }, [activeCandidate]);

  const handleLoggedIn = (nextSession) => {
    unlockAlertAudio();
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    saveSession(nextSession);
    setSession(nextSession);
    setActiveTab(defaultTabForRole(nextSession.user.department));
    showToast(`Welcome ${nextSession.user.name}`);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setActiveCandidate(null);
    setAssessorStatus('available');
  };

  const canJoin = user?.department === 'marketing' || user?.department === 'boarding' || user?.department === 'admin';

  const handleJoinCandidate = async (candidate) => {
    if (!canJoin) return;
    stopAlertTone();
    const assessmentId = candidate.assessmentId || candidate._id || candidate.id;
    try {
      if (assessmentId) {
        await acceptInstantAssessment(assessmentId, user?.name);
      }
    } catch (err) {
      console.warn('Accept assessment warning:', err.message);
      showToast(`⚠️ Could not accept: ${err.message}`);
      // Still allow joining room if socket/channel exists — worker may already be waiting
    }

    setActiveCandidate(candidate);
    setActiveTab('room');
    setAssessorStatus('in_session');

    if (socketRef.current) {
      const channel = candidate.channelName || `frenvi_room_${Date.now()}`;
      socketRef.current.emit('join_assessment', channel);
      socketRef.current.emit('assessment_accepted', {
        ...candidate,
        channelName: channel,
        assessmentId,
        assessorName: user?.name,
        assessor: {
          name: user?.name || 'FRENVI Marketing',
          avatar: '👩‍💼'
        }
      });
    }

    showToast(`🎥 Connected to assessment session with ${candidate.userName || 'Candidate'}`);
  };

  const handleLeaveCall = () => {
    setActiveCandidate(null);
    setActiveTab('queue');
    setAssessorStatus('available');
  };

  const handleDraftScoreUpdate = (scores, totalScore) => {
    if (socketRef.current && activeCandidate) {
      socketRef.current.emit('update_draft_score', {
        roomId: activeCandidate.channelName,
        scores,
        totalScore
      });
    }
  };

  const handleSubmitEvaluation = async (evaluationData) => {
    if (!activeCandidate) return;

    setIsSubmitting(true);
    try {
      const payload = {
        assessmentId: activeCandidate.assessmentId || activeCandidate._id,
        userPhone: activeCandidate.userPhone,
        userName: activeCandidate.userName,
        assessorName: `${user?.name || 'Assessor'} (${user?.title || 'Evaluator'})`,
        scores: evaluationData.scores,
        feedback: evaluationData.feedback
      };

      const result = await submitEvaluation(payload);

      showToast(`🎉 Verified ${activeCandidate.userName}! Score: ${result.totalScore}/100 (${result.grade})`);

      if (socketRef.current) {
        socketRef.current.emit('finish_assessment', {
          roomId: activeCandidate.channelName,
          evaluation: result
        });
      }

      setActiveCandidate(null);
      setAssessorStatus('available');
      await loadData();
      await loadHistory();
      await loadMonitor();
      setActiveTab(user?.department === 'admin' ? 'monitor' : 'history');
    } catch (err) {
      console.error('Submit evaluation error:', err);
      showToast(`⚠️ Failed to submit evaluation: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <LoginPage onLoggedIn={handleLoggedIn} />;
  }

  return (
    <div className="admin-app">
      <Header
        user={user}
        metrics={{
          instantQueueCount: instantQueue.length,
          scheduledCount: scheduledBookings.length,
          remaining: monitor?.remaining ?? (instantQueue.length + scheduledBookings.length),
          done: monitor?.done ?? historyRecords.length,
          passRate: `${monitor?.passRate ?? 0}%`
        }}
        assessorStatus={assessorStatus}
        onStatusChange={setAssessorStatus}
        onLogout={handleLogout}
      />

      <Navbar
        department={user.department}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        queueCount={instantQueue.length}
        scheduledCount={scheduledBookings.length}
        pendingBoonCount={pendingBoonCount}
        isInCall={Boolean(activeCandidate)}
      />

      <main className="admin-main">
        {activeTab === 'monitor' && (
          <MonitorDashboard
            monitor={monitor}
            onRefresh={() => { loadData(); loadMonitor(); loadHistory(); }}
            onOpenQueue={() => setActiveTab('queue')}
            onOpenScheduled={() => setActiveTab('scheduled')}
          />
        )}

        {activeTab === 'marketing' && (
          <MarketingDashboard
            monitor={monitor}
            onRefresh={() => { loadData(); loadMonitor(); loadHistory(); }}
          />
        )}

        {activeTab === 'queue' && (
          <InstantQueue
            queue={instantQueue}
            onJoinCandidate={handleJoinCandidate}
            onRefresh={loadData}
            canJoin={canJoin}
          />
        )}

        {activeTab === 'scheduled' && (
          <ScheduledAppointments
            bookings={scheduledBookings}
            onStartSession={handleJoinCandidate}
            canJoin={canJoin}
          />
        )}

        {activeTab === 'room' && (
          <LiveAssessmentRoom
            candidate={activeCandidate}
            onLeaveCall={handleLeaveCall}
            onSubmitEvaluation={handleSubmitEvaluation}
            onDraftUpdate={handleDraftScoreUpdate}
            isSubmitting={isSubmitting}
          />
        )}

        {activeTab === 'history' && (
          <HistoryLog
            records={historyRecords}
            onRefresh={loadHistory}
          />
        )}

        {activeTab === 'boons' && (
          <BoonApprovals
            reviewerName={user?.name || 'Frenvi Admin'}
          />
        )}
      </main>

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}
