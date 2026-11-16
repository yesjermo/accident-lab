import { useId, type KeyboardEvent } from 'react';
import type { DiagramId } from '../domain/types';
import { DIAGRAMS } from '../diagrams/defs';

export interface DiagramProps {
  diagram: DiagramId;
  selectedId?: string | null;
  highlight?: string[];
  onSelect?: (structureId: string) => void;
  /** Labeling mode: hide text labels and show numbered markers instead. */
  markers?: { structureId: string; marker: number; state?: 'correct' | 'incorrect' | 'filled' | 'active' }[];
  onMarker?: (structureId: string) => void;
  showLabels?: boolean;
  caption?: string;
}

/**
 * Interactive, accessible SVG diagram. Each structure is a focusable button
 * (Tab to move, Enter/Space to select). Highlight and selection are shown by
 * outline weight, a dashed halo and bold labels, not only by colour. A text
 * list of the same structures follows the drawing.
 */
export function Diagram({ diagram, selectedId, highlight = [], onSelect, markers, onMarker, showLabels = true, caption }: DiagramProps) {
  const def = DIAGRAMS[diagram];
  const uid = useId().replace(/:/g, '');
  const labelling = !!markers;
  const [w, h] = def.viewBox;

  const keyActivate = (e: KeyboardEvent, fn: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  return (
    <figure className={`diagram diagram-${diagram}`}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="group"
        aria-labelledby={`${uid}-t`}
        aria-describedby={`${uid}-d`}
        className="diagram-svg"
      >
        <title id={`${uid}-t`}>{def.title}</title>
        <desc id={`${uid}-d`}>{def.description}</desc>
        <g className="bg">{def.background}</g>
        {def.regions.map((r) => {
          const isSel = r.id === selectedId;
          const isHi = highlight.includes(r.id);
          const marker = markers?.find((m) => m.structureId === r.id);
          if (labelling && !marker) {
            return (
              <g key={r.id} className="region region-static" aria-hidden="true">
                {r.shape}
              </g>
            );
          }
          const interactive = labelling ? !!onMarker : !!onSelect;
          const activate = () => (labelling ? onMarker?.(r.id) : onSelect?.(r.id));
          const name = labelling ? `Marker ${marker!.marker}` : r.label;
          return (
            <g
              key={r.id}
              className={`region${isSel ? ' is-selected' : ''}${isHi ? ' is-highlighted' : ''}${interactive ? ' is-interactive' : ''}`}
              data-structure={r.id}
              {...(interactive
                ? {
                    role: 'button',
                    tabIndex: 0,
                    'aria-label': `${name}${isHi ? ' (highlighted in this step)' : ''}`,
                    'aria-pressed': labelling ? marker?.state === 'active' : isSel,
                    onClick: activate,
                    onKeyDown: (e: KeyboardEvent) => keyActivate(e, activate),
                  }
                : {})}
            >
              <g className="shape">{r.shape}</g>
              {!labelling && showLabels && (
                <g className="label" aria-hidden="true">
                  <line className="leader" x1={r.anchor[0]} y1={r.anchor[1]} x2={r.labelAt[0] + (r.labelAnchor === 'start' ? -2 : r.labelAnchor === 'end' ? 2 : 0)} y2={r.labelAt[1] - 4} />
                  <circle className="anchor-dot" cx={r.anchor[0]} cy={r.anchor[1]} r={2.5} />
                  <text x={r.labelAt[0]} y={r.labelAt[1]} textAnchor={r.labelAnchor ?? 'start'}>
                    {isHi || isSel ? '▸ ' : ''}
                    {r.label}
                  </text>
                </g>
              )}
              {marker && (
                <g className={`marker marker-${marker.state ?? 'empty'}`} aria-hidden="true">
                  <circle cx={r.anchor[0]} cy={r.anchor[1]} r={11} />
                  <text x={r.anchor[0]} y={r.anchor[1] + 4} textAnchor="middle">
                    {marker.marker}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        <g className="fg">{def.foreground}</g>
      </svg>
      <figcaption>
        {caption && <p className="diagram-caption">{caption}</p>}
        <ul className="legend" aria-label="Legend">
          {def.legend.map((l) => (
            <li key={l.text}>
              <svg width="18" height="12" aria-hidden="true">
                <rect width="18" height="12" className={`swatch swatch-${l.swatch}`} />
              </svg>
              {l.text}
            </li>
          ))}
          {def.orientation && <li className="legend-note">{def.orientation}</li>}
          <li className="legend-note">Schematic, not to scale.</li>
        </ul>
      </figcaption>
    </figure>
  );
}

/** Text alternative: the same structures as a list of buttons. */
export function StructureList({
  diagram,
  selectedId,
  highlight = [],
  onSelect,
}: Pick<DiagramProps, 'diagram' | 'selectedId' | 'highlight' | 'onSelect'>) {
  const def = DIAGRAMS[diagram];
  return (
    <div className="structure-list">
      <h3 className="eyebrow">Structures in this diagram</h3>
      <ul>
        {def.regions.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className={`chip${r.id === selectedId ? ' is-selected' : ''}${highlight.includes(r.id) ? ' is-highlighted' : ''}`}
              aria-pressed={r.id === selectedId}
              onClick={() => onSelect?.(r.id)}
            >
              {highlight.includes(r.id) && <span aria-hidden="true">▸ </span>}
              {r.label}
              {highlight.includes(r.id) && <span className="visually-hidden"> (highlighted)</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
