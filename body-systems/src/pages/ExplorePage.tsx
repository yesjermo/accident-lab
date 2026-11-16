import { lazy, Suspense, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { DiagramId } from '../domain/types';
import { useContent } from '../data/content';
import { Diagram, StructureList } from '../components/Diagram';
import { DetailPanel, TABS, type PanelTab } from '../components/DetailPanel';
import { BackLink } from '../components/Explain';
import { EmptyState, LoadingState, UnavailableState } from '../components/States';
import { BODY3D_PARTS, partByMesh } from '../content/body3d';

const Body3DStage = lazy(() => import('./Body3DStage'));
import { DIAGRAMS } from '../diagrams/defs';
import { DIAGRAM_REGIONS } from '../diagrams/regions';

type View = DiagramId | '3d';
const ORDER: View[] = ['3d', 'body', 'lung', 'heart', 'tissue'];
const SHORT: Record<View, string> = { '3d': '3D body', body: 'Body', lung: 'Alveolus', heart: 'Heart', tissue: 'Tissue & cell' };
const IN_3D = new Set(BODY3D_PARTS.flatMap((p) => (p.structureId ? [p.structureId] : [])));
/** Can this view show the given structure (or 3D mesh) id? */
const shows = (v: View, id: string) => (v === '3d' ? IN_3D.has(id) || !!partByMesh(id) : DIAGRAM_REGIONS[v].includes(id));

/**
 * Central workspace: a diagram plus the explanation panel. Diagram, selected
 * structure and tab live in the URL, so reloads, the back button and links
 * from elsewhere all restore the same view.
 */
export function ExplorePage() {
  const { diagram = 'body', structureId } = useParams();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const { ix } = useContent();
  const d = (ORDER.includes(diagram as View) ? diagram : 'body') as View;
  const tab = (TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'anatomy') as PanelTab;
  const structure = structureId ? ix.structures.get(structureId) : undefined;
  const plannedMesh = structureId && !structure ? partByMesh(structureId) : undefined;

  // When the layout is stacked (tablet portrait, phone), bring the panel into view on selection.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!structureId || !window.matchMedia?.('(max-width: 920px)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('panel-title')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [structureId]);

  const go = (dg: View, sid?: string, t: PanelTab = tab) =>
    nav(`/explore/${dg}${sid ? `/${sid}` : ''}${t !== 'anatomy' ? `?tab=${t}` : ''}`);

  const select = (sid: string) => {
    // Stay on this diagram if the structure is drawn here; otherwise move to the one that draws it.
    const s = ix.structures.get(sid);
    const dg: View = shows(d, sid) ? d : (s?.diagram ?? (d === '3d' ? 'body' : d));
    go(dg, sid);
  };

  return (
    <div className="workspace">
      <section className="stage" aria-labelledby="stage-title">
        <BackLink />
        <div className="stage-head">
          <h1 id="stage-title">{d === '3d' ? '3D body: organs in place' : DIAGRAMS[d].title}</h1>
          <div className="segmented" role="group" aria-label="Choose a diagram (scale)">
            {ORDER.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === d}
                className={id === d ? 'is-on' : ''}
                onClick={() => go(id, structureId && shows(id, structureId) && !(id !== '3d' && plannedMesh) ? structureId : undefined)}
              >
                {SHORT[id]}
              </button>
            ))}
          </div>
        </div>
        <p className="muted small scale-path" aria-label="Scale">
          Body system → organ → tissue → cell → molecule. Select a structure in the drawing or the list.
        </p>
        {d === '3d' ? (
          <Suspense fallback={<LoadingState label="Loading the 3D viewer" />}>
            <Body3DStage
              selectedMesh={structureId ? (partByMesh(structureId)?.mesh ?? BODY3D_PARTS.find((p) => p.structureId === structureId)?.mesh ?? null) : null}
              onSelect={(mesh) => {
                const part = partByMesh(mesh);
                go('3d', part?.structureId ?? mesh);
              }}
            />
          </Suspense>
        ) : (
          <>
            <Diagram diagram={d} selectedId={structureId} onSelect={select} highlight={structureId ? [structureId] : []} />
            <StructureList diagram={d} selectedId={structureId} onSelect={select} />
          </>
        )}
      </section>
      <aside className="side" aria-label="Explanation">
        {plannedMesh ? (
          <UnavailableState title={plannedMesh.label}>
            <p>
              Shown in 3D for orientation. Lessons for this part aren't written yet; it isn't hidden or paywalled. This release covers the heart,
              lungs and great vessels.
            </p>
          </UnavailableState>
        ) : structureId && !structure ? (
          <EmptyState title="That structure isn't in this release.">
            <p>It may have been renamed. Pick one from the diagram.</p>
          </EmptyState>
        ) : structure ? (
          <DetailPanel
            structure={structure}
            tab={tab}
            onTab={(t) => setParams(t === 'anatomy' ? {} : { tab: t }, { replace: true })}
            onSelectStructure={select}
            onZoom={(z) => z && go(z)}
          />
        ) : (
          <EmptyState title="Select a structure">
            <p>
              Choose the heart, the lungs or any labelled part to see its anatomy, physiology, biology, chemistry and clinical
              connections.
            </p>
          </EmptyState>
        )}
      </aside>
    </div>
  );
}
