const SESSION_KEY = 'frenvi_staff_session';

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.user || !parsed.token) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function defaultTabForRole(department) {
  if (department === 'admin') return 'monitor';
  if (department === 'marketing') return 'queue';
  return 'queue';
}
