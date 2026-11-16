import { useState } from 'react';
import { Body3D, webglAvailable } from '../components/Body3D';
import { BODY3D_ATTRIBUTION, BODY3D_PARTS } from '../content/body3d';
import { UnavailableState } from '../components/States';

/**
 * 3D whole-body view: the stage (model + controls + organ list). Loaded on
 * demand so three.js only downloads when a student opens it.
 */
export default function Body3DStage({ selectedMesh, onSelect }: { selectedMesh: string | null; onSelect: (mesh: string) => void }) {
  const [skin, setSkin] = useState(true);
  const [skeleton, setSkeleton] = useState(false);
  const [planned, setPlanned] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [gl] = useState(webglAvailable);

  const organs = BODY3D_PARTS.filter((p) => p.layer === 'organ');
  const covered = organs.filter((p) => !p.planned);
  const context = organs.filter((p) => p.planned);

  return (
    <div className="stage3d">
      {gl ? (
        <>
          <div className="row wrap toggles" role="group" aria-label="3D layers">
            <button type="button" className={`btn btn-quiet${skin ? ' is-on' : ''}`} aria-pressed={skin} onClick={() => setSkin((v) => !v)}>
              Skin
            </button>
            <button type="button" className={`btn btn-quiet${skeleton ? ' is-on' : ''}`} aria-pressed={skeleton} onClick={() => setSkeleton((v) => !v)}>
              Skeleton
            </button>
            <button type="button" className={`btn btn-quiet${planned ? ' is-on' : ''}`} aria-pressed={planned} onClick={() => setPlanned((v) => !v)}>
              Other organs (planned)
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setResetKey((k) => k + 1)}>
              Reset view
            </button>
          </div>
          <Body3D selected={selectedMesh} onSelect={onSelect} showSkin={skin} showSkeleton={skeleton} showPlanned={planned} resetKey={resetKey} />
          <p className="muted small">
            Drag to rotate, scroll or pinch to zoom, click an organ to open it. Clicks pass through the skin and skeleton. The selected organ glows and the
            others fade.
          </p>
        </>
      ) : (
        <UnavailableState title="3D needs WebGL">
          <p>This browser or device can't show the 3D model. The organ list below and the 2D diagrams have the same content.</p>
        </UnavailableState>
      )}

      <div className="structure-list">
        <h3 className="eyebrow">Organs with lessons</h3>
        <ul>
          {covered.map((p) => (
            <li key={p.mesh}>
              <button type="button" className={`chip${selectedMesh === p.mesh ? ' is-selected' : ''}`} aria-pressed={selectedMesh === p.mesh} onClick={() => onSelect(p.mesh)}>
                {p.label}
              </button>
            </li>
          ))}
        </ul>
        <h3 className="eyebrow">Context organs (planned)</h3>
        <ul>
          {context.map((p) => (
            <li key={p.mesh}>
              <button type="button" className={`chip chip-planned${selectedMesh === p.mesh ? ' is-selected' : ''}`} aria-pressed={selectedMesh === p.mesh} onClick={() => onSelect(p.mesh)}>
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="muted small attribution">
        3D model: {BODY3D_ATTRIBUTION} Thigh muscle is not in this dataset; see the Tissue &amp; cell diagram.
      </p>
    </div>
  );
}
