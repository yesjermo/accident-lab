import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { emptyStudyData, type StudyData } from '../study/model';
import { LocalStorageStudyRepository, MemoryStudyRepository, type StudyRepository } from '../study/persistence';
import { studyReducer, type StudyAction } from '../study/reducer';
import { LoadingState } from '../components/States';

type Status = 'loading' | 'ready' | 'memory-only' | 'load-failed';

/** Present when saved data could not be read. Saving is paused until the user chooses. */
export interface Recovery {
  message: string;
  /** The unreadable stored text, offered as a download. */
  raw: string | null;
  /** Start with empty data and resume saving (this replaces the unreadable data). */
  startFresh: () => void;
}

interface StudyValue {
  data: StudyData;
  dispatch: (a: StudyAction) => void;
  status: Status;
  statusMessage: string | null;
  saveError: string | null;
  recovery: Recovery | null;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<StudyValue | null>(null);

function defaultRepository(): StudyRepository {
  try {
    const k = '__bse_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return new LocalStorageStudyRepository();
  } catch {
    return new MemoryStudyRepository();
  }
}

type Internal = { data: StudyData; loaded: boolean; /** false when the change came from storage and must not be re-saved */ dirty: boolean };
type InternalAction = StudyAction | { type: '__loaded'; data: StudyData; dirty?: boolean };

function internalReducer(s: Internal, a: InternalAction): Internal {
  if (a.type === '__loaded') return { data: a.data, loaded: true, dirty: a.dirty ?? false };
  return { ...s, data: studyReducer(s.data, a), dirty: true };
}

export function StudyProvider({ children, repository }: { children: ReactNode; repository?: StudyRepository }) {
  const repoRef = useRef<StudyRepository>(repository ?? defaultRepository());
  const [state, dispatchInternal] = useReducer(internalReducer, { data: emptyStudyData(), loaded: false, dirty: false });
  const [status, setStatus] = useState<Status>('loading');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  // While saved data is unreadable, never write over it.
  const savingBlocked = recovery !== null;

  useEffect(() => {
    let live = true;
    const repo = repoRef.current;
    repo
      .load()
      .then((data) => {
        if (!live) return;
        dispatchInternal({ type: '__loaded', data });
        if (repo instanceof MemoryStudyRepository && !repository) {
          setStatus('memory-only');
          setStatusMessage('This browser is blocking local storage, so progress will be lost when you close the tab. Use Export to keep a copy.');
        } else setStatus('ready');
      })
      .catch((err: Error) => {
        if (!live) return;
        dispatchInternal({ type: '__loaded', data: emptyStudyData() });
        setStatus('load-failed');
        setRecovery({
          message: `Your saved study data could not be read (${err.message}). Nothing has been changed or deleted. Changes you make now are not saved until you choose what to do.`,
          raw: repo.readRaw?.() ?? null,
          startFresh: () => {
            setRecovery(null);
            setStatus('ready');
            dispatchInternal({ type: '__loaded', data: emptyStudyData(), dirty: true });
          },
        });
      });
    return () => {
      live = false;
    };
  }, [repository]);

  // Another tab saved: adopt its data so this tab doesn't overwrite it with an older copy.
  useEffect(() => {
    if (!state.loaded || savingBlocked) return;
    return repoRef.current.subscribe?.((data) => dispatchInternal({ type: '__loaded', data, dirty: false }));
  }, [state.loaded, savingBlocked]);

  useEffect(() => {
    if (!state.loaded || !state.dirty || savingBlocked) return;
    repoRef.current
      .save(state.data)
      .then(() => setSaveError(null))
      .catch((e: Error) => setSaveError(`Could not save: ${e.message}. Export your data to keep a copy.`));
  }, [state.data, state.loaded, state.dirty, savingBlocked]);

  const dispatch = useCallback((a: StudyAction) => dispatchInternal(a), []);
  const resetAll = useCallback(async () => {
    await repoRef.current.clear();
    setRecovery(null);
    dispatchInternal({ type: '__loaded', data: emptyStudyData() });
  }, []);

  if (!state.loaded) return <LoadingState label="Loading your study data" />;
  return (
    <Ctx.Provider value={{ data: state.data, dispatch, status, statusMessage, saveError, recovery, resetAll }}>{children}</Ctx.Provider>
  );
}

export function useStudy(): StudyValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStudy must be used inside StudyProvider');
  return v;
}

export const nowIso = () => new Date().toISOString();
