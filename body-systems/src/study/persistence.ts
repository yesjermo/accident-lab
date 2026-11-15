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
    lessons: rec(raw.lessons),
    attempts: arr<StudyData['attempts'][number]>(raw.attempts).filter(
      (a) => isObj(a) && typeof a.questionId === 'string' && typeof a.correct === 'boolean',
    ),
    labeling: arr(raw.labeling),
    predictions: arr(raw.predictions),
    cardSchedules: rec(raw.cardSchedules),
    userCards: arr<StudyData['userCards'][number]>(raw.userCards).filter(
      (c) => isObj(c) && typeof c.front === 'string' && typeof c.back === 'string',
    ),
    notes: arr<StudyData['notes'][number]>(raw.notes).filter(
      (n) => isObj(n) && typeof n.text === 'string' && isObj(n.target),
    ),
    bookmarks: arr<StudyData['bookmarks'][number]>(raw.bookmarks).filter(
      (b) => isObj(b) && isObj(b.target),
    ),
    userResources: arr<StudyData['userResources'][number]>(raw.userResources).filter(
      (r) => isObj(r) && typeof r.url === 'string' && isSafeUrl(r.url),
    ),
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
      // Keep the unreadable copy so nothing is silently destroyed.
      this.storage.setItem(`${this.key}:unreadable:${Date.now()}`, text);
      throw err instanceof StudyDataError ? err : new StudyDataError('Saved study data is corrupted.');
    }
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
