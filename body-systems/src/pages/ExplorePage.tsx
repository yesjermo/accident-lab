import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { DiagramId } from '../domain/types';
import { useContent } from '../data/content';
import { Diagram, StructureList } from '../components/Diagram';
import { DetailPanel, TABS, type PanelTab } from '../components/DetailPanel';
import { BackLink } from '../components/Explain';
import { EmptyState } from '../components/States';
import { DIAGRAMS } from '../diagrams/defs';
import { DIAGRAM_REGIONS } from '../diagrams/regions';

const ORDER: DiagramId[] = ['body', 'lung', 'heart', 'tissue'];
const SHORT: Record<DiagramId, string> = { body: 'Body', lung: 'Alveolus', heart: 'Heart', tissue: 'Tissue & cell' };

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
  const d = (ORDER.includes(diagram as DiagramId) ? diagram : 'body') as DiagramId;
  const tab = (TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'anatomy') as PanelTab;
  const structure = structureId ? ix.structures.get(structureId) : undefined;

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

  const go = (dg: DiagramId, sid?: string, t: PanelTab = tab) =>
    nav(`/explore/${dg}${sid ? `/${sid}` : ''}${t !== 'anatomy' ? `?tab=${t}` : ''}`);

  const select = (sid: string) => {
    // Stay on this diagram if the structure is drawn here; otherwise move to the one that draws it.
    const s = ix.structures.get(sid);
    const dg = DIAGRAM_REGIONS[d].includes(sid) ? d : (s?.diagram ?? d);
    go(dg, sid);
  };

  return (
    <div className="workspace">
      <section className="stage" aria-labelledby="stage-title">
        <BackLink />
        <div className="stage-head">
          <h1 id="stage-title">{DIAGRAMS[d].title}</h1>
          <div className="segmented" role="group" aria-label="Choose a diagram (scale)">
            {ORDER.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === d}
                className={id === d ? 'is-on' : ''}
                onClick={() => go(id, structureId && DIAGRAM_REGIONS[id].includes(structureId) ? structureId : undefined)}
              >
                {SHORT[id]}
              </button>
            ))}
          </div>
        </div>
        <p className="muted small scale-path" aria-label="Scale">
          Body system → organ → tissue → cell → molecule. Select a structure in the drawing or the list.
        </p>
        <Diagram diagram={d} selectedId={structureId} onSelect={select} highlight={structureId ? [structureId] : []} />
        <StructureList diagram={d} selectedId={structureId} onSelect={select} />
      </section>
      <aside className="side" aria-label="Explanation">
        {structureId && !structure ? (
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
