import { useState, type CSSProperties } from 'react';
import { Body3D, webglAvailable } from '../components/Body3D';
import { BODY3D_ATTRIBUTION, BODY3D_PARTS } from '../content/body3d';
import { UnavailableState } from '../components/States';

/**
 * 3D whole-body view: the stage (model + controls + organ list). Loaded on
 * demand so three.js only downloads when a student opens it. Used by the
 * explorer and by lesson steps whose view is '3d'.
 */
export default function Body3DStage({
  selectedMesh,
  onSelect,
  highlight = [],
  showList = true,
  height,
}: {
  selectedMesh: string | null;
  onSelect: (mesh: string) => void;
  /** Meshes to emphasise (lesson steps). */
  highlight?: string[];
  showList?: boolean;
  height?: string;
}) {
  const [skin, setSkin] = useState(true);
  const [skeleton, setSkeleton] = useState(false);
  const [other, setOther] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [gl] = useState(webglAvailable);

  const core = BODY3D_PARTS.filter((p) => p.group === 'core');
  const rest = BODY3D_PARTS.filter((p) => p.group === 'other');

  const chip = (p: (typeof BODY3D_PARTS)[number]) => (
    <li key={p.mesh}>
      <button
        type="button"
        className={`chip${selectedMesh === p.mesh ? ' is-selected' : ''}${highlight.includes(p.mesh) ? ' is-highlighted' : ''}`}
        aria-pressed={selectedMesh === p.mesh}
        onClick={() => onSelect(p.mesh)}
      >
        {highlight.includes(p.mesh) && <span aria-hidden="true">▸ </span>}
        {p.label}
        {highlight.includes(p.mesh) && <span className="visually-hidden"> (highlighted in this step)</span>}
      </button>
    </li>
  );

  return (
    <div className="stage3d" style={height ? ({ '--body3d-height': height } as CSSProperties) : undefined}>
      {gl ? (
        <>
          <div className="row wrap toggles" role="group" aria-label="3D layers">
            <button type="button" className={`btn btn-quiet${skin ? ' is-on' : ''}`} aria-pressed={skin} onClick={() => setSkin((v) => !v)}>
              Skin
            </button>
            <button type="button" className={`btn btn-quiet${skeleton ? ' is-on' : ''}`} aria-pressed={skeleton} onClick={() => setSkeleton((v) => !v)}>
              Skeleton
            </button>
            <button type="button" className={`btn btn-quiet${other ? ' is-on' : ''}`} aria-pressed={other} onClick={() => setOther((v) => !v)}>
              Other organs
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setResetKey((k) => k + 1)}>
              Reset view
            </button>
          </div>
          <Body3D
            selected={selectedMesh}
            highlight={highlight}
            onSelect={onSelect}
            showSkin={skin}
            showSkeleton={skeleton}
            showOther={other}
            resetKey={resetKey}
          />
          <p className="muted small">
            Drag to rotate, scroll or pinch to zoom, click an organ to open it. Clicks pass through the skin and skeleton (open those from
            the list). The selected organ glows and the camera moves to it.
          </p>
        </>
      ) : (
        <UnavailableState title="3D needs WebGL">
          <p>This browser or device can't show the 3D model. The organ list below and the 2D diagrams have the same content.</p>
        </UnavailableState>
      )}

      {showList && (
        <div className="structure-list">
          <h3 className="eyebrow">Heart, lungs and vessels (oxygen journey)</h3>
          <ul>{core.map(chip)}</ul>
          <h3 className="eyebrow">Other organs and layers</h3>
          <ul>{rest.map(chip)}</ul>
        </div>
      )}
      <p className="muted small attribution">3D model: {BODY3D_ATTRIBUTION}</p>
    </div>
  );
}
