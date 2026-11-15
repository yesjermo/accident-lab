import { useState } from 'react';

/** A flashcard that reveals its answer on demand. Plain button; no 3D flip (respects reduced motion). */
export function FlipCard({ front, back }: { front: string; back: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flipcard">
      <p className="flip-front">{front}</p>
      {open ? (
        <p className="flip-back" aria-live="polite">
          {back}
        </p>
      ) : null}
      <button type="button" className="btn btn-link" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide answer' : 'Show answer'}
      </button>
    </div>
  );
}
