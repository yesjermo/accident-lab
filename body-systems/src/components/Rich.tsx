import katex from 'katex';
import 'katex/contrib/mhchem';
import { useMemo } from 'react';
import type { Leveled, Level } from '../domain/types';

/** Render a TeX string with KaTeX. Errors render the source, never crash. */
export function Tex({ tex, display = false, label }: { tex: string; display?: boolean; label?: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'htmlAndMathml' }),
    [tex, display],
  );
  const Tag = display ? 'div' : 'span';
  return <Tag className={display ? 'tex tex-display' : 'tex'} aria-label={label} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Text with inline $…$ math segments. Content is authored in this repo, not user input. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('$') && p.endsWith('$') && p.length > 2 ? <Tex key={i} tex={p.slice(1, -1)} /> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

/** Paragraphs for the active level. Medical level adds paragraphs, marked as such. */
export function LeveledText({ text, level }: { text: Leveled; level: Level }) {
  return (
    <div className="leveled">
      {text.foundation.map((p, i) => (
        <p key={`f${i}`}>
          <Rich text={p} />
        </p>
      ))}
      {level === 'medical' &&
        text.medical?.map((p, i) => (
          <p key={`m${i}`} className="medical-para">
            <span className="tag tag-level">Medical</span> <Rich text={p} />
          </p>
        ))}
    </div>
  );
}

export function hasText(t: Leveled, level: Level) {
  return t.foundation.length > 0 || (level === 'medical' && (t.medical?.length ?? 0) > 0);
}
