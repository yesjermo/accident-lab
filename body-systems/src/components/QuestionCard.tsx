import { useEffect, useRef, useState } from 'react';
import type { Question } from '../domain/types';
import { nowIso, useStudy } from '../data/study';
import type { QuestionContext } from '../study/model';
import { ProvenanceNote } from './Provenance';

/**
 * One multiple-choice question. Records an attempt on submit, then explains
 * the chosen answer and the correct one. Uses a radio group, so it works
 * with the keyboard (arrow keys to choose, Enter or the button to check).
 */
export function QuestionCard({
  question,
  context,
  onAnswered,
  heading,
}: {
  question: Question;
  context: QuestionContext;
  onAnswered?: (correct: boolean) => void;
  heading?: string;
}) {
  const { dispatch } = useStudy();
  const [choice, setChoice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  /** After the answer has been revealed, retries are practice only and are not recorded as evidence. */
  const [revealed, setRevealed] = useState(false);
  const [counted, setCounted] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const [focusTarget, setFocusTarget] = useState<'feedback' | 'choices' | null>(null);
  useEffect(() => {
    if (focusTarget === 'feedback') feedbackRef.current?.focus();
    if (focusTarget === 'choices') fieldsetRef.current?.querySelector('input')?.focus();
    setFocusTarget(null);
  }, [focusTarget]);
  const correct = choice === question.correctChoiceId;
  const name = `q-${question.id}-${context}`;

  const submit = () => {
    if (!choice || submitted) return;
    setSubmitted(true);
    setFocusTarget('feedback');
    setCounted(!revealed);
    if (revealed) return;
    setRevealed(true);
    dispatch({ type: 'recordAttempt', attempt: { questionId: question.id, choiceId: choice, correct, at: nowIso(), context } });
    onAnswered?.(correct);
  };

  return (
    <form
      className="question"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <fieldset disabled={submitted} ref={fieldsetRef}>
        <legend>
          {heading && <span className="eyebrow">{heading}</span>}
          <span className="question-stem">{question.stem}</span>
        </legend>
        <div className="choices">
          {question.choices.map((c) => {
            const state = !submitted ? '' : c.id === question.correctChoiceId ? 'is-correct' : c.id === choice ? 'is-wrong' : '';
            return (
              <label key={c.id} className={`choice ${state}${choice === c.id ? ' is-chosen' : ''}`}>
                <input type="radio" name={name} value={c.id} checked={choice === c.id} onChange={() => setChoice(c.id)} />
                <span className="choice-text">{c.text}</span>
                {submitted && c.id === question.correctChoiceId && <span className="choice-mark">✓ Correct answer</span>}
                {submitted && c.id === choice && c.id !== question.correctChoiceId && <span className="choice-mark">✗ Your answer</span>}
              </label>
            );
          })}
        </div>
      </fieldset>
      {!submitted ? (
        <button type="submit" className="btn btn-primary" disabled={!choice}>
          Check answer
        </button>
      ) : (
        <div ref={feedbackRef} tabIndex={-1} className={`feedback ${correct ? 'is-correct' : 'is-wrong'}`} role="status" aria-live="polite">
          <p className="feedback-head">{correct ? '✓ Correct.' : '✗ Not quite.'}</p>
          {!correct && choice && (
            <p>
              <strong>Your answer:</strong> {question.choices.find((c) => c.id === choice)?.explanation}
            </p>
          )}
          <p>
            <strong>{correct ? 'Why:' : 'Correct answer:'}</strong>{' '}
            {question.choices.find((c) => c.id === question.correctChoiceId)?.explanation.replace(/^Correct\.\s*/, '')}
          </p>
          {!correct && counted && <p className="muted">Added to your review queue.</p>}
          {!counted && <p className="muted small">Practice retry: answers given after seeing the solution don't count as evidence.</p>}
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              setChoice(null);
              setSubmitted(false);
              setFocusTarget('choices');
            }}
          >
            Try again
          </button>
        </div>
      )}
      <ProvenanceNote provenance={question.provenance} compact />
    </form>
  );
}

