import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContent } from '../data/content';
import { useStudy } from '../data/study';
import { EquationBlock } from '../components/Explain';
import { LeveledText } from '../components/Rich';
import { ProvenanceNote } from '../components/Provenance';
import { EmptyState } from '../components/States';
import { allEquations, clinicalStructures } from '../content/medical';

/** Every equation in one place, each with its variables, units and limits. */
export function EquationsPage() {
  const { bundle } = useContent();
  const loc = useLocation();
  const entries = allEquations(bundle);
  useEffect(() => {
    if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [loc.hash]);
  return (
    <article className="page narrow">
      <p className="eyebrow">Medical student tools</p>
      <h1>Equation sheet</h1>
      <p className="lede">Every equation used in the app, with each variable, its unit, and where the model stops being valid.</p>
      {entries.map(({ eq, concept, simulation }) => (
        <section key={eq.id} id={`eq-${eq.id}`} className="eq-entry">
          <EquationBlock eq={eq} />
          <p className="muted small">
            Explained in{' '}
            {concept ? <Link to={`/concept/${concept.id}`}>{concept.name}</Link> : <Link to="/experiment">{simulation}</Link>}.
          </p>
        </section>
      ))}
    </article>
  );
}

/** All clinical connections, grouped by structure, with provenance. Educational only. */
export function ClinicalPage() {
  const { bundle } = useContent();
  const { data } = useStudy();
  const list = clinicalStructures(bundle.structures);
  return (
    <article className="page narrow">
      <p className="eyebrow">Medical student tools</p>
      <h1>Clinical connections</h1>
      <p className="notice" role="note">
        Educational examples that explain mechanisms. They are not diagnostic criteria or treatment advice.
      </p>
      {list.length === 0 ? (
        <EmptyState title="No clinical connections yet." />
      ) : (
        list.map((s) => (
          <section key={s.id} className="clinical-entry">
            <h2 className="h3">
              <Link to={`/explore/${s.diagram}/${s.id}?tab=clinical`}>{s.name}</Link>
            </h2>
            <LeveledText text={s.lenses.clinical.body} level={data.settings.level} />
            <ProvenanceNote provenance={s.provenance} compact />
          </section>
        ))
      )}
    </article>
  );
}
