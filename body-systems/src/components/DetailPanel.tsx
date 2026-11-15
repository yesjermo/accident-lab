import { useRef, type KeyboardEvent } from 'react';
import type { Lens, Structure } from '../domain/types';
import { useContent } from '../data/content';
import { useStudy } from '../data/study';
import { ContextLink } from './Explain';
import { ProvenanceNote } from './Provenance';
import { hasText, LeveledText } from './Rich';
import { AttachResource, BookmarkButton, CuratedResources, NoteEditor, QuickCardForm } from './StudyTools';
import { QuestionCard } from './QuestionCard';
import { FlipCard } from './FlipCard';
import { DIAGRAMS } from '../diagrams/defs';

export type PanelTab = Lens | 'study';
export const TABS: { id: PanelTab; label: string }[] = [
  { id: 'anatomy', label: 'Anatomy' },
  { id: 'physiology', label: 'Physiology' },
  { id: 'biology', label: 'Biology' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'clinical', label: 'Clinical' },
  { id: 'study', label: 'Study' },
];

const LENS_INTRO: Record<Lens, string> = {
  anatomy: 'Location, structure and relationships',
  physiology: 'Normal function and regulation',
  biology: 'Cells, tissues and cellular processes',
  chemistry: 'Molecules, reactions, gradients and equilibria',
  clinical: 'Educational examples only: not diagnosis or treatment advice',
};

/**
 * The contextual explanation panel. The selected structure stays highlighted
 * in the diagram while the student switches tabs; the active tab is kept when
 * another structure is selected.
 */
export function DetailPanel({
  structure,
  tab,
  onTab,
  onSelectStructure,
  onZoom,
}: {
  structure: Structure;
  tab: PanelTab;
  onTab: (t: PanelTab) => void;
  onSelectStructure: (id: string) => void;
  onZoom?: (diagram: Structure['zoomTo']) => void;
}) {
  const { ix, bundle } = useContent();
  const { data } = useStudy();
  const level = data.settings.level;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = TABS.length;
    let j: number | null = null;
    if (e.key === 'ArrowRight') j = (i + 1) % n;
    if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = n - 1;
    if (j !== null) {
      e.preventDefault();
      onTab(TABS[j].id);
      tabRefs.current[j]?.focus();
    }
  };

  const target = { kind: 'structure' as const, id: structure.id };
  const fromLabel = structure.name;

  return (
    <section className="panel" aria-labelledby="panel-title">
      <header className="panel-head">
        <p className="eyebrow">
          {structure.scale} · {structure.systemIds.map((s) => bundle.systems.find((x) => x.id === s)?.name).join(', ')}
        </p>
        <h2 id="panel-title">{structure.name}</h2>
        <p className="lede">{structure.oneLine}</p>
        <div className="row wrap">
          <BookmarkButton target={target} label={structure.name} />
          {structure.zoomTo && onZoom && (
            <button type="button" className="btn btn-quiet" onClick={() => onZoom(structure.zoomTo)}>
              Zoom in: {DIAGRAMS[structure.zoomTo].title.split(':')[0]} <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </header>

      <div role="tablist" aria-label={`${structure.name} explanations`} className="tabs">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => (tabRefs.current[i] = el)}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`tabpanel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className="tab"
            onClick={() => onTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`} className="tabpanel" tabIndex={0}>
        {tab !== 'study' ? (
          <>
            <p className="eyebrow">{LENS_INTRO[tab]}</p>
            {hasText(structure.lenses[tab].body, level) ? (
              <LeveledText text={structure.lenses[tab].body} level={level} />
            ) : (
              <p className="muted">
                No {tab} explanation has been written for this structure yet. It is part of the planned content, not hidden.
              </p>
            )}
            {level === 'foundation' && (structure.lenses[tab].body.medical?.length ?? 0) > 0 && (
              <p className="muted small">More detail is available at Medical Student level (switch in the header).</p>
            )}
            {(structure.lenses[tab].conceptIds?.length ?? 0) > 0 && (
              <div className="go-deeper">
                <h3 className="eyebrow">Why does this happen?</h3>
                <ul>
                  {structure.lenses[tab].conceptIds!.map((cid) => {
                    const c = ix.concepts.get(cid);
                    return c ? (
                      <li key={cid}>
                        <ContextLink to={`/concept/${cid}`} fromLabel={fromLabel} className="concept-link">
                          {c.name} <span aria-hidden="true">→</span>
                        </ContextLink>
                        <span className="muted small"> {c.oneLine}</span>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}
          </>
        ) : (
          <StudyTab structureId={structure.id} name={structure.name} />
        )}

        <div className="related">
          <h3 className="eyebrow">Related structures</h3>
          <ul className="chips">
            {structure.relatedStructureIds.map((id) => (
              <li key={id}>
                <button type="button" className="chip" onClick={() => onSelectStructure(id)}>
                  {ix.structures.get(id)?.name ?? id}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <ProvenanceNote provenance={structure.provenance} />
      </div>
    </section>
  );
}

function StudyTab({ structureId, name }: { structureId: string; name: string }) {
  const { bundle } = useContent();
  const questions = bundle.questions.filter((q) => q.structureIds.includes(structureId)).slice(0, 2);
  const cards = bundle.flashcards.filter((c) => c.structureIds.includes(structureId));
  const target = { kind: 'structure' as const, id: structureId };
  return (
    <div className="study-tab">
      <h3>Recall</h3>
      {questions.length === 0 ? (
        <p className="muted">No recall questions for this structure yet.</p>
      ) : (
        questions.map((q) => <QuestionCard key={q.id} question={q} context="quiz" />)
      )}
      <h3>Flashcards</h3>
      {cards.length === 0 ? <p className="muted">No editorial cards for this structure; make your own below.</p> : cards.map((c) => <FlipCard key={c.id} front={c.front} back={c.back} />)}
      <QuickCardForm target={target} label={name} />
      <NoteEditor target={target} label={name} />
      <AttachResource target={target} />
      <CuratedResources structureIds={[structureId]} />
    </div>
  );
}
