/**
 * ContentRepository: the one seam between editorial content and the UI.
 *
 * Today content ships as static TypeScript modules (`StaticContentRepository`).
 * A later `HttpContentRepository` can fetch the same shapes from a FastAPI
 * service (e.g. GET /content/bundle?version=…) without changing components,
 * which only ever see a `ContentBundle`.
 */
import type {
  BodySystem,
  Concept,
  Flashcard,
  GlossaryTerm,
  LabelingExercise,
  Lesson,
  Question,
  Relationship,
  Resource,
  SimulationSpec,
  Source,
  Structure,
} from '../domain/types';

export interface ContentBundle {
  version: string;
  systems: BodySystem[];
  structures: Structure[];
  concepts: Concept[];
  coreConceptIds: string[];
  relationships: Relationship[];
  glossary: GlossaryTerm[];
  lessons: Lesson[];
  questions: Question[];
  flashcards: Flashcard[];
  labeling: LabelingExercise[];
  resources: Resource[];
  simulations: SimulationSpec[];
  sources: Source[];
}

export interface ContentRepository {
  loadBundle(): Promise<ContentBundle>;
}

export const CONTENT_VERSION = '2026.11.0';

export class StaticContentRepository implements ContentRepository {
  async loadBundle(): Promise<ContentBundle> {
    // Dynamic import keeps content in its own chunk and exercises the loading state.
    const [s, c, l, q, p, src, o, t] = await Promise.all([
      import('./structures'),
      import('./concepts'),
      import('./lesson'),
      import('./questions'),
      import('./practice'),
      import('./sources'),
      import('./organs'),
      import('./tourLesson'),
    ]);
    return {
      version: CONTENT_VERSION,
      systems: [...s.SYSTEMS, ...o.ORGAN_SYSTEMS],
      structures: [...s.STRUCTURES, ...o.ORGAN_STRUCTURES],
      concepts: c.CONCEPTS,
      coreConceptIds: c.CORE_CONCEPT_IDS,
      relationships: c.RELATIONSHIPS,
      glossary: c.GLOSSARY,
      lessons: [l.OXYGEN_JOURNEY, t.ORGAN_TOUR],
      questions: [...q.QUESTIONS, ...t.TOUR_QUESTIONS],
      flashcards: p.FLASHCARDS,
      labeling: p.LABELING,
      resources: p.RESOURCES,
      simulations: [p.ODC_SIMULATION],
      sources: src.SOURCES,
    };
  }
}

/** Lookup helpers over a bundle. */
export function indexBundle(b: ContentBundle) {
  const by = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
  return {
    structures: by(b.structures),
    concepts: by(b.concepts),
    questions: by(b.questions),
    flashcards: by(b.flashcards),
    glossary: by(b.glossary),
    sources: by(b.sources),
    lessons: by(b.lessons),
    resources: by(b.resources),
    labeling: by(b.labeling),
  };
}
export type ContentIndex = ReturnType<typeof indexBundle>;
