import { ReactNode, useEffect } from 'react';
import { AppStatus, Stage, STAGES, label } from '../api';

export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={`badge st-${stage}`}>{label(stage)}</span>;
}

export function StatusBadge({ status }: { status: AppStatus | string }) {
  return <span className={`badge ss-${status}`}>{label(status)}</span>;
}

/** The signature element: a five-segment rail showing how far an application has travelled. */
export function StageRail({ stage, status }: { stage: Stage; status: AppStatus }) {
  const idx = STAGES.indexOf(stage);
  return (
    <div className={`rail ${status === 'REJECTED' || status === 'WITHDRAWN' ? 'rail-dead' : ''}`} aria-label={`Stage ${label(stage)}`}>
      {STAGES.map((s, i) => (
        <span key={s} className={`rail-seg st-bg-${s} ${i <= idx ? 'on' : ''}`} title={label(s)} />
      ))}
    </div>
  );
}

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'ok'; children: ReactNode }) {
  if (!children) return null;
  return <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Loading" />;
}

export function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pager">
      <button className="btn btn-ghost" disabled={page === 0} onClick={() => onChange(page - 1)}>Previous</button>
      <span>Page {page + 1} of {totalPages}</span>
      <button className="btn btn-ghost" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
