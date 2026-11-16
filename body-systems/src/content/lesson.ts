/** The guided learning journey: "Follow an Oxygen Molecule". */
import type { Lesson } from '../domain/types';
import { L, draft } from './helpers';
import { REF } from './sources';

export const OXYGEN_JOURNEY: Lesson = {
  id: 'oxygen-journey',
  title: 'Follow an Oxygen Molecule',
  summary:
    'Trace one O₂ molecule from the air you breathe to the mitochondrion that uses it, and the CO₂ that comes back. Each stop connects anatomy, physiology, biology and chemistry.',
  prerequisites: [
    { text: 'Pressure, and the idea that gases flow from high to low pressure' },
    { text: 'Basic cell structure: plasma membrane, cytoplasm, organelles' },
    { text: 'What an acid is, and that pH falls as [H⁺] rises' },
    { text: 'Proteins have shapes that can change when something binds', conceptId: 'hemoglobin-binding' },
  ],
  objectives: [
    { id: 'o-ventilation', text: 'Explain how contracting the diaphragm draws air into the lungs, using Boyle\'s law.', questionIds: ['q-boyle', 'q-conducting'] },
    { id: 'o-gradients', text: 'Use partial pressures to predict which way O₂ and CO₂ diffuse in the lungs and in the tissues.', questionIds: ['q-alv-po2', 'q-co2-solubility', 'q-tissue-gradient'] },
    { id: 'o-hemoglobin', text: 'Explain how the S-shaped dissociation curve lets hemoglobin load in the lungs and unload in the tissues.', questionIds: ['q-dissolved', 'q-sigmoid', 'q-p50'] },
    { id: 'o-shifts', text: 'Predict how pH, temperature and CO₂ shift the curve, and why that helps working tissue.', questionIds: ['q-acidosis', 'q-exercise', 'q-co'] },
    { id: 'o-circuit', text: 'Trace oxygenated blood from the lungs through the heart to the aorta.', questionIds: ['q-pulm-veins', 'q-lv-wall', 'q-path-order'] },
    { id: 'o-mito', text: 'Explain the role of O₂ as the final electron acceptor in mitochondria.', questionIds: ['q-final-acceptor', 'q-cyanide'] },
    { id: 'o-co2', text: 'Describe how CO₂ is carried back to the lungs and how it affects blood pH.', questionIds: ['q-bicarb-percent', 'q-hypovent', 'q-chloride'] },
  ],
  steps: [
    {
      id: 's1-inhale',
      title: 'Breathing in',
      whereNow: 'In the air, about to enter the nose',
      view: { diagram: 'body', highlight: ['diaphragm', 'trachea', 'lungs'], caption: 'The diaphragm contracts and flattens; air flows down the trachea into both lungs.' },
      body: L(
        [
          'Our oxygen molecule starts in ordinary air, where O₂ is about 21% of the molecules. Its partial pressure there is about 159 mmHg at sea level.',
          'The diaphragm contracts and moves down. The chest cavity gets bigger, so pressure inside the lungs drops just below atmospheric pressure, and air flows in through the trachea and branching airways.',
        ],
        [
          'Boyle\'s law (P₁V₁ = P₂V₂) explains the direction of flow: more volume, lower pressure. The airways down to the terminal bronchioles are the conducting zone: they warm, humidify and filter air but exchange no gas.',
          'Humidification adds water vapour, which takes up part of the total pressure, so inspired PO₂ in the airways is a little lower than in dry outside air.',
        ],
      ),
      values: [{ label: 'PO₂ in atmospheric air (sea level)', value: '158.8 mmHg', note: 'OpenStax A&P 2e, Table 22.2' }],
      structureIds: ['diaphragm', 'trachea', 'lungs'],
      conceptIds: ['ventilation-mechanics'],
      glossaryIds: ['boyles-law', 'conducting-zone', 'partial-pressure'],
      checkQuestionId: 'q-boyle',
    },
    {
      id: 's2-alveolus',
      title: 'Crossing into the blood',
      whereNow: 'In an alveolus, next to a capillary',
      view: { diagram: 'lung', highlight: ['alveolus', 'respiratory-membrane', 'pulmonary-capillary'], caption: 'O₂ diffuses from alveolar air across the ~0.5 µm respiratory membrane into capillary blood; CO₂ goes the other way.' },
      body: L(
        [
          'In the alveolus, PO₂ is about 104 mmHg. Blood arriving in the surrounding capillary has a PO₂ of only about 40 mmHg. Our molecule diffuses down that gradient, across the thin wall and into the blood.',
          'The respiratory membrane is only about 0.5 µm thick and covers a very large area, so this happens quickly.',
        ],
        [
          'Each gas moves according to its own partial-pressure gradient (Dalton\'s law). CO₂ leaves the blood down a gradient of only ~5 mmHg (45 → 40), but it is far more soluble than O₂, so similar amounts of both gases cross.',
          'The factors that set the diffusion rate (area, thickness, gradient and the gas\'s properties) are the terms of Fick\'s law. Local ventilation–perfusion matching sends blood toward well-ventilated alveoli.',
        ],
      ),
      values: [
        { label: 'Alveolar PO₂', value: '≈ 104 mmHg' },
        { label: 'PO₂ of blood entering pulmonary capillaries', value: '≈ 40 mmHg' },
        { label: 'PCO₂: blood → alveolus', value: '≈ 45 → 40 mmHg' },
      ],
      structureIds: ['alveolus', 'respiratory-membrane', 'type-1-cell', 'type-2-cell', 'pulmonary-capillary'],
      conceptIds: ['partial-pressure-diffusion', 'membrane-transport'],
      glossaryIds: ['diffusion', 'respiratory-membrane', 'partial-pressure'],
      checkQuestionId: 'q-alv-po2',
    },
    {
      id: 's3-hemoglobin',
      title: 'Boarding hemoglobin',
      whereNow: 'Inside a red blood cell, bound to a heme iron',
      view: { diagram: 'lung', highlight: ['red-blood-cell', 'pulmonary-capillary'], caption: 'Red cells pass through the capillary in single file; hemoglobin inside them binds the arriving O₂.' },
      body: L(
        [
          'Plasma dissolves very little O₂, so our molecule quickly enters a red blood cell and binds to an iron atom in a heme group of hemoglobin. About 98.5% of blood O₂ travels this way; only about 1.5% stays dissolved.',
          'Each hemoglobin can carry four O₂. Binding is cooperative: once one O₂ binds, the others bind more easily. This gives the oxygen–hemoglobin dissociation curve its S shape.',
        ],
        [
          'On the standard curve, PO₂ 100 mmHg gives ~97–98% saturation and P50 is ~27 mmHg. The flat top means saturation barely changes if alveolar PO₂ dips a little. Try it in the dissociation-curve experiment.',
        ],
      ),
      values: [
        { label: 'O₂ bound to hemoglobin', value: '≈ 98.5%' },
        { label: 'O₂ dissolved in plasma', value: '≈ 1.5%' },
        { label: 'Saturation at PO₂ 100 mmHg (standard curve)', value: '≈ 97.7%', note: 'Severinghaus 1979, Eq. 1' },
      ],
      structureIds: ['red-blood-cell', 'hemoglobin', 'pulmonary-capillary'],
      conceptIds: ['hemoglobin-binding'],
      glossaryIds: ['hemoglobin', 'saturation', 'cooperativity', 'p50'],
      checkQuestionId: 'q-sigmoid',
    },
    {
      id: 's4-heart',
      title: 'Through the left heart',
      whereNow: 'Travelling from the lungs through the left side of the heart',
      view: { diagram: 'heart', highlight: ['pulmonary-veins', 'left-atrium', 'mitral-valve', 'left-ventricle', 'aortic-valve', 'aorta'], caption: 'Pulmonary veins → left atrium → mitral valve → left ventricle → aortic valve → aorta.' },
      body: L(
        [
          'Blood carrying our molecule leaves the lungs in a pulmonary vein and enters the left atrium. It passes through the mitral (bicuspid) valve into the left ventricle.',
          'The left ventricle contracts. The mitral valve closes, the aortic valve opens, and the blood is pushed into the aorta and out to the body.',
        ],
        [
          'The left ventricle\'s wall is much thicker than the right\'s because it drives blood through the high-resistance systemic circuit. The right side, which our molecule never passes through on this trip, pumps deoxygenated blood into the low-resistance pulmonary circuit.',
        ],
      ),
      structureIds: ['pulmonary-veins', 'left-atrium', 'mitral-valve', 'left-ventricle', 'aortic-valve', 'aorta'],
      conceptIds: ['circulation'],
      glossaryIds: ['pulmonary-circuit', 'systemic-circuit'],
      checkQuestionId: 'q-path-order',
    },
    {
      id: 's5-delivery',
      title: 'Delivery to working muscle',
      whereNow: 'In a systemic capillary in thigh muscle',
      view: { diagram: 'tissue', highlight: ['systemic-capillary', 'red-blood-cell', 'hemoglobin', 'cell-membrane'], caption: 'Hemoglobin releases O₂, which diffuses out of the capillary and through the muscle cell\'s membrane.' },
      body: L(
        [
          'Arterial blood reaches a capillary in the thigh with PO₂ around 100 mmHg. Tissue PO₂ is about 40 mmHg, so O₂ diffuses out of the blood. As plasma PO₂ falls, hemoglobin releases its O₂, including our molecule.',
          'O₂ is small and nonpolar, so it passes through the capillary wall and the muscle cell\'s plasma membrane by simple diffusion.',
        ],
        [
          'Working muscle is warmer, more acidic and has more CO₂. Each of these shifts the dissociation curve to the right (Bohr effect), so hemoglobin unloads more O₂ at the same PO₂. On the standard curve, blood leaving a resting tissue at PO₂ 40 mmHg is still ~75% saturated: a reserve for exercise.',
        ],
      ),
      values: [
        { label: 'Arterial PO₂', value: '≈ 100 mmHg' },
        { label: 'Tissue PO₂ at rest', value: '≈ 40 mmHg' },
        { label: 'Saturation at PO₂ 40 mmHg (standard curve)', value: '≈ 75%', note: 'Severinghaus 1979, Eq. 1' },
      ],
      structureIds: ['systemic-capillary', 'red-blood-cell', 'hemoglobin', 'cell-membrane', 'skeletal-muscle'],
      conceptIds: ['bohr-effect', 'partial-pressure-diffusion', 'membrane-transport'],
      glossaryIds: ['bohr-effect', 'diffusion'],
      checkQuestionId: 'q-exercise',
    },
    {
      id: 's6-mitochondrion',
      title: 'The end of the line: a mitochondrion',
      whereNow: 'At complex IV in the inner mitochondrial membrane',
      view: { diagram: 'tissue', highlight: ['mitochondrion'], caption: 'O₂ accepts electrons at the end of the electron transport chain and becomes water.' },
      body: L(
        [
          'Our molecule diffuses to a mitochondrion. On the inner membrane, the electron transport chain passes electrons from food molecules along a series of proteins.',
          'At the last of them, complex IV (cytochrome c oxidase), our O₂ accepts electrons, picks up H⁺ and becomes water. Its journey as O₂ ends here.',
        ],
        [
          'The energy released along the chain pumps H⁺ out of the matrix. H⁺ flowing back through ATP synthase makes ATP (chemiosmosis), which supplies most of the cell\'s aerobic ATP. Constant O₂ use keeps intracellular PO₂ low, which keeps O₂ diffusing in.',
          'Cyanide inhibits cytochrome c oxidase, so cells cannot use oxygen even when plenty is delivered.',
        ],
      ),
      structureIds: ['mitochondrion', 'skeletal-muscle'],
      conceptIds: ['cellular-respiration'],
      glossaryIds: ['electron-transport-chain', 'chemiosmosis', 'atp'],
      checkQuestionId: 'q-final-acceptor',
    },
    {
      id: 's7-co2',
      title: 'The return trip: carbon dioxide',
      whereNow: 'Our O₂ is now water; follow the CO₂ the cell produced',
      view: { diagram: 'tissue', highlight: ['red-blood-cell', 'systemic-capillary'], caption: 'CO₂ diffuses into the blood; in red cells most becomes bicarbonate, which returns to the lungs.' },
      body: L(
        [
          'Breaking down fuel produces CO₂. It diffuses from the cell into the capillary blood (tissue PCO₂ is higher than arterial).',
          'About 70% of it is turned into bicarbonate inside red blood cells by carbonic anhydrase, about 20% binds hemoglobin, and 7–10% stays dissolved. Venous blood carries it back through the right heart to the lungs, where it is breathed out.',
        ],
        [
          'Converting CO₂ to bicarbonate also produces H⁺, so CO₂ links breathing to blood pH. Anything that impairs breathing raises PCO₂ and lowers pH (respiratory acidosis). Normal arterial pH is 7.35–7.45.',
          'Bicarbonate leaves the red cell in exchange for chloride (the chloride shift). In the lungs, all of these reactions run in reverse as CO₂ is removed.',
        ],
      ),
      values: [
        { label: 'CO₂ as bicarbonate', value: '≈ 70%' },
        { label: 'CO₂ bound to hemoglobin', value: '≈ 20%' },
        { label: 'CO₂ dissolved', value: '7–10%' },
        { label: 'Normal arterial pH', value: '7.35–7.45' },
      ],
      structureIds: ['red-blood-cell', 'systemic-capillary', 'vena-cava', 'right-atrium', 'right-ventricle', 'pulmonary-arteries'],
      conceptIds: ['co2-acid-base', 'cellular-respiration'],
      glossaryIds: ['bicarbonate', 'carbonic-anhydrase', 'chloride-shift', 'haldane-effect'],
      checkQuestionId: 'q-bicarb-percent',
    },
  ],
  provenance: draft(
    [REF.ap223, REF.ap224, REF.ap225, REF.ap191, REF.ap203, REF.bio74, REF.bio394, REF.ap265, REF.sev79],
    'Each step\'s facts are checked against the cited sections. The lesson is marked draft only because it mentions Fick\'s law by name, which is not yet confirmed as an equation in a fetched source. No subject-expert review has taken place.',
  ),
};
