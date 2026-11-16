import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useContent } from '../data/content';
import { useStudy } from '../data/study';
import { dueCardIds, missedQuestionIds } from '../study/progress';
import { allEquations, clinicalStructures } from '../content/medical';

/**
 * Disclosure menu that opens on hover (pointer), on tap or click, and with the
 * keyboard (Enter/Space on the button, Escape to close). It is a list of links,
 * not an ARIA "menu", so normal Tab navigation works inside it.
 */
function HoverMenu({ label, badge, children }: { label: string; badge?: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number>();
  /** Set when hover opened the menu, so the click that usually follows doesn't close it again. */
  const hoverOpened = useRef(false);
  const loc = useLocation();

  useEffect(() => setOpen(false), [loc.pathname, loc.search]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <div
      ref={wrap}
      className={`hover-menu${open ? ' is-open' : ''}`}
      onMouseEnter={(e) => {
        if ((e.nativeEvent as PointerEvent).pointerType === 'touch') return;
        window.clearTimeout(closeTimer.current);
        if (!open) hoverOpened.current = true;
        setOpen(true);
      }}
      onMouseLeave={() => {
        hoverOpened.current = false;
        closeTimer.current = window.setTimeout(() => setOpen(false), 180);
      }}
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          setOpen(false);
          btn.current?.focus();
        }
      }}
    >
      <button ref={btn} type="button" className="hover-menu-btn" aria-expanded={open} aria-controls={id} onClick={() => {
          if (hoverOpened.current) {
            hoverOpened.current = false;
            setOpen(true);
          } else setOpen((o) => !o);
        }}>
        {label}
        {badge ? <span className="badge">{badge}</span> : null}
        <span aria-hidden="true" className="caret">
          ▾
        </span>
      </button>
      <div id={id} className="hover-menu-panel" hidden={!open}>
        {children}
      </div>
    </div>
  );
}

/** Extra bar shown at Medical Student level: quick access to clinical, quantitative and review material. */
export function MedToolbar() {
  const { bundle } = useContent();
  const { data } = useStudy();
  const clinical = clinicalStructures(bundle.structures);
  const equations = allEquations(bundle);
  const due = dueCardIds(data, [...bundle.flashcards.map((c) => c.id), ...data.userCards.map((c) => c.id)], new Date()).length;
  const missed = missedQuestionIds(data).length;

  return (
    <nav className="med-toolbar" aria-label="Medical student tools">
      <span className="med-toolbar-label">
        <span className="tag tag-level">Medical</span> tools
      </span>
      <HoverMenu label="Clinical connections">
        <ul>
          {clinical.map((s) => (
            <li key={s.id}>
              <Link to={`/explore/${s.diagram}/${s.id}?tab=clinical`}>{s.name}</Link>
            </li>
          ))}
        </ul>
        <Link className="menu-footer" to="/clinical">
          All clinical connections →
        </Link>
      </HoverMenu>
      <HoverMenu label="Equations">
        <ul>
          {equations.map((e) => (
            <li key={e.eq.id}>
              <Link to={`/equations#eq-${e.eq.id}`}>{e.eq.name}</Link>
            </li>
          ))}
        </ul>
        <Link className="menu-footer" to="/equations">
          Equation sheet →
        </Link>
      </HoverMenu>
      <HoverMenu label="Mechanisms">
        <ul>
          {bundle.concepts.map((c) => (
            <li key={c.id}>
              <Link to={`/concept/${c.id}`}>{c.name}</Link>
            </li>
          ))}
        </ul>
        <Link className="menu-footer" to="/mechanisms">
          Concept map →
        </Link>
      </HoverMenu>
      <HoverMenu label="Review" badge={due + missed}>
        <ul>
          <li>
            <Link to="/review">
              Review queue: {due} due card{due === 1 ? '' : 's'}, {missed} missed question{missed === 1 ? '' : 's'}
            </Link>
          </li>
          <li>
            <Link to="/practice">Quiz (all lessons)</Link>
          </li>
          <li>
            <Link to="/practice/label">Labeling exercises</Link>
          </li>
          <li>
            <Link to="/experiment">Dissociation-curve experiment</Link>
          </li>
          <li>
            <Link to="/study">Progress by objective</Link>
          </li>
        </ul>
      </HoverMenu>
      <NavLink to="/sources" className="med-toolbar-link">
        Sources
      </NavLink>
    </nav>
  );
}
