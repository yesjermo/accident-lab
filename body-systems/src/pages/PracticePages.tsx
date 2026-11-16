import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContent } from '../data/content';
import { nowIso, useStudy } from '../data/study';
import { QuestionCard } from '../components/QuestionCard';
import { Diagram } from '../components/Diagram';
import { EmptyState } from '../components/States';
import { ProvenanceNote } from '../components/Provenance';
import { gradeLabeling, scoreQuiz, stableShuffle, type QuizAnswer } from '../study/grading';

export function QuizPage() {
  const { bundle } = useContent();
  const [objective, setObjective] = useState<string>('all');
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [session, setSession] = useState(0);
  const qs = useMemo(
    () => {
      if (objective === 'all') return bundle.questions;
      const lesson = bundle.lessons.find((l) => l.id === objective);
      const ids = lesson
        ? new Set(lesson.objectives.flatMap((o) => o.questionIds))
        : new Set(bundle.lessons.flatMap((l) => l.objectives).find((o) => o.id === objective)?.questionIds ?? []);
      return bundle.questions.filter((q) => ids.has(q.id));
    },
    [bundle.questions, bundle.lessons, objective],
  );
  const score = scoreQuiz(answers);

  return (
    <article className="page narrow">
      <p className="eyebrow">Practise</p>
      <h1>Quiz</h1>
      <p className="lede">Each answer is explained, right or wrong. Missed questions go to your review queue.</p>
      <div className="row wrap quiz-head">
        <label htmlFor="obj" className="field-label">
          Lesson or objective
        </label>
        <select
          id="obj"
          value={objective}
          onChange={(e) => {
            setObjective(e.target.value);
            setAnswers([]);
            setSession((s) => s + 1);
          }}
        >
          <option value="all">All objectives ({bundle.questions.length} questions)</option>
          {bundle.lessons.map((l) => (
            <optgroup key={l.id} label={l.title}>
              <option value={l.id}>All of {l.title}</option>
              {l.objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.text}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <p className="score" role="status" aria-live="polite">
        Score this session: <strong>{score.correct}</strong> of {score.answered} answered correctly on the first try
        {score.answered > 0 && ` (${score.percent}%)`} · {qs.length - score.answered} left
      </p>
      <ol className="quiz-list">
        {qs.map((q, i) => (
          <li key={`${session}-${q.id}`}>
            <QuestionCard
              question={q}
              context="quiz"
              heading={`Question ${i + 1} of ${qs.length}`}
              onAnswered={(correct) => setAnswers((a) => [...a, { questionId: q.id, correct }])}
            />
          </li>
        ))}
      </ol>
      {score.answered === qs.length && qs.length > 0 && (
        <div className="summary" role="status">
          <h2>
            Finished: {score.correct}/{qs.length}
          </h2>
          <p>
            <Link to="/study">See progress by objective</Link> · <Link to="/review">Review missed questions</Link>
          </p>
        </div>
      )}
    </article>
  );
}

export function LabelingIndex() {
  const { bundle } = useContent();
  const { data } = useStudy();
  return (
    <article className="page narrow">
      <p className="eyebrow">Practise</p>
      <h1>Labeling exercises</h1>
      <p className="lede">Place each label on its numbered marker. Works by tapping, or with the keyboard using the drop-down for each marker.</p>
      <ul className="exercise-list">
        {bundle.labeling.map((ex) => {
          const last = [...data.labeling].reverse().find((a) => a.exerciseId === ex.id);
          return (
            <li key={ex.id}>
              <Link to={`/practice/label/${ex.id}`}>{ex.title}</Link>
              <span className="muted small"> · {ex.targets.length} labels</span>
              {last && (
                <span className="muted small">
                  {' '}
                  · last score {last.correct}/{last.total}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export function LabelingExercisePage() {
  const { id = '' } = useParams();
  const { ix } = useContent();
  const { dispatch } = useStudy();
  const ex = ix.labeling.get(id);
  const [assign, setAssign] = useState<Record<string, string | undefined>>({});
  const [active, setActive] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const bank = useMemo(
    () => (ex ? stableShuffle([...ex.targets.map((t) => t.structureId), ...ex.distractorStructureIds], (x) => x) : []),
    [ex],
  );
  if (!ex) return <EmptyState title="Exercise not found"><Link to="/practice/label">All labeling exercises</Link></EmptyState>;

  const grade = gradeLabeling(ex.targets, assign);
  const used = new Set(Object.values(assign).filter(Boolean));
  const name = (sid: string) => ix.structures.get(sid)?.name ?? sid;

  const place = (markerStructureId: string, label: string | undefined) => {
    setAssign((a) => {
      const next = { ...a };
      // A label can sit on one marker only.
      for (const k of Object.keys(next)) if (label && next[k] === label) next[k] = undefined;
      next[markerStructureId] = label;
      return next;
    });
    setChecked(false);
  };

  const markers = ex.targets.map((t) => ({
    structureId: t.structureId,
    marker: t.marker,
    state: checked
      ? ((assign[t.structureId] === t.structureId ? 'correct' : 'incorrect') as 'correct' | 'incorrect')
      : assign[t.structureId]
        ? ('filled' as const)
        : undefined,
  }));

  const check = () => {
    setChecked(true);
    dispatch({
      type: 'recordLabeling',
      attempt: { exerciseId: ex.id, at: nowIso(), correct: grade.correct, total: grade.total, missedStructureIds: grade.missedStructureIds },
    });
  };

  return (
    <article className="page">
      <Link to="/practice/label" className="backlink">
        ← All labeling exercises
      </Link>
      <h1>{ex.title}</h1>
      <p className="lede">
        Tap a label, then tap its numbered marker. Or use the drop-down next to each marker number.
      </p>
      <div className="labeling">
        <div className="labeling-diagram">
          <Diagram
            diagram={ex.diagram}
            markers={markers}
            onMarker={(sid) => {
              if (active) {
                place(sid, active);
                setActive(null);
              }
            }}
          />
        </div>
        <div className="labeling-side">
          <h2 className="h3">Label bank</h2>
          <p className="muted small" id="bank-help">
            {active ? `Selected: ${name(active)}. Now choose a marker.` : 'Choose a label.'}
          </p>
          <ul className="chips" aria-describedby="bank-help">
            {bank.map((sid) => (
              <li key={sid}>
                <button
                  type="button"
                  className={`chip${active === sid ? ' is-selected' : ''}${used.has(sid) ? ' is-used' : ''}`}
                  aria-pressed={active === sid}
                  onClick={() => setActive(active === sid ? null : sid)}
                >
                  {name(sid)}
                  {used.has(sid) && <span className="visually-hidden"> (placed)</span>}
                </button>
              </li>
            ))}
          </ul>

          <h2 className="h3">Markers</h2>
          <ol className="marker-rows">
            {ex.targets
              .slice()
              .sort((a, b) => a.marker - b.marker)
              .map((t) => {
                const r = grade.results.find((x) => x.structureId === t.structureId)!;
                return (
                  <li key={t.structureId} className={checked ? (r.correct ? 'is-correct' : 'is-wrong') : ''}>
                    <label htmlFor={`m-${t.marker}`}>Marker {t.marker}</label>
                    <select
                      id={`m-${t.marker}`}
                      value={assign[t.structureId] ?? ''}
                      onChange={(e) => place(t.structureId, e.target.value || undefined)}
                    >
                      <option value="">— choose —</option>
                      {bank.map((sid) => (
                        <option key={sid} value={sid}>
                          {name(sid)}
                        </option>
                      ))}
                    </select>
                    {checked && (
                      <span className="mark">
                        {r.correct ? '✓ correct' : `✗ it is the ${name(t.structureId)}`}
                      </span>
                    )}
                  </li>
                );
              })}
          </ol>
          <div className="row wrap">
            <button type="button" className="btn btn-primary" onClick={check} disabled={used.size === 0}>
              Check labels
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAssign({});
                setChecked(false);
                setActive(null);
              }}
            >
              Clear
            </button>
          </div>
          {checked && (
            <p className="score" role="status">
              {grade.correct} of {grade.total} correct.
              {grade.correct < grade.total && ' Open the missed structures in Explore to see where they sit.'}
            </p>
          )}
          {checked && grade.missedStructureIds.length > 0 && (
            <ul>
              {grade.missedStructureIds.map((sid) => (
                <li key={sid}>
                  <Link to={`/explore/${ix.structures.get(sid)?.diagram}/${sid}`} state={{ from: { label: ex.title, path: `/practice/label/${ex.id}` } }}>
                    {name(sid)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ProvenanceNote provenance={ex.provenance} compact />
        </div>
      </div>
    </article>
  );
}
