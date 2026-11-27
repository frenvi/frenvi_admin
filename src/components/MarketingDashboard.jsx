import React from 'react';

export default function MarketingDashboard({ monitor, onRefresh }) {
  const workers = monitor?.workers || { NEW: 0, BOOKED: 0, IN_PROGRESS: 0, COMPLETED: 0 };
  const remaining = monitor?.remaining || 0;
  const done = monitor?.done || 0;
  const passRate = monitor?.passRate || 0;
  const scheduled = monitor?.scheduledBookings || [];
  const recent = monitor?.recentCompleted || [];

  const funnel = [
    { label: 'New workers', value: workers.NEW || 0, hint: 'Not yet assessed' },
    { label: 'Booked slots', value: workers.BOOKED || scheduled.length, hint: 'Waiting for boarding' },
    { label: 'In assessment', value: workers.IN_PROGRESS || 0, hint: 'Live with boarding' },
    { label: 'Certified', value: workers.COMPLETED || done, hint: 'Ready for shifts' }
  ];

  return (
    <section className="tab-panel active">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Marketing overview</h2>
          <p className="panel-subtitle">Onboarding funnel from new workers to certified, shift-ready talent.</p>
        </div>
        <button className="btn btn-outline" onClick={onRefresh} type="button">Refresh</button>
      </div>

      <div className="stat-grid">
        {funnel.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-label">{item.label}</div>
            <div className="stat-value">{item.value}</div>
            <div className="stat-hint">{item.hint}</div>
          </div>
        ))}
      </div>

      <div className="monitor-split">
        <div className="white-panel">
          <div className="white-panel-head">
            <h3>Still to certify</h3>
            <span className="chip">{remaining} left</span>
          </div>
          {scheduled.length === 0 ? (
            <p className="muted-copy">No upcoming marketing-ready bookings in the calendar.</p>
          ) : (
            <ul className="monitor-list">
              {scheduled.map((item) => (
                <li key={item._id || item.id}>
                  <span className="monitor-dot blue" />
                  <div>
                    <strong>{item.userName || 'Worker'}</strong>
                    <small>{item.designationTitle} · {item.language || 'English'}</small>
                  </div>
                  <span className="status-pill confirmed">{item.slotTime}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="white-panel">
          <div className="white-panel-head">
            <h3>Certified talent</h3>
            <span className="chip">{passRate}% pass</span>
          </div>
          {recent.length === 0 ? (
            <p className="muted-copy">Boarding has not certified workers yet.</p>
          ) : (
            <ul className="monitor-list">
              {recent.map((item) => (
                <li key={item._id || item.id}>
                  <span className="monitor-dot green" />
                  <div>
                    <strong>{item.skillBadge || 'Certified Associate'}</strong>
                    <small>{item.grade} · {item.totalScore}/100</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
