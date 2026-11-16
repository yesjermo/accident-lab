/**
 * Source registry. Every URL below was fetched and checked on the date in
 * CONTENT_VERIFIED_ON. NCBI Bookshelf (StatPearls) full text was behind a
 * browser check at that time, so StatPearls claims were checked against the
 * article abstracts (via Europe PMC) and are cited as such.
 *
 * Licences: OpenStax books are CC BY-NC-SA 4.0 and their terms forbid using
 * the text to train or feed generative AI. This app therefore never copies
 * OpenStax text or figures: explanations are written independently and the
 * books are linked as references and further reading.
 */
import type { Source, SourceRef } from '../domain/types';

export const CONTENT_VERIFIED_ON = '2026-11-15';

const AP = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const BIO = 'https://openstax.org/books/biology-2e/pages/';

export const SOURCES: Source[] = [
  {
    id: 'openstax-ap2e',
    title: 'Anatomy and Physiology 2e',
    authors: 'Betts JG, Young KA, Wise JA, et al.',
    publisher: 'OpenStax, Rice University',
    year: 2022,
    url: 'https://openstax.org/details/books/anatomy-and-physiology-2e',
    license: 'CC BY-NC-SA 4.0 (linked, not copied)',
    kind: 'open-textbook',
  },
  {
    id: 'openstax-bio2e',
    title: 'Biology 2e',
    authors: 'Clark MA, Douglas M, Choi J',
    publisher: 'OpenStax, Rice University',
    year: 2018,
    url: 'https://openstax.org/details/books/biology-2e',
    license: 'CC BY-NC-SA 4.0 (linked, not copied)',
    kind: 'open-textbook',
  },
  {
    id: 'openstax-chem2e',
    title: 'Chemistry 2e',
    authors: 'Flowers P, Theopold K, Langley R, Robinson WR',
    publisher: 'OpenStax, Rice University',
    year: 2019,
    url: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY-NC-SA 4.0 (linked, not copied)',
    kind: 'open-textbook',
  },
  {
    id: 'severinghaus-1979',
    title: 'Simple, accurate equations for human blood O2 dissociation computations',
    authors: 'Severinghaus JW',
    publisher: 'Journal of Applied Physiology 46(3):599–602',
    year: 1979,
    url: 'https://doi.org/10.1152/jappl.1979.46.3.599',
    license: null,
    kind: 'primary-literature',
    doi: '10.1152/jappl.1979.46.3.599',
  },
  {
    id: 'statpearls-alveolar-gas',
    title: 'Alveolar Gas Equation (StatPearls)',
    authors: 'Hendrix JM, Burns B',
    publisher: 'StatPearls Publishing, NCBI Bookshelf NBK482268',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK482268/',
    license: null,
    kind: 'review',
  },
  {
    id: 'statpearls-bohr',
    title: 'Physiology, Bohr Effect (StatPearls)',
    authors: 'StatPearls Publishing (authors listed on the article)',
    publisher: 'StatPearls Publishing, NCBI Bookshelf NBK526028',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK526028/',
    license: null,
    kind: 'review',
  },
  {
    id: 'statpearls-odc',
    title: 'Physiology, Oxyhemoglobin Dissociation Curve (StatPearls)',
    authors: 'StatPearls Publishing (authors listed on the article)',
    publisher: 'StatPearls Publishing, NCBI Bookshelf NBK499818',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK499818/',
    license: null,
    kind: 'review',
  },
  {
    id: 'statpearls-oxygen-transport',
    title: 'Physiology, Oxygen Transport (StatPearls)',
    authors: 'Rhodes CE, Denault D, Varacallo MA',
    publisher: 'StatPearls Publishing, NCBI Bookshelf NBK538336',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK538336/',
    license: null,
    kind: 'review',
  },
  {
    id: 'statpearls-co',
    title: 'Carbon Monoxide Poisoning (StatPearls)',
    authors: 'StatPearls Publishing (authors listed on the article)',
    publisher: 'StatPearls Publishing, PMID 32491811',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32491811/',
    license: null,
    kind: 'review',
  },
  {
    id: 'bodyparts3d',
    title: 'BodyParts3D 4.0 (part-of tree, 99% reduced OBJ)',
    authors: 'The Database Center for Life Science (DBCLS)',
    publisher: 'DBCLS, Japan',
    url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/',
    license: 'CC BY 4.0 per the current licence page; the 2011 files carry a CC BY-SA 2.1 JP notice, so the derived 3D model is shared under CC BY-SA',
    kind: 'reference',
  },
  {
    id: 'z-anatomy',
    title: 'Z-Anatomy: The libre 3D atlas of anatomy (Blender template)',
    authors: 'Kervyn G, Zielinski M, Vinent L, et al.; derived from BodyParts3D (Okubo K, DBCLS)',
    publisher: 'Z-Anatomy project, GitHub',
    url: 'https://github.com/Z-Anatomy/Models-of-human-anatomy',
    license: 'CC BY-SA 4.0 (lung lobes and thigh muscles only; its non-commercial inner-ear and kidney models are not used)',
    kind: 'reference',
  },
  {
    id: 'khan-bohr-haldane',
    title: 'Bohr effect vs. Haldane effect',
    authors: 'Khan Academy Medicine',
    publisher: 'Khan Academy (YouTube)',
    url: 'https://www.youtube.com/watch?v=dHi9ctwDUnc',
    license: null,
    kind: 'video',
  },
  {
    id: 'ninja-nerd-odc',
    title: 'Respiratory | Oxygen-Hemoglobin Dissociation Curve',
    authors: 'Ninja Nerd',
    publisher: 'Ninja Nerd (YouTube)',
    url: 'https://www.youtube.com/watch?v=bhJarMGNFw4',
    license: null,
    kind: 'video',
  },
];

