import React from 'react';

const ROLE_LABELS = {
  admin: 'MAIN ADMIN',
  marketing: 'MARKETING',
  boarding: 'BOARDING'
};

export default function Header({
  user,
  metrics,
  assessorStatus,
  onStatusChange,
  onLogout
}) {
  const isBoarding = user?.department === 'boarding';

  return (
    <header className="admin-header">
      <div className="brand-col">
        <div className="brand-logo">
          <img src={`${import.meta.env.BASE_URL}frenvi_logo.png`} alt="FRENVI" className="brand-logo-img" />
          <span className="brand-name">FRENVI</span>
          <span className="badge-role">{ROLE_LABELS[user?.department] || 'TEAM DESK'}</span>
        </div>
        <p className="brand-sub">Worker competency evaluation & skill certification</p>
      </div>

      <div className="header-metrics">
        <div className="metric-pill">
          <span className="metric-icon">⚡</span>
          <span className="metric-label">Instant Queue</span>
          <span className="metric-val">{metrics.instantQueueCount}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-icon">📅</span>
          <span className="metric-label">Scheduled</span>
          <span className="metric-val">{metrics.scheduledCount}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-icon">✅</span>
          <span className="metric-label">Remaining</span>
          <span className="metric-val">{metrics.remaining ?? (metrics.instantQueueCount + metrics.scheduledCount)}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-icon">⭐</span>
          <span className="metric-label">Done</span>
          <span className="metric-val text-green">{metrics.done ?? metrics.passRate}</span>
        </div>
      </div>

      <div className="assessor-profile">
        <div className="assessor-avatar">{user?.avatar || '👤'}</div>
        <div className="assessor-info">
          <div className="assessor-name">{user?.name || 'Team member'}</div>
          <div className="assessor-status-wrapper">
            {isBoarding ? (
              <>
                <span className={`live-dot ${assessorStatus === 'available' ? 'online' : ''}`}></span>
                <select
                  value={assessorStatus}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className="status-select"
                >
                  <option value="available">Available for Calls</option>
                  <option value="in_session">In Assessment Session</option>
                  <option value="break">Break / Offline</option>
                </select>
              </>
            ) : (
              <span className="status-select">{user?.title || user?.department}</span>
            )}
          </div>
        </div>
        <button className="btn btn-outline logout-btn" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
