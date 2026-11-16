/**
 * Persistence and versioned (de)serialisation of study data.
 *
 * `StudyRepository` is the seam for a future backend: today it is backed by
 * localStorage; later an HTTP implementation can talk to FastAPI without the
 * UI changing.
 */
import { SCHEMA_VERSION, emptyStudyData, type StudyData } from './model';

export interface StudyRepository {
  load(): Promise<StudyData>;
  save(data: StudyData): Promise<void>;
  clear(): Promise<void>;
  /** The stored text as-is, for recovery when it cannot be parsed. */
  readRaw?(): string | null;
  /** Notify when another tab or window changes the stored data. Returns an unsubscribe function. */
  subscribe?(onChange: (data: StudyData) => void): () => void;
}

export const STORAGE_KEY = 'body-systems-explorer:study';
export const EXPORT_FORMAT = 'body-systems-explorer/study-data';

export class StudyDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StudyDataError';
  }
}

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migrations from version N to N+1, keyed by N. Version 1 is the first
 * release, so there are none yet; add `1: (v1) => v2` when the schema changes.
 */
const MIGRATIONS: Record<number, Migration> = {};

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const rec = <T>(v: unknown): Record<string, T> => (isObj(v) ? (v as Record<string, T>) : {});
const str = (v: unknown): v is string => typeof v === 'string';
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const strArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(str);
const isTarget = (v: unknown) => isObj(v) && str(v.kind) && str(v.id);
const isDirection = (v: unknown) => v === 'left' || v === 'right' || v === 'none';
/** Keep only the record entries whose value passes `ok`. */
const recOf = <T>(v: unknown, ok: (x: Record<string, unknown>) => boolean): Record<string, T> =>
  Object.fromEntries(Object.entries(rec<unknown>(v)).filter(([, x]) => isObj(x) && ok(x))) as Record<string, T>;

/**
 * Turn any stored or imported JSON into valid current-version study data.
 * Unknown fields are dropped; missing collections become empty. Throws
 * StudyDataError for data that is not study data or is from a newer app.
 */
export function parseStudyData(input: unknown): StudyData {
  if (!isObj(input)) throw new StudyDataError('Study data must be a JSON object.');
  let raw = input;
  let version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new StudyDataError('Missing or invalid schemaVersion.');
  }
  if (version > SCHEMA_VERSION) {
    throw new StudyDataError(
      `This file uses schema version ${version}, but this app reads up to version ${SCHEMA_VERSION}. Update the app first.`,
    );
  }
  while (version < SCHEMA_VERSION) {
    const m = MIGRATIONS[version];
    if (!m) throw new StudyDataError(`No migration from schema version ${version}.`);
    raw = m(raw);
    version += 1;
  }

  const base = emptyStudyData();
  const settings = rec<unknown>(raw.settings);
  const level = settings.level === 'medical' ? 'medical' : 'foundation';

  const data: StudyData = {
    ...base,
    ownerId: typeof raw.ownerId === 'string' ? raw.ownerId : base.ownerId,
    settings: { level },
    lessons: recOf(
      raw.lessons,
      (l) => strArr(l.completedStepIds) && (l.lastStepId === null || str(l.lastStepId)) && (l.completedAt === null || str(l.completedAt)),
    ),
    attempts: arr<StudyData['attempts'][number]>(raw.attempts).filter(
      (a) => isObj(a) && str(a.questionId) && str(a.choiceId) && typeof a.correct === 'boolean' && str(a.at),
    ),
    labeling: arr<StudyData['labeling'][number]>(raw.labeling).filter(
      (l) => isObj(l) && str(l.exerciseId) && num(l.correct) && num(l.total) && strArr(l.missedStructureIds) && str(l.at),
    ),
    predictions: arr<StudyData['predictions'][number]>(raw.predictions).filter(
      (p) =>
        isObj(p) && isDirection(p.predicted) && isDirection(p.actual) && isObj(p.conditions) && num(p.conditions.pH) && num(p.conditions.temperatureC),
    ),
    cardSchedules: recOf(
      raw.cardSchedules,
      (c) => num(c.box) && num(c.reviews) && num(c.lapses) && (c.dueAt === null || str(c.dueAt)) && (c.lastReviewedAt === null || str(c.lastReviewedAt)),
    ),
    userCards: arr<StudyData['userCards'][number]>(raw.userCards)
      .filter((c) => isObj(c) && str(c.id) && str(c.front) && str(c.back))
      .map((c) => ({ ...c, tags: strArr(c.tags) ? c.tags : [], target: isTarget(c.target) ? c.target : null })),
    notes: arr<StudyData['notes'][number]>(raw.notes).filter((n) => isObj(n) && str(n.id) && str(n.text) && isTarget(n.target)),
    bookmarks: arr<StudyData['bookmarks'][number]>(raw.bookmarks)
      .filter((b) => isObj(b) && str(b.id) && isTarget(b.target))
      .map((b) => ({ ...b, label: str(b.label) ? b.label : b.target.id })),
    userResources: arr<StudyData['userResources'][number]>(raw.userResources)
      .filter((r) => isObj(r) && str(r.id) && str(r.url) && isSafeUrl(r.url) && isTarget(r.target))
      .map((r) => ({ ...r, title: str(r.title) ? r.title : r.url, note: str(r.note) ? r.note : '' })),
  };
  return data;
}

/** Only http(s) links may be attached or imported (no javascript: URLs). */
export function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function serializeForExport(data: StudyData, now = new Date()): string {
  return JSON.stringify(
    { format: EXPORT_FORMAT, exportedAt: now.toISOString(), ...data },
    null,
    2,
  );
}

export function parseImport(text: string): StudyData {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new StudyDataError('That file is not valid JSON.');
  }
  if (!isObj(json) || json.format !== EXPORT_FORMAT) {
    throw new StudyDataError('That file is not a Body Systems Explorer study-data export.');
  }
  return parseStudyData(json);
}

export class LocalStorageStudyRepository implements StudyRepository {
  constructor(
    private storage: Storage = window.localStorage,
    private key = STORAGE_KEY,
  ) {}

  async load(): Promise<StudyData> {
    const text = this.storage.getItem(this.key);
    if (!text) return emptyStudyData();
    try {
      return parseStudyData(JSON.parse(text));
    } catch (err) {
      // Try to keep a side copy too, but never let a full quota hide the real error.
      // The original key is left untouched; the provider stops saving until the user decides.
      try {
        this.storage.setItem(`${this.key}:unreadable:${Date.now()}`, text);
      } catch {
        /* quota exceeded: the original key still holds the data */
      }
      throw err instanceof StudyDataError ? err : new StudyDataError('Saved study data is corrupted.');
    }
  }

  readRaw(): string | null {
    return this.storage.getItem(this.key);
  }

  subscribe(onChange: (data: StudyData) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key !== this.key || e.storageArea !== this.storage || !e.newValue) return;
      try {
        onChange(parseStudyData(JSON.parse(e.newValue)));
      } catch {
        /* another tab wrote something unreadable; ignore here, load() will report it */
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }

  async save(data: StudyData): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(data));
  }

  async clear(): Promise<void> {
    this.storage.removeItem(this.key);
  }
}

/** In-memory repository for tests and for browsers that block storage. */
export class MemoryStudyRepository implements StudyRepository {
  constructor(private data: StudyData = emptyStudyData()) {}
  async load() {
    return structuredClone(this.data);
  }
  async save(d: StudyData) {
    this.data = structuredClone(d);
  }
  async clear() {
    this.data = emptyStudyData();
  }
}
