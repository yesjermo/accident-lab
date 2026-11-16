import type { DiagramId, ViewId } from '../domain/types';
import { BODY3D_PARTS } from '../content/body3d';
import { DIAGRAMS } from './defs';

/** Structure IDs that are selectable on each diagram. */
export const DIAGRAM_REGIONS: Record<DiagramId, string[]> = Object.fromEntries(
  Object.entries(DIAGRAMS).map(([id, d]) => [id, d.regions.map((r) => r.id)]),
) as Record<DiagramId, string[]>;

/** Can this view (a 2D diagram or the 3D body) show the given structure? */
export function viewShows(view: ViewId, structureId: string): boolean {
  return view === '3d' ? BODY3D_PARTS.some((p) => p.structureId === structureId) : DIAGRAM_REGIONS[view].includes(structureId);
}
