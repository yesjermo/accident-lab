/** Pure grading for quizzes and labeling exercises. */
import type { LabelingTarget } from '../domain/types';

export interface QuizAnswer {
  questionId: string;
  correct: boolean;
}

/**
 * Quiz score counts only the first answer to each question in a session:
 * "Try again" after feedback helps learning but does not raise the score.
 */
export function scoreQuiz(answers: QuizAnswer[]): { correct: number; answered: number; percent: number } {
  const first = new Map<string, boolean>();
  for (const a of answers) if (!first.has(a.questionId)) first.set(a.questionId, a.correct);
  const correct = [...first.values()].filter(Boolean).length;
  const answered = first.size;
  return { correct, answered, percent: answered ? Math.round((100 * correct) / answered) : 0 };
}

/** assignments: marker structureId → the label (structureId) the student placed there. */
export function gradeLabeling(targets: LabelingTarget[], assignments: Record<string, string | undefined>) {
  const results = targets.map((t) => ({ ...t, given: assignments[t.structureId], correct: assignments[t.structureId] === t.structureId }));
  return {
    results,
    correct: results.filter((r) => r.correct).length,
    total: targets.length,
    missedStructureIds: results.filter((r) => !r.correct).map((r) => r.structureId),
  };
}

/** Deterministic shuffle so the label bank order is stable across renders but not in marker order. */
export function stableShuffle<T>(xs: T[], key: (x: T) => string): T[] {
  const h = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return [...xs].sort((a, b) => h(key(a)) - h(key(b)));
}
