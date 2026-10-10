import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg, fmtDate, fmtSalary, Job, label, PageResponse } from '../api';
import { Alert, Empty, Pager, Spinner } from '../components/ui';

const EMPTY = { q: '', location: '', type: '', maxExperience: '' };

export default function Jobs() {
  const [draft, setDraft] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<Job> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null); setError('');
    api.searchJobs({
      q: applied.q, location: applied.location, type: applied.type,
      maxExperience: applied.maxExperience === '' ? '' : Number(applied.maxExperience),
      page, size: 10,
    }).then(setData).catch((e) => setError(errMsg(e)));
  }, [applied, page]);

  const search = (e: FormEvent) => { e.preventDefault(); setPage(0); setApplied(draft); };
  const clear = () => { setDraft(EMPTY); setApplied(EMPTY); setPage(0); };

  return (
    <>
      <div className="page-head">
        <div><h1>Open roles</h1><p>{data ? `${data.totalElements} matching jobs` : 'Searching…'}</p></div>
      </div>

      <form className="filters" onSubmit={search}>
        <label><span>Keyword</span><input placeholder="Title or skill" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} /></label>
        <label><span>Location</span><input placeholder="Any city" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} /></label>
        <label><span>Type</span>
          <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
            <option value="">Any</option>
            {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].map((t) => <option key={t} value={t}>{label(t)}</option>)}
          </select>
        </label>
        <label><span>My experience (yrs)</span><input type="number" min={0} value={draft.maxExperience} onChange={(e) => setDraft({ ...draft, maxExperience: e.target.value })} /></label>
        <div className="actions"><button className="btn">Search</button><button type="button" className="btn btn-ghost" onClick={clear}>Clear</button></div>
      </form>

      <Alert>{error}</Alert>
      {!data && !error && <Spinner />}
      {data && data.content.length === 0 && <Empty title="No jobs match those filters">Try a broader keyword or clear the filters.</Empty>}
      {data?.content.map((j) => (
        <Link key={j.id} to={`/jobs/${j.id}`} className="job">
          <div className="job-top"><h3>{j.title}</h3><small>Posted {fmtDate(j.createdAt)}</small></div>
          <div className="meta">
            {j.department && <span>{j.department}</span>}
            {j.location && <span>{j.location}</span>}
            <span>{label(j.employmentType)}</span>
            <span>{j.minExperience}{j.maxExperience != null ? `–${j.maxExperience}` : '+'} yrs</span>
            {fmtSalary(j.minSalary, j.maxSalary) && <span>{fmtSalary(j.minSalary, j.maxSalary)}</span>}
          </div>
          {j.skills && <div className="chips">{j.skills.split(',').map((s) => <span className="chip" key={s}>{s.trim()}</span>)}</div>}
        </Link>
      ))}
      {data && <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </>
  );
}
