/**
 * Domain model for Body Systems Explorer.
 *
 * Editorial content (systems, structures, concepts, lessons, questions, cards,
 * sources) is read-only and versioned. User data (notes, bookmarks, attempts,
 * card reviews) lives in `study/` and is keyed by these IDs.
 *
 * Every shape here is plain JSON so the same records can later be served by a
 * FastAPI + PostgreSQL backend without changing the components that read them.
 */

export type ID = string;

/** Two reading levels. Every explanation that varies by level has both. */
export type Level = 'foundation' | 'medical';
/**
 * Text at two reading levels. `foundation` is always shown; at Medical Student
 * level, `medical` paragraphs are added after it (mechanism, numbers, clinical
 * reasoning). Leave `medical` out when the foundation text is already enough.
 */
export interface Leveled {
  foundation: string[];
  medical?: string[];
}

/** The four lenses plus clinical, used by the detail panel tabs. */
export type Lens = 'anatomy' | 'physiology' | 'biology' | 'chemistry' | 'clinical';

// ---------------------------------------------------------------- provenance

export type ReviewStatus =
  /** Written, not yet checked against its cited sources. Shown with a warning. */
  | 'draft'
  /** Each claim checked against the cited sources by the author. No subject-expert review. */
  | 'source-checked'
  /** Reviewed by a named subject expert (not used yet: no expert review has happened). */
  | 'expert-reviewed';

export interface Source {
  id: ID;
  title: string;
  /** Authors or organisation, as the source lists them. */
  authors: string;
  publisher: string;
  /** Publication year where the source states one (StatPearls articles are continuously updated). */
  year?: number;
  url: string;
  /** e.g. "CC BY 4.0". `null` = all rights reserved; we link only, never copy. */
  license: string | null;
  kind: 'open-textbook' | 'review' | 'primary-literature' | 'video' | 'reference';
  doi?: string;
}

export interface SourceRef {
  sourceId: ID;
  /** Section, figure, or page within the source that supports the content. */
  section: string;
  /** Optional deep link to the section. Falls back to the source URL. */
  url?: string;
}

export interface Provenance {
  sources: SourceRef[];
  /** Semantic version of this content item. Bump on any factual change. */
  version: string;
  /** ISO date (YYYY-MM-DD) of the last check against sources, or null if never. */
  lastVerified: string | null;
  reviewStatus: ReviewStatus;
  /** Simplifications, model limits, or open questions a reader should know. */
  notes?: string;
}

// ------------------------------------------------------------------ anatomy

export type DiagramId = 'body' | 'lung' | 'heart' | 'tissue';

export interface BodySystem {
  id: ID;
  name: string;
  summary: string;
  /** `planned` systems appear in navigation, disabled, so future scope is visible. */
  status: 'available' | 'planned';
  structureIds: ID[];
}

export interface StructureLens {
  /** Short paragraphs. Two levels where the depth genuinely differs. */
  body: Leveled;
  /** Concepts this lens leads to (the "go deeper" links). */
  conceptIds?: ID[];
}

export interface Structure {
  id: ID;
  name: string;
  systemIds: ID[];
  /** Diagram on which this structure is drawn and selectable. */
  diagram: DiagramId;
  /** Other diagrams that also draw it. */
  overviewOn?: DiagramId[];
  /** A closer diagram to zoom into from this structure (e.g. heart → heart diagram). */
  zoomTo?: DiagramId;
  scale: 'organ' | 'tissue' | 'cell' | 'organelle' | 'vessel';
  oneLine: string;
  lenses: Record<Lens, StructureLens>;
  relatedStructureIds: ID[];
  provenance: Provenance;
}

// ----------------------------------------------------------------- concepts

/** One layer of a "Why does this happen?" explanation, from intuition to molecules. */
export interface WhyLayer {
  depth: 'intuition' | 'physiology' | 'cellular' | 'molecular';
  title: string;
  body: Leveled;
  equations?: Equation[];
}

export interface Variable {
  symbol: string; // TeX
  meaning: string;
  unit: string;
  typical?: string;
}

export interface Equation {
  id: ID;
  name: string;
  tex: string;
  variables: Variable[];
  /** Where the equation stops being a good description. Required. */
  limits: string;
}

export interface Concept {
  id: ID;
  name: string;
  discipline: 'chemistry' | 'biology' | 'physiology' | 'physics';
  oneLine: string;
  why: WhyLayer[];
  /** What the explanation leaves out. Shown under every concept. */
  simplifications: string[];
  structureIds: ID[];
  glossaryIds: ID[];
  provenance: Provenance;
}

/** An edge on the concept map. `why` explains the link and is the point of the map. */
export interface Relationship {
  id: ID;
  from: ID;
  to: ID;
  label: string;
  why: string;
  provenance: Provenance;
}

export interface GlossaryTerm {
  id: ID;
  term: string;
  definition: string;
  conceptId?: ID;
}

// ------------------------------------------------------------------ lessons

export interface LearningObjective {
  id: ID;
  text: string;
  /** Questions whose answers count as evidence for this objective. */
  questionIds: ID[];
}

export interface DiagramView {
  diagram: DiagramId;
  highlight: ID[];
  /** Short caption shown under the diagram for this step. */
  caption: string;
}

export interface LessonStep {
  id: ID;
  title: string;
  /** "Where is the molecule now?" one-liner. */
  whereNow: string;
  view: DiagramView;
  body: Leveled;
  /** Key numbers for this stage (e.g. PO2 values), shown as a small table. */
  values?: { label: string; value: string; note?: string }[];
  structureIds: ID[];
  conceptIds: ID[];
  glossaryIds: ID[];
  checkQuestionId: ID;
}

export interface Lesson {
  id: ID;
  title: string;
  summary: string;
  objectives: LearningObjective[];
  prerequisites: { text: string; conceptId?: ID }[];
  steps: LessonStep[];
  provenance: Provenance;
}

// ---------------------------------------------------------------- practice

export interface Choice {
  id: ID;
  text: string;
  /** Why this choice is right or wrong. Every choice has one. */
  explanation: string;
}

export interface Question {
  id: ID;
  stem: string;
  choices: Choice[];
  correctChoiceId: ID;
  objectiveIds: ID[];
  conceptIds: ID[];
  structureIds: ID[];
  provenance: Provenance;
}

export interface Flashcard {
  id: ID;
  front: string;
  back: string;
  conceptIds: ID[];
  structureIds: ID[];
  /** Editorial cards carry provenance; user cards are stored in study data. */
  provenance: Provenance;
}

export interface LabelingTarget {
  structureId: ID;
  /** Marker number shown on the diagram. */
  marker: number;
}

export interface LabelingExercise {
  id: ID;
  title: string;
  diagram: DiagramId;
  targets: LabelingTarget[];
  /** Extra plausible labels so the bank isn't a giveaway. */
  distractorStructureIds: ID[];
  objectiveIds: ID[];
  provenance: Provenance;
}

/** Curated companion resource (editorial). Always link-out, never copied. */
export interface Resource {
  id: ID;
  title: string;
  kind: 'reading' | 'video';
  sourceId: ID;
  url: string;
  attribution: string;
  why: string;
  conceptIds: ID[];
  structureIds: ID[];
}

// -------------------------------------------------------------- simulation

export interface SimulationParam {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  baseline: number;
}

export interface SimulationSpec {
  id: ID;
  title: string;
  model: string;
  equations: Equation[];
  params: SimulationParam[];
  assumptions: string[];
  notModelled: string[];
  provenance: Provenance;
}
