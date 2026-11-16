/**
 * Catalogue of the meshes in public/models/body.glb (built by tools/build_body_glb.py
 * from BodyParts3D, plus lung lobes and thigh muscles from Z-Anatomy via
 * tools/extract_zanatomy.py). Mesh names are the keys. `structureId` links a mesh to a
 * structure with full content; `planned` meshes give whole-body context and
 * are marked as not yet covered.
 */
export type MeshRole = 'o2-rich' | 'o2-poor' | 'organ' | 'muscle' | 'context';

export interface Body3DPart {
  mesh: string;
  label: string;
  structureId?: string;
  planned?: boolean;
  /** Visual role: decides colour and default opacity; oxygenation also differs in the label. */
  role: MeshRole;
  layer: 'organ' | 'skin' | 'skeleton';
  /** Override the role's default opacity. */
  opacity?: number;
  source: 'BodyParts3D' | 'Z-Anatomy';
}

export const BODY3D_PARTS: Body3DPart[] = [
  { mesh: 'lungs', label: 'Lungs (five lobes)', structureId: 'lungs', role: 'organ', layer: 'organ', opacity: 0.42, source: 'Z-Anatomy' },
  { mesh: 'bronchial-tree', label: 'Bronchial tree (bronchi to bronchioles)', structureId: 'bronchiole', role: 'organ', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'trachea', label: 'Trachea and main bronchi', structureId: 'trachea', role: 'organ', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'heart', label: 'Heart', structureId: 'heart', role: 'muscle', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'aorta', label: 'Aorta (oxygen-rich)', structureId: 'aorta', role: 'o2-rich', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'pulmonary-veins', label: 'Pulmonary veins (oxygen-rich)', structureId: 'pulmonary-veins', role: 'o2-rich', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'pulmonary-arteries', label: 'Pulmonary trunk and arteries (oxygen-poor)', structureId: 'pulmonary-arteries', role: 'o2-poor', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'vena-cava', label: 'Venae cavae (oxygen-poor)', structureId: 'vena-cava', role: 'o2-poor', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'diaphragm', label: 'Diaphragm', structureId: 'diaphragm', role: 'muscle', layer: 'organ', opacity: 0.45, source: 'BodyParts3D' },
  { mesh: 'thigh-muscles', label: 'Thigh muscles (representative tissue)', structureId: 'skeletal-muscle', role: 'muscle', layer: 'organ', source: 'Z-Anatomy' },
  { mesh: 'planned-brain', label: 'Brain', planned: true, role: 'context', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'planned-esophagus', label: 'Esophagus', planned: true, role: 'context', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'planned-liver', label: 'Liver', planned: true, role: 'context', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'planned-stomach', label: 'Stomach', planned: true, role: 'context', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'planned-pancreas', label: 'Pancreas', planned: true, role: 'context', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'planned-kidneys', label: 'Kidneys', planned: true, role: 'context', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'planned-small-intestine', label: 'Small intestine', planned: true, role: 'context', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'planned-large-intestine', label: 'Large intestine', planned: true, role: 'context', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'planned-bladder', label: 'Urinary bladder', planned: true, role: 'context', layer: 'organ', source: 'BodyParts3D' },
  { mesh: 'skeleton', label: 'Skeleton', planned: true, role: 'context', layer: 'skeleton', source: 'BodyParts3D' },
  { mesh: 'skin', label: 'Skin (body outline)', planned: true, role: 'context', layer: 'skin', source: 'BodyParts3D' },
];

export const BODY3D_ATTRIBUTION =
  'BodyParts3D, © The Database Center for Life Science (DBCLS), CC BY 4.0 (files distributed with a CC BY-SA 2.1 JP notice); lung lobes and thigh muscles from Z-Anatomy (Kervyn, Zielinski et al.), CC BY-SA 4.0. Merged, aligned and simplified for this app; shapes unchanged. The combined model is shared under CC BY-SA 4.0.';

export const partByMesh = (mesh: string) => BODY3D_PARTS.find((p) => p.mesh === mesh);
