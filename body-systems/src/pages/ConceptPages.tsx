import { useState, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContent } from '../data/content';
import { useStudy } from '../data/study';
import { BackLink, ContextLink, WhyExplainer } from '../components/Explain';
import { ProvenanceNote } from '../components/Provenance';
import { EmptyState, UnavailableState } from '../components/States';
import { AttachResource, BookmarkButton, CuratedResources, NoteEditor, QuickCardForm } from '../components/StudyTools';
import { QuestionCard } from '../components/QuestionCard';
import { FlipCard } from '../components/FlipCard';

export function ConceptPage() {
  const { id = '' } = useParams();
  const { ix, bundle } = useContent();
  const { data } = useStudy();
  const c = ix.concepts.get(id);
  if (!c)
    return (
      <EmptyState title="Concept not found">
        <Link to="/mechanisms">See all mechanisms</Link>
      </EmptyState>
    );
  const target = { kind: 'concept' as const, id: c.id };
  const rels = bundle.relationships.filter((r) => r.from === c.id || r.to === c.id);
  const questions = bundle.questions.filter((q) => q.conceptIds.includes(c.id)).slice(0, 2);
  const cards = bundle.flashcards.filter((f) => f.conceptIds.includes(c.id));
  return (
    <article className="page concept">
      <BackLink />
      <p className="eyebrow">Mechanism · {c.discipline}</p>
      <h1>{c.name}</h1>
      <p className="lede">{c.oneLine}</p>
      <div className="row wrap">
        <BookmarkButton target={target} label={c.name} />
      </div>
      <div className="concept-grid">
        <div>
          <h2>Why does this happen?</h2>
          <WhyExplainer concept={c} level={data.settings.level} />
          <ProvenanceNote provenance={c.provenance} />
        </div>
        <div className="concept-side">
          <section>
            <h2 className="h3">Where you see it</h2>
            <ul className="chips">
              {c.structureIds.map((sid) => {
                const s = ix.structures.get(sid)!;
                return (
                  <li key={sid}>
                    <ContextLink to={`/explore/${s.diagram}/${sid}`} fromLabel={c.name} className="chip">
                      {s.name}
                    </ContextLink>
                  </li>
                );
              })}
            </ul>
          </section>
          <section>
            <h2 className="h3">Connected mechanisms</h2>
            <ul className="rel-list">
              {rels.map((r) => {
                const other = ix.concepts.get(r.from === c.id ? r.to : r.from)!;
                return (
                  <li key={r.id}>
                    <p>
                      <strong>{r.from === c.id ? c.name : other.name}</strong> {r.label}{' '}
                      <strong>{r.from === c.id ? other.name : c.name}</strong>
                    </p>
                    <p className="muted small">{r.why}</p>
                    <ContextLink to={`/concept/${other.id}`} fromLabel={c.name}>
                      Open {other.name} →
                    </ContextLink>
                  </li>
                );
              })}
            </ul>
          </section>
          <section>
            <h2 className="h3">Glossary</h2>
            <dl className="glossary">
              {c.glossaryIds.map((g) => {
                const t = ix.glossary.get(g)!;
                return (
                  <div key={g}>
                    <dt>{t.term}</dt>
                    <dd>{t.definition}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </div>
      </div>
      <section className="study-tools">
        <h2>Study this concept</h2>
        <div className="grid-2">
          <div>
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} context="quiz" heading="Recall" />
            ))}
            {cards.map((f) => (
              <FlipCard key={f.id} front={f.front} back={f.back} />
            ))}
          </div>
          <div>
            <NoteEditor target={target} label={c.name} />
            <QuickCardForm target={target} label={c.name} />
            <AttachResource target={target} />
            <CuratedResources conceptIds={[c.id]} />
          </div>
        </div>
      </section>
    </article>
  );
}

const POS: Record<string, [number, number]> = {
  'ventilation-mechanics': [110, 60],
  circulation: [650, 60],
  'partial-pressure-diffusion': [220, 230],
  'hemoglobin-binding': [540, 230],
  'membrane-transport': [100, 420],
  'bohr-effect': [650, 420],
  'cellular-respiration': [260, 550],
  'co2-acid-base': [520, 550],
};

