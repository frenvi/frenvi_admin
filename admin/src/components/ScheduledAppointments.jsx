import React, { useState } from 'react';

export default function ScheduledAppointments({ bookings, onStartSession, canJoin = true }) {
  const [filter, setFilter] = useState('all');

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'today') return b.scheduledDateFormatted?.includes('Today') || b.scheduledDate?.includes('Today');
    if (filter === 'tomorrow') return b.scheduledDateFormatted?.includes('Tomorrow');
    return true;
  });

  return (
    <section className="tab-panel active">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Scheduled assessment slots</h2>
          <p className="panel-subtitle">Upcoming 15-minute video assessments booked from the FRENVI app.</p>
        </div>
        <div className="filter-group">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Dates
          </button>
          <button
            className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button
            className={`filter-btn ${filter === 'tomorrow' ? 'active' : ''}`}
            onClick={() => setFilter('tomorrow')}
          >
            Tomorrow
          </button>
        </div>
      </div>

      <div className="scheduled-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Target Designation</th>
              <th>Categories</th>
              <th>Language</th>
              <th>Scheduled Date & Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  No scheduled video appointments booked for this filter.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b._id || b.id}>
                  <td>
                    <strong>{b.userName || 'Candidate'}</strong>
                    <div className="table-sub">
                      {b.userPhone || ''}
                    </div>
                  </td>
                  <td>
                    <span className="desig-cell">
                      {b.designationTitle || 'Retail'}
                    </span>
                  </td>
                  <td>
                    <span className="table-sub">
                      {(b.categoryNames || b.categoryIds || []).join(', ') || 'Standard Operations'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px' }}>🗣️ {b.language || 'English'}</span>
                  </td>
                  <td>
                    <strong>{b.scheduledDateFormatted || b.scheduledDate || ''}</strong>
                    <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: '12px' }}>
                      ⏰ {b.slotTime || ''}
                    </div>
                  </td>
                  <td>
                    <span className="status-pill confirmed">CONFIRMED</span>
                  </td>
                  <td>
                    {canJoin ? (
                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => onStartSession(b)}
                      >
                        Start Session
                      </button>
                    ) : (
                      <span className="table-sub">Boarding handles this slot</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
