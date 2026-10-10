import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout, RequireAuth } from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import MyApplications from './pages/MyApplications';
import ApplicationDetail from './pages/ApplicationDetail';
import RecruiterJobs from './pages/RecruiterJobs';
import JobForm from './pages/JobForm';
import Pipeline from './pages/Pipeline';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />

        <Route element={<RequireAuth roles={['CANDIDATE']} />}>
          <Route path="/my-applications" element={<MyApplications />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/applications/:id" element={<ApplicationDetail />} />
        </Route>

        <Route element={<RequireAuth roles={['RECRUITER', 'ADMIN']} />}>
          <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
          <Route path="/recruiter/jobs/new" element={<JobForm />} />
          <Route path="/recruiter/jobs/:id/edit" element={<JobForm />} />
          <Route path="/recruiter/jobs/:id/pipeline" element={<Pipeline />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
