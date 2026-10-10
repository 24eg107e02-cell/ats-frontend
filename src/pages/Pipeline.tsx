import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  api, Application, errMsg, fmtDate, fmtDateTime, InterviewMode, Job, label, NEXT_STAGES, Stage, STAGES,
} from '../api';
import { useAuth } from '../auth';
import { Alert, Modal, Spinner, StatusBadge } from '../components/ui';

export default function Pipeline() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<Application | null>(null);
  const [scheduling, setScheduling] = useState<Application | null>(null);

  const load = useCallback(async () => {
    try {
      const [j, a] = await Promise.all([api.getJob(id!), api.jobApplications(id!)]);
      setJob(j); setApps(a.content);
    } catch (e) { setError(errMsg(e)); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const move = async (a: Application, to: Stage) => {
    setBusyId(a.id); setError(''); setNotice('');
    try { await api.changeStage(a.id, to); await load(); } catch (e) { setError(errMsg(e)); } finally { setBusyId(null); }
  };
  const download = async (a: Application) => {
    try { await api.downloadResume(a.resumeId!); } catch (e) { setError(errMsg(e)); }
  };

  if (!job || !apps) return error ? <Alert>{error}</Alert> : <Spinner />;

  const active = apps.filter((a) => a.status === 'ACTIVE' || a.status === 'HIRED');
  const closed = apps.filter((a) => a.status === 'REJECTED' || a.status === 'WITHDRAWN');

  return (
    <>
      <p><Link to="/recruiter/jobs">Back to jobs</Link></p>
      <div className="page-head">
        <div><h1>{job.title}</h1><p>{apps.length} {apps.length === 1 ? 'application' : 'applications'} · <StatusBadge status={job.status} /></p></div>
        <Link className="btn btn-ghost" to={`/jobs/${job.id}`}>View public listing</Link>
      </div>
      <Alert>{error}</Alert>
      <Alert kind="ok">{notice}</Alert>

      {apps.length === 0 && <div className="empty"><h3>No applications yet</h3><p>Candidates who apply will appear in the Applied column.</p></div>}

      {apps.length > 0 && (
        <div className="board">
          {STAGES.map((stage) => {
            const col = active.filter((a) => a.currentStage === stage);
            return (
              <section key={stage} className={`col col-${stage}`} aria-label={label(stage)}>
                <div className="col-head">{label(stage)}<span>{col.length}</span></div>
                {col.map((a) => (
                  <article className="cand" key={a.id}>
                    <Link to={`/applications/${a.id}`}><strong>{a.candidateName}</strong></Link>
                    <small>Applied {fmtDate(a.appliedAt)}</small>
                    {a.status === 'HIRED' && <div style={{ marginTop: 6 }}><StatusBadge status="HIRED" /></div>}
                    {a.status === 'ACTIVE' && (
                      <div className="actions">
                        {NEXT_STAGES[a.currentStage].map((to) => {
                          const forward = STAGES.indexOf(to) > STAGES.indexOf(a.currentStage);
                          return (
                            <button key={to} className={`btn btn-sm ${forward ? '' : 'btn-ghost'}`} disabled={busyId === a.id} onClick={() => move(a, to)}>
                              {forward ? `Move to ${label(to).toLowerCase()}` : `Back to ${label(to).toLowerCase()}`}
                            </button>
                          );
                        })}
                        {a.currentStage === 'INTERVIEW' && <button className="btn btn-sm btn-ghost" onClick={() => setScheduling(a)}>Schedule interview</button>}
                        {a.resumeId && <button className="btn btn-sm btn-ghost" onClick={() => download(a)}>Resume</button>}
                        <button className="btn btn-sm btn-ghost" onClick={() => setRejecting(a)}>Reject</button>
                      </div>
                    )}
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      )}

      {closed.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2>Rejected and withdrawn</h2>
          <div className="stack">
            {closed.map((a) => (
              <div key={a.id} className="job-top">
                <Link to={`/applications/${a.id}`}>{a.candidateName}</Link>
                <span className="actions"><small>Stopped at {label(a.currentStage)}</small><StatusBadge status={a.status} /></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejecting && <RejectModal app={rejecting} onClose={() => setRejecting(null)} onDone={() => { setRejecting(null); load(); }} />}
      {scheduling && (
        <ScheduleModal app={scheduling} onClose={() => setScheduling(null)}
          onDone={(msg) => { setScheduling(null); setNotice(msg); }} />
      )}
    </>
  );
}

function RejectModal({ app, onClose, onDone }: { app: Application; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.reject(app.id, reason.trim()); onDone(); } catch (err) { setError(errMsg(err)); setBusy(false); }
  };
  return (
    <Modal title={`Reject ${app.candidateName}`} onClose={onClose}>
      <Alert>{error}</Alert>
      <form onSubmit={submit}>
        <label><span>Reason</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} required autoFocus />
          <small className="hint">Recorded in the application history.</small></label>
        <button className="btn btn-danger" disabled={busy || !reason.trim()}>{busy ? 'Rejecting…' : 'Reject application'}</button>
      </form>
    </Modal>
  );
}

function ScheduleModal({ app, onClose, onDone }: { app: Application; onClose: () => void; onDone: (msg: string) => void }) {
  const { user } = useAuth();
  const [f, setF] = useState({ interviewerId: String(user?.userId ?? ''), start: '', end: '', mode: 'VIDEO' as InterviewMode, where: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (new Date(f.end) <= new Date(f.start)) return setError('The end time must be after the start time.');
    setBusy(true);
    try {
      const i = await api.schedule(app.id, {
        interviewerId: Number(f.interviewerId), scheduledStart: `${f.start}:00`, scheduledEnd: `${f.end}:00`,
        mode: f.mode, locationOrLink: f.where || undefined,
      });
      onDone(`Interview booked with ${app.candidateName} for ${fmtDateTime(i.scheduledStart)}, interviewer ${i.interviewerName}.`);
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <Modal title={`Schedule interview — ${app.candidateName}`} onClose={onClose}>
      <Alert>{error}</Alert>
      <form onSubmit={submit}>
        <label><span>Interviewer user ID</span><input type="number" min={1} value={f.interviewerId} onChange={set('interviewerId')} required />
          <small className="hint">Defaults to you. Overlapping interviews for the same interviewer are rejected.</small></label>
        <div className="row">
          <label><span>Starts</span><input type="datetime-local" value={f.start} onChange={set('start')} required /></label>
          <label><span>Ends</span><input type="datetime-local" value={f.end} onChange={set('end')} required /></label>
        </div>
        <label><span>Mode</span>
          <select value={f.mode} onChange={set('mode')}>
            <option value="VIDEO">Video call</option><option value="PHONE">Phone</option><option value="ONSITE">On site</option>
          </select>
        </label>
        <label><span>Meeting link or location</span><input value={f.where} onChange={set('where')} /></label>
        <button className="btn" disabled={busy}>{busy ? 'Booking…' : 'Book interview'}</button>
      </form>
    </Modal>
  );
}
