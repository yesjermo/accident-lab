import { Link } from 'react-router-dom';
import { useContent } from '../data/content';
import type { Provenance } from '../domain/types';
import { CONTENT_VERIFIED_ON } from '../content/sources';

export function SourcesPage() {
  const { bundle } = useContent();
  const items: { kind: string; name: string; p: Provenance; to?: string }[] = [
    ...bundle.lessons.map((l) => ({ kind: 'Lesson', name: l.title, p: l.provenance, to: '/journey' })),
    ...bundle.simulations.map((s) => ({ kind: 'Simulation', name: s.title, p: s.provenance, to: '/experiment' })),
    ...bundle.concepts.map((c) => ({ kind: 'Concept', name: c.name, p: c.provenance, to: `/concept/${c.id}` })),
    ...bundle.structures.map((s) => ({ kind: 'Structure', name: s.name, p: s.provenance, to: `/explore/${s.diagram}/${s.id}` })),
    ...bundle.relationships.map((r) => ({ kind: 'Connection', name: `${r.from} → ${r.to}`, p: r.provenance })),
    ...bundle.questions.map((q) => ({ kind: 'Question', name: q.stem, p: q.provenance })),
  ];
  const drafts = items.filter((i) => i.p.reviewStatus === 'draft');
  return (
    <article className="page">
      <p className="eyebrow">Trust</p>
      <h1>Sources and licences</h1>
      <p className="lede">
        Every lesson, explanation, question and simulation records its sources, version, last check date and review status.
        Content was last checked against its sources on {CONTENT_VERIFIED_ON}. <strong>No subject-expert review has taken place yet.</strong>
      </p>

      <section>
        <h2>Sources</h2>
        <table className="sources-table">
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col">Type</th>
              <th scope="col">Licence / use</th>
            </tr>
          </thead>
          <tbody>
            {bundle.sources.map((s) => (
              <tr key={s.id}>
                <td>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                  </a>
                  <div className="muted small">
                    {s.authors}. {s.publisher}
                    {s.year ? `, ${s.year}` : ''}.{s.doi && ` doi:${s.doi}`}
                  </div>
                </td>
                <td>{s.kind}</td>
                <td>{s.license ?? 'All rights reserved: linked and cited only'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">
          OpenStax books are CC BY-NC-SA 4.0 and their terms restrict use with generative AI, so no OpenStax text or figures are
          reproduced here. Explanations are written for this app and cite the sections they were checked against. StatPearls
          full text was not accessible during checking, so StatPearls citations refer to article abstracts. Videos are linked, not
          embedded; no partnership with any provider is implied.
        </p>
      </section>

      <section>
        <h2>Diagrams</h2>
        <p>
          The 2D diagrams are original schematic drawings made for this app and released under the project's licence. They are
          simplified and not to scale.
        </p>
        <p>
          The 3D body uses real anatomical meshes from <strong>BodyParts3D</strong> (© The Database Center for Life Science), merged
          per organ and polygon-reduced with Blender; shapes are not edited. The licence page states CC BY 4.0, while the 2011 files carry
          a CC BY-SA 2.1 JP notice, so the derived model file is shared under CC BY-SA. The dataset has no lung-surface or individual
          thigh-muscle meshes, so the lungs appear as their bronchial and vascular trees and thigh muscle is shown only in the 2D tissue
          diagram. Nothing was sculpted or generated to fill these gaps.
        </p>
      </section>

      <section>
        <h2>Content marked Draft ({drafts.length})</h2>
        <p className="muted">These items contain at least one claim not yet confirmed against an accessible source.</p>
        <ul>
          {drafts.map((d) => (
            <li key={d.kind + d.name}>
              <strong>{d.kind}:</strong> {d.to ? <Link to={d.to}>{d.name}</Link> : d.name}
              <div className="muted small">{d.p.notes}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>All content records ({items.length})</h2>
        <div className="table-scroll">
          <table className="provenance-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Status</th>
                <th scope="col">Version</th>
                <th scope="col">Checked</th>
                <th scope="col">Sources</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.kind + i.name}>
                  <td>
                    <span className="muted small">{i.kind}</span>
                    <br />
                    {i.to ? <Link to={i.to}>{i.name}</Link> : i.name}
                  </td>
                  <td>{i.p.reviewStatus}</td>
                  <td>{i.p.version}</td>
                  <td>{i.p.lastVerified ?? '—'}</td>
                  <td className="small">{i.p.sources.map((s) => s.section).join('; ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}

export function AboutPage() {
  return (
    <article className="page narrow">
      <p className="eyebrow">About</p>
      <h1>Scope, limits and what comes next</h1>
      <p className="lede">
        Body Systems Explorer helps premedical and medical students connect anatomy, physiology, biology and chemistry, moving
        between scales from organ to molecule.
      </p>
      <h2>What is in this release</h2>
      <ul>
        <li>Cardiovascular and respiratory systems, connected by the guided journey "Follow an Oxygen Molecule".</li>
        <li>A transparent 3D body built from BodyParts3D anatomical meshes, plus four schematic diagrams, all with selectable structures and five-lens explanations.</li>
        <li>Five core mechanisms with layered "Why does this happen?" explanations and a concept map.</li>
        <li>One experiment: the oxygen–hemoglobin dissociation curve (Severinghaus 1979).</li>
        <li>Quiz, labeling, flashcards with a documented spaced-review schedule, notes, bookmarks and attached links.</li>
      </ul>
      <h2>What it is not</h2>
      <ul>
        <li>Not a clinical tool. It does not diagnose, predict outcomes for individual patients or recommend treatment.</li>
        <li>Not expert-reviewed yet. Items are labelled Source-checked or Draft; see Sources.</li>
        <li>Not a substitute for your course materials. Attach them to concepts instead.</li>
      </ul>
      <h2>Planned (not built)</h2>
      <ul>
        <li>More systems (renal, nervous) and more experiments.</li>
        <li>Accounts, sync and a FastAPI + PostgreSQL backend. The data model already has owner, collection and visibility fields for this.</li>
        <li>Shared study collections and group annotations.</li>
        <li>3D lessons for the other organs shown in the 3D body (currently marked Planned).</li>
        <li>Document ingestion and AI tutoring are deliberately deferred.</li>
      </ul>
      <p className="muted small">
        Keyboard: Tab moves between controls and diagram structures; Enter or Space selects; arrow keys switch panel tabs. Reduced
        motion is respected.
      </p>
    </article>
  );
}

export function NotFound() {
  return (
    <article className="page narrow">
      <h1>Page not found</h1>
      <p>
        <Link to="/">Go to the start</Link>
      </p>
    </article>
  );
}
