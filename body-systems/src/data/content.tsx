import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { indexBundle, StaticContentRepository, type ContentBundle, type ContentIndex, type ContentRepository } from '../content/repository';
import { ErrorState, LoadingState } from '../components/States';

interface ContentValue {
  bundle: ContentBundle;
  ix: ContentIndex;
}

const Ctx = createContext<ContentValue | null>(null);

export function ContentProvider({
  children,
  repository = new StaticContentRepository(),
}: {
  children: ReactNode;
  repository?: ContentRepository;
}) {
  const [state, setState] = useState<{ bundle?: ContentBundle; error?: Error }>({});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setState({});
    repository
      .loadBundle()
      .then((bundle) => live && setState({ bundle }))
      .catch((error: Error) => live && setState({ error }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const value = useMemo(() => (state.bundle ? { bundle: state.bundle, ix: indexBundle(state.bundle) } : null), [state.bundle]);

  if (state.error) {
    return (
      <ErrorState title="Content could not be loaded" detail={state.error.message} onRetry={() => setAttempt((a) => a + 1)} />
    );
  }
  if (!value) return <LoadingState label="Loading content" />;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContent(): ContentValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useContent must be used inside ContentProvider');
  return v;
}
