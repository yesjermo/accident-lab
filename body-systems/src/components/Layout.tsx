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
    <div className="segmented" role="radiogroup" aria-label="Explanation level">
      {(['foundation', 'medical'] as Level[]).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={data.settings.level === l}
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

export function Layout() {
  const { bundle } = useContent();
  const { statusMessage, saveError } = useStudy();
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
      <a href="#main" className="skip-link">
        Skip to content
      </a>
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
      {(statusMessage || saveError) && (
        <div className="banner" role="alert">
          {saveError ?? statusMessage}
        </div>
      )}
      <div className="shell">
        <nav id="sidenav" className={`sidenav${navOpen ? ' is-open' : ''}`} aria-label="Main">
          <p className="nav-head">Learn</p>
          <ul>
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
            <li><span className="nav-disabled" aria-disabled="true">3D anatomy <span className="tag tag-planned">Planned</span></span></li>
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
