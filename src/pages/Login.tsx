import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { errMsg } from '../api';
import { Alert } from '../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'CANDIDATE' ? '/jobs' : '/recruiter/jobs'} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const u = await login(email.trim(), password);
      nav(u.role === 'CANDIDATE' ? '/jobs' : '/recruiter/jobs');
    } catch (err) {
      setError(errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="card auth-card">
      <h1>Sign in</h1>
      <Alert>{error}</Alert>
      <form onSubmit={submit}>
        <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
        <label><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}
