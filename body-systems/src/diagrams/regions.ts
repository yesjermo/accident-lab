import type { DiagramId } from '../domain/types';
import { DIAGRAMS } from './defs';

/** Structure IDs that are selectable on each diagram. */
export const DIAGRAM_REGIONS: Record<DiagramId, string[]> = Object.fromEntries(
  Object.entries(DIAGRAMS).map(([id, d]) => [id, d.regions.map((r) => r.id)]),
) as Record<DiagramId, string[]>;
