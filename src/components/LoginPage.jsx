import React, { useEffect, useState } from 'react';
import { fetchStaffDirectory, staffLogin } from '../services/api';

const FALLBACK_DEPARTMENTS = [
  {
    id: 'admin',
    title: 'Main Admin',
    subtitle: 'Monitor completed vs remaining assessments across the desk.',
    icon: '👔'
  },
  {
    id: 'marketing',
    title: 'Marketing',
    subtitle: 'Take worker video assessments from the live queue.',
    icon: '📣'
  },
  {
    id: 'boarding',
    title: 'Boarding Members',
    subtitle: 'Log in and run video assessments from the live worker queue.',
    icon: '👩‍💼'
  }
];

const FALLBACK_MEMBERS = {
  admin: [{ username: 'admin', name: 'Arjun Mehta', title: 'Main Admin', avatar: '👔' }],
  marketing: [
    { username: 'neha', name: 'Neha Kapoor', title: 'Marketing Lead', avatar: '📣' },
    { username: 'rohan', name: 'Rohan Iyer', title: 'Marketing Associate', avatar: '📊' }
  ],
  boarding: [
    { username: 'priya', name: 'Priya Sharma', title: 'Senior Evaluator', avatar: '👩‍💼' },
    { username: 'rajesh', name: 'Rajesh Verma', title: 'Logistics & QSR Lead', avatar: '👨‍💼' },
    { username: 'anita', name: 'Anita Reddy', title: 'Customer Experience Lead', avatar: '👩‍💻' }
  ]
};

const DEMO_PASSWORDS = {
  admin: 'admin123',
  neha: 'neha123',
  rohan: 'rohan123',
  priya: 'priya123',
  rajesh: 'rajesh123',
  anita: 'anita123'
};

export default function LoginPage({ onLoggedIn }) {
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [members, setMembers] = useState(FALLBACK_MEMBERS);
  const [selected, setSelected] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchStaffDirectory()
      .then((data) => {
        if (data?.departments?.length) setDepartments(data.departments);
        if (data?.data) setMembers({ ...FALLBACK_MEMBERS, ...data.data });
      })
      .catch(() => {});
  }, []);

  const pickDepartment = (id) => {
    setSelected(id);
    setError('');
    const first = (members[id] || [])[0];
    setUsername(first?.username || '');
    setPassword('');
  };

  const pickMember = (member) => {
    setUsername(member.username);
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) {
      setError('Choose Main Admin, Marketing or Boarding first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const session = await staffLogin(username.trim().toLowerCase(), password, selected);
      onLoggedIn(session);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const selectedDept = departments.find((d) => d.id === selected);
  const selectedMembers = selected ? (members[selected] || []) : [];

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-brand">
          <img src={`${import.meta.env.BASE_URL}frenvi_logo.png`} alt="FRENVI" className="login-logo" />
          <div>
            <div className="login-kicker">FRENVI TEAM DESK</div>
            <h1 className="login-title">Choose your workspace</h1>
            <p className="login-sub">White team cards for Main Admin, Marketing and Boarding members. Boarding logins like Priya run the assessment queue.</p>
          </div>
        </div>

        <div className="login-cards">
          {departments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              className={`login-role-card ${selected === dept.id ? 'selected' : ''}`}
              onClick={() => pickDepartment(dept.id)}
            >
              <div className="login-role-icon">{dept.icon}</div>
              <div className="login-role-title">{dept.title}</div>
              <p className="login-role-sub">{dept.subtitle}</p>
              <div className="login-member-chips">
                {(members[dept.id] || []).map((m) => (
                  <span key={m.username} className="login-chip">{m.avatar} {m.name.split(' ')[0]}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <form className="login-form-card" onSubmit={handleSubmit}>
            <div className="login-form-head">
              <div>
                <div className="login-kicker">{selectedDept?.title}</div>
                <h2>Sign in to continue</h2>
              </div>
            </div>

            <div className="login-people">
              {selectedMembers.map((member) => (
                <button
                  key={member.username}
                  type="button"
                  className={`login-person ${username === member.username ? 'selected' : ''}`}
                  onClick={() => pickMember(member)}
                >
                  <span className="login-person-avatar">{member.avatar}</span>
                  <span>
                    <strong>{member.name}</strong>
                    <small>{member.title} · {member.username} / {DEMO_PASSWORDS[member.username]}</small>
                  </span>
                </button>
              ))}
            </div>

            <label className="login-label">
              Username
              <input
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="priya"
              />
            </label>
            <label className="login-label">
              Password
              <input
                className="login-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>

            {error && <div className="login-error">{error}</div>}

            <button className="btn btn-primary btn-submit" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
