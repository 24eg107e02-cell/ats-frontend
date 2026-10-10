import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg, fmtDate, Job, JobStatus, label } from '../api';
import { useAuth } from '../auth';
import { Alert, Empty, Pager, Spinner, StatusBadge } from '../components/ui';

const TABS: JobStatus[] = ['OPEN', 'DRAFT', 'CLOSED'];

export default function RecruiterJobs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<JobStatus>('OPEN');
  const [page, setPage] = useState(0);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setJobs(null);
    api.searchJobs({ status: tab, page, size: 20 })
      .then((r) => {
        // Recruiters manage only their own postings; admins see everything.
        setJobs(user?.role === 'ADMIN' ? r.content : r.content.filter((j) => j.postedByName === user?.fullName));
        setPages(r.totalPages);
      })
      .catch((e) => setError(errMsg(e)));
  }, [tab, page, user]);

  useEffect(() => { load(); }, [load]);

  const change = async (j: Job, status: JobStatus) => {
    setError('');
    try { await api.setJobStatus(j.id, status); load(); } catch (e) { setError(errMsg(e)); }
  };
  const remove = async (j: Job) => {
    if (!window.confirm(`Delete "${j.title}"? This cannot be undone.`)) return;
    setError('');
    try { await api.deleteJob(j.id); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Manage jobs</h1><p>Post roles and run each hiring pipeline.</p></div>
        <Link className="btn" to="/recruiter/jobs/new">Post a job</Link>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => { setTab(t); setPage(0); }}>{label(t)}</button>
        ))}
      </div>
      <Alert>{error}</Alert>
      {!jobs && !error && <Spinner />}
      {jobs && jobs.length === 0 && <Empty title={`No ${label(tab).toLowerCase()} jobs`}>{tab === 'OPEN' ? 'Post a job to start receiving applications.' : 'Nothing here yet.'}</Empty>}
      {jobs?.map((j) => (
        <div className="card" key={j.id}>
          <div className="job-top">
            <h3 style={{ margin: 0 }}>{j.title}</h3>
            <StatusBadge status={j.status} />
          </div>
          <div className="meta">
            {j.location && <span>{j.location}</span>}
            <span>{label(j.employmentType)}</span>
            <span>{j.openings} {j.openings === 1 ? 'opening' : 'openings'}</span>
            <span>Posted {fmtDate(j.createdAt)}</span>
            {user?.role === 'ADMIN' && j.postedByName && <span>by {j.postedByName}</span>}
          </div>
          <div className="actions" style={{ marginTop: 14 }}>
            <Link className="btn btn-sm" to={`/recruiter/jobs/${j.id}/pipeline`}>Open pipeline</Link>
            <Link className="btn btn-sm btn-ghost" to={`/recruiter/jobs/${j.id}/edit`}>Edit</Link>
            {j.status !== 'OPEN' && <button className="btn btn-sm btn-ghost" onClick={() => change(j, 'OPEN')}>{j.status === 'DRAFT' ? 'Publish' : 'Reopen'}</button>}
            {j.status === 'OPEN' && <button className="btn btn-sm btn-ghost" onClick={() => change(j, 'CLOSED')}>Close job</button>}
            {user?.role === 'ADMIN' && <button className="btn btn-sm btn-danger" onClick={() => remove(j)}>Delete</button>}
          </div>
        </div>
      ))}
      <Pager page={page} totalPages={pages} onChange={setPage} />
    </>
  );
}
