import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContent } from '../data/content';
import { nowIso, useStudy } from '../data/study';
import { Diagram } from '../components/Diagram';
import { ContextLink } from '../components/Explain';
import { LeveledText } from '../components/Rich';
import { QuestionCard } from '../components/QuestionCard';
import { ProvenanceNote } from '../components/Provenance';
import { BookmarkButton, NoteEditor } from '../components/StudyTools';
import { lessonProgress, OBJECTIVE_STATUS_LABEL } from '../study/progress';
import { EmptyState } from '../components/States';

export function JourneyPage() {
  const { stepId } = useParams();
  const { bundle } = useContent();
  const lesson = bundle.lessons[0];
  if (!stepId) return <JourneyOverview />;
  const index = lesson.steps.findIndex((s) => s.id === stepId);
  if (index < 0)
    return (
      <EmptyState title="That step doesn't exist.">
        <Link to="/journey">Back to the journey overview</Link>
      </EmptyState>
    );
  return <JourneyStep index={index} />;
}

function JourneyOverview() {
  const { bundle, ix } = useContent();
  const { data } = useStudy();
  const lesson = bundle.lessons[0];
  const p = lessonProgress(lesson, data);
  const resume = data.lessons[lesson.id]?.lastStepId ?? lesson.steps[0].id;
  return (
    <article className="page narrow">
      <p className="eyebrow">Guided learning path · cardiovascular + respiratory</p>
      <h1>{lesson.title}</h1>
      <p className="lede">{lesson.summary}</p>
      <div className="row wrap">
        <Link className="btn btn-primary" to={`/journey/${resume}`}>
          {p.stepsCompleted === 0 ? 'Start the journey' : p.lessonCompleted ? 'Revisit the journey' : 'Continue where you left off'}
        </Link>
        <span className="muted">
          {p.stepsCompleted} of {p.stepsTotal} steps completed
          {p.lessonCompleted && ' · lesson completed'}
        </span>
      </div>

      <section>
        <h2>Learning objectives</h2>
        <p className="muted small">
          Completing the steps marks the lesson complete. An objective shows as <strong>Demonstrated</strong> only after you
          answer its questions correctly; a later wrong answer moves it back to <strong>Needs review</strong>.
        </p>
        <ul className="objectives">
          {p.objectives.map((o) => (
            <li key={o.objective.id} className={`objective status-${o.status}`}>
              <span className={`tag tag-status-${o.status}`}>{OBJECTIVE_STATUS_LABEL[o.status]}</span>
              <span>{o.objective.text}</span>
              <span className="muted small">
                {o.correct}/{o.total} questions correct on latest try
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Before you start</h2>
        <ul>
          {lesson.prerequisites.map((pr) => (
            <li key={pr.text}>
              {pr.text}
              {pr.conceptId && (
                <>
                  {' — '}
                  <ContextLink to={`/concept/${pr.conceptId}`} fromLabel="the journey overview">
                    refresh: {ix.concepts.get(pr.conceptId)?.name}
                  </ContextLink>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>The route</h2>
        <ol className="route">
          {lesson.steps.map((s, i) => (
            <li key={s.id}>
              <Link to={`/journey/${s.id}`}>
                {i + 1}. {s.title}
              </Link>{' '}
              {data.lessons[lesson.id]?.completedStepIds.includes(s.id) && <span className="tag tag-done">✓ done</span>}
              <div className="muted small">{s.whereNow}</div>
            </li>
          ))}
        </ol>
      </section>
      <ProvenanceNote provenance={lesson.provenance} />
    </article>
  );
}

function JourneyStep({ index }: { index: number }) {
  const { bundle, ix } = useContent();
  const { data, dispatch } = useStudy();
  const nav = useNavigate();
  const loc = useLocation();
  const lesson = bundle.lessons[0];
  const step = lesson.steps[index];
  const level = data.settings.level;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const done = data.lessons[lesson.id]?.completedStepIds ?? [];
  const isLast = index === lesson.steps.length - 1;
  const check = ix.questions.get(step.checkQuestionId)!;

  useEffect(() => {
    dispatch({ type: 'visitStep', lessonId: lesson.id, stepId: step.id });
    headingRef.current?.focus();
  }, [step.id, lesson.id, dispatch]);

  const complete = () => {
    dispatch({ type: 'completeStep', lessonId: lesson.id, stepId: step.id, allStepIds: lesson.steps.map((s) => s.id), now: nowIso() });
    nav(isLast ? '/journey/complete' : `/journey/${lesson.steps[index + 1].id}`);
  };

  const openStructure = (sid: string) => {
    const s = ix.structures.get(sid);
    if (!s) return;
    nav(`/explore/${s.diagram}/${sid}`, { state: { from: { label: `Step ${index + 1}: ${step.title}`, path: loc.pathname } } });
  };

  return (
    <div className="journey">
      <nav className="stepper" aria-label="Journey steps">
        <ol>
          {lesson.steps.map((s, i) => (
            <li key={s.id} className={i === index ? 'is-current' : ''}>
              <Link to={`/journey/${s.id}`} aria-current={i === index ? 'step' : undefined}>
                <span className="step-num">{done.includes(s.id) ? '✓' : i + 1}</span>
                <span className="step-title">{s.title}</span>
                {done.includes(s.id) && <span className="visually-hidden"> (completed)</span>}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className="workspace">
        <section className="stage" aria-label="Diagram for this step">
          <p className="where">
            <span className="eyebrow">Where is the molecule now?</span>
            <strong>{step.whereNow}</strong>
          </p>
          <Diagram diagram={step.view.diagram} highlight={step.view.highlight} onSelect={openStructure} caption={step.view.caption} />
          <p className="muted small">Select any structure to open its full explanation. You can come straight back to this step.</p>
        </section>

        <aside className="side" aria-labelledby="step-title">
          <p className="eyebrow">
            Step {index + 1} of {lesson.steps.length}
          </p>
          <h1 id="step-title" ref={headingRef} tabIndex={-1}>
            {step.title}
          </h1>
          <LeveledText text={step.body} level={level} />
          {level === 'foundation' && (step.body.medical?.length ?? 0) > 0 && (
            <p className="muted small">Switch to Medical student level in the header for mechanism and numbers.</p>
          )}

          {step.values && (
            <table className="values">
              <caption>Key values at this stage (typical, resting)</caption>
              <tbody>
                {step.values.map((v) => (
                  <tr key={v.label}>
                    <th scope="row">{v.label}</th>
                    <td>
                      {v.value}
                      {v.note && <div className="muted small">{v.note}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="go-deeper">
            <h2 className="eyebrow">Why does this happen?</h2>
            <ul>
              {step.conceptIds.map((cid) => (
                <li key={cid}>
                  <ContextLink to={`/concept/${cid}`} fromLabel={`Step ${index + 1}: ${step.title}`} className="concept-link">
                    {ix.concepts.get(cid)?.name} <span aria-hidden="true">→</span>
                  </ContextLink>
                </li>
              ))}
              {step.id === 's3-hemoglobin' || step.id === 's5-delivery' ? (
                <li>
                  <ContextLink to="/experiment" fromLabel={`Step ${index + 1}: ${step.title}`} className="concept-link">
                    Try it: the dissociation-curve experiment <span aria-hidden="true">→</span>
                  </ContextLink>
                </li>
              ) : null}
            </ul>
          </div>

          <details className="glossary-box">
            <summary>Glossary for this step ({step.glossaryIds.length})</summary>
            <dl>
              {step.glossaryIds.map((g) => {
                const t = ix.glossary.get(g)!;
                return (
                  <div key={g}>
                    <dt>{t.term}</dt>
                    <dd>{t.definition}</dd>
                  </div>
                );
              })}
            </dl>
          </details>

          <section className="check" aria-label="Knowledge check">
            <QuestionCard key={check.id} question={check} context="lesson" heading="Knowledge check" />
          </section>

          <details className="step-tools">
            <summary>Notes and bookmark for this step</summary>
            <BookmarkButton target={{ kind: 'lesson-step', id: step.id }} label={`Oxygen journey: ${step.title}`} />
            <NoteEditor target={{ kind: 'lesson-step', id: step.id }} label={step.title} />
          </details>

          <div className="row step-nav">
            {index > 0 && (
              <Link className="btn btn-quiet" to={`/journey/${lesson.steps[index - 1].id}`}>
                ← Previous
              </Link>
            )}
            <button type="button" className="btn btn-primary" onClick={complete}>
              {isLast ? 'Complete the journey' : 'Mark step done and continue →'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function JourneyComplete() {
  const { bundle } = useContent();
  const { data } = useStudy();
  const lesson = bundle.lessons[0];
  const p = lessonProgress(lesson, data);
  return (
    <article className="page narrow">
      <p className="eyebrow">{lesson.title}</p>
      <h1>{p.lessonCompleted ? 'Journey completed' : 'Almost there'}</h1>
      <p className="lede">
        {p.lessonCompleted
          ? 'You have followed the molecule from the air to the mitochondrion and back out as CO₂.'
          : `You have completed ${p.stepsCompleted} of ${p.stepsTotal} steps.`}
      </p>
      <p>
        Completing the lesson is not the same as demonstrating understanding. You have demonstrated{' '}
        <strong>
          {p.demonstrated} of {p.objectives.length}
        </strong>{' '}
        objectives so far.
      </p>
      <div className="row wrap">
        <Link className="btn btn-primary" to="/practice">
          Take the quiz
        </Link>
        <Link className="btn" to="/practice/label">
          Try a labeling exercise
        </Link>
        <Link className="btn btn-quiet" to="/journey">
          Lesson overview
        </Link>
      </div>
    </article>
  );
}
