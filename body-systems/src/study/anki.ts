/**
 * Export user-created flashcards as an Anki-compatible CSV.
 *
 * Format: RFC 4180 CSV (comma separated, double quotes around every field,
 * internal quotes doubled, CRLF line ends) with Anki's optional file headers:
 *
 *   #separator:Comma
 *   #html:false
 *   #columns:Front,Back,Tags
 *   #tags column:3
 *
 * Anki 2.1.55+ reads these headers and maps the columns to a Basic note type.
 * Older versions can import the same file if the four header lines are deleted.
 * Tags are space-separated (Anki's convention); spaces inside a tag become "_".
 */
import type { UserFlashcard } from './model';

export const ANKI_HEADER = ['#separator:Comma', '#html:false', '#columns:Front,Back,Tags', '#tags column:3'];

export function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function toAnkiCsv(cards: Pick<UserFlashcard, 'front' | 'back' | 'tags'>[]): string {
  const rows = cards.map((c) =>
    [c.front, c.back, ['body-systems-explorer', ...c.tags].map((t) => t.trim().replace(/\s+/g, '_')).filter(Boolean).join(' ')]
      .map(csvField)
      .join(','),
  );
  return [...ANKI_HEADER, ...rows].join('\r\n') + '\r\n';
}
