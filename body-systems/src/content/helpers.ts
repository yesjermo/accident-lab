import type { Leveled, Provenance, SourceRef } from '../domain/types';
import { CONTENT_VERIFIED_ON } from './sources';

/** Provenance for content checked against its cited sources by the author. */
export function checked(sources: SourceRef[], notes?: string, version = '1.0.0'): Provenance {
  return { sources, version, lastVerified: CONTENT_VERIFIED_ON, reviewStatus: 'source-checked', notes };
}

/** Provenance for content whose claims have not all been confirmed in a fetched source. */
export function draft(sources: SourceRef[], notes: string, version = '0.1.0'): Provenance {
  return { sources, version, lastVerified: null, reviewStatus: 'draft', notes };
}

/** Leveled text: foundation paragraphs, plus optional medical-level additions. */
export const L = (foundation: string | string[], medical?: string | string[]): Leveled => ({
  foundation: Array.isArray(foundation) ? foundation : [foundation],
  medical: medical === undefined ? undefined : Array.isArray(medical) ? medical : [medical],
});
