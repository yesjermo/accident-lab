/** Derived views over content used by the Medical Student tools. */
import type { Concept, Equation, Structure } from '../domain/types';
import type { ContentBundle } from './repository';

/** Structures with a written clinical lens. */
export function clinicalStructures(structures: Structure[]): Structure[] {
  return structures.filter((s) => s.lenses.clinical.body.foundation.length > 0 || (s.lenses.clinical.body.medical?.length ?? 0) > 0);
}

export interface EquationEntry {
  eq: Equation;
  /** Where it is explained. */
  concept?: Concept;
  simulation?: string;
}

/** Every equation in the content, once each, with where it lives. */
export function allEquations(bundle: Pick<ContentBundle, 'concepts' | 'simulations'>): EquationEntry[] {
  const seen = new Set<string>();
  const out: EquationEntry[] = [];
  for (const c of bundle.concepts)
    for (const layer of c.why)
      for (const eq of layer.equations ?? [])
        if (!seen.has(eq.id)) {
          seen.add(eq.id);
          out.push({ eq, concept: c });
        }
  for (const s of bundle.simulations)
    for (const eq of s.equations)
      if (!seen.has(eq.id)) {
        seen.add(eq.id);
        out.push({ eq, simulation: s.title });
      }
  return out;
}
