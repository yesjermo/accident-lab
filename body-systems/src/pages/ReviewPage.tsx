import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../data/content';
import { nowIso, useStudy } from '../data/study';
import { QuestionCard } from '../components/QuestionCard';
import { EmptyState } from '../components/States';
import { dueCardIds, missedQuestionIds } from '../study/progress';
import { BOX_INTERVAL_DAYS, AGAIN_DELAY_MINUTES, describeDue, isNew, type Rating } from '../study/srs';

interface ReviewCard {
  id: string;
  front: string;
  back: string;
  origin: 'editorial' | 'user';
}

export function ReviewPage() {
  const { bundle, ix } = useContent();
  const { data } = useStudy();
  // Snapshot the queue when the page opens so cards don't vanish mid-answer.
  const [snapshot] = useState(() => new Date());
  const allCards: ReviewCard[] = useMemo(
    () => [
      ...bundle.flashcards.map((c) => ({ id: c.id, front: c.front, back: c.back, origin: 'editorial' as const })),
      ...data.userCards.map((c) => ({ id: c.id, front: c.front, back: c.back, origin: 'user' as const })),
    ],
    [bundle.flashcards, data.userCards],
  );
  const due = useMemo(() => dueCardIds(data, allCards.map((c) => c.id), snapshot), [allCards, snapshot]); // eslint-disable-line react-hooks/exhaustive-deps
  const missed = useMemo(() => missedQuestionIds(data), []); // eslint-disable-line react-hooks/exhaustive-deps
  const fresh = allCards.filter((c) => isNew(data.cardSchedules[c.id]));
  // The session's cards are fixed when it starts; rating a card must not reshuffle the list.
  const [session, setSession] = useState<ReviewCard[] | null>(null);

  return (
    <article className="page narrow">
      <p className="eyebrow">Review</p>
      <h1>Review queue</h1>
      <p className="lede">Built from questions you missed most recently and flashcards that are due.</p>

      <div className="queue-summary">
        <div>
          <p className="stat">{due.length}</p>
          <p>flashcards due</p>
        </div>
        <div>
          <p className="stat">{missed.length}</p>
          <p>missed questions</p>
        </div>
        <div>
          <p className="stat">{fresh.length}</p>
          <p>new cards not yet studied</p>
        </div>
      </div>

      {session === null && (
        <div className="row wrap">
          <button type="button" className="btn btn-primary" disabled={due.length === 0} onClick={() => setSession(allCards.filter((c) => due.includes(c.id)))}>
            Review due cards
          </button>
          <button type="button" className="btn" disabled={fresh.length === 0} onClick={() => setSession(fresh.slice(0, 10))}>
            Learn new cards ({Math.min(10, fresh.length)})
          </button>
        </div>
      )}

      {session && <CardSession cards={session} onDone={() => setSession(null)} />}

      <section>
        <h2>Missed questions</h2>
        {missed.length === 0 ? (
          <EmptyState title="Nothing missed right now.">
            <p>
              Questions you get wrong in lessons, quizzes or the experiment appear here until you answer them correctly.{' '}
              <Link to="/practice">Take the quiz</Link>.
            </p>
          </EmptyState>
        ) : (
          missed.map((qid) => {
            const q = ix.questions.get(qid);
            return q ? <QuestionCard key={qid} question={q} context="review" /> : null;
          })
        )}
      </section>

      <details className="schedule-doc">
        <summary>How the review schedule works</summary>
        <p>A simple five-box Leitner schedule, so you can predict it:</p>
        <ul>
          <li>
            <strong>Again</strong>: back to box 1, shown again in {AGAIN_DELAY_MINUTES} minutes.
          </li>
          <li>
            <strong>Good</strong>: up one box. <strong>Easy</strong>: up two boxes (max box 5).
          </li>
          <li>
            Box intervals:{' '}
            {Object.entries(BOX_INTERVAL_DAYS)
              .map(([b, d]) => `box ${b} → ${d} day${d === 1 ? '' : 's'}`)
              .join(', ')}
            .
          </li>
          <li>New cards are not "due"; start them from "Learn new cards".</li>
        </ul>
      </details>
    </article>
  );
}

function CardSession({ cards, onDone }: { cards: ReviewCard[]; onDone: () => void }) {
  const { data, dispatch } = useStudy();
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const card = cards[i];
  if (!card)
    return (
      <div className="session-done" role="status">
        <p>
          <strong>Session finished:</strong> {cards.length} card{cards.length === 1 ? '' : 's'} reviewed.
        </p>
        <button type="button" className="btn" onClick={onDone}>
          Back to the queue
        </button>
      </div>
    );
  const rate = (r: Rating) => {
    dispatch({ type: 'reviewCard', cardId: card.id, rating: r, now: nowIso() });
    setOpen(false);
    setI((x) => x + 1);
  };
  return (
    <section className="card-session" aria-label="Flashcard review">
      <p className="muted small">
        Card {i + 1} of {cards.length} · {card.origin === 'user' ? <span className="tag tag-user">Your card</span> : <span className="tag tag-editorial">Editorial</span>} ·{' '}
        {describeDue(data.cardSchedules[card.id], new Date())}
      </p>
      <div className="flash">
        <p className="flash-front">{card.front}</p>
        {open && (
          <p className="flash-back" aria-live="polite">
            {card.back}
          </p>
        )}
      </div>
      {!open ? (
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)} autoFocus>
          Show answer
        </button>
      ) : (
        <div className="row wrap" role="group" aria-label="How well did you recall it?">
          <button type="button" className="btn rate-again" onClick={() => rate('again')}>
            Again <span className="muted small">· {AGAIN_DELAY_MINUTES} min</span>
          </button>
          <button type="button" className="btn rate-good" onClick={() => rate('good')} autoFocus>
            Good
          </button>
          <button type="button" className="btn rate-easy" onClick={() => rate('easy')}>
            Easy
          </button>
        </div>
      )}
    </section>
  );
}
