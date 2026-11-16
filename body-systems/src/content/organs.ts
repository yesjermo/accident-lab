/**
 * Organs shown in the 3D body beyond the heart and lungs. Each has the same
 * five lenses as the core structures. The oxygen thread is kept explicit:
 * every organ says how it uses or supports oxygen transport.
 *
 * Status: written 2026-11-15; provenance is set per item after checking
 * against the cited OpenStax sections (see CONTENT_SOURCES.md).
 */
import type { BodySystem, Structure } from '../domain/types';
import { L, checked } from './helpers';
import { REF } from './sources';

const none = { body: L([]) };

export const ORGAN_SYSTEMS: BodySystem[] = [
  {
    id: 'nervous',
    name: 'Nervous system',
    summary: 'The brain sets the rhythm of breathing and is one of the body\'s most oxygen-dependent organs.',
    status: 'available',
    structureIds: ['brain'],
  },
  {
    id: 'digestive',
    name: 'Digestive system',
    summary: 'Supplies the fuel that cellular respiration burns, and the liver recycles old red blood cells.',
    status: 'available',
    structureIds: ['esophagus', 'stomach', 'small-intestine', 'large-intestine', 'liver', 'pancreas'],
  },
  {
    id: 'urinary',
    name: 'Urinary system',
    summary: 'Kidneys sense low oxygen, call for more red blood cells, and adjust blood bicarbonate.',
    status: 'available',
    structureIds: ['kidneys', 'urinary-bladder'],
  },
  {
    id: 'skeletal',
    name: 'Skeletal and integumentary systems',
    summary: 'Red bone marrow makes the red blood cells; skin helps regulate temperature.',
    status: 'available',
    structureIds: ['skeleton', 'skin'],
  },
];

const organ = (
  id: string,
  name: string,
  systemIds: string[],
  oneLine: string,
  lenses: Structure['lenses'],
  relatedStructureIds: string[],
  provenance: Structure['provenance'],
  scale: Structure['scale'] = 'organ',
): Structure => ({ id, name, systemIds, diagram: '3d', scale, oneLine, lenses, relatedStructureIds, provenance });

