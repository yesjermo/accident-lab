import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useContent } from '../data/content';
import { useStudy } from '../data/study';
import { dueCardIds, missedQuestionIds } from '../study/progress';
import type { Level } from '../domain/types';

export function LevelToggle() {
  const { data, dispatch } = useStudy();
  const set = (level: Level) => dispatch({ type: 'setLevel', level });
  return (
    <div className="segmented" role="group" aria-label="Explanation level">
      {(['foundation', 'medical'] as Level[]).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={data.settings.level === l}
          className={data.settings.level === l ? 'is-on' : ''}
          onClick={() => set(l)}
        >
          {l === 'foundation' ? 'Foundation' : 'Medical student'}
        </button>
      ))}
    </div>
  );
}

function useReviewCount() {
  const { bundle } = useContent();
  const { data } = useStudy();
  const ids = [...bundle.flashcards.map((c) => c.id), ...data.userCards.map((c) => c.id)];
  return dueCardIds(data, ids, new Date()).length + missedQuestionIds(data).length;
}

/**
 * Patterns and markers used by every diagram, defined once per page so their
 * ids are unique and still resolve when a particular diagram is hidden.
 */
function SharedSvgDefs() {
  return (
    <svg className="svg-defs" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" className="hatch-bg" />
          <line x1="0" y1="0" x2="0" y2="6" className="hatch-line" strokeWidth="2.2" />
        </pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="arrow-head" />
        </marker>
      </defs>
    </svg>
  );
}

export function Layout() {
  const { bundle } = useContent();
  const { statusMessage, saveError, recovery } = useStudy();
  const [navOpen, setNavOpen] = useState(false);
  const loc = useLocation();
  const reviewCount = useReviewCount();

  useEffect(() => setNavOpen(false), [loc.pathname]);

  const link = (to: string, label: string, extra?: React.ReactNode, end = false) => (
    <li key={to}>
      <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
        {label}
        {extra}
      </NavLink>
    </li>
  );

  return (
    <div className="app">
      {/* A button, not href="#main": with hash routing that href would navigate to the route /main. */}
      <button type="button" className="skip-link" onClick={() => document.getElementById('main')?.focus()}>
        Skip to content
      </button>
      <header className="topbar">
        <button
          type="button"
          className="btn btn-quiet nav-toggle"
          aria-expanded={navOpen}
          aria-controls="sidenav"
          onClick={() => setNavOpen((o) => !o)}
        >
          <span aria-hidden="true">☰</span> Menu
        </button>
        <NavLink to="/" className="brand">
          Body Systems Explorer
        </NavLink>
        <span className="topbar-tag">Educational only · not for diagnosis or treatment</span>
        <div className="topbar-right">
          <span className="field-label inline" id="level-label">
            Level
          </span>
          <LevelToggle />
        </div>
      </header>
      <SharedSvgDefs />
      {recovery && (
        <div className="banner banner-recovery" role="alert">
          <p>{recovery.message}</p>
          <div className="row wrap">
            {recovery.raw && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const url = URL.createObjectURL(new Blob([recovery.raw!], { type: 'application/json' }));
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'body-systems-explorer-unreadable-study-data.json';
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                Download the unreadable data
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={recovery.startFresh}>
              Start fresh (replaces it)
            </button>
          </div>
        </div>
      )}
      {!recovery && (statusMessage || saveError) && (
        <div className="banner" role="alert">
          {saveError ?? statusMessage}
        </div>
      )}
      <div className="shell">
        <nav id="sidenav" className={`sidenav${navOpen ? ' is-open' : ''}`} aria-label="Main">
          <p className="nav-head">Learn</p>
          <ul>
            {link('/explore/3d', '3D body')}
            {link('/explore/body', 'Explore the body')}
            {link('/journey', 'Follow an Oxygen Molecule')}
          </ul>
          <p className="nav-head">Systems</p>
          <ul>
            {bundle.systems.map((s) =>
              s.status === 'available' ? (
                link(`/system/${s.id}`, s.name)
              ) : (
                <li key={s.id}>
                  <span className="nav-disabled" aria-disabled="true">
                    {s.name} <span className="tag tag-planned">Planned</span>
                  </span>
                </li>
              ),
            )}
          </ul>
          <p className="nav-head">Understand</p>
          <ul>
            {link('/mechanisms', 'Mechanisms and concept map')}
            {link('/experiment', 'Experiment: O₂–Hb curve')}
          </ul>
          <p className="nav-head">Practise and review</p>
          <ul>
            {link('/practice', 'Quiz', undefined, true)}
            {link('/practice/label', 'Labeling')}
            {link(
              '/review',
              'Review queue',
              reviewCount > 0 ? (
                <span className="badge" aria-label={`${reviewCount} items to review`}>
                  {reviewCount}
                </span>
              ) : undefined,
            )}
            {link('/study', 'My study')}
          </ul>
          <p className="nav-head">Trust</p>
          <ul>
            {link('/sources', 'Sources and licences')}
            {link('/about', 'About, scope and limits')}
          </ul>
          <p className="nav-head">Coming later</p>
          <ul className="planned">
            <li><span className="nav-disabled" aria-disabled="true">Shared study collections <span className="tag tag-planned">Planned</span></span></li>
            <li><span className="nav-disabled" aria-disabled="true">Accounts and sync <span className="tag tag-planned">Planned</span></span></li>
          </ul>
        </nav>
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
