/** Editorial flashcards, labeling exercises, curated resources, and the simulation spec. */
import type { Flashcard, LabelingExercise, Resource, SimulationSpec } from '../domain/types';
import { checked } from './helpers';
import { REF } from './sources';
import { EQ } from './concepts';
import { SUPPORTED_RANGE } from '../science/odc';

const card = (id: string, front: string, back: string, conceptIds: string[], structureIds: string[], refs: Flashcard['provenance']['sources']): Flashcard => ({
  id,
  front,
  back,
  conceptIds,
  structureIds,
  provenance: checked(refs),
});

export const FLASHCARDS: Flashcard[] = [
  card('fc-lobes', 'How many lobes does each lung have?', 'Right: 3 (superior, middle, inferior). Left: 2 (superior, inferior), plus the cardiac notch.', [], ['lungs'], [REF.ap222]),
  card('fc-boyle', 'Why does air flow in when the diaphragm contracts?', 'Thoracic volume rises, so intrapulmonary pressure falls below atmospheric (Boyle\'s law).', ['ventilation-mechanics'], ['diaphragm'], [REF.ap223]),
  card('fc-alv-po2', 'Typical alveolar PO₂ and PCO₂?', 'PO₂ ≈ 104 mmHg; PCO₂ ≈ 40 mmHg.', ['partial-pressure-diffusion'], ['alveolus'], [REF.ap224]),
  card('fc-venous', 'PO₂ and PCO₂ of blood entering the pulmonary capillaries?', 'PO₂ ≈ 40 mmHg; PCO₂ ≈ 45 mmHg.', ['partial-pressure-diffusion'], ['pulmonary-capillary'], [REF.ap224]),
  card('fc-membrane', 'Thickness of the respiratory membrane?', 'About 0.5 µm.', ['partial-pressure-diffusion'], ['respiratory-membrane'], [REF.ap221]),
  card('fc-co2-sol', 'Why does CO₂ cross the respiratory membrane as readily as O₂ despite a smaller gradient?', 'CO₂ is much more soluble than O₂.', ['partial-pressure-diffusion'], ['respiratory-membrane'], [REF.ap224]),
  card('fc-type2', 'What do type II alveolar cells secrete, and why?', 'Surfactant (phospholipids + proteins); it lowers surface tension so alveoli stay open.', [], ['type-2-cell'], [REF.ap221]),
  card('fc-hb-pct', 'Share of blood O₂ bound to hemoglobin vs dissolved?', '≈ 98.5% bound; ≈ 1.5% dissolved.', ['hemoglobin-binding'], ['hemoglobin'], [REF.bio394]),
  card('fc-p50', 'Standard P50 of adult hemoglobin?', '≈ 27 mmHg (37 °C, pH 7.40). Higher P50 = lower affinity = right shift.', ['hemoglobin-binding'], ['hemoglobin'], [REF.sev79]),
  card('fc-right', 'Four things that shift the O₂–Hb curve to the right?', '↓ pH, ↑ temperature, ↑ PCO₂, ↑ 2,3-BPG.', ['bohr-effect'], ['hemoglobin'], [REF.ap225]),
  card('fc-coop', 'Why is the O₂–Hb curve sigmoid?', 'Cooperative binding: each O₂ that binds raises the affinity of the remaining sites.', ['hemoglobin-binding'], ['hemoglobin'], [REF.ap225]),
  card('fc-mitral', 'Valve between left atrium and left ventricle?', 'Mitral (bicuspid) valve: two cusps.', ['circulation'], ['mitral-valve'], [REF.ap191]),
  card('fc-complexIV', 'What happens to O₂ at complex IV?', 'It accepts electrons and H⁺ to form water: O₂ + 4e⁻ + 4H⁺ → 2H₂O.', ['cellular-respiration'], ['mitochondrion'], [REF.bio74]),
  card('fc-cyanide', 'Which enzyme does cyanide inhibit?', 'Cytochrome c oxidase (complex IV).', ['cellular-respiration'], ['mitochondrion'], [REF.bio74]),
  card('fc-co2-forms', 'Three forms of CO₂ in blood, with rough shares?', 'Bicarbonate ≈ 70%; carbaminohemoglobin ≈ 20%; dissolved 7–10%.', ['co2-acid-base'], ['red-blood-cell'], [REF.ap225]),
  card('fc-ph', 'Normal arterial pH range?', '7.35–7.45.', ['co2-acid-base'], [], [REF.ap265]),
  card('fc-chloride', 'What is the chloride shift?', 'HCO₃⁻ leaves the red cell in exchange for Cl⁻ entering.', ['co2-acid-base', 'membrane-transport'], ['red-blood-cell'], [REF.ap225]),
];

