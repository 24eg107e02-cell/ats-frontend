import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { errMsg, Role } from '../api';
import { Alert } from '../components/ui';

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ fullName: '', email: '', phone: '', password: '', role: 'CANDIDATE' as Role });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  if (user) return <Navigate to="/jobs" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (f.password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    try {
      const u = await register({ ...f, email: f.email.trim(), phone: f.phone || undefined });
      nav(u.role === 'CANDIDATE' ? '/jobs' : '/recruiter/jobs');
    } catch (err) {
      setError(errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="card auth-card">
      <h1>Create account</h1>
      <Alert>{error}</Alert>
      <form onSubmit={submit}>
        <label><span>I am a</span>
          <select value={f.role} onChange={set('role')}>
            <option value="CANDIDATE">Candidate looking for a job</option>
            <option value="RECRUITER">Recruiter hiring for a team</option>
          </select>
        </label>
        <label><span>Full name</span><input value={f.fullName} onChange={set('fullName')} required /></label>
        <label><span>Email</span><input type="email" value={f.email} onChange={set('email')} required /></label>
        <label><span>Phone (optional)</span><input value={f.phone} onChange={set('phone')} /></label>
        <label><span>Password</span><input type="password" value={f.password} onChange={set('password')} required minLength={8} />
          <small className="hint">At least 8 characters.</small></label>
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>Already registered? <Link to="/login">Sign in</Link></p>
    </div>
  );
}
