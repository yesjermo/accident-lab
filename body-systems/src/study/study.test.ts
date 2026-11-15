import { toAnkiCsv, csvField, ANKI_HEADER } from './anki';
import { emptyStudyData, SCHEMA_VERSION, type QuestionAttempt } from './model';
import {
  LocalStorageStudyRepository,
  StudyDataError,
  isSafeUrl,
  parseImport,
  parseStudyData,
  serializeForExport,
} from './persistence';
import { lessonProgress, missedQuestionIds, objectiveProgress, latestAttempts, dueCardIds } from './progress';
import { studyReducer } from './reducer';
import { review, isDue, isNew, BOX_INTERVAL_DAYS, describeDue } from './srs';
import type { Lesson } from '../domain/types';

const T0 = new Date('2026-01-01T09:00:00Z');
const plusDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

describe('Leitner spaced review', () => {
  it('new cards are new, not due', () => {
    expect(isNew(undefined)).toBe(true);
    expect(isDue(undefined, T0)).toBe(false);
  });

  it('Good moves up one box and schedules by the documented intervals', () => {
    let s = review(undefined, 'good', T0);
    expect(s.box).toBe(1);
    expect(s.dueAt).toBe(plusDays(T0, 1).toISOString());
    s = review(s, 'good', plusDays(T0, 1));
    expect(s.box).toBe(2);
    expect(s.dueAt).toBe(plusDays(T0, 1 + BOX_INTERVAL_DAYS[2]).toISOString());
  });

  it('Easy skips a box; boxes cap at 5 (35 days)', () => {
    let s = review(undefined, 'easy', T0);
    expect(s.box).toBe(2);
    for (let i = 0; i < 5; i++) s = review(s, 'easy', T0);
    expect(s.box).toBe(5);
    expect(s.dueAt).toBe(plusDays(T0, 35).toISOString());
  });

  it('Again returns to box 1, due in 10 minutes, and counts a lapse after the first review', () => {
    const first = review(undefined, 'again', T0);
    expect(first.lapses).toBe(0);
    const s = review(review(first, 'good', T0), 'again', T0);
    expect(s.box).toBe(1);
    expect(s.lapses).toBe(1);
    expect(new Date(s.dueAt!).getTime() - T0.getTime()).toBe(10 * 60_000);
  });

  it('becomes due exactly at its due time', () => {
    const s = review(undefined, 'good', T0);
    expect(isDue(s, plusDays(T0, 0.99))).toBe(false);
    expect(isDue(s, plusDays(T0, 1))).toBe(true);
    expect(describeDue(s, T0)).toBe('In 1 d');
  });

  it('dueCardIds only returns due cards', () => {
    let d = emptyStudyData();
    d = studyReducer(d, { type: 'reviewCard', cardId: 'a', rating: 'good', now: T0.toISOString() });
    d = studyReducer(d, { type: 'reviewCard', cardId: 'b', rating: 'easy', now: T0.toISOString() });
    expect(dueCardIds(d, ['a', 'b', 'c'], plusDays(T0, 2))).toEqual(['a']);
  });
});

const lesson: Lesson = {
  id: 'L',
  title: 'L',
  summary: '',
  prerequisites: [],
  objectives: [
    { id: 'o1', text: 'one', questionIds: ['q1', 'q2', 'q3'] },
    { id: 'o2', text: 'two', questionIds: ['q4'] },
  ],
  steps: [
    { id: 's1' } as Lesson['steps'][number],
    { id: 's2' } as Lesson['steps'][number],
  ],
  provenance: { sources: [], version: '1', lastVerified: null, reviewStatus: 'draft' },
};

const attempt = (questionId: string, correct: boolean, at: string): QuestionAttempt => ({
  questionId,
  choiceId: 'x',
  correct,
  at,
  context: 'quiz',
});

describe('progress by objective', () => {
  it('completing the lesson does not demonstrate understanding', () => {
    let d = emptyStudyData();
    for (const s of ['s1', 's2']) {
      d = studyReducer(d, { type: 'completeStep', lessonId: 'L', stepId: s, allStepIds: ['s1', 's2'], now: T0.toISOString() });
    }
    const p = lessonProgress(lesson, d);
    expect(p.lessonCompleted).toBe(true);
    expect(p.demonstrated).toBe(0);
    expect(p.objectives.every((o) => o.status === 'not-started')).toBe(true);
  });

  it('needs two correct latest answers to be Demonstrated', () => {
    const o = lesson.objectives[0];
    expect(objectiveProgress(o, latestAttempts([attempt('q1', true, '1')])).status).toBe('practising');
    expect(
      objectiveProgress(o, latestAttempts([attempt('q1', true, '1'), attempt('q2', true, '2')])).status,
    ).toBe('demonstrated');
  });

  it('a later wrong answer moves it to Needs review; a later right answer recovers it', () => {
    const o = lesson.objectives[0];
    const base = [attempt('q1', true, '1'), attempt('q2', true, '2')];
    expect(objectiveProgress(o, latestAttempts([...base, attempt('q1', false, '3')])).status).toBe('needs-review');
    expect(
      objectiveProgress(o, latestAttempts([...base, attempt('q1', false, '3'), attempt('q1', true, '4')])).status,
    ).toBe('demonstrated');
  });

  it('single-question objectives need that one question', () => {
    expect(objectiveProgress(lesson.objectives[1], latestAttempts([attempt('q4', true, '1')])).status).toBe(
      'demonstrated',
    );
  });

  it('missed questions are those whose latest attempt is wrong', () => {
    const d = { ...emptyStudyData(), attempts: [attempt('q1', false, '1'), attempt('q2', false, '1'), attempt('q2', true, '2')] };
    expect(missedQuestionIds(d)).toEqual(['q1']);
  });
});

