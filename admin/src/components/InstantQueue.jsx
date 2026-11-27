import React from 'react';
import { RefreshCw, Video } from 'lucide-react';

export default function InstantQueue({ queue, onJoinCandidate, onRefresh, canJoin = true }) {
  return (
    <section className="tab-panel active">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Instant assessment queue</h2>
          <p className="panel-subtitle">
            {canJoin
              ? 'Workers requesting on-demand video verification. Join the call to begin.'
              : 'Workers waiting for the marketing desk. Admin can monitor; marketing members take the calls.'}
          </p>
        </div>
        <button className="btn btn-outline" onClick={onRefresh} type="button">
          <RefreshCw size={16} />
          Refresh Queue
        </button>
      </div>

      <div className="queue-grid">
        {queue.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚡</div>
            <h3>Waiting for incoming instant assessments</h3>
            <p>When a worker taps Instant Assessment in the FRENVI app, their profile and video room appear here in real time.</p>
          </div>
        ) : (
          queue.map((cand) => (
            <div
              key={cand._id || cand.id}
              className={`queue-card ${cand.status === 'CALL_ACTIVE' ? 'is-live' : 'needs-accept'}`}
            >
              <div className="card-top">
                <div className="candidate-meta">
                  <div className="meta-avatar">👷</div>
                  <div>
                    <div className="meta-name">{cand.userName || 'Candidate'}</div>
                    <div className="meta-phone">{cand.userPhone || ''}</div>
                  </div>
                </div>
                <div className={`wait-timer ${cand.status === 'CALL_ACTIVE' ? '' : 'pulse'}`}>
                  <span>{cand.status === 'CALL_ACTIVE' ? 'In call' : 'Waiting — accept now'}</span>
                </div>
              </div>

              <div className="designation-badge">
                {cand.designationTitle || 'Store Associate'}
              </div>

              <div className="card-chips">
                {(cand.categoryNames || cand.categoryIds || []).map((c, i) => (
                  <span key={i} className="chip">{c}</span>
                ))}
                <span className="chip">🗣️ {cand.language || 'English'}</span>
              </div>

              {canJoin ? (
                <button
                  className="btn btn-primary"
                  onClick={() => onJoinCandidate(cand)}
                  type="button"
                >
                  <Video size={16} />
                  <span>Accept & Join Call</span>
                </button>
              ) : (
                <div className="chip">Waiting for marketing</div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
