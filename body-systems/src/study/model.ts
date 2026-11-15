/**
 * User study data, schema version 1.
 *
 * Everything the student creates or earns lives here. Editorial content is
 * referenced by ID only. Records that a future backend may share carry
 * `ownerId`, `collectionId` and `visibility`, so shared study collections and
 * group annotations can be added without a data migration. Today the only
 * owner is "local" and everything is private.
 */
import type { ID, Level } from '../domain/types';

export const SCHEMA_VERSION = 1 as const;
export const LOCAL_OWNER = 'local';

/** What a note, bookmark or attached resource is about. */
export interface StudyTarget {
  kind: 'structure' | 'concept' | 'lesson-step' | 'resource' | 'simulation';
  id: ID;
}

interface Shareable {
  id: ID;
  ownerId: string;
  /** Reserved for shared study collections. Always null in this release. */
  collectionId: ID | null;
  visibility: 'private' | 'collection';
  createdAt: string;
  updatedAt: string;
}

export interface Note extends Shareable {
  target: StudyTarget;
  text: string;
}

export interface Bookmark extends Shareable {
  target: StudyTarget;
  /** Label captured at bookmark time so the list reads well even if content changes. */
  label: string;
}

/** A link the student attached to a concept. Shown as user-added, never as editorial. */
export interface UserResource extends Shareable {
  target: StudyTarget;
  url: string;
  title: string;
  note: string;
}

export interface UserFlashcard extends Shareable {
  front: string;
  back: string;
  target: StudyTarget | null;
  tags: string[];
}

export type QuestionContext = 'quiz' | 'lesson' | 'review' | 'experiment';

export interface QuestionAttempt {
  questionId: ID;
  choiceId: ID;
  correct: boolean;
  at: string;
  context: QuestionContext;
}

export interface LabelingAttempt {
  exerciseId: ID;
  at: string;
  correct: number;
  total: number;
  missedStructureIds: ID[];
}

export interface PredictionRecord {
  at: string;
  conditions: { pH: number; temperatureC: number };
  predicted: 'left' | 'right' | 'none';
  actual: 'left' | 'right' | 'none';
}

/** Leitner-box schedule for one card (editorial or user). See srs.ts. */
export interface CardSchedule {
  box: number;
  dueAt: string | null;
  lastReviewedAt: string | null;
  reviews: number;
  lapses: number;
}

export interface LessonProgress {
  completedStepIds: ID[];
  lastStepId: ID | null;
  completedAt: string | null;
}

export interface StudySettings {
  level: Level;
}

export interface StudyData {
  schemaVersion: typeof SCHEMA_VERSION;
  ownerId: string;
  settings: StudySettings;
  lessons: Record<ID, LessonProgress>;
  attempts: QuestionAttempt[];
  labeling: LabelingAttempt[];
  predictions: PredictionRecord[];
  cardSchedules: Record<ID, CardSchedule>;
  userCards: UserFlashcard[];
  notes: Note[];
  bookmarks: Bookmark[];
  userResources: UserResource[];
}

export function emptyStudyData(): StudyData {
  return {
    schemaVersion: SCHEMA_VERSION,
    ownerId: LOCAL_OWNER,
    settings: { level: 'foundation' },
    lessons: {},
    attempts: [],
    labeling: [],
    predictions: [],
    cardSchedules: {},
    userCards: [],
    notes: [],
    bookmarks: [],
    userResources: [],
  };
}

export function newId(prefix: string): ID {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${rand}`;
}

export function shareableDefaults(prefix: string, now: string) {
  return {
    id: newId(prefix),
    ownerId: LOCAL_OWNER,
    collectionId: null,
    visibility: 'private' as const,
    createdAt: now,
    updatedAt: now,
  };
}
