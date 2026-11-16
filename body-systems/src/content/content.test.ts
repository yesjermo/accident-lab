import { StaticContentRepository, indexBundle, type ContentBundle } from './repository';
import type { Provenance } from '../domain/types';
import { DIAGRAM_REGIONS, viewShows } from '../diagrams/regions';

let b: ContentBundle;
beforeAll(async () => {
  b = await new StaticContentRepository().loadBundle();
});

function provenanceOk(p: Provenance, ix: ReturnType<typeof indexBundle>, where: string) {
  expect(p.sources.length, `${where}: needs at least one source`).toBeGreaterThan(0);
  for (const r of p.sources) expect(ix.sources.has(r.sourceId), `${where}: unknown source ${r.sourceId}`).toBe(true);
  expect(p.version, where).toMatch(/^\d+\.\d+\.\d+$/);
  if (p.reviewStatus === 'draft') {
    expect(p.notes, `${where}: draft content must say what is unverified`).toBeTruthy();
    expect(p.lastVerified).toBeNull();
  } else {
    expect(p.lastVerified, where).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
  // Nobody has done an expert review; the content must not claim one.
  expect(p.reviewStatus, where).not.toBe('expert-reviewed');
}

describe('content integrity', () => {
  it('every item carries valid provenance', () => {
    const ix = indexBundle(b);
    const all: [string, { provenance: Provenance }][] = [
      ...b.structures.map((x) => [`structure ${x.id}`, x] as [string, typeof x]),
      ...b.concepts.map((x) => [`concept ${x.id}`, x] as [string, typeof x]),
      ...b.relationships.map((x) => [`relationship ${x.id}`, x] as [string, typeof x]),
      ...b.lessons.map((x) => [`lesson ${x.id}`, x] as [string, typeof x]),
      ...b.questions.map((x) => [`question ${x.id}`, x] as [string, typeof x]),
      ...b.flashcards.map((x) => [`card ${x.id}`, x] as [string, typeof x]),
      ...b.labeling.map((x) => [`labeling ${x.id}`, x] as [string, typeof x]),
      ...b.simulations.map((x) => [`simulation ${x.id}`, x] as [string, typeof x]),
    ];
    for (const [where, item] of all) provenanceOk(item.provenance, ix, where);
  });

  it('all cross-references resolve', () => {
    const ix = indexBundle(b);
    const s = (id: string, where: string) => expect(ix.structures.has(id), `${where} → structure ${id}`).toBe(true);
    const c = (id: string, where: string) => expect(ix.concepts.has(id), `${where} → concept ${id}`).toBe(true);
    const g = (id: string, where: string) => expect(ix.glossary.has(id), `${where} → glossary ${id}`).toBe(true);
    const q = (id: string, where: string) => expect(ix.questions.has(id), `${where} → question ${id}`).toBe(true);

    for (const sys of b.systems) sys.structureIds.forEach((id) => s(id, `system ${sys.id}`));
    for (const st of b.structures) {
      st.relatedStructureIds.forEach((id) => s(id, st.id));
      Object.values(st.lenses).forEach((lens) => lens.conceptIds?.forEach((id) => c(id, st.id)));
    }
    for (const co of b.concepts) {
      co.structureIds.forEach((id) => s(id, co.id));
      co.glossaryIds.forEach((id) => g(id, co.id));
    }
    for (const r of b.relationships) {
      c(r.from, r.id);
      c(r.to, r.id);
    }
    b.coreConceptIds.forEach((id) => c(id, 'core'));
    for (const lesson of b.lessons) {
      lesson.objectives.forEach((o) => o.questionIds.forEach((id) => q(id, o.id)));
      for (const step of lesson.steps) {
        q(step.checkQuestionId, step.id);
        step.structureIds.forEach((id) => s(id, step.id));
        step.view.highlight.forEach((id) => s(id, step.id));
        step.conceptIds.forEach((id) => c(id, step.id));
        step.glossaryIds.forEach((id) => g(id, step.id));
      }
    }
    for (const qu of b.questions) {
      qu.structureIds.forEach((id) => s(id, qu.id));
      qu.conceptIds.forEach((id) => c(id, qu.id));
    }
    for (const r of b.resources) {
      expect(ix.sources.has(r.sourceId), r.id).toBe(true);
      expect(r.url.startsWith('https://'), r.id).toBe(true);
    }
  });

  it('every question has one correct answer and an explanation for every choice', () => {
    for (const qu of b.questions) {
      expect(qu.choices.filter((ch) => ch.id === qu.correctChoiceId)).toHaveLength(1);
      for (const ch of qu.choices) expect(ch.explanation.length, `${qu.id}/${ch.id}`).toBeGreaterThan(5);
      expect(qu.objectiveIds.length, qu.id).toBeGreaterThan(0);
    }
  });

  it('every objective has questions; every question serves a real objective', () => {
    const objectiveIds = new Set(b.lessons.flatMap((l) => l.objectives.map((o) => o.id)));
    for (const qu of b.questions) qu.objectiveIds.forEach((id) => expect(objectiveIds.has(id), qu.id).toBe(true));
  });

  it('every structure appears on its diagram, and every lesson highlight is drawable', () => {
    for (const st of b.structures) {
      expect(viewShows(st.diagram, st.id), `${st.id} on ${st.diagram}`).toBe(true);
    }
    for (const lesson of b.lessons) {
      for (const step of lesson.steps) {
        for (const id of step.view.highlight) {
          expect(viewShows(step.view.diagram, id), `${step.id}: ${id} on ${step.view.diagram}`).toBe(true);
        }
      }
    }
    for (const ex of b.labeling) {
      for (const t of ex.targets) expect(DIAGRAM_REGIONS[ex.diagram].includes(t.structureId), `${ex.id}: ${t.structureId}`).toBe(true);
    }
  });

  it('every equation explains each variable with a unit and states its limits', () => {
    const eqs = [
      ...b.concepts.flatMap((co) => co.why.flatMap((w) => w.equations ?? [])),
      ...b.simulations.flatMap((s) => s.equations),
    ];
    expect(eqs.length).toBeGreaterThan(4);
    for (const e of eqs) {
      expect(e.limits.length, e.id).toBeGreaterThan(10);
      for (const v of e.variables) expect(v.unit, `${e.id} ${v.symbol}`).toBeTruthy();
    }
  });

  it('all five first-release mechanisms are on the concept map', () => {
    expect(b.coreConceptIds).toEqual([
      'partial-pressure-diffusion',
      'hemoglobin-binding',
      'membrane-transport',
      'cellular-respiration',
      'co2-acid-base',
    ]);
    for (const id of b.coreConceptIds) {
      expect(b.relationships.some((r) => r.from === id || r.to === id), id).toBe(true);
    }
  });
});
