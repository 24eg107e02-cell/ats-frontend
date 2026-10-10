import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { StageRail } from '../components/ui';

export default function Home() {
  const { user } = useAuth();
  const staff = user?.role === 'RECRUITER' || user?.role === 'ADMIN';
  return (
    <section className="hero">
      <h1>Every application, one clear path to an offer.</h1>
      <StageRail stage="HIRED" status="ACTIVE" />
      <p>
        Candidates apply once and watch their application move from applied to screening, interview, offer and hired.
        Recruiters run the whole pipeline from a single board, with every stage change on record.
      </p>
      <div className="actions">
        <Link className="btn" to="/jobs">Browse open jobs</Link>
        {!user && <Link className="btn btn-ghost" to="/register">Create an account</Link>}
        {user?.role === 'CANDIDATE' && <Link className="btn btn-ghost" to="/my-applications">My applications</Link>}
        {staff && <Link className="btn btn-ghost" to="/recruiter/jobs">Manage jobs</Link>}
      </div>
    </section>
  );
}
