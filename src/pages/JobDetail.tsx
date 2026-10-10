import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errMsg, fmtDate, fmtSalary, Job, label } from '../api';
import { useAuth } from '../auth';
import { Alert, Spinner, StatusBadge } from '../components/ui';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState('');
  const [busy, setBusy] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    api.getJob(id!).then(setJob).catch((e) => setError(errMsg(e)));
  }, [id]);

  const apply = async (e: FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setApplyError(''); setBusy(true);
    try {
      let resumeId: number | null = null;
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error('Resume must be 5 MB or smaller.');
        resumeId = (await api.uploadResume(file)).id;
      }
      const app = await api.apply(job.id, { resumeId, coverLetter: cover || undefined });
      nav(`/applications/${app.id}`);
    } catch (err) {
      setApplyError(errMsg(err));
    } finally { setBusy(false); }
  };

  if (error) return <Alert>{error}</Alert>;
  if (!job) return <Spinner />;

  const salary = fmtSalary(job.minSalary, job.maxSalary);
  const isStaff = user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  return (
    <>
      <p><Link to="/jobs">Back to jobs</Link></p>
      <div className="layout-2">
        <div className="card">
          <div className="actions" style={{ marginBottom: 8 }}><StatusBadge status={job.status} /></div>
          <h1>{job.title}</h1>
          <div className="meta" style={{ marginBottom: 20 }}>
            {job.department && <span>{job.department}</span>}
            {job.location && <span>{job.location}</span>}
            <span>{label(job.employmentType)}</span>
            <span>{job.minExperience}{job.maxExperience != null ? `–${job.maxExperience}` : '+'} years experience</span>
            {salary && <span>{salary}</span>}
            <span>{job.openings} {job.openings === 1 ? 'opening' : 'openings'}</span>
          </div>
          <h3>About the role</h3>
          <p className="desc">{job.description}</p>
          {job.skills && (<><h3>Skills</h3><div className="chips">{job.skills.split(',').map((s) => <span className="chip" key={s}>{s.trim()}</span>)}</div></>)}
          <p className="muted" style={{ marginTop: 20 }}>
            {job.postedByName && <>Posted by {job.postedByName} on </>}{fmtDate(job.createdAt)}
            {job.closingDate && <> · Applications close {fmtDate(job.closingDate)}</>}
          </p>
        </div>

        <aside className="card">
          {!user && (<><h2>Apply for this role</h2><p className="muted">Sign in as a candidate to apply.</p>
            <div className="actions"><Link className="btn" to="/login">Sign in</Link><Link className="btn btn-ghost" to="/register">Create account</Link></div></>)}

          {user?.role === 'CANDIDATE' && job.status === 'OPEN' && (
            <form onSubmit={apply}>
              <h2>Apply for this role</h2>
              <Alert>{applyError}</Alert>
              <label><span>Resume</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <small className="hint">PDF or Word, up to 5 MB.</small>
              </label>
              <label><span>Cover letter (optional)</span><textarea value={cover} onChange={(e) => setCover(e.target.value)} /></label>
              <button className="btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
            </form>
          )}
          {user?.role === 'CANDIDATE' && job.status !== 'OPEN' && <><h2>Applications closed</h2><p className="muted">This job is not accepting applications.</p></>}

          {isStaff && (<><h2>Recruiter tools</h2>
            <div className="actions"><Link className="btn" to={`/recruiter/jobs/${job.id}/pipeline`}>Open pipeline</Link>
              <Link className="btn btn-ghost" to={`/recruiter/jobs/${job.id}/edit`}>Edit job</Link></div></>)}
        </aside>
      </div>
    </>
  );
}
