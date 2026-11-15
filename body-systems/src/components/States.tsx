import type { ReactNode } from 'react';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="state state-loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorState({ title, detail, onRetry }: { title: string; detail?: string; onRetry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <h2>{title}</h2>
      {detail && <p>{detail}</p>}
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state state-empty">
      <p className="state-title">{title}</p>
      {children && <div className="state-body">{children}</div>}
    </div>
  );
}

/** For content that exists in the navigation but is not available in this release. */
export function UnavailableState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state state-unavailable">
      <p className="tag tag-planned">Planned</p>
      <h2>{title}</h2>
      <div className="state-body">{children ?? <p>This part is not built yet. Nothing here is hidden behind a login or a paywall.</p>}</div>
    </div>
  );
}