describe('reducer: notes, bookmarks, resources, cards', () => {
  const now = T0.toISOString();
  const target = { kind: 'concept' as const, id: 'c1' };

  it('keeps one note per target and deletes on empty text', () => {
    let d = studyReducer(emptyStudyData(), { type: 'saveNote', target, text: 'first', now });
    d = studyReducer(d, { type: 'saveNote', target, text: 'second', now });
    expect(d.notes).toHaveLength(1);
    expect(d.notes[0].text).toBe('second');
    expect(d.notes[0].visibility).toBe('private');
    expect(d.notes[0].collectionId).toBeNull();
    d = studyReducer(d, { type: 'saveNote', target, text: '   ', now });
    expect(d.notes).toHaveLength(0);
  });

  it('toggles bookmarks', () => {
    let d = studyReducer(emptyStudyData(), { type: 'toggleBookmark', target, label: 'C1', now });
    expect(d.bookmarks).toHaveLength(1);
    d = studyReducer(d, { type: 'toggleBookmark', target, label: 'C1', now });
    expect(d.bookmarks).toHaveLength(0);
  });

  it('removes a user card and its schedule together', () => {
    let d = studyReducer(emptyStudyData(), { type: 'addUserCard', front: 'F', back: 'B', target: null, tags: [], now });
    const id = d.userCards[0].id;
    d = studyReducer(d, { type: 'reviewCard', cardId: id, rating: 'good', now });
    d = studyReducer(d, { type: 'deleteUserCard', id });
    expect(d.userCards).toHaveLength(0);
    expect(d.cardSchedules[id]).toBeUndefined();
  });
});

describe('persistence', () => {
  it('round-trips through localStorage (reload keeps progress)', async () => {
    const repo = new LocalStorageStudyRepository(window.localStorage, 'test-key');
    let d = studyReducer(emptyStudyData(), { type: 'saveNote', target: { kind: 'structure', id: 'heart' }, text: 'n', now: T0.toISOString() });
    d = studyReducer(d, { type: 'recordAttempt', attempt: attempt('q1', true, T0.toISOString()) });
    d = studyReducer(d, { type: 'setLevel', level: 'medical' });
    await repo.save(d);
    const fresh = new LocalStorageStudyRepository(window.localStorage, 'test-key');
    expect(await fresh.load()).toEqual(d);
  });

  it('keeps an unreadable copy instead of silently discarding corrupt data', async () => {
    window.localStorage.setItem('bad-key', '{not json');
    const repo = new LocalStorageStudyRepository(window.localStorage, 'bad-key');
    await expect(repo.load()).rejects.toBeInstanceOf(StudyDataError);
    const kept = Object.keys(window.localStorage).filter((k) => k.startsWith('bad-key:unreadable:'));
    expect(kept).toHaveLength(1);
  });

  it('exports and imports with a format tag and schema version', () => {
    const d = studyReducer(emptyStudyData(), { type: 'addUserCard', front: 'F', back: 'B', target: null, tags: ['x'], now: T0.toISOString() });
    const text = serializeForExport(d, T0);
    expect(JSON.parse(text).schemaVersion).toBe(SCHEMA_VERSION);
    expect(parseImport(text)).toEqual(d);
  });

  it('rejects files from other apps, newer schemas, and bad JSON', () => {
    expect(() => parseImport('{"hello":1}')).toThrow(StudyDataError);
    expect(() => parseImport('nope')).toThrow(/not valid JSON/);
    expect(() =>
      parseImport(JSON.stringify({ format: 'body-systems-explorer/study-data', schemaVersion: 99 })),
    ).toThrow(/schema version 99/);
  });

  it('fills missing collections and drops unsafe imported links', () => {
    const d = parseStudyData({
      schemaVersion: 1,
      userResources: [
        { id: 'a', url: 'javascript:alert(1)', target: { kind: 'concept', id: 'c' } },
        { id: 'b', url: 'https://openstax.org', target: { kind: 'concept', id: 'c' } },
      ],
    });
    expect(d.notes).toEqual([]);
    expect(d.userResources.map((r) => r.id)).toEqual(['b']);
    expect(isSafeUrl('ftp://x')).toBe(false);
  });
});

describe('Anki CSV export', () => {
  it('quotes fields and doubles internal quotes', () => {
    expect(csvField('say "hi", ok')).toBe('"say ""hi"", ok"');
  });

  it('writes Anki headers, CRLF rows, and space-separated tags', () => {
    const csv = toAnkiCsv([{ front: 'What is P50?', back: 'PO2 at 50%\nsaturation', tags: ['oxygen transport'] }]);
    const lines = csv.split('\r\n');
    expect(lines.slice(0, 4)).toEqual(ANKI_HEADER);
    expect(lines[4]).toBe('"What is P50?","PO2 at 50%\nsaturation","body-systems-explorer oxygen_transport"');
    expect(csv.endsWith('\r\n')).toBe(true);
  });
});
