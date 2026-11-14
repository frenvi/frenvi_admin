import React from 'react';

export default function HistoryLog({ records, onRefresh }) {
  return (
    <section className="tab-panel active">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Certified workers</h2>
          <p className="panel-subtitle">Workers who completed video assessment, with scores and skill badges.</p>
        </div>
        <button className="btn btn-outline" onClick={onRefresh}>
          Refresh Records
        </button>
      </div>

      <div className="history-grid">
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h3>No evaluations conducted yet</h3>
            <p>When candidates are evaluated and verified through video calls, their scores and unlocked shifts will be archived here.</p>
          </div>
        ) : (
          records.map((item) => (
            <div key={item._id || item.id} className="history-card">
              <div className="hist-top">
                <div className="hist-name">
                  {item.userPhone || (item.userId && item.userId.name) || 'Worker Candidate'}
                </div>
                <div className="hist-score">{item.totalScore} / 100</div>
              </div>

              <div className="hist-badge">
                <span>🎖️</span>
                <span>{item.skillBadge || 'Verified Associate'}</span>
                <span className="grade-pill grade-a" style={{ marginLeft: 'auto' }}>
                  {item.grade || 'Grade A'}
                </span>
              </div>

              <div className="hist-feedback">
                "{item.feedback || 'Candidate passed practical competency assessment.'}"
              </div>

              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                Assessed by: {item.assessorName || 'Priya Sharma'} •{' '}
                {new Date(item.evaluatedAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
