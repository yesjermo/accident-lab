import type { Provenance as P } from '../domain/types';
import { useContent } from '../data/content';

const STATUS: Record<P['reviewStatus'], { label: string; cls: string; help: string }> = {
  draft: {
    label: 'Draft: not fully verified',
    cls: 'tag-draft',
    help: 'Some claims here have not been confirmed against an accessible source yet. Check the notes and cited sources.',
  },
  'source-checked': {
    label: 'Source-checked',
    cls: 'tag-checked',
    help: 'Each claim was checked against the cited sources by the author. No subject-expert review has taken place.',
  },
  'expert-reviewed': { label: 'Expert-reviewed', cls: 'tag-checked', help: 'Reviewed by a named subject expert.' },
};

/** Compact, expandable provenance record for any content item. */
export function ProvenanceNote({ provenance, compact = false }: { provenance: P; compact?: boolean }) {
  const { ix } = useContent();
  const s = STATUS[provenance.reviewStatus];
  return (
    <details className={`provenance${compact ? ' is-compact' : ''}`}>
      <summary>
        <span className={`tag ${s.cls}`}>{s.label}</span>
        <span className="provenance-meta">
          v{provenance.version}
          {provenance.lastVerified ? ` · checked ${provenance.lastVerified}` : ' · not yet verified'}
          {' · '}
          {provenance.sources.length} source{provenance.sources.length === 1 ? '' : 's'}
        </span>
      </summary>
      <div className="provenance-body">
        <p className="muted">{s.help}</p>
        {provenance.notes && <p className="provenance-notes">{provenance.notes}</p>}
        <ul>
          {provenance.sources.map((r, i) => {
            const src = ix.sources.get(r.sourceId);
            return (
              <li key={i}>
                <a href={r.url ?? src?.url} target="_blank" rel="noreferrer">
                  {src?.title ?? r.sourceId}
                </a>
                {' — '}
                <span>{r.section}</span>
                {src?.license && <span className="muted"> · {src.license}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
