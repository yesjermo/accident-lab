/**
 * Mechanism concepts, the concept map, and the glossary.
 * Each concept's "Why does this happen?" layers go from intuition to molecules.
 */
import type { Concept, Equation, GlossaryTerm, Relationship } from '../domain/types';
import { L, checked, draft } from './helpers';
import { REF } from './sources';

export const EQ: Record<string, Equation> = {
  dalton: {
    id: 'dalton',
    name: "Dalton's law (partial pressure)",
    tex: 'P_{\\text{gas}} = F_{\\text{gas}} \\times P_{\\text{total}}',
    variables: [
      { symbol: 'P_{\\text{gas}}', meaning: 'partial pressure of one gas', unit: 'mmHg' },
      { symbol: 'F_{\\text{gas}}', meaning: 'fraction of the mixture that is that gas', unit: 'dimensionless', typical: '0.21 for O₂ in dry air' },
      { symbol: 'P_{\\text{total}}', meaning: 'total pressure of the mixture', unit: 'mmHg', typical: '760 at sea level' },
    ],
    limits: 'Treats each gas as ideal and independent. Fine at body pressures; in humid airway air, water vapour takes up part of the total pressure first.',
  },
  fick: {
    id: 'fick',
    name: "Fick's law of diffusion (across a sheet)",
    tex: '\\dot V_{\\text{gas}} \\propto \\dfrac{A}{T}\\, D\\, (P_1 - P_2)',
    variables: [
      { symbol: '\\dot V_{\\text{gas}}', meaning: 'rate of gas transfer across the membrane', unit: 'mL/min' },
      { symbol: 'A', meaning: 'surface area of the membrane', unit: 'm²' },
      { symbol: 'T', meaning: 'thickness of the membrane', unit: 'µm', typical: '≈ 0.5 µm' },
      { symbol: 'D', meaning: 'diffusion constant: rises with the gas\'s solubility, falls with its molecular size', unit: 'depends on the form used' },
      { symbol: 'P_1 - P_2', meaning: 'partial-pressure difference across the membrane', unit: 'mmHg' },
    ],
    limits: 'Steady-state, uniform membrane. The real lung is uneven in thickness, ventilation and blood flow, and O₂ uptake is also limited by how fast blood flows past (perfusion) and by binding to hemoglobin.',
  },
  hill: {
    id: 'severinghaus',
    name: 'Standard O₂–hemoglobin dissociation curve (Severinghaus 1979, Eq. 1)',
    tex: 'S = \\left(\\dfrac{23\\,400}{P_{\\mathrm{O_2}}^{3} + 150\\,P_{\\mathrm{O_2}}} + 1\\right)^{-1}',
    variables: [
      { symbol: 'S', meaning: 'fractional hemoglobin O₂ saturation', unit: '0–1 (×100 for %)' },
      { symbol: 'P_{\\mathrm{O_2}}', meaning: 'partial pressure of O₂ in blood', unit: 'mmHg (Torr)' },
    ],
    limits: 'Empirical fit to the standard adult human curve at 37 °C and pH 7.40, within ±0.0055 saturation. Not valid for fetal or abnormal hemoglobin, carbon monoxide, or altered 2,3-BPG.',
  },
  hh: {
    id: 'henderson-hasselbalch',
    name: 'Henderson–Hasselbalch for the bicarbonate buffer',
    tex: '\\mathrm{pH} = 6.1 + \\log_{10}\\dfrac{[\\mathrm{HCO_3^-}]}{0.03 \\times P_{\\mathrm{CO_2}}}',
    variables: [
      { symbol: '6.1', meaning: 'apparent pKa of carbonic acid/CO₂ in plasma at 37 °C', unit: 'dimensionless' },
      { symbol: '[\\mathrm{HCO_3^-}]', meaning: 'plasma bicarbonate concentration', unit: 'mmol/L', typical: '≈ 24' },
      { symbol: '0.03', meaning: 'solubility of CO₂ in plasma', unit: 'mmol/L per mmHg' },
      { symbol: 'P_{\\mathrm{CO_2}}', meaning: 'partial pressure of CO₂', unit: 'mmHg', typical: '≈ 40' },
    ],
    limits: 'Describes one buffer at equilibrium. It does not say what caused a change, and the body has other buffers (proteins, phosphate). The clinical constants 6.1 and 0.03 are not yet confirmed in a fetched source; see provenance.',
  },
  complexIV: {
    id: 'complex-iv',
    name: 'Reduction of O₂ at complex IV',
    tex: '\\ce{O2 + 4e- + 4H+ -> 2H2O}',
    variables: [
      { symbol: '\\ce{e-}', meaning: 'electrons delivered along the electron transport chain', unit: 'count' },
      { symbol: '\\ce{H+}', meaning: 'protons from the mitochondrial matrix', unit: 'count' },
    ],
    limits: 'Net equation. The real reaction passes through bound intermediates inside cytochrome c oxidase.',
  },
  carbonic: {
    id: 'carbonic-anhydrase',
    name: 'CO₂ hydration (carbonic anhydrase)',
    tex: '\\ce{CO2 + H2O <=>[\\text{carbonic anhydrase}] H2CO3 <=> H+ + HCO3-}',
    variables: [
      { symbol: '\\ce{H2CO3}', meaning: 'carbonic acid', unit: 'mmol/L' },
      { symbol: '\\ce{HCO3-}', meaning: 'bicarbonate, the main form CO₂ travels in', unit: 'mmol/L' },
    ],
    limits: 'Reversible: the direction depends on concentrations (Le Chatelier). The enzyme speeds the reaction in both directions but does not change the equilibrium.',
  },
};