/** Concept map: nodes are mechanisms; edges are buttons that explain the link. */
export function MechanismsPage() {
  const { bundle, ix } = useContent();
  const [sel, setSel] = useState<string | null>(null);
  const rel = bundle.relationships.find((r) => r.id === sel);

  const key = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSel(id);
    }
  };

  const pairCount = (a: string, b: string) => bundle.relationships.filter((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a)).length;

  return (
    <article className="page">
      <p className="eyebrow">How chemistry and biology connect to medicine</p>
      <h1>Mechanisms and concept map</h1>
      <p className="lede">
        Five mechanisms carry the oxygen story. Select a connection (an arrow or its label) to see why the two ideas are linked,
        or open a mechanism for its layered "Why does this happen?" explanation.
      </p>
      <div className="map-layout">
        <figure className="concept-map">
          <svg viewBox="0 0 760 610" role="group" aria-labelledby="cm-t" aria-describedby="cm-d">
            <title id="cm-t">Concept map of oxygen-transport mechanisms</title>
            <desc id="cm-d">Each arrow is a selectable connection. A list of the same connections follows the map.</desc>
            <defs>
              <marker id="cm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" className="arrow-head" />
              </marker>
            </defs>
            {bundle.relationships.map((r) => {
              const [x1, y1] = POS[r.from];
              const [x2, y2] = POS[r.to];
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.hypot(dx, dy);
              const bend = pairCount(r.from, r.to) > 1 ? 56 : 0;
              const nx = (-dy / len) * bend;
              const ny = (dx / len) * bend;
              const cx = (x1 + x2) / 2 + nx;
              const cy = (y1 + y2) / 2 + ny;
              // trim the ends so arrows stop at node edges (nodes ~ 60×26)
              const t = 54 / len;
              const sx = x1 + dx * t;
              const sy = y1 + dy * t;
              const ex = x2 - dx * t;
              const ey = y2 - dy * t;
              const on = sel === r.id;
              return (
                <g
                  key={r.id}
                  className={`edge${on ? ' is-selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={on}
                  aria-label={`${ix.concepts.get(r.from)?.name} ${r.label} ${ix.concepts.get(r.to)?.name}`}
                  onClick={() => setSel(r.id)}
                  onKeyDown={(e) => key(e, r.id)}
                >
                  <path className="edge-hit" d={`M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`} />
                  <path className="edge-line" d={`M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`} markerEnd="url(#cm-arrow)" />
                  <text className="edge-label" x={(sx + 2 * cx + ex) / 4} y={(sy + 2 * cy + ey) / 4} textAnchor="middle">
                    {r.label}
                  </text>
                </g>
              );
            })}
            {Object.entries(POS).map(([id, [x, y]]) => {
              const c = ix.concepts.get(id)!;
              const core = bundle.coreConceptIds.includes(id);
              const words = c.name.split(' ');
              const lines: string[] = [];
              for (const w of words) {
                const last = lines[lines.length - 1];
                if (last && (last + ' ' + w).length <= 18) lines[lines.length - 1] = last + ' ' + w;
                else lines.push(w);
              }
              return (
                <g key={id} className={`node${core ? ' is-core' : ''}`}>
                  <a href={`#/concept/${id}`} aria-label={`Open ${c.name}`}>
                    <rect x={x - 70} y={y - 12 - lines.length * 8} width="140" height={24 + lines.length * 16} rx="10" />
                    {lines.map((l, i) => (
                      <text key={i} x={x} y={y + 5 - (lines.length - 1) * 8 + i * 16} textAnchor="middle">
                        {l}
                      </text>
                    ))}
                  </a>
                </g>
              );
            })}
          </svg>
          <figcaption className="muted small">Bold outlines mark the five first-release mechanisms. Selecting a node opens it.</figcaption>
        </figure>
        <aside className="map-explain" aria-live="polite">
          {rel ? (
            <div>
              <p className="eyebrow">Why are these connected?</p>
              <h2 className="h3">
                {ix.concepts.get(rel.from)?.name} → {rel.label} → {ix.concepts.get(rel.to)?.name}
              </h2>
              <p>{rel.why}</p>
              <ProvenanceNote provenance={rel.provenance} compact />
              <div className="row wrap">
                <ContextLink to={`/concept/${rel.from}`} fromLabel="the concept map">
                  Open {ix.concepts.get(rel.from)?.name}
                </ContextLink>
                <ContextLink to={`/concept/${rel.to}`} fromLabel="the concept map">
                  Open {ix.concepts.get(rel.to)?.name}
                </ContextLink>
              </div>
            </div>
          ) : (
            <EmptyState title="Select a connection">
              <p>Every arrow has an explanation of why the two mechanisms are linked.</p>
            </EmptyState>
          )}
        </aside>
      </div>

      <section>
        <h2>All connections (text version)</h2>
        <ul className="rel-buttons">
          {bundle.relationships.map((r) => (
            <li key={r.id}>
              <button type="button" className={`btn btn-quiet${sel === r.id ? ' is-on' : ''}`} aria-pressed={sel === r.id} onClick={() => setSel(r.id)}>
                {ix.concepts.get(r.from)?.name} → {r.label} → {ix.concepts.get(r.to)?.name}
              </button>
            </li>
          ))}
        </ul>
        <h2>All mechanisms</h2>
        <ul className="concept-cards">
          {bundle.concepts.map((c) => (
            <li key={c.id}>
              <Link to={`/concept/${c.id}`}>{c.name}</Link>
              <p className="muted small">{c.oneLine}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

export function SystemPage() {
  const { id = '' } = useParams();
  const { bundle, ix } = useContent();
  const sys = bundle.systems.find((s) => s.id === id);
  if (!sys) return <EmptyState title="System not found" />;
  if (sys.status === 'planned') return <UnavailableState title={sys.name}><p>{sys.summary}</p></UnavailableState>;
  return (
    <article className="page narrow">
      <p className="eyebrow">System</p>
      <h1>{sys.name}</h1>
      <p className="lede">{sys.summary}</p>
      <ul className="structure-index">
        {sys.structureIds.map((sid) => {
          const s = ix.structures.get(sid)!;
          return (
            <li key={sid}>
              <ContextLink to={`/explore/${s.diagram}/${sid}`} fromLabel={sys.name}>
                {s.name}
              </ContextLink>
              <span className="muted small"> · {s.scale}</span>
              <p className="muted small">{s.oneLine}</p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
