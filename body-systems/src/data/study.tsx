import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { emptyStudyData, type StudyData } from '../study/model';
import { LocalStorageStudyRepository, MemoryStudyRepository, type StudyRepository } from '../study/persistence';
import { studyReducer, type StudyAction } from '../study/reducer';
import { LoadingState } from '../components/States';

type Status = 'loading' | 'ready' | 'memory-only' | 'recovered';

interface StudyValue {
  data: StudyData;
  dispatch: (a: StudyAction) => void;
  status: Status;
  statusMessage: string | null;
  saveError: string | null;
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

type Internal = { data: StudyData; loaded: boolean };

function internalReducer(s: Internal, a: StudyAction | { type: '__loaded'; data: StudyData }): Internal {
  if (a.type === '__loaded') return { data: a.data, loaded: true };
  return { ...s, data: studyReducer(s.data, a) };
}

export function StudyProvider({ children, repository }: { children: ReactNode; repository?: StudyRepository }) {
  const repoRef = useRef<StudyRepository>(repository ?? defaultRepository());
  const [state, dispatchInternal] = useReducer(internalReducer, { data: emptyStudyData(), loaded: false });
  const [status, setStatus] = useState<Status>('loading');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const repo = repoRef.current;
    repo
      .load()
      .then((data) => {
        dispatchInternal({ type: '__loaded', data });
        if (repo instanceof MemoryStudyRepository && !repository) {
          setStatus('memory-only');
          setStatusMessage('This browser is blocking local storage, so progress will be lost when you close the tab. Use Export to keep a copy.');
        } else setStatus('ready');
      })
      .catch((err: Error) => {
        dispatchInternal({ type: '__loaded', data: emptyStudyData() });
        setStatus('recovered');
        setStatusMessage(`${err.message} A copy of the unreadable data was kept in this browser; starting fresh.`);
      });
  }, [repository]);

  useEffect(() => {
    if (!state.loaded) return;
    repoRef.current
      .save(state.data)
      .then(() => setSaveError(null))
      .catch((e: Error) => setSaveError(`Could not save: ${e.message}. Export your data to keep a copy.`));
  }, [state.data, state.loaded]);

  const dispatch = useCallback((a: StudyAction) => dispatchInternal(a), []);
  const resetAll = useCallback(async () => {
    await repoRef.current.clear();
    dispatchInternal({ type: '__loaded', data: emptyStudyData() });
  }, []);

  if (!state.loaded) return <LoadingState label="Loading your study data" />;
  return (
    <Ctx.Provider value={{ data: state.data, dispatch, status, statusMessage, saveError, resetAll }}>{children}</Ctx.Provider>
  );
}

export function useStudy(): StudyValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStudy must be used inside StudyProvider');
  return v;
}

export const nowIso = () => new Date().toISOString();