export const LABELING: LabelingExercise[] = [
  {
    id: 'lab-heart',
    title: 'Label the heart: the path of oxygenated blood',
    diagram: 'heart',
    targets: [
      { structureId: 'right-atrium', marker: 1 },
      { structureId: 'right-ventricle', marker: 2 },
      { structureId: 'left-atrium', marker: 3 },
      { structureId: 'left-ventricle', marker: 4 },
      { structureId: 'mitral-valve', marker: 5 },
      { structureId: 'aorta', marker: 6 },
    ],
    distractorStructureIds: ['pulmonary-veins', 'tricuspid-valve'],
    objectiveIds: ['o-circuit'],
    provenance: checked([REF.ap191]),
  },
  {
    id: 'lab-alveolus',
    title: 'Label the alveolus and capillary',
    diagram: 'lung',
    targets: [
      { structureId: 'bronchiole', marker: 1 },
      { structureId: 'alveolus', marker: 2 },
      { structureId: 'type-1-cell', marker: 3 },
      { structureId: 'type-2-cell', marker: 4 },
      { structureId: 'pulmonary-capillary', marker: 5 },
      { structureId: 'red-blood-cell', marker: 6 },
    ],
    distractorStructureIds: ['respiratory-membrane', 'systemic-capillary'],
    objectiveIds: ['o-gradients'],
    provenance: checked([REF.ap221]),
  },
];

const AP = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/';

export const RESOURCES: Resource[] = [
  {
    id: 'res-ap224',
    title: 'Gas Exchange (OpenStax A&P 2e, 22.4)',
    kind: 'reading',
    sourceId: 'openstax-ap2e',
    url: `${AP}22-4-gas-exchange`,
    attribution: 'Betts et al., OpenStax, CC BY-NC-SA 4.0',
    why: 'Partial pressures, Dalton\'s and Henry\'s laws, and ventilation–perfusion matching, with a table of values.',
    conceptIds: ['partial-pressure-diffusion'],
    structureIds: ['alveolus', 'respiratory-membrane'],
  },
  {
    id: 'res-ap225',
    title: 'Transport of Gases (OpenStax A&P 2e, 22.5)',
    kind: 'reading',
    sourceId: 'openstax-ap2e',
    url: `${AP}22-5-transport-of-gases`,
    attribution: 'Betts et al., OpenStax, CC BY-NC-SA 4.0',
    why: 'Hemoglobin binding, curve shifts, CO₂ transport, chloride shift and Haldane effect.',
    conceptIds: ['hemoglobin-binding', 'bohr-effect', 'co2-acid-base'],
    structureIds: ['hemoglobin', 'red-blood-cell'],
  },
  {
    id: 'res-ap191',
    title: 'Heart Anatomy (OpenStax A&P 2e, 19.1)',
    kind: 'reading',
    sourceId: 'openstax-ap2e',
    url: `${AP}19-1-heart-anatomy`,
    attribution: 'Betts et al., OpenStax, CC BY-NC-SA 4.0',
    why: 'Chambers, valves and the pulmonary and systemic circuits.',
    conceptIds: ['circulation'],
    structureIds: ['heart', 'left-ventricle', 'mitral-valve'],
  },
  {
    id: 'res-bio74',
    title: 'Oxidative Phosphorylation (OpenStax Biology 2e, 7.4)',
    kind: 'reading',
    sourceId: 'openstax-bio2e',
    url: 'https://openstax.org/books/biology-2e/pages/7-4-oxidative-phosphorylation',
    attribution: 'Clark, Douglas & Choi, OpenStax, CC BY-NC-SA 4.0',
    why: 'The electron transport chain, chemiosmosis and ATP synthase.',
    conceptIds: ['cellular-respiration'],
    structureIds: ['mitochondrion'],
  },
  {
    id: 'res-ap203',
    title: 'Capillary Exchange (OpenStax A&P 2e, 20.3)',
    kind: 'reading',
    sourceId: 'openstax-ap2e',
    url: `${AP}20-3-capillary-exchange`,
    attribution: 'Betts et al., OpenStax, CC BY-NC-SA 4.0',
    why: 'How substances, including gases, cross capillary walls.',
    conceptIds: ['membrane-transport'],
    structureIds: ['systemic-capillary', 'cell-membrane'],
  },
  {
    id: 'res-ninja-odc',
    title: 'Respiratory | Oxygen-Hemoglobin Dissociation Curve',
    kind: 'video',
    sourceId: 'ninja-nerd-odc',
    url: 'https://www.youtube.com/watch?v=bhJarMGNFw4',
    attribution: 'Ninja Nerd, YouTube. Linked, not embedded; no affiliation.',
    why: 'A long-form whiteboard walk-through of the curve and its shifts.',
    conceptIds: ['hemoglobin-binding', 'bohr-effect'],
    structureIds: ['hemoglobin'],
  },
  {
    id: 'res-khan-bohr',
    title: 'Bohr effect vs. Haldane effect',
    kind: 'video',
    sourceId: 'khan-bohr-haldane',
    url: 'https://www.youtube.com/watch?v=dHi9ctwDUnc',
    attribution: 'Khan Academy Medicine, YouTube. Linked, not embedded; no affiliation.',
    why: 'Separates two effects students often mix up.',
    conceptIds: ['bohr-effect', 'co2-acid-base'],
    structureIds: ['hemoglobin'],
  },
];