export const CONCEPTS: Concept[] = [
  {
    id: 'ventilation-mechanics',
    name: 'Breathing and Boyle\'s law',
    discipline: 'physics',
    oneLine: 'A bigger chest means lower pressure inside the lungs, so air flows in.',
    why: [
      { depth: 'intuition', title: 'Air flows from high to low pressure', body: L('Air moves into the lungs for the same reason it rushes into a squeezed-then-released bottle: pressure inside drops below pressure outside.') },
      {
        depth: 'physiology',
        title: 'The diaphragm changes the volume',
        body: L(
          'Contracting the diaphragm (and external intercostals) enlarges the thoracic cavity. The lungs are held against the chest wall by the pleural seal, so they expand too.',
          'Quiet expiration is mostly passive elastic recoil; forced expiration recruits abdominal and internal intercostal muscles.',
        ),
        equations: [
          {
            id: 'boyle',
            name: "Boyle's law",
            tex: 'P_1 V_1 = P_2 V_2',
            variables: [
              { symbol: 'P', meaning: 'pressure of the gas in the lungs', unit: 'mmHg' },
              { symbol: 'V', meaning: 'volume of the lungs', unit: 'L' },
            ],
            limits: 'Holds for a fixed amount of gas at constant temperature. During a breath gas is flowing in, so this explains the direction of flow, not its exact amount.',
          },
        ],
      },
    ],
    simplifications: ['Ignores airway resistance and lung compliance, which set how much air moves for a given pressure change.'],
    structureIds: ['diaphragm', 'lungs', 'trachea'],
    glossaryIds: ['boyles-law', 'conducting-zone'],
    provenance: checked([REF.ap223]),
  },
  {
    id: 'partial-pressure-diffusion',
    name: 'Diffusion and partial-pressure gradients',
    discipline: 'chemistry',
    oneLine: 'Each gas diffuses from where its partial pressure is higher to where it is lower.',
    why: [
      {
        depth: 'intuition',
        title: 'Gases spread out',
        body: L('Molecules move randomly. Where there are more of them, more move away than come back, so there is a net flow toward where there are fewer. For a gas, "how many" is measured as partial pressure.'),
      },
      {
        depth: 'physiology',
        title: 'Two gradients, in opposite directions',
        body: L(
          'In the lungs, alveolar PO₂ (~104 mmHg) is higher than in arriving blood (~40), so O₂ moves into blood. Blood PCO₂ (~45) is higher than alveolar (~40), so CO₂ moves out. In tissues the gradients reverse.',
          'The CO₂ gradient is only ~5 mmHg, but CO₂ is much more soluble than O₂, so similar amounts of each cross. Ventilation keeps alveolar PO₂ high; tissue metabolism keeps tissue PO₂ low. Remove either and the gradient shrinks.',
        ),
        equations: [EQ.dalton],
      },
      {
        depth: 'cellular',
        title: 'A very thin, very large membrane',
        body: L('The respiratory membrane is about 0.5 µm thick and spread over an enormous alveolar surface. Thin and large both make diffusion faster.'),
        equations: [EQ.fick],
      },
      {
        depth: 'molecular',
        title: 'Why gases need no transporter',
        body: L('O₂ and CO₂ are small and nonpolar. They dissolve in the lipid core of cell membranes and pass straight through, so no channel or ATP is needed.'),
      },
    ],
    simplifications: [
      'Partial pressures shown are typical resting values, rounded; they vary across the lung and between people.',
      'Fick\'s law is shown as a proportionality: it lists the factors, not exact numbers.',
    ],
    structureIds: ['alveolus', 'respiratory-membrane', 'systemic-capillary', 'cell-membrane'],
    glossaryIds: ['partial-pressure', 'diffusion', 'respiratory-membrane'],
    provenance: draft(
      [REF.ap224, REF.ap221, REF.ap203],
      'Partial pressures, membrane thickness and the factors affecting diffusion are checked against OpenStax 22.4 and 22.1. Fick\'s law written as an equation is not yet confirmed in a fetched source.',
    ),
  },
  {
    id: 'hemoglobin-binding',
    name: 'Hemoglobin and oxygen binding',
    discipline: 'biology',
    oneLine: 'Cooperative binding gives an S-shaped curve: load fully in the lungs, unload in the tissues.',
    why: [
      {
        depth: 'intuition',
        title: 'A carrier that grabs and lets go',
        body: L('Blood plasma dissolves very little O₂. Hemoglobin acts as a carrier: it picks O₂ up where O₂ is plentiful and releases it where O₂ is scarce.'),
      },
      {
        depth: 'physiology',
        title: 'The flat top and the steep middle',
        body: L(
          'The curve is flat near the top, so arterial blood stays nearly saturated even if lung PO₂ falls a little. It is steep in the middle, so a small drop in PO₂ in the tissues releases a lot of O₂.',
          'On the standard curve, PO₂ 100 mmHg gives ~97–98% saturation, PO₂ 40 gives ~75%, and 50% saturation (P50) is at ~27 mmHg. At rest, then, only about a quarter of the O₂ is released in one pass, leaving a reserve for exercise.',
        ),
        equations: [EQ.hill],
      },
      {
        depth: 'cellular',
        title: 'Packed into red blood cells',
        body: L('About 98.5% of blood O₂ is bound to hemoglobin inside red cells; about 1.5% is dissolved in plasma.'),
      },
      {
        depth: 'molecular',
        title: 'Cooperativity',
        body: L(
          'Hemoglobin has four subunits, each with a heme iron that can bind one O₂. Binding one O₂ changes the protein\'s shape so the remaining sites bind O₂ more easily. That makes the curve sigmoid instead of hyperbolic.',
        ),
      },
    ],
    simplifications: ['The curve shown is the standard adult curve at 37 °C and pH 7.40; individuals differ.'],
    structureIds: ['hemoglobin', 'red-blood-cell', 'pulmonary-capillary'],
    glossaryIds: ['hemoglobin', 'saturation', 'p50', 'cooperativity'],
    provenance: checked([REF.ap225, REF.bio394, REF.sev79, REF.spOdc]),
  },
  {
    id: 'bohr-effect',
    name: 'Bohr effect and curve shifts',
    discipline: 'chemistry',
    oneLine: 'Acid, heat and CO₂ loosen hemoglobin\'s grip on O₂ exactly where tissues are working hardest.',
    why: [
      {
        depth: 'intuition',
        title: 'Busy tissue asks for more',
        body: L('Exercising muscle is warmer, makes more CO₂ and acid. All three make hemoglobin release O₂ more readily, so delivery rises where demand rises.'),
      },
      {
        depth: 'physiology',
        title: 'Right shift = lower affinity',
        body: L(
          'A right shift (higher P50) means less saturation at the same PO₂, so more O₂ is unloaded. Lower pH, higher temperature, higher PCO₂ and more 2,3-BPG shift right. The opposite conditions shift left.',
          'In the lungs, CO₂ leaves and pH rises, shifting the curve back left and helping loading. Severinghaus\'s Eq. 4 gives the Bohr coefficient: about −1.2 change in ln PO₂ per pH unit near P50.',
        ),
      },
      {
        depth: 'molecular',
        title: 'Protons change the protein',
        body: L('H⁺ and CO₂ bind to hemoglobin at sites other than heme. This stabilises the low-affinity shape, so O₂ is released more easily.'),
      },
    ],
    simplifications: ['In the experiment, CO₂\'s effect is represented through pH only. The source equations give no separate PCO₂ term.'],
    structureIds: ['hemoglobin', 'skeletal-muscle', 'systemic-capillary'],
    glossaryIds: ['bohr-effect', 'p50'],
    provenance: checked([REF.ap225, REF.bio394, REF.spBohr, REF.sev79]),
  },
  {
    id: 'membrane-transport',
    name: 'Cell membranes and transport',
    discipline: 'biology',
    oneLine: 'Small nonpolar gases slip through the lipid bilayer; ions need proteins.',
    why: [
      {
        depth: 'intuition',
        title: 'An oily wall',
        body: L('A cell membrane is a thin film of fat-like molecules. Things that dissolve in oil pass through easily; charged or large water-loving things do not.'),
      },
      {
        depth: 'cellular',
        title: 'Simple diffusion vs. carriers',
        body: L(
          'O₂ and CO₂ cross by simple diffusion through the lipid bilayer of every membrane between alveolus and mitochondrion. Bicarbonate, an ion, needs a protein exchanger to leave the red cell (in exchange for chloride).',
        ),
      },
      {
        depth: 'molecular',
        title: 'Amphipathic phospholipids',
        body: L('Each phospholipid has a polar, water-attracting head and two nonpolar tails. In water they form a bilayer with the tails hidden inside, which is the barrier that ions cannot easily cross.'),
      },
    ],
    simplifications: ['The layers between air and mitochondrion (fluid films, plasma, cytoplasm) are lumped together as "membranes" here; each adds a little to the diffusion distance.'],
    structureIds: ['cell-membrane', 'respiratory-membrane', 'systemic-capillary', 'type-1-cell'],
    glossaryIds: ['diffusion', 'phospholipid-bilayer', 'chloride-shift'],
    provenance: checked([REF.ap203, REF.ap225]),
  },
  {
    id: 'cellular-respiration',
    name: 'Mitochondria, ATP and cellular respiration',
    discipline: 'biology',
    oneLine: 'O₂ is the final electron acceptor that lets mitochondria make most of the cell\'s ATP.',
    why: [
      {
        depth: 'intuition',
        title: 'Why we need oxygen at all',
        body: L('Cells release energy from food in small steps. Oxygen sits at the very end of the chain, accepting the used electrons. Without it the chain backs up and stops.'),
      },
      {
        depth: 'cellular',
        title: 'The electron transport chain',
        body: L(
          'In the inner mitochondrial membrane, electrons from NADH and FADH₂ pass through a series of protein complexes. The energy released pumps H⁺ out of the matrix, building a gradient.',
          'Most of the cell\'s aerobic ATP comes from this step. OpenStax notes that the exact ATP yield per glucose varies, so this app does not give a single number.',
        ),
      },
      {
        depth: 'molecular',
        title: 'Complex IV and ATP synthase',
        body: L('At complex IV, O₂ takes the electrons and picks up H⁺ to form water. H⁺ flowing back into the matrix through ATP synthase drives ATP production (chemiosmosis).'),
        equations: [EQ.complexIV],
      },
    ],
    simplifications: ['Glycolysis and the citric acid cycle, which feed electrons into the chain, are not covered in this release.'],
    structureIds: ['mitochondrion', 'skeletal-muscle'],
    glossaryIds: ['atp', 'electron-transport-chain', 'chemiosmosis'],
    provenance: checked([REF.bio74]),
  },
  {
    id: 'co2-acid-base',
    name: 'CO₂ transport and acid–base',
    discipline: 'chemistry',
    oneLine: 'Most CO₂ travels as bicarbonate, and the same reaction links breathing to blood pH.',
    why: [
      {
        depth: 'intuition',
        title: 'CO₂ makes acid',
        body: L('CO₂ dissolved in water forms carbonic acid. More CO₂ in the blood means more acid; breathing it off makes the blood less acidic.'),
      },
      {
        depth: 'physiology',
        title: 'Three ways to carry CO₂',
        body: L(
          'About 70% travels as bicarbonate, about 20% bound to hemoglobin (carbaminohemoglobin, on the globin, not the iron), and 7–10% dissolved in plasma.',
          'Normal arterial pH is 7.35–7.45. Anything that impairs breathing raises PCO₂ and lowers pH (respiratory acidosis). The bicarbonate-to-carbonic-acid ratio is about 20:1 at normal pH.',
        ),
        equations: [EQ.hh],
      },
      {
        depth: 'cellular',
        title: 'Inside the red cell',
        body: L('Carbonic anhydrase in red blood cells speeds the conversion of CO₂ to bicarbonate. Bicarbonate leaves in exchange for chloride (the chloride shift). Deoxygenated hemoglobin binds H⁺ and CO₂ more readily (the Haldane effect).'),
        equations: [EQ.carbonic],
      },
      {
        depth: 'molecular',
        title: 'Equilibrium and Le Chatelier',
        body: L('The reaction runs toward bicarbonate in the tissues, where CO₂ is added, and back toward CO₂ in the lungs, where CO₂ is removed.'),
      },
    ],
    simplifications: ['The kidneys\' slower control of bicarbonate is outside this release.', 'Percentages are rounded textbook values.'],
    structureIds: ['red-blood-cell', 'hemoglobin', 'alveolus'],
    glossaryIds: ['bicarbonate', 'carbonic-anhydrase', 'chloride-shift', 'haldane-effect'],
    provenance: draft(
      [REF.ap225, REF.ap264, REF.ap265, REF.chem146],
      'CO₂ transport percentages, normal pH range and the 20:1 ratio are checked against OpenStax. The clinical Henderson–Hasselbalch constants (6.1 and 0.03) are not yet confirmed in a fetched source.',
    ),
  },
  {
    id: 'circulation',
    name: 'Pulmonary and systemic circuits',
    discipline: 'physiology',
    oneLine: 'Two pumps in series: right heart to the lungs, left heart to the body.',
    why: [
      {
        depth: 'intuition',
        title: 'A figure of eight',
        body: L('Blood loops through the lungs and back to the heart, then through the body and back to the heart. Each loop has its own pump.'),
      },
      {
        depth: 'physiology',
        title: 'Same flow, different pressures',
        body: L(
          'The right ventricle pumps into the low-resistance pulmonary circuit; the left ventricle pumps into the high-resistance systemic circuit, which is why its wall is much thicker.',
          'Because the circuits are in series, over time the right and left ventricles must pump the same volume per minute.',
        ),
      },
    ],
    simplifications: ['Shown as two simple loops; the coronary and bronchial circulations are not covered.'],
    structureIds: ['heart', 'left-ventricle', 'right-ventricle', 'aorta', 'pulmonary-arteries', 'pulmonary-veins', 'vena-cava'],
    glossaryIds: ['pulmonary-circuit', 'systemic-circuit'],
    provenance: checked([REF.ap191]),
  },
];