export const ORGAN_STRUCTURES: Structure[] = [
  organ(
    'brain',
    'Brain',
    ['nervous'],
    'Generates the breathing rhythm in the brainstem and adjusts it to blood CO₂ and pH.',
    {
      anatomy: { body: L('Inside the skull. The brainstem (midbrain, pons, medulla oblongata) connects the brain to the spinal cord.') },
      physiology: {
        body: L(
          'Breathing is driven by respiratory centres in the medulla oblongata and pons, which set the rate and depth of each breath.',
          'Central chemoreceptors in the brain and brainstem respond to rising CO₂ and H⁺. Under normal conditions CO₂, not O₂, is the main stimulus to breathe; peripheral chemoreceptors respond to O₂ only when it falls to about 60 mmHg or less.',
        ),
        conceptIds: ['ventilation-mechanics', 'co2-acid-base'],
      },
      biology: none,
      chemistry: {
        body: L('CO₂ forms carbonic acid, which releases H⁺. As H⁺ rises in the brain, the central chemoreceptors stimulate the respiratory centres.'),
        conceptIds: ['co2-acid-base'],
      },
      clinical: none,
    },
    ['diaphragm', 'lungs'],
    checked([REF.ap223, REF.ap132]),
  ),
  organ(
    'esophagus',
    'Esophagus',
    ['digestive'],
    'Muscular tube carrying food from the pharynx to the stomach, behind the trachea.',
    {
      anatomy: {
        body: L('Runs behind (posterior to) the trachea, through the mediastinum, and passes through the diaphragm at the esophageal hiatus to reach the stomach.'),
      },
      physiology: { body: L('Peristalsis moves food down. The upper sphincter lets food in; the lower sphincter stops stomach contents backing up.') },
      biology: none,
      chemistry: none,
      clinical: none,
    },
    ['trachea', 'stomach', 'diaphragm'],
    checked([REF.ap233]),
  ),
  organ(
    'stomach',
    'Stomach',
    ['digestive'],
    'Stores food, mixes it with acid and enzymes, and releases it to the small intestine as chyme.',
    {
      anatomy: { body: L('Below the diaphragm, between the esophagus and the duodenum.') },
      physiology: { body: L('Churns food into chyme and releases it in small amounts into the duodenum.') },
      biology: { body: L('Parietal cells secrete hydrochloric acid; chief cells secrete pepsinogen.') },
      chemistry: {
        body: L('Gastric juice is strongly acidic: parietal cells secrete hydrochloric acid, which converts pepsinogen into the active enzyme pepsin.'),
      },
      clinical: none,
    },
    ['esophagus', 'small-intestine', 'pancreas'],
    checked([REF.ap234]),
  ),
  organ(
    'small-intestine',
    'Small intestine',
    ['digestive'],
    'Where most digestion and nutrient absorption happen, including the glucose cells later burn with oxygen.',
    {
      anatomy: { body: L('Duodenum, jejunum and ileum. Circular folds, villi and microvilli give it a very large absorptive surface.') },
      physiology: {
        body: L('Absorbs most nutrients. Blood draining it goes first to the liver through the hepatic portal vein.'),
      },
      biology: { body: L('Absorptive cells on the villi carry nutrients into capillaries and lacteals.'), conceptIds: ['membrane-transport'] },
      chemistry: { body: L('Pancreatic bicarbonate neutralises the acidic chyme arriving from the stomach.'), conceptIds: ['co2-acid-base'] },
      clinical: none,
    },
    ['stomach', 'large-intestine', 'liver', 'pancreas'],
    checked([REF.ap235, REF.ap205, REF.ap236]),
  ),
  organ(
    'large-intestine',
    'Large intestine',
    ['digestive'],
    'Absorbs water and electrolytes and forms feces.',
    {
      anatomy: { body: L('Cecum, colon (ascending, transverse, descending, sigmoid), rectum and anal canal, framing the small intestine.') },
      physiology: { body: L('Absorbs most of the remaining water; its bacteria ferment some undigested material.') },
      biology: none,
      chemistry: none,
      clinical: none,
    },
    ['small-intestine'],
    checked([REF.ap235]),
  ),
  organ(
    'liver',
    'Liver',
    ['digestive'],
    'Processes absorbed nutrients and breaks down the heme from worn-out red blood cells.',
    {
      anatomy: {
        body: L('Below the diaphragm in the upper right abdomen. It receives blood from two sources: the hepatic artery and the hepatic portal vein.'),
      },
      physiology: {
        body: L('Nutrient-rich blood from the digestive tract reaches the liver through the hepatic portal vein before entering the general circulation.'),
      },
      biology: { body: L('Hepatocytes process absorbed nutrients and make bile.') },
      chemistry: {
        body: L('When old red blood cells are broken down, heme is converted to bilirubin, which the liver excretes in bile. The iron is recycled.'),
        conceptIds: ['hemoglobin-binding'],
      },
      clinical: none,
    },
    ['small-intestine', 'pancreas', 'red-blood-cell'],
    checked([REF.ap236, REF.ap205, REF.ap183]),
  ),
  organ(
    'pancreas',
    'Pancreas',
    ['digestive'],
    'Secretes digestive enzymes and bicarbonate into the duodenum, and hormones into the blood.',
    {
      anatomy: { body: L('Behind the stomach, its head nestled in the curve of the duodenum.') },
      physiology: { body: L('Exocrine: pancreatic juice with enzymes and bicarbonate. Endocrine: insulin and glucagon from the pancreatic islets.') },
      biology: none,
      chemistry: { body: L('Bicarbonate in pancreatic juice neutralises stomach acid in the duodenum.'), conceptIds: ['co2-acid-base'] },
      clinical: none,
    },
    ['stomach', 'small-intestine', 'liver'],
    checked([REF.ap236]),
  ),
  organ(
    'kidneys',
    'Kidneys',
    ['urinary'],
    'Filter the blood, sense low oxygen, and release erythropoietin to boost red blood cell production.',
    {
      anatomy: { body: L('Paired organs against the posterior abdominal wall, either side of the vertebral column.') },
      physiology: {
        body: L(
          'They receive a large share of cardiac output (about a quarter at rest) and filter it to make urine.',
          'When tissue oxygen is low, the kidneys release erythropoietin (EPO), which stimulates red bone marrow to make more red blood cells.',
        ),
        conceptIds: ['hemoglobin-binding'],
      },
      biology: { body: L('Each kidney contains about 1.3 million nephrons, the filtering units.') },
      chemistry: {
        body: L('Kidneys regulate blood pH over hours to days by excreting H⁺ and conserving or generating bicarbonate. This is the slow partner to breathing\'s fast control of CO₂.'),
        conceptIds: ['co2-acid-base'],
      },
      clinical: none,
    },
    ['urinary-bladder', 'skeleton', 'aorta'],
    checked([REF.ap253, REF.ap183, REF.ap264, REF.ap265]),
  ),
  organ(
    'urinary-bladder',
    'Urinary bladder',
    ['urinary'],
    'Stores urine until it is released.',
    {
      anatomy: { body: L('In the pelvis, behind the pubic symphysis. Ureters bring urine from the kidneys; the urethra drains it.') },
      physiology: { body: L('Its muscular wall (detrusor) stretches as it fills and contracts during urination.') },
      biology: { body: L('Lined by transitional epithelium (urothelium), which can stretch.') },
      chemistry: none,
      clinical: none,
    },
    ['kidneys'],
    checked([REF.ap252]),
  ),
  organ(
    'skeleton',
    'Skeleton',
    ['skeletal'],
    'Supports and protects the body; its red bone marrow produces the red blood cells.',
    {
      anatomy: { body: L('An adult skeleton has 206 bones. The ribs protect the heart and lungs.') },
      physiology: {
        body: L('Red bone marrow is the site of hematopoiesis, the production of blood cells, including erythrocytes.'),
      },
      biology: { body: L('Erythrocytes develop from hematopoietic stem cells in red marrow; erythropoietin from the kidneys speeds this up.') },
      chemistry: { body: L('Bone stores calcium and phosphorus.') },
      clinical: none,
    },
    ['kidneys', 'red-blood-cell'],
    checked([REF.ap61, REF.ap71, REF.ap182, REF.ap183]),
    'tissue',
  ),
  organ(
    'skin',
    'Skin',
    ['skeletal'],
    'The body\'s outer covering; its blood flow helps regulate body temperature.',
    {
      anatomy: { body: L('Epidermis over dermis, on top of the hypodermis. The dermis contains blood vessels, glands and nerve endings.') },
      physiology: {
        body: L('When the body is warm, dermal blood vessels dilate and sweat glands secrete; when cold, the vessels constrict to conserve heat.'),
      },
      biology: none,
      chemistry: none,
      clinical: none,
    },
    ['skeleton'],
    checked([REF.ap51, REF.ap53]),
  ),
];
