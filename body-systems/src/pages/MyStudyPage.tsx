import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../data/content';
import { useStudy } from '../data/study';
import { EmptyState } from '../components/States';
import { QuickCardForm } from '../components/StudyTools';
import { lessonProgress, OBJECTIVE_STATUS_LABEL } from '../study/progress';
import { parseImport, serializeForExport, StudyDataError } from '../study/persistence';
import { toAnkiCsv } from '../study/anki';
import type { StudyTarget } from '../study/model';

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useTargetLink() {
  const { ix, bundle } = useContent();
  return (t: StudyTarget): { label: string; to: string } => {
    if (t.kind === 'structure') {
      const s = ix.structures.get(t.id);
      return { label: s?.name ?? t.id, to: s ? `/explore/${s.diagram}/${s.id}` : '/explore/body' };
    }
    if (t.kind === 'concept') return { label: ix.concepts.get(t.id)?.name ?? t.id, to: `/concept/${t.id}` };
    if (t.kind === 'lesson-step') {
      const st = bundle.lessons[0].steps.find((s) => s.id === t.id);
      return { label: st ? `Journey: ${st.title}` : t.id, to: `/journey/${t.id}` };
    }
    if (t.kind === 'simulation') return { label: 'Dissociation-curve experiment', to: '/experiment' };
    return { label: t.id, to: '/' };
  };
}