/** The five mechanisms the first release connects, in map order. */
export const CORE_CONCEPT_IDS = [
  'partial-pressure-diffusion',
  'hemoglobin-binding',
  'membrane-transport',
  'cellular-respiration',
  'co2-acid-base',
];

export const RELATIONSHIPS: Relationship[] = [
  {
    id: 'r1',
    from: 'ventilation-mechanics',
    to: 'partial-pressure-diffusion',
    label: 'keeps alveolar PO₂ high',
    why: 'Each breath replaces alveolar air, holding alveolar PO₂ near 104 mmHg and PCO₂ near 40 mmHg. Without ventilation, the gradients that drive diffusion would collapse.',
    provenance: checked([REF.ap223, REF.ap224]),
  },
  {
    id: 'r2',
    from: 'partial-pressure-diffusion',
    to: 'hemoglobin-binding',
    label: 'sets the PO₂ hemoglobin sees',
    why: 'Hemoglobin\'s saturation depends on the PO₂ around it. Diffusion brings capillary blood close to alveolar PO₂, which places it on the flat, nearly saturated top of the curve.',
    provenance: checked([REF.ap224, REF.ap225]),
  },
  {
    id: 'r3',
    from: 'hemoglobin-binding',
    to: 'partial-pressure-diffusion',
    label: 'keeps plasma PO₂ low while loading',
    why: 'As O₂ binds hemoglobin it leaves solution, so plasma PO₂ rises more slowly and the gradient from the alveolus stays steep while the red cell is loading.',
    provenance: draft([REF.ap225], 'Mechanistic inference from binding and Henry\'s law; not stated in this form in the cited section.'),
  },
  {
    id: 'r4',
    from: 'membrane-transport',
    to: 'partial-pressure-diffusion',
    label: 'lets gases cross without a carrier',
    why: 'Because O₂ and CO₂ dissolve in the lipid bilayer, each membrane is a thin obstacle rather than a gate. The rate is set by the gradient, area and thickness, not by transporter numbers.',
    provenance: checked([REF.ap203, REF.ap224]),
  },
  {
    id: 'r5',
    from: 'cellular-respiration',
    to: 'partial-pressure-diffusion',
    label: 'keeps tissue PO₂ low',
    why: 'Mitochondria continuously consume O₂ at complex IV. That keeps PO₂ inside cells below capillary PO₂, so O₂ keeps diffusing in from the blood.',
    provenance: checked([REF.bio74, REF.ap224]),
  },
  {
    id: 'r6',
    from: 'cellular-respiration',
    to: 'co2-acid-base',
    label: 'produces CO₂',
    why: 'Oxidising fuel releases CO₂. That CO₂ diffuses into the blood, where most of it becomes bicarbonate and H⁺. Faster metabolism means more CO₂ and more acid.',
    provenance: checked([REF.bio74, REF.ap225]),
  },
  {
    id: 'r7',
    from: 'co2-acid-base',
    to: 'bohr-effect',
    label: 'lowers pH near tissues',
    why: 'H⁺ produced from CO₂ in red cells binds hemoglobin and lowers its O₂ affinity. CO₂ transport and O₂ delivery are therefore coupled.',
    provenance: checked([REF.ap225, REF.spBohr]),
  },
  {
    id: 'r8',
    from: 'bohr-effect',
    to: 'hemoglobin-binding',
    label: 'shifts the dissociation curve',
    why: 'Acid, heat, CO₂ and 2,3-BPG move the curve right (lower affinity). In tissues this releases more O₂; in the lungs, as CO₂ leaves, the curve moves back left and loading improves.',
    provenance: checked([REF.ap225, REF.sev79]),
  },
  {
    id: 'r9',
    from: 'membrane-transport',
    to: 'co2-acid-base',
    label: 'chloride shift',
    why: 'Bicarbonate is charged, so it cannot diffuse through the bilayer. A membrane exchanger swaps it for chloride, letting red cells keep converting CO₂.',
    provenance: checked([REF.ap225]),
  },
  {
    id: 'r10',
    from: 'circulation',
    to: 'hemoglobin-binding',
    label: 'moves loaded hemoglobin',
    why: 'Hemoglobin only carries O₂; the heart moves it. Delivery to a tissue depends on how much O₂ each litre carries and how many litres arrive.',
    provenance: checked([REF.ap191, REF.ap225]),
  },
];

