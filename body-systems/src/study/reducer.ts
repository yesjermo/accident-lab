/**
 * Pure state transitions for study data. Every action carries its own `now`
 * so the reducer stays deterministic and testable.
 */
import type { ID, Level } from '../domain/types';
import {
  shareableDefaults,
  type LabelingAttempt,
  type PredictionRecord,
  type QuestionAttempt,
  type StudyData,
  type StudyTarget,
} from './model';
import { review, type Rating } from './srs';

export type StudyAction =
  | { type: 'setLevel'; level: Level }
  | { type: 'completeStep'; lessonId: ID; stepId: ID; allStepIds: ID[]; now: string }
  | { type: 'visitStep'; lessonId: ID; stepId: ID }
  | { type: 'recordAttempt'; attempt: QuestionAttempt }
  | { type: 'recordLabeling'; attempt: LabelingAttempt }
  | { type: 'recordPrediction'; record: PredictionRecord }
  | { type: 'reviewCard'; cardId: ID; rating: Rating; now: string }
  | { type: 'saveNote'; target: StudyTarget; text: string; now: string }
  | { type: 'deleteNote'; id: ID }
  | { type: 'toggleBookmark'; target: StudyTarget; label: string; now: string }
  | { type: 'addUserResource'; target: StudyTarget; url: string; title: string; note: string; now: string }
  | { type: 'deleteUserResource'; id: ID }
  | { type: 'addUserCard'; front: string; back: string; target: StudyTarget | null; tags: string[]; now: string }
  | { type: 'deleteUserCard'; id: ID }
  | { type: 'replaceAll'; data: StudyData };

export const sameTarget = (a: StudyTarget, b: StudyTarget) => a.kind === b.kind && a.id === b.id;

export function studyReducer(state: StudyData, action: StudyAction): StudyData {
  switch (action.type) {
    case 'setLevel':
      return { ...state, settings: { ...state.settings, level: action.level } };

    case 'visitStep': {
      const prev = state.lessons[action.lessonId] ?? { completedStepIds: [], lastStepId: null, completedAt: null };
      return { ...state, lessons: { ...state.lessons, [action.lessonId]: { ...prev, lastStepId: action.stepId } } };
    }

    case 'completeStep': {
      const prev = state.lessons[action.lessonId] ?? { completedStepIds: [], lastStepId: null, completedAt: null };
      const done = prev.completedStepIds.includes(action.stepId)
        ? prev.completedStepIds
        : [...prev.completedStepIds, action.stepId];
      const all = action.allStepIds.every((id) => done.includes(id));
      return {
        ...state,
        lessons: {
          ...state.lessons,
          [action.lessonId]: {
            completedStepIds: done,
            lastStepId: action.stepId,
            completedAt: all ? prev.completedAt ?? action.now : null,
          },
        },
      };
    }

    case 'recordAttempt':
      return { ...state, attempts: [...state.attempts, action.attempt] };

    case 'recordLabeling':
      return { ...state, labeling: [...state.labeling, action.attempt] };

    case 'recordPrediction':
      return { ...state, predictions: [...state.predictions, action.record] };

    case 'reviewCard':
      return {
        ...state,
        cardSchedules: {
          ...state.cardSchedules,
          [action.cardId]: review(state.cardSchedules[action.cardId], action.rating, new Date(action.now)),
        },
      };

    case 'saveNote': {
      // One note per target; empty text deletes it.
      const existing = state.notes.find((n) => sameTarget(n.target, action.target));
      const text = action.text.trim();
      if (!text) return { ...state, notes: state.notes.filter((n) => n !== existing) };
      if (existing) {
        return {
          ...state,
          notes: state.notes.map((n) => (n === existing ? { ...n, text, updatedAt: action.now } : n)),
        };
      }
      return {
        ...state,
        notes: [...state.notes, { ...shareableDefaults('note', action.now), target: action.target, text }],
      };
    }

    case 'deleteNote':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };

    case 'toggleBookmark': {
      const existing = state.bookmarks.find((b) => sameTarget(b.target, action.target));
      if (existing) return { ...state, bookmarks: state.bookmarks.filter((b) => b !== existing) };
      return {
        ...state,
        bookmarks: [
          ...state.bookmarks,
          { ...shareableDefaults('bm', action.now), target: action.target, label: action.label },
        ],
      };
    }

    case 'addUserResource':
      return {
        ...state,
        userResources: [
          ...state.userResources,
          {
            ...shareableDefaults('res', action.now),
            target: action.target,
            url: action.url,
            title: action.title.trim() || action.url,
            note: action.note.trim(),
          },
        ],
      };

    case 'deleteUserResource':
      return { ...state, userResources: state.userResources.filter((r) => r.id !== action.id) };

    case 'addUserCard':
      return {
        ...state,
        userCards: [
          ...state.userCards,
          {
            ...shareableDefaults('card', action.now),
            front: action.front.trim(),
            back: action.back.trim(),
            target: action.target,
            tags: action.tags,
          },
        ],
      };

    case 'deleteUserCard': {
      const { [action.id]: _removed, ...schedules } = state.cardSchedules;
      void _removed;
      return { ...state, userCards: state.userCards.filter((c) => c.id !== action.id), cardSchedules: schedules };
    }

    case 'replaceAll':
      return action.data;
  }
}
