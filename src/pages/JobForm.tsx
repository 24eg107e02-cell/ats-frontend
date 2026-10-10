import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, EmploymentType, errMsg, JobRequest, label } from '../api';
import { Alert, Spinner } from '../components/ui';

const blank = {
  title: '', description: '', department: '', location: '', employmentType: 'FULL_TIME' as EmploymentType,
  minExperience: '0', maxExperience: '', minSalary: '', maxSalary: '', skills: '', openings: '1', closingDate: '',
};

export default function JobForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState(blank);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (!id) return;
    api.getJob(id).then((j) => setF({
      title: j.title, description: j.description, department: j.department ?? '', location: j.location ?? '',
      employmentType: j.employmentType, minExperience: String(j.minExperience), maxExperience: j.maxExperience?.toString() ?? '',
      minSalary: j.minSalary?.toString() ?? '', maxSalary: j.maxSalary?.toString() ?? '', skills: j.skills ?? '',
      openings: String(j.openings), closingDate: j.closingDate ?? '',
    })).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, [id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const num = (v: string) => (v === '' ? null : Number(v));
    const body: JobRequest = {
      title: f.title.trim(), description: f.description.trim(), department: f.department || undefined,
      location: f.location || undefined, employmentType: f.employmentType,
      minExperience: Number(f.minExperience || 0), maxExperience: num(f.maxExperience),
      minSalary: num(f.minSalary), maxSalary: num(f.maxSalary), skills: f.skills || undefined,
      openings: Number(f.openings || 1), closingDate: f.closingDate || null,
    };
    if (body.maxExperience != null && body.maxExperience < body.minExperience) return setError('Maximum experience cannot be lower than minimum.');
    if (body.minSalary != null && body.maxSalary != null && body.maxSalary < body.minSalary) return setError('Maximum salary cannot be lower than minimum.');
    setBusy(true);
    try {
      if (id) await api.updateJob(Number(id), body); else await api.createJob(body);
      nav('/recruiter/jobs');
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <p><Link to="/recruiter/jobs">Back to jobs</Link></p>
      <div className="card" style={{ maxWidth: 760 }}>
        <h1>{id ? 'Edit job' : 'Post a job'}</h1>
        <Alert>{error}</Alert>
        <form onSubmit={submit}>
          <label><span>Job title</span><input value={f.title} onChange={set('title')} required /></label>
          <label><span>Description</span><textarea style={{ minHeight: 160 }} value={f.description} onChange={set('description')} required /></label>
          <div className="row">
            <label><span>Department</span><input value={f.department} onChange={set('department')} /></label>
            <label><span>Location</span><input value={f.location} onChange={set('location')} /></label>
            <label><span>Employment type</span>
              <select value={f.employmentType} onChange={set('employmentType')}>
                {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].map((t) => <option key={t} value={t}>{label(t)}</option>)}
              </select>
            </label>
          </div>
          <div className="row">
            <label><span>Min experience (yrs)</span><input type="number" min={0} value={f.minExperience} onChange={set('minExperience')} /></label>
            <label><span>Max experience (yrs)</span><input type="number" min={0} value={f.maxExperience} onChange={set('maxExperience')} /></label>
            <label><span>Openings</span><input type="number" min={1} value={f.openings} onChange={set('openings')} required /></label>
          </div>
          <div className="row">
            <label><span>Min salary (₹ / year)</span><input type="number" min={0} value={f.minSalary} onChange={set('minSalary')} /></label>
            <label><span>Max salary (₹ / year)</span><input type="number" min={0} value={f.maxSalary} onChange={set('maxSalary')} /></label>
            <label><span>Closing date</span><input type="date" value={f.closingDate} onChange={set('closingDate')} /></label>
          </div>
          <label><span>Skills</span><input value={f.skills} onChange={set('skills')} placeholder="Java, Spring Boot, MySQL" />
            <small className="hint">Separate skills with commas.</small></label>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Create job'}</button>
        </form>
      </div>
    </>
  );
}
