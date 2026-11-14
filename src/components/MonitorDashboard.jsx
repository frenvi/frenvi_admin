import React from 'react';

export default function MonitorDashboard({ monitor, onRefresh, onOpenQueue, onOpenScheduled }) {
  const remaining = monitor?.remaining || 0;
  const done = monitor?.done || 0;
  const inProgress = monitor?.inProgress || 0;
  const completedToday = monitor?.completedToday || 0;
  const passRate = monitor?.passRate || 0;
  const instant = monitor?.instantQueue || [];
  const scheduled = monitor?.scheduledBookings || [];
  const recent = monitor?.recentCompleted || [];
  const team = monitor?.team || [];

  return (
    <section className="tab-panel active">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Admin monitor</h2>
          <p className="panel-subtitle">See how many assessments are done and what is still left in the boarding queue.</p>
        </div>
        <button className="btn btn-outline" onClick={onRefresh} type="button">Refresh</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card remaining">
          <div className="stat-label">Remaining</div>
          <div className="stat-value">{remaining}</div>
          <div className="stat-hint">{instant.length} instant · {scheduled.length} scheduled</div>
        </div>
        <div className="stat-card done">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{done}</div>
          <div className="stat-hint">{completedToday} finished today</div>
        </div>
        <div className="stat-card live">
          <div className="stat-label">In session</div>
          <div className="stat-value">{inProgress}</div>
          <div className="stat-hint">Live video assessments</div>
        </div>
        <div className="stat-card pass">
          <div className="stat-label">Pass rate</div>
          <div className="stat-value">{passRate}%</div>
          <div className="stat-hint">Certified vs evaluated</div>
        </div>
      </div>

      <div className="monitor-split">
        <div className="white-panel">
          <div className="white-panel-head">
            <h3>Still in queue</h3>
            <button className="btn btn-outline" type="button" onClick={onOpenQueue}>Open queue</button>
          </div>
          {instant.length === 0 && scheduled.length === 0 ? (
            <p className="muted-copy">No workers waiting. Boarding members are clear.</p>
          ) : (
            <ul className="monitor-list">
              {instant.map((item) => (
                <li key={item._id || item.id}>
                  <span className="monitor-dot red" />
                  <div>
                    <strong>{item.userName || 'Worker'}</strong>
                    <small>Instant · {item.designationTitle || 'Assessment'}</small>
                  </div>
                  <span className="status-pill confirmed">WAITING</span>
                </li>
              ))}
              {scheduled.map((item) => (
                <li key={item._id || item.id}>
                  <span className="monitor-dot blue" />
                  <div>
                    <strong>{item.userName || 'Worker'}</strong>
                    <small>{item.scheduledDateFormatted || item.scheduledDate} · {item.slotTime}</small>
                  </div>
                  <span className="status-pill confirmed">BOOKED</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="white-panel">
          <div className="white-panel-head">
            <h3>Recently completed</h3>
            <button className="btn btn-outline" type="button" onClick={onOpenScheduled}>View slots</button>
          </div>
          {recent.length === 0 ? (
            <p className="muted-copy">No evaluations recorded yet.</p>
          ) : (
            <ul className="monitor-list">
              {recent.map((item) => (
                <li key={item._id || item.id}>
                  <span className="monitor-dot green" />
                  <div>
                    <strong>{item.userPhone || item.userName || 'Worker'}</strong>
                    <small>{item.assessorName || 'Assessor'} · {item.grade || ''} · {item.totalScore}/100</small>
                  </div>
                  <span className="status-pill completed">DONE</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {team.length > 0 && (
        <div className="white-panel" style={{ marginTop: 16 }}>
          <div className="white-panel-head">
            <h3>Boarding team output</h3>
          </div>
          <div className="team-grid">
            {team.map((member) => (
              <div key={member.name} className="team-card">
                <div className="team-name">{member.name}</div>
                <div className="team-meta">{member.done} completed · avg {member.avgScore}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
