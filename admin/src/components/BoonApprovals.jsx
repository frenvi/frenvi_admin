import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, MessageSquareText, Pencil, RefreshCw, Save, X } from 'lucide-react';
import {
  approveBoon,
  fetchPendingBoons,
  rejectBoon,
  sendBoonFeedback,
  updateBoon
} from '../services/api';

function formatPay(pay) {
  return `₹${Number(pay || 0).toLocaleString('en-IN')}`;
}

function blankForm(boon = {}) {
  return {
    brand: boon.brand || '',
    role: boon.role || '',
    location: boon.location || '',
    pay: boon.pay != null ? String(boon.pay) : '',
    date: boon.date || '',
    startTime: boon.startTime || '',
    endTime: boon.endTime || '',
    description: boon.description || '',
    feedback: boon.adminFeedback || ''
  };
}

export default function BoonApprovals({ reviewerName = 'Frenvi Admin' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm());

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchPendingBoons();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load pending boons');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  const editingBoon = useMemo(
    () => items.find((b) => String(b.id || b._id) === String(editingId)) || null,
    [items, editingId]
  );

  const openEditor = (boon) => {
    const id = boon.id || boon._id;
    setEditingId(id);
    setForm(blankForm(boon));
    setNotice('');
    setError('');
  };

  const closeEditor = () => {
    setEditingId(null);
    setForm(blankForm());
  };

  const onField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const payloadFromForm = () => ({
    reviewedBy: reviewerName,
    brand: form.brand.trim(),
    role: form.role.trim(),
    location: form.location.trim(),
    pay: Number(form.pay),
    date: form.date.trim(),
    startTime: form.startTime.trim(),
    endTime: form.endTime.trim(),
    description: form.description.trim()
  });

  const onSaveEdits = async () => {
    if (!editingId) return;
    if (!form.brand.trim() || !form.role.trim() || !form.location.trim()) {
      setError('Brand, role and location are required');
      return;
    }
    if (!Number.isFinite(Number(form.pay)) || Number(form.pay) < 50) {
      setError('Pay must be at least ₹50');
      return;
    }
    setBusyId(editingId);
    setError('');
    try {
      const updated = await updateBoon(editingId, payloadFromForm());
      setItems((prev) =>
        prev.map((b) => (String(b.id || b._id) === String(editingId) ? { ...b, ...updated } : b))
      );
      setNotice('Boon details saved');
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setBusyId(null);
    }
  };

  const onSendFeedback = async () => {
    if (!editingId) return;
    const feedback = form.feedback.trim();
    if (feedback.length < 4) {
      setError('Write clear feedback so the poster knows what to fix');
      return;
    }
    setBusyId(editingId);
    setError('');
    try {
      await sendBoonFeedback(editingId, {
        ...payloadFromForm(),
        feedback,
        reviewedBy: reviewerName
      });
      setItems((prev) => prev.filter((b) => String(b.id || b._id) !== String(editingId)));
      closeEditor();
      setNotice('Feedback sent — poster can edit and resubmit');
    } catch (err) {
      setError(err.message || 'Could not send feedback');
    } finally {
      setBusyId(null);
    }
  };

  const onApprove = async (boon) => {
    const id = boon.id || boon._id;
    if (!id) return;
    setBusyId(id);
    setError('');
    try {
      if (String(editingId) === String(id)) {
        await updateBoon(id, payloadFromForm());
      }
      await approveBoon(id, reviewerName);
      setItems((prev) => prev.filter((b) => String(b.id || b._id) !== String(id)));
      if (String(editingId) === String(id)) closeEditor();
      setNotice('Boon approved and now live');
    } catch (err) {
      setError(err.message || 'Approve failed');
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (boon) => {
    const id = boon.id || boon._id;
    if (!id) return;
    const reason =
      (String(editingId) === String(id) && form.feedback.trim()) ||
      'Does not meet Frenvi guidelines';
    setBusyId(id);
    setError('');
    try {
      await rejectBoon(id, reviewerName, reason);
      setItems((prev) => prev.filter((b) => String(b.id || b._id) !== String(id)));
      if (String(editingId) === String(id)) closeEditor();
      setNotice('Boon rejected');
    } catch (err) {
      setError(err.message || 'Reject failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="tab-panel active">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Boon approvals</h2>
          <p className="panel-subtitle">
            Edit details, send feedback to posters, or approve to make a boon live.
          </p>
        </div>
        <button className="btn btn-outline" onClick={load} type="button">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error ? <div className="admin-inline-error">{error}</div> : null}
      {notice ? <div className="admin-inline-ok">{notice}</div> : null}

      <div className="boon-review-layout">
        <div className="queue-grid">
          {loading ? (
            <div className="empty-state">
              <h3>Loading pending boons…</h3>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>No boons waiting for review</h3>
              <p>When a poster submits or resubmits a boon, it appears here.</p>
            </div>
          ) : (
            items.map((boon) => {
              const id = boon.id || boon._id;
              const busy = String(busyId) === String(id);
              const selected = String(editingId) === String(id);
              return (
                <div key={id} className={`queue-card ${selected ? 'is-selected' : ''}`}>
                  <div className="card-top">
                    <div className="candidate-meta">
                      <div className="meta-avatar">🏪</div>
                      <div>
                        <div className="meta-name">{boon.brand || 'Outlet'}</div>
                        <div className="meta-phone">
                          {boon.posterName || 'Poster'} · +91 {boon.posterPhone || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="wait-timer">
                      <span>Under review</span>
                    </div>
                  </div>

                  <div className="designation-badge">{boon.role || 'Open boon'}</div>

                  <div className="card-chips">
                    <span className="chip">{boon.location || 'Location pending'}</span>
                    <span className="chip">
                      {boon.date || 'Today'} · {boon.startTime || '—'}–{boon.endTime || '—'}
                    </span>
                    <span className="chip">{formatPay(boon.pay)}</span>
                  </div>

                  {boon.description ? (
                    <p className="boon-desc">{boon.description}</p>
                  ) : null}

                  <div className="boon-card-actions">
                    <button
                      className="btn btn-outline"
                      type="button"
                      disabled={busy}
                      onClick={() => openEditor(boon)}
                    >
                      <Pencil size={16} />
                      Edit / Feedback
                    </button>
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={busy}
                      onClick={() => onApprove(boon)}
                    >
                      <Check size={16} />
                      <span>{busy && !selected ? 'Saving…' : 'Approve'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <aside className={`boon-editor ${editingBoon ? 'is-open' : ''}`}>
          {editingBoon ? (
            <>
              <div className="boon-editor-head">
                <div>
                  <h3>Review &amp; edit</h3>
                  <p>Changes save to the boon. Feedback is shown to the poster in the app.</p>
                </div>
                <button className="btn btn-outline" type="button" onClick={closeEditor}>
                  Close
                </button>
              </div>

              <div className="boon-editor-grid">
                <label>
                  <span>Brand / outlet</span>
                  <input value={form.brand} onChange={(e) => onField('brand', e.target.value)} />
                </label>
                <label>
                  <span>Role</span>
                  <input value={form.role} onChange={(e) => onField('role', e.target.value)} />
                </label>
                <label className="span-2">
                  <span>Location</span>
                  <input value={form.location} onChange={(e) => onField('location', e.target.value)} />
                </label>
                <label>
                  <span>Pay (₹)</span>
                  <input
                    type="number"
                    min="50"
                    value={form.pay}
                    onChange={(e) => onField('pay', e.target.value)}
                  />
                </label>
                <label>
                  <span>Date label</span>
                  <input value={form.date} onChange={(e) => onField('date', e.target.value)} />
                </label>
                <label>
                  <span>Start</span>
                  <input value={form.startTime} onChange={(e) => onField('startTime', e.target.value)} />
                </label>
                <label>
                  <span>End</span>
                  <input value={form.endTime} onChange={(e) => onField('endTime', e.target.value)} />
                </label>
                <label className="span-2">
                  <span>Description</span>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => onField('description', e.target.value)}
                  />
                </label>
                <label className="span-2">
                  <span>Feedback to poster</span>
                  <textarea
                    rows={4}
                    placeholder="Example: Please raise pay to at least ₹400 and clarify outlet entrance photo."
                    value={form.feedback}
                    onChange={(e) => onField('feedback', e.target.value)}
                  />
                </label>
              </div>

              <div className="boon-editor-actions">
                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={String(busyId) === String(editingId)}
                  onClick={onSaveEdits}
                >
                  <Save size={16} />
                  Save edits
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={String(busyId) === String(editingId)}
                  onClick={onSendFeedback}
                >
                  <MessageSquareText size={16} />
                  Send feedback
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={String(busyId) === String(editingId)}
                  onClick={() => onApprove(editingBoon)}
                >
                  <Check size={16} />
                  Approve &amp; live
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={String(busyId) === String(editingId)}
                  onClick={() => onReject(editingBoon)}
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            </>
          ) : (
            <div className="boon-editor-empty">
              <Pencil size={22} />
              <h3>Select a boon</h3>
              <p>Open Edit / Feedback to correct details or message the poster.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