export const ODC_SIMULATION: SimulationSpec = {
  id: 'odc',
  title: 'Oxygen–hemoglobin dissociation curve',
  model: 'Severinghaus (1979) standard curve, Eq. 1, with temperature (Eq. 3) and pH/Bohr (Eq. 4) coefficients from the same paper.',
  equations: [
    EQ.hill,
    {
      id: 'sev-shift',
      name: 'Shifting the curve for temperature and pH (Eq. 3 and 4, applied as in this app)',
      tex: 'P_{\\mathrm{O_2}} = P_{\\mathrm{O_2},s}\\,\\exp\\!\\big[c_T\\,(T - 37) + c_{\\mathrm{pH}}\\,(\\mathrm{pH} - 7.40)\\big]',
      variables: [
        { symbol: 'P_{\\mathrm{O_2},s}', meaning: 'PO₂ that gives the same saturation on the standard curve', unit: 'mmHg' },
        { symbol: 'c_T', meaning: 'Eq. 3: 0.058 / ((0.243·PO₂,s/100)^3.88 + 1) + 0.013', unit: 'per °C', typical: '≈ 0.071 near P50' },
        { symbol: 'c_{\\mathrm{pH}}', meaning: 'Eq. 4 (Bohr coefficient): (PO₂,s/26.6)^0.184 − 2.2', unit: 'per pH unit', typical: '≈ −1.2 near P50' },
        { symbol: 'T', meaning: 'blood temperature', unit: '°C' },
      ],
      limits: 'The paper gives these as coefficients (rates of change). Treating them as constant over a change of several °C or 0.3 pH units is our first-order approximation, so accuracy falls toward the edges of the range.',
    },
  ],
  params: [
    { key: 'pH', label: 'Blood pH', unit: '', min: SUPPORTED_RANGE.pH.min, max: SUPPORTED_RANGE.pH.max, step: 0.01, baseline: 7.4 },
    { key: 'temperatureC', label: 'Temperature', unit: '°C', min: SUPPORTED_RANGE.temperatureC.min, max: SUPPORTED_RANGE.temperatureC.max, step: 0.5, baseline: 37 },
  ],
  assumptions: [
    'Standard adult human hemoglobin (HbA), normal 2,3-BPG, no carbon monoxide or methemoglobin.',
    'Baseline: 37 °C, pH 7.40 (the conditions the standard curve was fitted to).',
    'CO₂ acts only through pH here. The source gives no separate PCO₂ term.',
    'Saturation does not depend on hemoglobin concentration: anemia lowers O₂ content, not the curve.',
    'Population-average curve for teaching. It is not a patient-specific prediction and must not be used for clinical decisions.',
  ],
  notModelled: ['2,3-BPG', 'Carbon monoxide', 'Fetal hemoglobin', 'Abnormal hemoglobins', 'Separate PCO₂ effect at constant pH'],
  provenance: checked(
    [REF.sev79, REF.ap225],
    'Equation 1 and the coefficient equations 3 and 4 were checked against the paper\'s abstract (PMID 35496). Combining them as a constant-coefficient shift is our modelling choice, stated in the limits. Code is tested against reference values (P50 ≈ 26.9 mmHg; SO₂ ≈ 75% at 40 mmHg).',
  ),
};
