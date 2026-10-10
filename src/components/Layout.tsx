import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { Role } from '../api';
import { Spinner } from './ui';
import { ChatBot } from './ChatBot';

export function Layout() {
  const { user, logout } = useAuth();
  const isStaff = user?.role === 'RECRUITER' || user?.role === 'ADMIN';
  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-in">
          <Link to="/" className="brand">Shortlist</Link>
          <nav className="nav">
            <NavLink to="/jobs">Jobs</NavLink>
            {user?.role === 'CANDIDATE' && <NavLink to="/my-applications">My applications</NavLink>}
            {isStaff && <NavLink to="/recruiter/jobs">Manage jobs</NavLink>}
          </nav>
          <div className="who">
            {user ? (
              <>
                <span className="who-name">{user.fullName}<small>{user.role.toLowerCase()}</small></span>
                <button className="btn btn-ghost" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <Link className="btn btn-ghost" to="/login">Sign in</Link>
                <Link className="btn" to="/register">Create account</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="wrap main">
        <Outlet />
      </main>
      <ChatBot />
    </>
  );
}

export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/jobs" replace />;
  return <Outlet />;
}
