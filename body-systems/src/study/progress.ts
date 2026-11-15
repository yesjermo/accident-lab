/**
 * Progress by learning objective.
 *
 * Opening or completing a lesson is tracked separately from demonstrated
 * understanding. An objective is "Demonstrated" only when the student's most
 * recent answer to each linked question they have tried is correct, and at
 * least two linked questions (or all of them, if fewer) have been answered
 * correctly. A later wrong answer moves it back to "Needs review".
 * Nothing is ever labelled "mastered".
 */
import type { ID, Lesson, LearningObjective } from '../domain/types';
import type { QuestionAttempt, StudyData } from './model';
import { isDue } from './srs';

export type ObjectiveStatus = 'not-started' | 'practising' | 'needs-review' | 'demonstrated';

export const OBJECTIVE_STATUS_LABEL: Record<ObjectiveStatus, string> = {
  'not-started': 'No evidence yet',
  practising: 'Practising',
  'needs-review': 'Needs review',
  demonstrated: 'Demonstrated',
};

export function latestAttempts(attempts: QuestionAttempt[]): Map<ID, QuestionAttempt> {
  const m = new Map<ID, QuestionAttempt>();
  for (const a of attempts) {
    const prev = m.get(a.questionId);
    if (!prev || prev.at <= a.at) m.set(a.questionId, a);
  }
  return m;
}

export interface ObjectiveProgress {
  objective: LearningObjective;
  status: ObjectiveStatus;
  correct: number;
  attempted: number;
  total: number;
}

export function objectiveProgress(
  objective: LearningObjective,
  latest: Map<ID, QuestionAttempt>,
): ObjectiveProgress {
  const total = objective.questionIds.length;
  const tried = objective.questionIds.map((id) => latest.get(id)).filter((a): a is QuestionAttempt => !!a);
  const correct = tried.filter((a) => a.correct).length;
  const anyWrong = tried.some((a) => !a.correct);
  const needed = Math.min(2, total);
  let status: ObjectiveStatus;
  if (tried.length === 0) status = 'not-started';
  else if (anyWrong) status = 'needs-review';
  else if (correct >= needed) status = 'demonstrated';
  else status = 'practising';
  return { objective, status, correct, attempted: tried.length, total };
}

export interface LessonProgressSummary {
  stepsCompleted: number;
  stepsTotal: number;
  lessonCompleted: boolean;
  objectives: ObjectiveProgress[];
  demonstrated: number;
}

export function lessonProgress(lesson: Lesson, data: StudyData): LessonProgressSummary {
  const lp = data.lessons[lesson.id];
  const done = lp ? lesson.steps.filter((s) => lp.completedStepIds.includes(s.id)).length : 0;
  const latest = latestAttempts(data.attempts);
  const objectives = lesson.objectives.map((o) => objectiveProgress(o, latest));
  return {
    stepsCompleted: done,
    stepsTotal: lesson.steps.length,
    lessonCompleted: done === lesson.steps.length,
    objectives,
    demonstrated: objectives.filter((o) => o.status === 'demonstrated').length,
  };
}

/** Questions whose most recent attempt was wrong. */
export function missedQuestionIds(data: StudyData): ID[] {
  return [...latestAttempts(data.attempts).values()].filter((a) => !a.correct).map((a) => a.questionId);
}

/** Card IDs (editorial or user) that are due now. */
export function dueCardIds(data: StudyData, cardIds: ID[], now: Date): ID[] {
  return cardIds.filter((id) => isDue(data.cardSchedules[id], now));
}