export function MyStudyPage() {
  const { bundle } = useContent();
  const { data, dispatch, resetAll } = useStudy();
  const link = useTargetLink();
  const lesson = bundle.lessons[0];
  const p = lessonProgress(lesson, data);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof parseImport> | null>(null);

  const onFile = async (f: File) => {
    try {
      const parsed = parseImport(await f.text());
      setPendingImport(parsed);
      setImportMsg(null);
    } catch (e) {
      setImportMsg({ ok: false, text: e instanceof StudyDataError ? e.message : 'Could not read that file.' });
    }
  };

  return (
    <article className="page">
      <p className="eyebrow">My study</p>
      <h1>Progress, notes and resources</h1>

      <section>
        <h2>Progress by learning objective</h2>
        <p className="muted">
          <strong>Lesson:</strong> {p.stepsCompleted}/{p.stepsTotal} steps completed
          {p.lessonCompleted ? ' (lesson completed)' : ''}. <strong>Understanding:</strong> {p.demonstrated}/{p.objectives.length}{' '}
          objectives demonstrated. Opening or completing a lesson never counts as demonstrated understanding.
        </p>
        <table className="progress-table">
          <thead>
            <tr>
              <th scope="col">Objective</th>
              <th scope="col">Status</th>
              <th scope="col">Evidence (latest answers)</th>
            </tr>
          </thead>
          <tbody>
            {p.objectives.map((o) => (
              <tr key={o.objective.id}>
                <td>{o.objective.text}</td>
                <td>
                  <span className={`tag tag-status-${o.status}`}>{OBJECTIVE_STATUS_LABEL[o.status]}</span>
                </td>
                <td>
                  {o.correct} correct of {o.attempted} tried · {o.total} questions
                  <div className="meter" aria-hidden="true">
                    <span style={{ width: `${(100 * o.correct) / o.total}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">
          Demonstrated = your latest answers to at least two of the objective's questions (or all, if it has fewer) are correct, and
          none of your latest answers is wrong. Labeling: {data.labeling.length} attempt{data.labeling.length === 1 ? '' : 's'}.
          Predictions in the experiment: {data.predictions.filter((x) => x.predicted === x.actual).length}/{data.predictions.length} correct.
        </p>
      </section>

      <div className="grid-2">
        <section>
          <h2>Bookmarks</h2>
          {data.bookmarks.length === 0 ? (
            <EmptyState title="No bookmarks yet.">
              <p>Use ☆ Bookmark on any structure, concept or journey step.</p>
            </EmptyState>
          ) : (
            <ul className="plain-list">
              {data.bookmarks.map((b) => (
                <li key={b.id}>
                  <Link to={link(b.target).to}>{b.label}</Link>{' '}
                  <button type="button" className="btn btn-link" onClick={() => dispatch({ type: 'toggleBookmark', target: b.target, label: b.label, now: '' })}>
                    Remove<span className="visually-hidden"> {b.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2>
            Notes <span className="tag tag-user">Your content</span>
          </h2>
          {data.notes.length === 0 ? (
            <EmptyState title="No notes yet.">
              <p>Every structure, concept and journey step has a note box.</p>
            </EmptyState>
          ) : (
            <ul className="plain-list notes">
              {data.notes.map((n) => (
                <li key={n.id}>
                  <Link to={link(n.target).to}>{link(n.target).label}</Link>
                  <p className="note-text">{n.text}</p>
                  <button type="button" className="btn btn-link" onClick={() => dispatch({ type: 'deleteNote', id: n.id })}>
                    Delete note
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2>
            Attached resources <span className="tag tag-user">Your content</span>
          </h2>
          {data.userResources.length === 0 ? (
            <EmptyState title="No links attached yet." />
          ) : (
            <ul className="plain-list">
              {data.userResources.map((r) => (
                <li key={r.id}>
                  <a href={r.url} target="_blank" rel="noreferrer noopener">
                    {r.title}
                  </a>{' '}
                  <span className="muted small">on {link(r.target).label}</span>
                  {r.note && <div className="muted small">{r.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>
            My flashcards <span className="tag tag-user">Your content</span>
          </h2>
          {data.userCards.length === 0 ? (
            <EmptyState title="You haven't made any cards yet." />
          ) : (
            <ul className="plain-list">
              {data.userCards.map((c) => (
                <li key={c.id}>
                  <strong>{c.front}</strong>
                  <div>{c.back}</div>
                  <button type="button" className="btn btn-link" onClick={() => dispatch({ type: 'deleteUserCard', id: c.id })}>
                    Delete card
                  </button>
                </li>
              ))}
            </ul>
          )}
          <QuickCardForm target={null} />
          <button
            type="button"
            className="btn"
            disabled={data.userCards.length === 0}
            onClick={() => download('body-systems-explorer-cards.csv', toAnkiCsv(data.userCards), 'text/csv;charset=utf-8')}
          >
            Export my cards for Anki (CSV)
          </button>
          <p className="muted small">
            Exports only cards you made. In Anki: File → Import, choose the file; the header lines map Front, Back and Tags
            (Anki 2.1.55+).
          </p>

          <h2 id="data">Your data</h2>
          <p className="muted small">
            Everything is saved in this browser only (no account, nothing sent anywhere). Export a copy to move it or back it up.
          </p>
          <div className="row wrap">
            <button type="button" className="btn" onClick={() => download(`body-systems-explorer-study-${new Date().toISOString().slice(0, 10)}.json`, serializeForExport(data), 'application/json')}>
              Export study data (JSON)
            </button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              Import study data…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              tabIndex={-1}
              aria-label="Choose a study-data file to import"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = '';
              }}
            />
          </div>
          {pendingImport && (
            <div className="confirm" role="alertdialog" aria-labelledby="imp-h">
              <p id="imp-h">
                <strong>Replace your current study data?</strong> The file has {pendingImport.notes.length} notes,{' '}
                {pendingImport.bookmarks.length} bookmarks, {pendingImport.userCards.length} cards and {pendingImport.attempts.length} answers.
                Your current data will be overwritten. Export first if you want to keep it.
              </p>
              <div className="row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    dispatch({ type: 'replaceAll', data: pendingImport });
                    setPendingImport(null);
                    setImportMsg({ ok: true, text: 'Imported.' });
                  }}
                >
                  Replace and import
                </button>
                <button type="button" className="btn" onClick={() => setPendingImport(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {importMsg && (
            <p role="status" className={importMsg.ok ? 'ok-text' : 'error-text'}>
              {importMsg.text}
            </p>
          )}
          <ResetButton onReset={resetAll} />
        </section>
      </div>
    </article>
  );
}

function ResetButton({ onReset }: { onReset: () => Promise<void> }) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm)
    return (
      <button type="button" className="btn btn-link danger" onClick={() => setConfirm(true)}>
        Delete all my study data…
      </button>
    );
  return (
    <div className="confirm" role="alertdialog" aria-labelledby="rst-h">
      <p id="rst-h">
        <strong>Delete all notes, cards, bookmarks and progress in this browser?</strong> This cannot be undone.
      </p>
      <div className="row">
        <button type="button" className="btn danger" onClick={() => onReset().then(() => setConfirm(false))}>
          Delete everything
        </button>
        <button type="button" className="btn" onClick={() => setConfirm(false)} autoFocus>
          Cancel
        </button>
      </div>
    </div>
  );
}
