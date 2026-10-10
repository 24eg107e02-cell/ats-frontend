import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, Application, errMsg, fmtDateTime, label, StageHistory } from '../api';
import { useAuth } from '../auth';
import { Alert, Spinner, StageBadge, StageRail, StatusBadge } from '../components/ui';

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [history, setHistory] = useState<StageHistory[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, h] = await Promise.all([api.getApplication(id!), api.history(id!)]);
      setApp(a); setHistory(h);
    } catch (e) { setError(errMsg(e)); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true); setError('');
    try { await fn(); await load(); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  if (!app) return error ? <Alert>{error}</Alert> : <Spinner />;

  const isStaff = user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  return (
    <>
      <p>{isStaff
        ? <Link to={`/recruiter/jobs/${app.jobId}/pipeline`}>Back to pipeline</Link>
        : <Link to="/my-applications">Back to my applications</Link>}</p>
      <Alert>{error}</Alert>
      <div className="layout-2">
        <div className="card">
          <div className="actions" style={{ marginBottom: 8 }}><StageBadge stage={app.currentStage} /><StatusBadge status={app.status} /></div>
          <h1>{app.jobTitle}</h1>
          <p className="muted">Candidate: <strong>{app.candidateName}</strong> · Applied {fmtDateTime(app.appliedAt)}</p>
          <StageRail stage={app.currentStage} status={app.status} />
          <p className="muted">
            {app.status === 'ACTIVE' ? `Currently at ${label(app.currentStage)}.` : `This application is ${label(app.status).toLowerCase()}.`}
          </p>

          {app.coverLetter && (<><h3>Cover letter</h3><p className="desc">{app.coverLetter}</p></>)}

          <div className="actions">
            {app.resumeId && (
              <button className="btn btn-ghost" onClick={() => act(() => api.downloadResume(app.resumeId!))}>Download resume</button>
            )}
            {user?.role === 'CANDIDATE' && app.status === 'ACTIVE' && (
              <button className="btn btn-danger" disabled={busy}
                onClick={() => act(() => api.withdraw(app.id), 'Withdraw this application? This cannot be undone.')}>Withdraw application</button>
            )}
            {user?.role === 'ADMIN' && (app.status === 'REJECTED' || app.status === 'WITHDRAWN') && (
              <button className="btn" disabled={busy} onClick={() => act(() => api.reopen(app.id))}>Reopen application</button>
            )}
          </div>
        </div>

        <aside className="card">
          <h2>History</h2>
          {history.length === 0 ? <p className="muted">No changes yet.</p> : (
            <ul className="timeline">
              {history.map((h) => (
                <li key={h.id}>
                  <strong>{h.fromStage ? `${label(h.fromStage)} → ${label(h.toStage)}` : `Applied (${label(h.toStage)})`}</strong>
                  <div className="when">{fmtDateTime(h.changedAt)} · {h.changedByName}</div>
                  {h.note && <div>{h.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}
