/**
 * Spaced review: a five-box Leitner schedule.
 *
 * A deliberately simple, documented schedule (not SM-2 or FSRS):
 *
 *   | Rating | New box            | Next due                    |
 *   |--------|--------------------|-----------------------------|
 *   | Again  | 1                  | 10 minutes (same session)   |
 *   | Good   | box + 1 (max 5)    | interval for the new box    |
 *   | Easy   | box + 2 (max 5)    | interval for the new box    |
 *
 *   Box intervals: 1 → 1 day, 2 → 3 days, 3 → 7 days, 4 → 16 days, 5 → 35 days.
 *
 * A card never seen is in box 0 and is "new", not "due". Lapses count every
 * "Again" after the first review, so the review screen can surface leeches.
 */
import type { CardSchedule } from './model';

export type Rating = 'again' | 'good' | 'easy';

export const BOX_INTERVAL_DAYS: Readonly<Record<number, number>> = Object.freeze({
  1: 1,
  2: 3,
  3: 7,
  4: 16,
  5: 35,
});
export const MAX_BOX = 5;
export const AGAIN_DELAY_MINUTES = 10;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export function newSchedule(): CardSchedule {
  return { box: 0, dueAt: null, lastReviewedAt: null, reviews: 0, lapses: 0 };
}

export function review(prev: CardSchedule | undefined, rating: Rating, now: Date): CardSchedule {
  const s = prev ?? newSchedule();
  let box: number;
  let dueMs: number;
  if (rating === 'again') {
    box = 1;
    dueMs = now.getTime() + AGAIN_DELAY_MINUTES * MINUTE;
  } else {
    box = Math.min(MAX_BOX, Math.max(1, s.box + (rating === 'easy' ? 2 : 1)));
    dueMs = now.getTime() + BOX_INTERVAL_DAYS[box] * DAY;
  }
  return {
    box,
    dueAt: new Date(dueMs).toISOString(),
    lastReviewedAt: now.toISOString(),
    reviews: s.reviews + 1,
    lapses: s.lapses + (rating === 'again' && s.reviews > 0 ? 1 : 0),
  };
}

export function isNew(s: CardSchedule | undefined): boolean {
  return !s || s.reviews === 0;
}

export function isDue(s: CardSchedule | undefined, now: Date): boolean {
  if (!s || s.reviews === 0 || !s.dueAt) return false;
  return new Date(s.dueAt).getTime() <= now.getTime();
}

/** Human-readable "next review" text. */
export function describeDue(s: CardSchedule | undefined, now: Date): string {
  if (isNew(s)) return 'New';
  const ms = new Date(s!.dueAt!).getTime() - now.getTime();
  if (ms <= 0) return 'Due now';
  if (ms < 60 * MINUTE) return `In ${Math.ceil(ms / MINUTE)} min`;
  if (ms < DAY) return `In ${Math.ceil(ms / (60 * MINUTE))} h`;
  return `In ${Math.round(ms / DAY)} d`;
}
