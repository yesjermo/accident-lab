/**
 * Catalogue of the meshes in public/models/body.glb (built by tools/build_body_glb.py
 * from BodyParts3D, plus lung lobes and thigh muscles from Z-Anatomy via
 * tools/extract_zanatomy.py). Mesh names are the keys; every mesh links to a
 * structure with full lesson content.
 */
export type MeshRole = 'o2-rich' | 'o2-poor' | 'organ' | 'muscle' | 'viscera' | 'context';

export interface Body3DPart {
  mesh: string;
  label: string;
  structureId: string;
  /** Visual role: decides colour and default opacity. Oxygenation is also stated in the label. */
  role: MeshRole;
  layer: 'organ' | 'skin' | 'skeleton';
  /** 'core' = the cardiorespiratory organs of the oxygen journey. */
  group: 'core' | 'other';
  /** Override the role's default opacity. */
  opacity?: number;
  source: 'BodyParts3D' | 'Z-Anatomy';
}

const BP = 'BodyParts3D' as const;
const ZA = 'Z-Anatomy' as const;

export const BODY3D_PARTS: Body3DPart[] = [
  { mesh: 'lungs', label: 'Lungs (five lobes)', structureId: 'lungs', role: 'organ', layer: 'organ', group: 'core', opacity: 0.42, source: ZA },
  { mesh: 'bronchial-tree', label: 'Bronchial tree (bronchi to bronchioles)', structureId: 'bronchiole', role: 'organ', layer: 'organ', group: 'core', source: BP },
  { mesh: 'trachea', label: 'Trachea and main bronchi', structureId: 'trachea', role: 'organ', layer: 'organ', group: 'core', source: BP },
  { mesh: 'heart', label: 'Heart', structureId: 'heart', role: 'muscle', layer: 'organ', group: 'core', source: BP },
  { mesh: 'aorta', label: 'Aorta (oxygen-rich)', structureId: 'aorta', role: 'o2-rich', layer: 'organ', group: 'core', source: BP },
  { mesh: 'pulmonary-veins', label: 'Pulmonary veins (oxygen-rich)', structureId: 'pulmonary-veins', role: 'o2-rich', layer: 'organ', group: 'core', source: BP },
  { mesh: 'pulmonary-arteries', label: 'Pulmonary trunk and arteries (oxygen-poor)', structureId: 'pulmonary-arteries', role: 'o2-poor', layer: 'organ', group: 'core', source: BP },
  { mesh: 'vena-cava', label: 'Venae cavae (oxygen-poor)', structureId: 'vena-cava', role: 'o2-poor', layer: 'organ', group: 'core', source: BP },
  { mesh: 'diaphragm', label: 'Diaphragm', structureId: 'diaphragm', role: 'muscle', layer: 'organ', group: 'core', opacity: 0.45, source: BP },
  { mesh: 'thigh-muscles', label: 'Thigh muscles (representative tissue)', structureId: 'skeletal-muscle', role: 'muscle', layer: 'organ', group: 'core', source: ZA },
  { mesh: 'brain', label: 'Brain', structureId: 'brain', role: 'viscera', layer: 'organ', group: 'other', source: BP },
  { mesh: 'esophagus', label: 'Esophagus', structureId: 'esophagus', role: 'viscera', layer: 'organ', group: 'other', source: BP },
  { mesh: 'stomach', label: 'Stomach', structureId: 'stomach', role: 'viscera', layer: 'organ', group: 'other', source: BP },
  { mesh: 'liver', label: 'Liver', structureId: 'liver', role: 'viscera', layer: 'organ', group: 'other', source: BP },
  { mesh: 'pancreas', label: 'Pancreas', structureId: 'pancreas', role: 'viscera', layer: 'organ', group: 'other', source: BP },
  { mesh: 'small-intestine', label: 'Small intestine', structureId: 'small-intestine', role: 'viscera', layer: 'organ', group: 'other', source: BP },
  { mesh: 'large-intestine', label: 'Large intestine', structureId: 'large-intestine', role: 'viscera', layer: 'organ', group: 'other', source: BP },
  { mesh: 'kidneys', label: 'Kidneys', structureId: 'kidneys', role: 'viscera', layer: 'organ', group: 'other', source: BP },
  { mesh: 'urinary-bladder', label: 'Urinary bladder', structureId: 'urinary-bladder', role: 'viscera', layer: 'organ', group: 'other', source: BP },
  { mesh: 'skeleton', label: 'Skeleton', structureId: 'skeleton', role: 'context', layer: 'skeleton', group: 'other', source: BP },
  { mesh: 'skin', label: 'Skin (body outline)', structureId: 'skin', role: 'context', layer: 'skin', group: 'other', source: BP },
];

export const BODY3D_ATTRIBUTION =
  'BodyParts3D, © The Database Center for Life Science (DBCLS), CC BY 4.0 (files distributed with a CC BY-SA 2.1 JP notice); lung lobes and thigh muscles from Z-Anatomy (Kervyn, Zielinski et al.), CC BY-SA 4.0. Merged, aligned and simplified for this app; shapes unchanged. The combined model is shared under CC BY-SA 4.0.';

export const partByMesh = (mesh: string) => BODY3D_PARTS.find((p) => p.mesh === mesh);
export const partByStructure = (id: string) => BODY3D_PARTS.find((p) => p.structureId === id);
/** Mesh names for a list of structure ids (ignores ids without a 3D mesh). */
export const meshesFor = (structureIds: string[]) =>
  structureIds.flatMap((id) => {
    const p = partByStructure(id);
    return p ? [p.mesh] : [];
  });