export const GLOSSARY: GlossaryTerm[] = [
  { id: 'partial-pressure', term: 'Partial pressure', definition: 'The pressure one gas in a mixture would exert on its own. Written PO₂, PCO₂; measured in mmHg.', conceptId: 'partial-pressure-diffusion' },
  { id: 'diffusion', term: 'Diffusion', definition: 'Net movement of molecules from higher to lower concentration (or partial pressure) by random motion. Needs no ATP.', conceptId: 'partial-pressure-diffusion' },
  { id: 'respiratory-membrane', term: 'Respiratory membrane', definition: 'Alveolar and capillary walls with their fused basement membranes, about 0.5 µm thick.' },
  { id: 'conducting-zone', term: 'Conducting zone', definition: 'Airways that carry air but do not exchange gas: nose to terminal bronchioles.' },
  { id: 'boyles-law', term: "Boyle's law", definition: 'At constant temperature, the pressure of a fixed amount of gas is inversely proportional to its volume.', conceptId: 'ventilation-mechanics' },
  { id: 'hemoglobin', term: 'Hemoglobin', definition: 'Red-cell protein of four globin chains, each with a heme group whose iron binds one O₂.', conceptId: 'hemoglobin-binding' },
  { id: 'saturation', term: 'Saturation (SO₂)', definition: 'Percentage of hemoglobin O₂-binding sites that are occupied.', conceptId: 'hemoglobin-binding' },
  { id: 'p50', term: 'P50', definition: 'The PO₂ at which hemoglobin is 50% saturated. About 27 mmHg on the standard curve. Higher P50 = lower affinity.', conceptId: 'hemoglobin-binding' },
  { id: 'cooperativity', term: 'Cooperative binding', definition: 'Binding at one site makes binding at the others easier; gives hemoglobin its S-shaped curve.', conceptId: 'hemoglobin-binding' },
  { id: 'bohr-effect', term: 'Bohr effect', definition: 'Lower pH (and higher CO₂) reduces hemoglobin\'s O₂ affinity, shifting the curve right.', conceptId: 'bohr-effect' },
  { id: 'haldane-effect', term: 'Haldane effect', definition: 'Deoxygenated hemoglobin binds CO₂ and H⁺ more readily, helping blood pick up CO₂ in tissues.', conceptId: 'co2-acid-base' },
  { id: 'bicarbonate', term: 'Bicarbonate (HCO₃⁻)', definition: 'The main form in which CO₂ travels in blood, and the base half of the main blood buffer.', conceptId: 'co2-acid-base' },
  { id: 'carbonic-anhydrase', term: 'Carbonic anhydrase', definition: 'Enzyme in red blood cells that speeds CO₂ + H₂O ⇌ H₂CO₃.', conceptId: 'co2-acid-base' },
  { id: 'chloride-shift', term: 'Chloride shift', definition: 'Exchange of bicarbonate out of the red cell for chloride in.', conceptId: 'co2-acid-base' },
  { id: 'phospholipid-bilayer', term: 'Phospholipid bilayer', definition: 'Two layers of phospholipids, tails inward, forming the core of every cell membrane.', conceptId: 'membrane-transport' },
  { id: 'atp', term: 'ATP', definition: 'Adenosine triphosphate, the cell\'s immediate energy currency.', conceptId: 'cellular-respiration' },
  { id: 'electron-transport-chain', term: 'Electron transport chain', definition: 'Protein complexes in the inner mitochondrial membrane that pass electrons to O₂ and pump H⁺.', conceptId: 'cellular-respiration' },
  { id: 'chemiosmosis', term: 'Chemiosmosis', definition: 'Using the H⁺ gradient across a membrane to drive ATP synthase.', conceptId: 'cellular-respiration' },
  { id: 'pulmonary-circuit', term: 'Pulmonary circuit', definition: 'Right ventricle → lungs → left atrium.', conceptId: 'circulation' },
  { id: 'systemic-circuit', term: 'Systemic circuit', definition: 'Left ventricle → body → right atrium.', conceptId: 'circulation' },
];

export const conceptById = (id: string) => CONCEPTS.find((c) => c.id === id);
export const glossaryById = (id: string) => GLOSSARY.find((g) => g.id === id);