/** Shorthand section references used throughout the content files. */
export const REF = {
  ap221: { sourceId: 'openstax-ap2e', section: '22.1 Organs and Structures of the Respiratory System', url: `${AP}22-1-organs-and-structures-of-the-respiratory-system` },
  ap222: { sourceId: 'openstax-ap2e', section: '22.2 The Lungs', url: `${AP}22-2-the-lungs` },
  ap223: { sourceId: 'openstax-ap2e', section: '22.3 The Process of Breathing', url: `${AP}22-3-the-process-of-breathing` },
  ap224: { sourceId: 'openstax-ap2e', section: '22.4 Gas Exchange (Table 22.2, partial pressures)', url: `${AP}22-4-gas-exchange` },
  ap225: { sourceId: 'openstax-ap2e', section: '22.5 Transport of Gases', url: `${AP}22-5-transport-of-gases` },
  ap191: { sourceId: 'openstax-ap2e', section: '19.1 Heart Anatomy', url: `${AP}19-1-heart-anatomy` },
  ap203: { sourceId: 'openstax-ap2e', section: '20.3 Capillary Exchange', url: `${AP}20-3-capillary-exchange` },
  ap264: { sourceId: 'openstax-ap2e', section: '26.4 Acid-Base Balance', url: `${AP}26-4-acid-base-balance` },
  ap265: { sourceId: 'openstax-ap2e', section: '26.5 Disorders of Acid-Base Balance (Table 26.3)', url: `${AP}26-5-disorders-of-acid-base-balance` },
  bio74: { sourceId: 'openstax-bio2e', section: '7.4 Oxidative Phosphorylation', url: `${BIO}7-4-oxidative-phosphorylation` },
  bio394: { sourceId: 'openstax-bio2e', section: '39.4 Transport of Gases in Human Bodily Fluids', url: `${BIO}39-4-transport-of-gases-in-human-bodily-fluids` },
  chem146: { sourceId: 'openstax-chem2e', section: '14.6 Buffers (The Henderson-Hasselbalch Equation)', url: 'https://openstax.org/books/chemistry-2e/pages/14-6-buffers' },
  ap53: { sourceId: 'openstax-ap2e', section: '5.3 Functions of the Integumentary System', url: `${AP}5-3-functions-of-the-integumentary-system` },
  ap51: { sourceId: 'openstax-ap2e', section: '5.1 Layers of the Skin', url: `${AP}5-1-layers-of-the-skin` },
  ap71: { sourceId: 'openstax-ap2e', section: '7.1 Divisions of the Skeletal System', url: `${AP}7-1-divisions-of-the-skeletal-system` },
  ap61: { sourceId: 'openstax-ap2e', section: '6.1 The Functions of the Skeletal System', url: `${AP}6-1-the-functions-of-the-skeletal-system` },
  ap132: { sourceId: 'openstax-ap2e', section: '13.2 The Central Nervous System', url: `${AP}13-2-the-central-nervous-system` },
  ap182: { sourceId: 'openstax-ap2e', section: '18.2 Production of the Formed Elements', url: `${AP}18-2-production-of-the-formed-elements` },
  ap183: { sourceId: 'openstax-ap2e', section: '18.3 Erythrocytes', url: `${AP}18-3-erythrocytes` },
  ap205: { sourceId: 'openstax-ap2e', section: '20.5 Circulatory Pathways', url: `${AP}20-5-circulatory-pathways` },
  ap233: { sourceId: 'openstax-ap2e', section: '23.3 The Mouth, Pharynx, and Esophagus', url: `${AP}23-3-the-mouth-pharynx-and-esophagus` },
  ap234: { sourceId: 'openstax-ap2e', section: '23.4 The Stomach', url: `${AP}23-4-the-stomach` },
  ap235: { sourceId: 'openstax-ap2e', section: '23.5 The Small and Large Intestines', url: `${AP}23-5-the-small-and-large-intestines` },
  ap236: { sourceId: 'openstax-ap2e', section: '23.6 Accessory Organs in Digestion: The Liver, Pancreas, and Gallbladder', url: `${AP}23-6-accessory-organs-in-digestion-the-liver-pancreas-and-gallbladder` },
  ap252: { sourceId: 'openstax-ap2e', section: '25.2 Gross Anatomy of Urine Transport', url: `${AP}25-2-gross-anatomy-of-urine-transport` },
  ap253: { sourceId: 'openstax-ap2e', section: '25.3 Gross Anatomy of the Kidney', url: `${AP}25-3-gross-anatomy-of-the-kidney` },
  sev79: { sourceId: 'severinghaus-1979', section: 'Abstract, Eq. 1, 3 and 4' },
  spAlv: { sourceId: 'statpearls-alveolar-gas', section: 'Abstract (worked example: 99.7 mmHg)' },
  spBohr: { sourceId: 'statpearls-bohr', section: 'Abstract' },
  spOdc: { sourceId: 'statpearls-odc', section: 'Abstract' },
  spO2: { sourceId: 'statpearls-oxygen-transport', section: 'Abstract' },
  spCo: { sourceId: 'statpearls-co', section: 'Abstract' },
} satisfies Record<string, SourceRef>;

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);
