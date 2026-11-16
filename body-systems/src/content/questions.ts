/**
 * Multiple-choice questions. Every choice carries an explanation, so feedback
 * says why a wrong answer is wrong, not only which one is right.
 * Written for this app; not taken from any question bank.
 */
import type { Question } from '../domain/types';
import { checked } from './helpers';
import { REF } from './sources';

const q = (
  id: string,
  stem: string,
  choices: [string, string][],
  correctIndex: number,
  meta: Pick<Question, 'objectiveIds' | 'conceptIds' | 'structureIds'>,
  refs: Question['provenance']['sources'],
): Question => ({
  id,
  stem,
  choices: choices.map(([text, explanation], i) => ({ id: `${id}-${'abcd'[i]}`, text, explanation })),
  correctChoiceId: `${id}-${'abcd'[correctIndex]}`,
  ...meta,
  provenance: checked(refs),
});

export const QUESTIONS: Question[] = [
  q(
    'q-boyle',
    'The diaphragm contracts at the start of a quiet breath. What happens to pressure inside the lungs, and why?',
    [
      ['It rises, because the muscle squeezes the lungs.', 'Contraction flattens the diaphragm and enlarges the chest; it does not squeeze the lungs.'],
      ['It falls below atmospheric, because thoracic volume increases.', 'Correct. By Boyle\'s law, a larger volume of the same gas has a lower pressure, so air flows in.'],
      ['It stays atmospheric; air is pulled in by the trachea.', 'The trachea is a passive tube. Flow needs a pressure difference.'],
      ['It falls because the lungs absorb O₂ faster.', 'Gas uptake is far too slow to drive airflow; volume change does.'],
    ],
    1,
    { objectiveIds: ['o-ventilation'], conceptIds: ['ventilation-mechanics'], structureIds: ['diaphragm', 'lungs'] },
    [REF.ap223],
  ),
  q(
    'q-conducting',
    'Which part of the airway exchanges gas with blood?',
    [
      ['Trachea', 'The trachea is in the conducting zone: it carries, warms and filters air only.'],
      ['Main bronchi', 'Also conducting zone; walls are too thick for gas exchange.'],
      ['Terminal bronchioles', 'Terminal bronchioles are the last part of the conducting zone.'],
      ['Alveoli', 'Correct. Alveoli (with respiratory bronchioles and alveolar ducts) form the respiratory zone.'],
    ],
    3,
    { objectiveIds: ['o-ventilation'], conceptIds: ['ventilation-mechanics'], structureIds: ['alveolus', 'trachea', 'bronchiole'] },
    [REF.ap221],
  ),
  q(
    'q-alv-po2',
    'Alveolar PO₂ is about 104 mmHg and blood entering the pulmonary capillaries has PO₂ about 40 mmHg. Which way does O₂ move?',
    [
      ['From blood to alveolus', 'O₂ diffuses down its partial-pressure gradient, from 104 toward 40.'],
      ['From alveolus to blood', 'Correct. Net diffusion runs from higher to lower partial pressure.'],
      ['No net movement until hemoglobin pulls it', 'Hemoglobin binds O₂ once it arrives, but the gradient is what drives O₂ across.'],
      ['Only by active transport', 'O₂ crosses membranes by simple diffusion; no ATP-driven pump is involved.'],
    ],
    1,
    { objectiveIds: ['o-gradients'], conceptIds: ['partial-pressure-diffusion'], structureIds: ['alveolus', 'respiratory-membrane'] },
    [REF.ap224],
  ),
  q(
    'q-co2-solubility',
    'The CO₂ gradient across the respiratory membrane (~5 mmHg) is much smaller than the O₂ gradient (~64 mmHg). Why do similar amounts of each gas still cross?',
    [
      ['CO₂ is actively pumped out', 'There is no CO₂ pump; it diffuses.'],
      ['CO₂ is far more soluble than O₂', 'Correct. Higher solubility compensates for the smaller pressure difference.'],
      ['The membrane is thinner for CO₂', 'Both gases cross the same membrane.'],
      ['CO₂ molecules are smaller than O₂', 'CO₂ (three atoms) is larger than O₂; size is not the explanation.'],
    ],
    1,
    { objectiveIds: ['o-gradients'], conceptIds: ['partial-pressure-diffusion'], structureIds: ['respiratory-membrane'] },
    [REF.ap224],
  ),
  q(
    'q-tissue-gradient',
    'In a resting muscle, arterial blood arrives at PO₂ ≈ 100 mmHg and tissue PO₂ is ≈ 40 mmHg. What keeps tissue PO₂ low over time?',
    [
      ['Mitochondria continually consume O₂', 'Correct. O₂ use at complex IV keeps intracellular PO₂ low, maintaining the gradient.'],
      ['Hemoglobin in the muscle cell absorbs it', 'Hemoglobin is in red blood cells, not muscle fibres.'],
      ['CO₂ pushes O₂ out of the tissue', 'Each gas follows its own gradient (Dalton\'s law); CO₂ does not displace O₂.'],
      ['The capillary wall blocks O₂', 'Capillary walls let gases diffuse freely.'],
    ],
    0,
    { objectiveIds: ['o-gradients', 'o-mito'], conceptIds: ['partial-pressure-diffusion', 'cellular-respiration'], structureIds: ['systemic-capillary', 'mitochondrion'] },
    [REF.ap224, REF.bio74],
  ),
  q(
    'q-dissolved',
    'Roughly what fraction of the O₂ in arterial blood is bound to hemoglobin?',
    [
      ['About 25%', 'Far too low; dissolved O₂ is the small fraction.'],
      ['About 50%', 'Too low. Plasma dissolves very little O₂.'],
      ['About 75%', '75% is the saturation of venous blood at PO₂ 40, not the share carried by hemoglobin.'],
      ['About 98.5%', 'Correct. Only ~1.5% is dissolved in plasma.'],
    ],
    3,
    { objectiveIds: ['o-hemoglobin'], conceptIds: ['hemoglobin-binding'], structureIds: ['hemoglobin', 'red-blood-cell'] },
    [REF.bio394, REF.ap225],
  ),
  q(
    'q-sigmoid',
    'What molecular property gives the oxygen–hemoglobin dissociation curve its S shape?',
    [
      ['Cooperative binding among hemoglobin\'s four subunits', 'Correct. Binding one O₂ makes the next bind more easily.'],
      ['O₂ dissolving better at high pressure', 'That is Henry\'s law: it gives a straight line, not a sigmoid.'],
      ['Red cells having no nucleus', 'Relevant to red cell function, but not to binding shape.'],
      ['Carbonic anhydrase activity', 'That enzyme handles CO₂, not O₂ binding.'],
    ],
    0,
    { objectiveIds: ['o-hemoglobin'], conceptIds: ['hemoglobin-binding'], structureIds: ['hemoglobin'] },
    [REF.ap225, REF.bio394],
  ),
  q(
    'q-p50',
    'P50 rises from 27 to 32 mmHg. What does that mean?',
    [
      ['Higher affinity: the curve shifted left', 'A higher P50 means more PO₂ is needed for 50% saturation: lower affinity.'],
      ['Lower affinity: the curve shifted right', 'Correct. Hemoglobin gives up O₂ more readily at any given PO₂.'],
      ['More hemoglobin in the blood', 'P50 describes affinity, not how much hemoglobin there is.'],
      ['Arterial saturation must now be below 50%', 'At PO₂ ~100 mmHg the flat top keeps arterial saturation high.'],
    ],
    1,
    { objectiveIds: ['o-hemoglobin', 'o-shifts'], conceptIds: ['hemoglobin-binding', 'bohr-effect'], structureIds: ['hemoglobin'] },
    [REF.ap225, REF.sev79],
  ),
  q(
    'q-acidosis',
    'Blood pH falls from 7.40 to 7.20, temperature unchanged. How does the dissociation curve move?',
    [
      ['Left: hemoglobin holds O₂ more tightly', 'Acid lowers affinity; a left shift is what alkalosis does.'],
      ['Right: hemoglobin releases O₂ more readily', 'Correct. This is the Bohr effect: P50 rises.'],
      ['It does not move; pH only affects CO₂', 'H⁺ binds hemoglobin and changes its affinity for O₂.'],
      ['It flattens into a straight line', 'The curve keeps its sigmoid shape; it shifts along the PO₂ axis.'],
    ],
    1,
    { objectiveIds: ['o-shifts'], conceptIds: ['bohr-effect'], structureIds: ['hemoglobin'] },
    [REF.ap225, REF.spBohr],
  ),
  q(
    'q-exercise',
    'Compared with resting muscle, exercising muscle is warmer and more acidic. What is the effect on O₂ delivery?',
    [
      ['Less O₂ is unloaded, saving it for the brain', 'Both changes lower affinity, increasing unloading in that muscle.'],
      ['More O₂ is unloaded at the same PO₂', 'Correct. Heat and acid both shift the curve right.'],
      ['No change: only PO₂ matters', 'Affinity also depends on pH, temperature, CO₂ and 2,3-BPG.'],
      ['Hemoglobin stops binding O₂ entirely', 'Binding is reduced, not abolished.'],
    ],
    1,
    { objectiveIds: ['o-shifts'], conceptIds: ['bohr-effect'], structureIds: ['skeletal-muscle', 'hemoglobin'] },
    [REF.ap225, REF.bio394],
  ),
  q(
    'q-co',
    'Why can a standard pulse oximeter look reassuring in carbon monoxide poisoning?',
    [
      ['CO raises PO₂', 'CO does not raise PO₂.'],
      ['It cannot tell carboxyhemoglobin from oxyhemoglobin', 'Correct. Standard pulse oximetry cannot distinguish the two; co-oximetry is needed.'],
      ['CO only affects plasma, not hemoglobin', 'CO binds hemoglobin roughly 200–250 times more avidly than O₂.'],
      ['CO shifts the curve right, which oximeters read as normal', 'CO also impairs O₂ release from hemoglobin, but the false reassurance is a measurement problem.'],
    ],
    1,
    { objectiveIds: ['o-shifts'], conceptIds: ['hemoglobin-binding'], structureIds: ['hemoglobin'] },
    [REF.spCo],
  ),
  q(
    'q-pulm-veins',
    'Which vessels bring oxygen-rich blood back to the heart from the lungs?',
    [
      ['Pulmonary arteries', 'Pulmonary arteries carry deoxygenated blood from the right ventricle to the lungs.'],
      ['Pulmonary veins', 'Correct. They return to the left atrium.'],
      ['Venae cavae', 'The venae cavae return deoxygenated blood from the body to the right atrium.'],
      ['Aorta', 'The aorta carries blood away from the left ventricle.'],
    ],
    1,
    { objectiveIds: ['o-circuit'], conceptIds: ['circulation'], structureIds: ['pulmonary-veins'] },
    [REF.ap191],
  ),
  q(
    'q-lv-wall',
    'Why is the left ventricle\'s wall much thicker than the right\'s?',
    [
      ['It pumps more blood per minute', 'In series circuits, both ventricles pump the same volume over time.'],
      ['It pumps into the high-resistance systemic circuit', 'Correct. It must generate higher pressure.'],
      ['It holds oxygenated blood, which is heavier', 'Oxygenation does not meaningfully change blood density.'],
      ['It contains more valves', 'Each ventricle has an inlet and an outlet valve; wall thickness reflects the pressure it must generate.'],
    ],
    1,
    { objectiveIds: ['o-circuit'], conceptIds: ['circulation'], structureIds: ['left-ventricle', 'right-ventricle'] },
    [REF.ap191],
  ),
  q(
    'q-path-order',
    'Put the path in order: oxygenated blood from the lungs to the body.',
    [
      ['Pulmonary veins → left atrium → mitral valve → left ventricle → aortic valve → aorta', 'Correct.'],
      ['Pulmonary arteries → right atrium → tricuspid valve → right ventricle → aorta', 'This mixes up the right and left sides; the right side handles deoxygenated blood.'],
      ['Pulmonary veins → left ventricle → mitral valve → left atrium → aorta', 'The atrium comes before the ventricle.'],
      ['Pulmonary veins → left atrium → aortic valve → left ventricle → aorta', 'The mitral valve is between atrium and ventricle; the aortic valve is between ventricle and aorta.'],
    ],
    0,
    { objectiveIds: ['o-circuit'], conceptIds: ['circulation'], structureIds: ['pulmonary-veins', 'left-atrium', 'mitral-valve', 'left-ventricle', 'aortic-valve', 'aorta'] },
    [REF.ap191],
  ),
  q(
    'q-final-acceptor',
    'What is oxygen\'s job in the mitochondrion?',
    [
      ['It is the final electron acceptor of the electron transport chain', 'Correct. At complex IV it accepts electrons and H⁺ to form water.'],
      ['It is converted directly into ATP', 'ATP is made by ATP synthase from ADP and phosphate, powered by the H⁺ gradient.'],
      ['It is the source of the CO₂ we exhale', 'CO₂ comes from the carbon in fuel molecules, not from O₂ in this step.'],
      ['It pumps protons across the inner membrane', 'The chain\'s protein complexes pump H⁺; O₂ receives the electrons at the end.'],
    ],
    0,
    { objectiveIds: ['o-mito'], conceptIds: ['cellular-respiration'], structureIds: ['mitochondrion'] },
    [REF.bio74],
  ),
  q(
    'q-cyanide',
    'Cyanide inhibits cytochrome c oxidase. What happens to the cell\'s ability to use oxygen?',
    [
      ['Unchanged; hemoglobin compensates', 'Delivery is not the problem; the use step is blocked.'],
      ['It falls, even if plenty of O₂ is delivered', 'Correct. Complex IV is where O₂ accepts electrons.'],
      ['It rises because more O₂ is released', 'Blocking complex IV stops O₂ use.'],
      ['Only CO₂ transport is affected', 'Cyanide acts on the electron transport chain.'],
    ],
    1,
    { objectiveIds: ['o-mito'], conceptIds: ['cellular-respiration'], structureIds: ['mitochondrion'] },
    [REF.bio74],
  ),
  q(
    'q-bicarb-percent',
    'How is most CO₂ carried in blood?',
    [
      ['Dissolved in plasma', 'Only about 7–10% is dissolved.'],
      ['Bound to the heme iron', 'CO₂ binds the globin chains (carbaminohemoglobin), not the iron, and only ~20% travels that way.'],
      ['As bicarbonate', 'Correct. About 70%, formed in red cells by carbonic anhydrase.'],
      ['As carbonic acid', 'Carbonic acid is a short-lived intermediate that dissociates to H⁺ and HCO₃⁻.'],
    ],
    2,
    { objectiveIds: ['o-co2'], conceptIds: ['co2-acid-base'], structureIds: ['red-blood-cell'] },
    [REF.ap225],
  ),
  q(
    'q-hypovent',
    'If breathing is impaired so that CO₂ builds up, what happens to arterial pH?',
    [
      ['It rises (alkalosis)', 'More CO₂ means more carbonic acid and H⁺: pH falls.'],
      ['It falls (respiratory acidosis)', 'Correct. Retained CO₂ is converted to H⁺ and HCO₃⁻.'],
      ['It does not change; CO₂ is not an acid', 'CO₂ + H₂O forms carbonic acid.'],
      ['It falls, but only because O₂ drops', 'The pH change comes from CO₂, not from low O₂.'],
    ],
    1,
    { objectiveIds: ['o-co2'], conceptIds: ['co2-acid-base'], structureIds: ['red-blood-cell', 'alveolus'] },
    [REF.ap265, REF.ap264],
  ),
  q(
    'q-chloride',
    'Bicarbonate formed in a red blood cell moves into plasma. What crosses the membrane the other way?',
    [
      ['Sodium', 'Not the exchange partner here.'],
      ['Chloride', 'Correct. This is the chloride shift.'],
      ['Oxygen', 'O₂ diffuses independently down its own gradient.'],
      ['Hydrogen ions', 'H⁺ is mostly buffered by hemoglobin inside the cell.'],
    ],
    1,
    { objectiveIds: ['o-co2'], conceptIds: ['co2-acid-base', 'membrane-transport'], structureIds: ['red-blood-cell'] },
    [REF.ap225],
  ),
];

/** Recall question shown after the dissociation-curve experiment. */
export const EXPERIMENT_RECALL_ID = 'q-p50';

export const questionById = (id: string) => QUESTIONS.find((x) => x.id === id);
