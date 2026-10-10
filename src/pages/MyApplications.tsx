import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Application, errMsg, fmtDate, PageResponse } from '../api';
import { Alert, Empty, Pager, Spinner, StageBadge, StageRail, StatusBadge } from '../components/ui';

export default function MyApplications() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<Application> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api.myApplications(page).then(setData).catch((e) => setError(errMsg(e)));
  }, [page]);

  return (
    <>
      <div className="page-head"><div><h1>My applications</h1><p>Follow each one from applied to hired.</p></div></div>
      <Alert>{error}</Alert>
      {!data && !error && <Spinner />}
      {data && data.content.length === 0 && (
        <Empty title="You haven't applied anywhere yet"><Link to="/jobs">Browse open jobs</Link> to get started.</Empty>
      )}
      {data?.content.map((a) => (
        <Link key={a.id} to={`/applications/${a.id}`} className="app-card">
          <div className="job-top"><h3 style={{ margin: 0 }}>{a.jobTitle}</h3>
            <span className="actions"><StageBadge stage={a.currentStage} /><StatusBadge status={a.status} /></span></div>
          <StageRail stage={a.currentStage} status={a.status} />
          <small>Applied {fmtDate(a.appliedAt)} · Last update {fmtDate(a.updatedAt)}</small>
        </Link>
      ))}
      {data && <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </>
  );
}
