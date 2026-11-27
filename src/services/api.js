import { io } from 'socket.io-client';

// Live server from admin/.env (VITE_BACKEND_URL) — fallback stays production
const BACKEND_URL = String(
  import.meta.env.VITE_BACKEND_URL || 'https://api.frenvi.co'
).replace(/\/$/, '');

const API_BASE = `${BACKEND_URL}/api`;

export const getBackendUrl = () => BACKEND_URL;
export const getApiBase = () => API_BASE;

export const fetchDashboardData = async () => {
  const res = await fetch(`${API_BASE}/assessments/admin/dashboard`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch dashboard');
  return json.data;
};

export const fetchAgoraToken = async (channelName, uid = 1001, role = 'publisher') => {
  const numericUid = Number(uid) || 0;
  const res = await fetch(
    `${API_BASE}/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${numericUid}&role=${encodeURIComponent(role)}`
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to generate video token');
  return json.data;
};

export const submitEvaluation = async (evaluationPayload) => {
  const res = await fetch(`${API_BASE}/evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evaluationPayload)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to submit evaluation');
  return json.data;
};

export const fetchAllEvaluations = async () => {
  const res = await fetch(`${API_BASE}/evaluations/all`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch evaluations');
  return json.data;
};

export const fetchStaffDirectory = async () => {
  const res = await fetch(`${API_BASE}/auth/staff-directory`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load team directory');
  return json;
};

export const staffLogin = async (username, password, department) => {
  const res = await fetch(`${API_BASE}/auth/staff-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, department })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Login failed');
  return json;
};

export const acceptInstantAssessment = async (assessmentId, assessorName) => {
  const res = await fetch(`${API_BASE}/assessments/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assessmentId, assessorName })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to accept assessment');
  return json.data;
};

export const fetchMonitorStats = async () => {
  const res = await fetch(`${API_BASE}/assessments/admin/monitor`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch monitor stats');
  return json.data;
};

export const fetchPendingBoons = async () => {
  const res = await fetch(`${API_BASE}/shifts/admin/pending`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch pending boons');
  return json.data || [];
};

export const approveBoon = async (id, reviewedBy = 'Frenvi Admin') => {
  const res = await fetch(`${API_BASE}/shifts/admin/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewedBy })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to approve boon');
  return json.data;
};

export const rejectBoon = async (id, reviewedBy = 'Frenvi Admin', reason = '') => {
  const res = await fetch(`${API_BASE}/shifts/admin/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewedBy, reason })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to reject boon');
  return json.data;
};

export const updateBoon = async (id, payload = {}) => {
  const res = await fetch(`${API_BASE}/shifts/admin/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to update boon');
  return json.data;
};

export const sendBoonFeedback = async (id, payload = {}) => {
  const res = await fetch(`${API_BASE}/shifts/admin/${encodeURIComponent(id)}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to send feedback');
  return json.data;
};

export const createSignalingSocket = () => {
  return io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  });
};
