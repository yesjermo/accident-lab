/**
 * Catalogue of the meshes in public/models/body.glb (built by tools/build_body_glb.py
 * from BodyParts3D). Mesh names are the keys. `structureId` links a mesh to a
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
}

export const BODY3D_PARTS: Body3DPart[] = [
  { mesh: 'lungs', label: 'Lungs (bronchial trees; no lung-surface mesh in the dataset)', structureId: 'lungs', role: 'organ', layer: 'organ' },
  { mesh: 'trachea', label: 'Trachea and main bronchi', structureId: 'trachea', role: 'organ', layer: 'organ' },
  { mesh: 'heart', label: 'Heart', structureId: 'heart', role: 'muscle', layer: 'organ' },
  { mesh: 'aorta', label: 'Aorta (oxygen-rich)', structureId: 'aorta', role: 'o2-rich', layer: 'organ' },
  { mesh: 'pulmonary-veins', label: 'Pulmonary veins (oxygen-rich)', structureId: 'pulmonary-veins', role: 'o2-rich', layer: 'organ' },
  { mesh: 'pulmonary-arteries', label: 'Pulmonary trunk and arteries (oxygen-poor)', structureId: 'pulmonary-arteries', role: 'o2-poor', layer: 'organ' },
  { mesh: 'vena-cava', label: 'Venae cavae (oxygen-poor)', structureId: 'vena-cava', role: 'o2-poor', layer: 'organ' },
  { mesh: 'diaphragm', label: 'Diaphragm', structureId: 'diaphragm', role: 'muscle', layer: 'organ', opacity: 0.45 },
  { mesh: 'planned-brain', label: 'Brain', planned: true, role: 'context', layer: 'organ' },
  { mesh: 'planned-esophagus', label: 'Esophagus', planned: true, role: 'context', layer: 'organ' },
  { mesh: 'planned-liver', label: 'Liver', planned: true, role: 'context', layer: 'organ' },
  { mesh: 'planned-stomach', label: 'Stomach', planned: true, role: 'context', layer: 'organ' },
  { mesh: 'planned-pancreas', label: 'Pancreas', planned: true, role: 'context', layer: 'organ' },
  { mesh: 'planned-kidneys', label: 'Kidneys', planned: true, role: 'context', layer: 'organ' },
  { mesh: 'planned-small-intestine', label: 'Small intestine', planned: true, role: 'context', layer: 'organ' },
  { mesh: 'planned-large-intestine', label: 'Large intestine', planned: true, role: 'context', layer: 'organ' },
  { mesh: 'planned-bladder', label: 'Urinary bladder', planned: true, role: 'context', layer: 'organ' },
  { mesh: 'skeleton', label: 'Skeleton', planned: true, role: 'context', layer: 'skeleton' },
  { mesh: 'skin', label: 'Skin (body outline)', planned: true, role: 'context', layer: 'skin' },
];

export const BODY3D_ATTRIBUTION =
  'BodyParts3D, © The Database Center for Life Science (DBCLS), CC BY 4.0 (files distributed with a CC BY-SA 2.1 JP notice). Merged and simplified for this app; shapes unchanged.';

export const partByMesh = (mesh: string) => BODY3D_PARTS.find((p) => p.mesh === mesh);
