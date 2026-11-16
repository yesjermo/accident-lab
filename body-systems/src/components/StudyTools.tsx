import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { nowIso, useStudy } from '../data/study';
import { useContent } from '../data/content';
import type { StudyTarget } from '../study/model';
import { isSafeUrl } from '../study/persistence';
import { sameTarget } from '../study/reducer';

export function BookmarkButton({ target, label }: { target: StudyTarget; label: string }) {
  const { data, dispatch } = useStudy();
  const on = data.bookmarks.some((b) => sameTarget(b.target, target));
  return (
    <button
      type="button"
      className={`btn btn-quiet bookmark${on ? ' is-on' : ''}`}
      aria-pressed={on}
      onClick={() => dispatch({ type: 'toggleBookmark', target, label, now: nowIso() })}
    >
      <span aria-hidden="true">{on ? '★' : '☆'}</span> {on ? 'Bookmarked' : 'Bookmark'}
    </button>
  );
}

/** One personal note per target. Saves on button press (explicit, predictable). */
export function NoteEditor({ target, label }: { target: StudyTarget; label: string }) {
  const { data, dispatch } = useStudy();
  const existing = data.notes.find((n) => sameTarget(n.target, target));
  const stored = existing?.text ?? '';
  const [text, setText] = useState(stored);
  const [saved, setSaved] = useState(false);
  const editing = useRef(false);
  // Follow the stored note when the target changes, or when it changes elsewhere
  // (import, deletion, another tab) and the student has no unsaved edits.
  useEffect(() => {
    editing.current = false;
    setText(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.kind, target.id]);
  useEffect(() => {
    if (!editing.current) setText(stored);
  }, [stored]);
  const dirty = text.trim() !== stored;
  const id = `note-${target.kind}-${target.id}`;
  return (
    <div className="note-editor user-content">
      <label htmlFor={id} className="field-label">
        My note on {label} <span className="tag tag-user">Your content</span>
      </label>
      <textarea
        id={id}
        rows={4}
        value={text}
        onChange={(e) => {
          editing.current = true;
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="Write it in your own words…"
      />
      <div className="row">
        <button
          type="button"
          className="btn"
          disabled={!dirty}
          onClick={() => {
            dispatch({ type: 'saveNote', target, text, now: nowIso() });
            editing.current = false;
            setSaved(true);
          }}
        >
          Save note
        </button>
        {saved && !dirty && (
          <span role="status" className="muted">
            Saved.
          </span>
        )}
        {existing && <span className="muted">Last edited {new Date(existing.updatedAt).toLocaleString()}</span>}
      </div>
    </div>
  );
}

export function AttachResource({ target }: { target: StudyTarget }) {
  const { data, dispatch } = useStudy();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mine = data.userResources.filter((r) => sameTarget(r.target, target));
  const base = `res-${target.kind}-${target.id}`;

  return (
    <div className="attach user-content">
      <h4>
        My resources <span className="tag tag-user">Your content</span>
      </h4>
      {mine.length === 0 ? (
        <p className="muted">No links attached yet. Add your lecture slides, a textbook page or a video you found useful.</p>
      ) : (
        <ul className="resource-list">
          {mine.map((r) => (
            <li key={r.id}>
              <a href={r.url} target="_blank" rel="noreferrer noopener">
                {r.title}
              </a>
              {r.note && <span className="muted"> — {r.note}</span>}{' '}
              <button type="button" className="btn btn-link" onClick={() => dispatch({ type: 'deleteUserResource', id: r.id })}>
                Remove<span className="visually-hidden"> {r.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="attach-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isSafeUrl(url.trim())) {
            setError('Enter a full web address starting with https:// or http://');
            return;
          }
          dispatch({ type: 'addUserResource', target, url: url.trim(), title, note, now: nowIso() });
          setUrl('');
          setTitle('');
          setNote('');
          setError(null);
        }}
      >
        <label htmlFor={`${base}-url`}>Link (URL)</label>
        <input id={`${base}-url`} type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" required aria-invalid={!!error} aria-describedby={error ? `${base}-err` : undefined} />
        <label htmlFor={`${base}-title`}>Title (optional)</label>
        <input id={`${base}-title`} value={title} onChange={(e) => setTitle(e.target.value)} />
        <label htmlFor={`${base}-note`}>Why it helps (optional)</label>
        <input id={`${base}-note`} value={note} onChange={(e) => setNote(e.target.value)} />
        {error && (
          <p id={`${base}-err`} className="error-text" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn">
          Attach link
        </button>
      </form>
    </div>
  );
}

/** Curated, source-linked readings and videos for a concept or structure. */
export function CuratedResources({ conceptIds = [], structureIds = [] }: { conceptIds?: string[]; structureIds?: string[] }) {
  const { bundle } = useContent();
  const list = bundle.resources.filter(
    (r) => r.conceptIds.some((c) => conceptIds.includes(c)) || r.structureIds.some((s) => structureIds.includes(s)),
  );
  if (list.length === 0) return null;
  return (
    <div className="curated">
      <h4>
        Further reading and video <span className="tag tag-editorial">Curated</span>
      </h4>
      <ul className="resource-list">
        {list.map((r) => (
          <li key={r.id}>
            <span className="tag tag-kind">{r.kind === 'video' ? 'Video' : 'Reading'}</span>{' '}
            <a href={r.url} target="_blank" rel="noreferrer">
              {r.title}
            </a>
            <div className="muted small">
              {r.why} <em>{r.attribution}</em>
            </div>
          </li>
        ))}
      </ul>
      <p className="muted small">External links. No partnership with these providers is implied.</p>
    </div>
  );
}

export function QuickCardForm({ target, label }: { target: StudyTarget | null; label?: string }) {
  const { dispatch } = useStudy();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [done, setDone] = useState(false);
  const base = `card-${target?.kind ?? 'none'}-${target?.id ?? 'x'}`;
  return (
    <form
      className="card-form user-content"
      onSubmit={(e) => {
        e.preventDefault();
        if (!front.trim() || !back.trim()) return;
        dispatch({ type: 'addUserCard', front, back, target, tags: label ? [label] : [], now: nowIso() });
        setFront('');
        setBack('');
        setDone(true);
      }}
    >
      <h4>
        Make a flashcard <span className="tag tag-user">Your content</span>
      </h4>
      <label htmlFor={`${base}-f`}>Front (question)</label>
      <textarea id={`${base}-f`} rows={2} value={front} onChange={(e) => { setFront(e.target.value); setDone(false); }} required />
      <label htmlFor={`${base}-b`}>Back (answer)</label>
      <textarea id={`${base}-b`} rows={2} value={back} onChange={(e) => setBack(e.target.value)} required />
      <div className="row">
        <button type="submit" className="btn">Add card</button>
        {done && <span role="status" className="muted">Added. <Link to="/review">Review cards</Link></span>}
      </div>
    </form>
  );
}
