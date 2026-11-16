import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, type Location } from 'react-router-dom';
import type { Concept, Equation, Level } from '../domain/types';
import { LeveledText, Tex } from './Rich';

export function EquationBlock({ eq }: { eq: Equation }) {
  return (
    <div className="equation">
      <p className="equation-name">{eq.name}</p>
      <Tex tex={eq.tex} display label={eq.name} />
      <table className="vars">
        <caption className="visually-hidden">Variables in {eq.name}</caption>
        <thead>
          <tr>
            <th scope="col">Symbol</th>
            <th scope="col">Meaning</th>
            <th scope="col">Unit</th>
            <th scope="col">Typical</th>
          </tr>
        </thead>
        <tbody>
          {eq.variables.map((v) => (
            <tr key={v.symbol}>
              <td>
                <Tex tex={v.symbol} />
              </td>
              <td>{v.meaning}</td>
              <td>{v.unit}</td>
              <td>{v.typical ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="limits">
        <strong>Limits of this model:</strong> {eq.limits}
      </p>
    </div>
  );
}

const DEPTH_LABEL = { intuition: 'Intuition', physiology: 'Physiology', cellular: 'Cellular', molecular: 'Molecular' } as const;

/** "Why does this happen?": reveal explanation layers one at a time. */
export function WhyExplainer({ concept, level }: { concept: Concept; level: Level }) {
  const [shown, setShown] = useState(1);
  const lastRef = useRef<HTMLElement>(null);
  useEffect(() => setShown(1), [concept.id]);
  useEffect(() => {
    if (shown > 1) lastRef.current?.focus();
  }, [shown]);
  const next = concept.why[shown];
  return (
    <section className="why" aria-label={`Why does this happen: ${concept.name}`}>
      <ol className="why-steps">
        {concept.why.slice(0, shown).map((layer, i) => (
          <li key={layer.title} className="why-layer">
            <article ref={i === shown - 1 ? lastRef : undefined} tabIndex={-1}>
              <p className="eyebrow">
                Layer {i + 1} of {concept.why.length} · {DEPTH_LABEL[layer.depth]}
              </p>
              <h3>{layer.title}</h3>
              <LeveledText text={layer.body} level={level} />
              {layer.equations?.map((eq) => <EquationBlock key={eq.id} eq={eq} />)}
            </article>
          </li>
        ))}
      </ol>
      {next ? (
        <button type="button" className="btn btn-primary" onClick={() => setShown((s) => s + 1)}>
          Why? Go deeper: {DEPTH_LABEL[next.depth].toLowerCase()} level <span aria-hidden="true">↓</span>
        </button>
      ) : (
        <div className="simplifications">
          <h4>What this explanation simplifies</h4>
          <ul>
            {concept.simplifications.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          {concept.why.length > 1 && (
            <button type="button" className="btn btn-quiet" onClick={() => setShown(1)}>
              Collapse to the overview
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export interface FromState {
  from?: { label: string; path: string };
}

/** Link that remembers where you came from so the destination can offer "Back to …". */
export function ContextLink({ to, fromLabel, children, className }: { to: string; fromLabel: string; children: React.ReactNode; className?: string }) {
  const loc = useLocation();
  return (
    <Link to={to} state={{ from: { label: fromLabel, path: loc.pathname + loc.search } } satisfies FromState} className={className}>
      {children}
    </Link>
  );
}

export function BackLink() {
  const loc = useLocation() as Location<FromState | null>;
  const from = loc.state?.from;
  if (!from) return null;
  return (
    <Link to={from.path} className="backlink">
      <span aria-hidden="true">←</span> Back to {from.label}
    </Link>
  );
}
