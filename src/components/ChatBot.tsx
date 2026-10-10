import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ChatJobCard, errMsg, JobMatch, label } from '../api';

type Msg =
  | { from: 'bot' | 'me'; text: string }
  | { from: 'bot'; text: string; jobs: ChatJobCard[] }
  | { from: 'bot'; text: string; matches: JobMatch[]; skills: string[] };

const START: Msg = {
  from: 'bot',
  text: 'Hi! Ask me about open jobs, or upload your resume with the paperclip and I will find jobs that fit you.',
};
const QUICK = ['Show open jobs', 'How do I apply?', 'Jobs for freshers', 'What are the hiring stages?'];

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([START]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy, open]);

  const push = (m: Msg) => setMsgs((prev) => [...prev, m]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    push({ from: 'me', text: t });
    setInput('');
    setBusy(true);
    try {
      const r = await api.chatMessage(t);
      push(r.jobs.length ? { from: 'bot', text: r.reply, jobs: r.jobs } : { from: 'bot', text: r.reply });
    } catch (e) {
      push({ from: 'bot', text: errMsg(e) });
    } finally { setBusy(false); }
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(input); };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || busy) return;
    push({ from: 'me', text: `Uploaded resume: ${file.name}` });
    setBusy(true);
    try {
      const r = await api.chatResumeMatch(file);
      push({ from: 'bot', text: r.message, matches: r.matches, skills: r.detectedSkills });
    } catch (err) {
      push({ from: 'bot', text: errMsg(err) });
    } finally { setBusy(false); }
  };

  if (!open) {
    return <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Open job assistant">Ask Shortlist</button>;
  }

  return (
    <section className="chat" aria-label="Job assistant">
      <header className="chat-head">
        <strong>Job assistant</strong>
        <button className="chat-x" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
      </header>

      <div className="chat-body">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.from}`}>
            <p>{m.text}</p>

            {'skills' in m && m.skills.length > 0 && (
              <div className="chips">{m.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
            )}

            {'jobs' in m && m.jobs.map((j) => (
              <Link key={j.id} to={`/jobs/${j.id}`} className="mini-job" onClick={() => setOpen(false)}>
                <b>{j.title}</b>
                <small>{[j.location, j.employmentType && label(j.employmentType), `${j.minExperience}+ yrs`].filter(Boolean).join(' · ')}</small>
              </Link>
            ))}

            {'matches' in m && m.matches.map((j) => (
              <Link key={j.jobId} to={`/jobs/${j.jobId}`} className="mini-job" onClick={() => setOpen(false)}>
                <span className="match-pct">{j.matchPercent}% match</span>
                <b>{j.title}</b>
                <small>{[j.location, j.employmentType && label(j.employmentType)].filter(Boolean).join(' · ')}</small>
                {j.matchedSkills.length > 0 && <small>You have: {j.matchedSkills.join(', ')}</small>}
                {j.missingSkills.length > 0 && <small>To learn: {j.missingSkills.join(', ')}</small>}
                {j.note && <small className="note">{j.note}</small>}
              </Link>
            ))}
          </div>
        ))}
        {busy && <div className="bubble bot"><p>Thinking…</p></div>}
        <div ref={endRef} />
      </div>

      <div className="chat-quick">
        {QUICK.map((q) => <button key={q} type="button" className="chip chip-btn" onClick={() => send(q)} disabled={busy}>{q}</button>)}
      </div>

      <form className="chat-input" onSubmit={onSubmit}>
        <input ref={fileRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={onFile} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={busy} title="Upload resume (PDF or DOCX)" aria-label="Upload resume">📎</button>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about jobs…" maxLength={500} aria-label="Message" />
        <button className="btn btn-sm" disabled={busy || !input.trim()}>Send</button>
      </form>
    </section>
  );
}
