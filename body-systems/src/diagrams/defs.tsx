/**
 * Diagram definitions: original schematic SVG drawings made for this app
 * (licence: same as the project; see ASSETS.md). They are schematic, not to
 * scale, and drawn in anterior view (the patient's right is on the viewer's
 * left). Anatomical relationships follow OpenStax A&P 2e 19.1, 22.1 and 22.2.
 *
 * Fills use classes, not colours: `.o2-rich` and `.o2-poor` (hatched) so
 * oxygenation is never shown by colour alone.
 */
import type { ReactNode } from 'react';
import type { DiagramId } from '../domain/types';

export interface RegionDef {
  id: string;
  label: string;
  shape: ReactNode;
  /** Where markers and leader lines attach. */
  anchor: [number, number];
  /** Where the text label sits. */
  labelAt: [number, number];
  labelAnchor?: 'start' | 'middle' | 'end';
}

export interface DiagramDef {
  id: DiagramId;
  title: string;
  description: string;
  viewBox: [number, number];
  background?: ReactNode;
  foreground?: ReactNode;
  regions: RegionDef[];
  legend: { swatch: 'o2-rich' | 'o2-poor' | 'tissue' | 'air'; text: string }[];
  orientation?: string;
}

// ----------------------------------------------------------------- body

const BODY: DiagramDef = {
  id: 'body',
  title: 'Body overview: thorax and thigh',
  description:
    'Schematic front view of a person. The trachea divides into two bronchi entering the lungs; the right lung (viewer\'s left) shows three lobes, the left lung two lobes with a cardiac notch. The heart sits between the lungs, apex to the patient\'s left. The aorta arches over the heart and descends; the venae cavae return to the right side of the heart. The diaphragm domes under the lungs. Thigh muscle is shown as a representative tissue.',
  viewBox: [440, 540],
  orientation: 'Anterior view: patient\'s right is on your left.',
  background: (
    <g className="silhouette">
      <circle cx="180" cy="48" r="30" />
      <path d="M166 76 L166 96 L194 96 L194 76" />
      <path d="M110 104 Q180 88 250 104 L268 120 L292 300 L276 304 L254 170 L252 330 Q246 352 236 360 L224 520 L196 520 L186 380 L174 380 L164 520 L136 520 L124 360 Q114 352 108 330 L106 170 L84 304 L68 300 L92 120 Z" />
      <path className="fissure" d="M180 150 L180 350" strokeDasharray="2 5" />
    </g>
  ),
  regions: [
    {
      id: 'lungs',
      label: 'Lungs',
      anchor: [128, 190],
      labelAt: [20, 175],
      labelAnchor: 'start',
      shape: (
        <g>
          {/* right lung: three lobes */}
          <path className="air" d="M170 150 Q140 140 122 175 Q106 220 110 290 Q140 302 172 288 Q178 220 170 150 Z" />
          <path className="fissure" d="M114 248 Q140 230 170 218" />
          <path className="fissure" d="M122 270 Q150 250 172 262" />
          {/* left lung: two lobes and cardiac notch */}
          <path className="air" d="M190 150 Q220 140 238 175 Q254 220 250 290 Q228 300 208 296 Q214 270 196 262 Q190 240 192 220 Z" />
          <path className="fissure" d="M246 250 Q222 236 198 210" />
        </g>
      ),
    },
    {
      id: 'trachea',
      label: 'Trachea',
      anchor: [180, 120],
      labelAt: [20, 118],
      labelAnchor: 'start',
      shape: <path className="airway" d="M175 92 L185 92 L185 150 L198 166 L193 170 L180 156 L167 170 L162 166 L175 150 Z" />,
    },
    {
      id: 'pulmonary-arteries',
      label: 'Pulmonary arteries',
      anchor: [160, 212],
      labelAt: [20, 214],
      labelAnchor: 'start',
      shape: <path className="vessel o2-poor" d="M194 228 L196 206 Q190 200 176 204 L150 210 L150 216 L176 212 Q186 210 190 214 L188 228 Z M198 206 Q210 198 226 204 L240 210 L238 216 L222 210 Q210 206 202 212 Z" />,
    },
    {
      id: 'pulmonary-veins',
      label: 'Pulmonary veins',
      anchor: [226, 236],
      labelAt: [304, 244],
      labelAnchor: 'start',
      shape: <path className="vessel o2-rich" d="M152 236 L182 232 L182 238 L152 242 Z M210 232 L238 234 L238 240 L210 238 Z" />,
    },
    {
      id: 'vena-cava',
      label: 'Venae cavae',
      anchor: [178, 336],
      labelAt: [20, 352],
      labelAnchor: 'start',
      shape: <path className="vessel o2-poor" d="M168 170 L178 170 L178 222 L168 222 Z M172 268 L182 268 L184 350 L174 350 Z" />,
    },
    {
      id: 'aorta',
      label: 'Aorta',
      anchor: [212, 182],
      labelAt: [304, 180],
      labelAnchor: 'start',
      shape: <path className="vessel o2-rich" d="M194 214 L192 190 Q194 172 208 172 Q222 174 222 192 L222 350 L212 350 L212 194 Q212 184 207 184 Q202 184 202 192 L204 214 Z" />,
    },
    {
      id: 'heart',
      label: 'Heart',
      anchor: [204, 250],
      labelAt: [304, 280],
      labelAnchor: 'start',
      shape: <path className="muscle" d="M178 220 Q186 210 204 214 Q228 218 236 236 Q240 258 222 276 Q210 284 202 290 Q186 276 178 262 Q170 240 178 220 Z" />,
    },
    {
      id: 'diaphragm',
      label: 'Diaphragm',
      anchor: [140, 296],
      labelAt: [20, 318],
      labelAnchor: 'start',
      shape: <path className="muscle-band" d="M106 306 Q140 268 180 300 Q220 272 254 308 L254 314 Q220 280 180 308 Q140 276 106 312 Z" />,
    },
    {
      id: 'skeletal-muscle',
      label: 'Thigh muscle (tissue)',
      anchor: [150, 440],
      labelAt: [20, 470],
      labelAnchor: 'start',
      shape: (
        <g>
          <ellipse className="muscle" cx="150" cy="440" rx="16" ry="52" />
          <path className="striation" d="M140 410 L160 410 M138 425 L162 425 M137 440 L163 440 M138 455 L162 455 M140 470 L160 470" />
        </g>
      ),
    },
  ],
  legend: [
    { swatch: 'o2-rich', text: 'Oxygen-rich blood (solid)' },
    { swatch: 'o2-poor', text: 'Oxygen-poor blood (hatched)' },
    { swatch: 'air', text: 'Air spaces' },
  ],
};

// ---------------------------------------------------------------- heart

const HEART: DiagramDef = {
  id: 'heart',
  title: 'Heart: four chambers and valves',
  description:
    'Schematic frontal view of the heart. The superior and inferior venae cavae enter the right atrium (upper left of the drawing), which opens through the tricuspid valve into the right ventricle. The right ventricle\'s outflow tract runs up and across in front of the aortic root to the pulmonary valve and pulmonary trunk, which divides: the right pulmonary artery passes behind the ascending aorta, the left runs under the aortic arch. Pulmonary veins enter the left atrium (upper right), which opens through the mitral valve into the thick-walled left ventricle; it ejects through the aortic valve into the aorta, which rises, arches over and descends on the right of the drawing.',
  viewBox: [600, 420],
  orientation: 'Anterior view: the heart\'s right side is on your left.',
  background: <path className="septum" d="M296 236 L322 392" />,
  regions: [
    {
      id: 'pulmonary-arteries',
      label: 'Pulmonary arteries',
      anchor: [420, 77],
      labelAt: [592, 100],
      labelAnchor: 'end',
      shape: <path className="vessel o2-poor" d="M322 118 L322 84 L120 84 L120 70 L322 70 Q334 58 346 70 L432 70 L432 84 L346 84 L346 118 Z" />,
    },
    {
      id: 'aorta',
      label: 'Aorta',
      anchor: [400, 32],
      labelAt: [592, 30],
      labelAnchor: 'end',
      shape: <path className="vessel o2-rich" d="M290 222 L290 52 Q290 20 322 20 L436 20 Q464 20 464 48 L464 410 L440 410 L440 52 Q440 44 432 44 L324 44 Q314 44 314 54 L314 222 Z" />,
    },
    {
      id: 'vena-cava',
      label: 'Venae cavae',
      anchor: [152, 40],
      labelAt: [8, 40],
      labelAnchor: 'start',
      shape: <path className="vessel o2-poor" d="M140 16 L164 16 L164 124 L140 124 Z M120 220 L144 220 L144 410 L120 410 Z" />,
    },
    {
      id: 'right-atrium',
      label: 'Right atrium',
      anchor: [168, 170],
      labelAt: [8, 170],
      labelAnchor: 'start',
      shape: <path className="chamber o2-poor" d="M124 140 Q120 118 150 116 L196 118 Q222 126 220 170 Q220 214 196 226 L140 228 Q116 216 118 180 Z" />,
    },
    {
      id: 'tricuspid-valve',
      label: 'Tricuspid valve',
      anchor: [180, 232],
      labelAt: [8, 240],
      labelAnchor: 'start',
      shape: <path className="valve" d="M150 228 L176 242 L182 236 M210 228 L188 242 L182 236" />,
    },
    {
      id: 'right-ventricle',
      label: 'Right ventricle',
      anchor: [228, 300],
      labelAt: [8, 312],
      labelAnchor: 'start',
      shape: <path className="chamber o2-poor" d="M176 236 L226 236 L318 124 L348 124 L300 236 L294 236 L318 384 Q262 386 214 352 Q178 320 176 236 Z" />,
    },
    {
      id: 'pulmonary-valve',
      label: 'Pulmonary valve',
      anchor: [334, 120],
      labelAt: [592, 128],
      labelAnchor: 'end',
      shape: <path className="valve" d="M320 124 L334 110 L348 124" />,
    },
    {
      id: 'left-atrium',
      label: 'Left atrium',
      anchor: [392, 168],
      labelAt: [592, 226],
      labelAnchor: 'end',
      shape: <path className="chamber o2-rich" d="M354 150 Q352 128 380 128 L408 128 Q432 132 432 160 Q434 200 418 212 L362 214 Q350 196 354 150 Z" />,
    },
    {
      id: 'pulmonary-veins',
      label: 'Pulmonary veins',
      anchor: [474, 146],
      labelAt: [592, 172],
      labelAnchor: 'end',
      shape: <path className="vessel o2-rich" d="M430 140 L492 140 L492 152 L430 152 Z M430 182 L492 182 L492 194 L430 194 Z" />,
    },
    {
      id: 'mitral-valve',
      label: 'Mitral valve',
      anchor: [392, 218],
      labelAt: [592, 254],
      labelAnchor: 'end',
      shape: <path className="valve" d="M364 214 L388 228 L392 222 M420 214 L396 228 L392 222" />,
    },
    {
      id: 'left-ventricle',
      label: 'Left ventricle',
      anchor: [372, 310],
      labelAt: [592, 330],
      labelAnchor: 'end',
      shape: (
        <path
          className="chamber o2-rich lv"
          fillRule="evenodd"
          d="M300 222 L432 216 Q448 300 404 370 Q378 400 340 398 Q316 390 300 222 Z M322 236 L414 232 Q424 300 392 352 Q372 378 346 376 Q332 368 322 236 Z"
        />
      ),
    },
    {
      id: 'aortic-valve',
      label: 'Aortic valve',
      anchor: [302, 222],
      labelAt: [592, 288],
      labelAnchor: 'end',
      shape: <path className="valve" d="M290 226 L302 214 L314 226" />,
    },
  ],
  legend: [
    { swatch: 'o2-rich', text: 'Oxygen-rich blood (solid)' },
    { swatch: 'o2-poor', text: 'Oxygen-poor blood (hatched)' },
  ],
};

// ------------------------------------------------------- alveolus / lung

const LUNG: DiagramDef = {
  id: 'lung',
  title: 'Alveolus and pulmonary capillary',
  description:
    'Schematic of one alveolus at the end of a bronchiole. Its wall is mostly thin type I cells with a cuboidal type II cell. A pulmonary capillary wraps around it; red blood cells pass in single file from the oxygen-poor end (from the pulmonary artery, PO₂ about 40 mmHg) to the oxygen-rich end (toward the pulmonary vein). Where capillary meets alveolus is the respiratory membrane, about 0.5 micrometres thick. Arrows: O₂ from alveolus into blood; CO₂ from blood into alveolus.',
  viewBox: [580, 392],
  background: (
    <g>
      <circle className="air faint" cx="64" cy="320" r="38" />
    </g>
  ),
  foreground: (
    <g className="gas-arrows" aria-hidden="true">
      <text className="note" x="222" y="186" textAnchor="middle">Alveolar air</text>
      <text className="note" x="222" y="202" textAnchor="middle">PO₂ ≈ 104 · PCO₂ ≈ 40</text>
      <path className="arrow o2" d="M268 150 L320 120" markerEnd="url(#arrow)" />
      <text className="arrow-label" x="276" y="128">O₂</text>
      <path className="arrow co2" d="M322 252 L272 230" markerEnd="url(#arrow)" />
      <text className="arrow-label" x="286" y="262">CO₂</text>
      <text className="note" x="384" y="368">in: from pulmonary artery</text>
      <text className="note" x="384" y="382">PO₂ ≈ 40, PCO₂ ≈ 45</text>
      <text className="note" x="384" y="26">out: to pulmonary vein</text>
      <text className="note" x="384" y="40">≈ equilibrated with alveolar air</text>
      <text className="note" x="384" y="220">≈ 0.5 µm thick</text>
    </g>
  ),
  regions: [
    {
      id: 'bronchiole',
      label: 'Bronchiole',
      anchor: [70, 70],
      labelAt: [12, 40],
      labelAnchor: 'start',
      shape: <path className="airway" d="M10 50 L40 40 L150 108 L136 128 Z" />,
    },
    {
      id: 'alveolus',
      label: 'Alveolus',
      anchor: [190, 250],
      labelAt: [12, 200],
      labelAnchor: 'start',
      shape: <circle className="air" cx="222" cy="200" r="98" />,
    },
    {
      id: 'type-1-cell',
      label: 'Type I alveolar cell',
      anchor: [170, 112],
      labelAt: [12, 120],
      labelAnchor: 'start',
      shape: <path className="cell-thin" d="M140 140 Q160 112 196 104 L198 110 Q164 118 146 144 Z" />,
    },
    {
      id: 'type-2-cell',
      label: 'Type II alveolar cell',
      anchor: [150, 270],
      labelAt: [12, 262],
      labelAnchor: 'start',
      shape: (
        <g>
          <path className="cell" d="M132 252 Q150 240 168 262 Q170 282 150 292 Q132 286 128 270 Z" />
          <circle className="granule" cx="146" cy="266" r="3" />
          <circle className="granule" cx="156" cy="274" r="3" />
          <circle className="granule" cx="144" cy="278" r="3" />
        </g>
      ),
    },
    {
      id: 'pulmonary-capillary',
      label: 'Pulmonary capillary',
      anchor: [340, 300],
      labelAt: [384, 340],
      labelAnchor: 'start',
      shape: <path className="vessel capillary" d="M226 374 Q366 344 358 200 Q366 58 226 20 L230 44 Q340 78 332 200 Q340 322 230 350 Z" />,
    },
    {
      id: 'respiratory-membrane',
      label: 'Respiratory membrane',
      anchor: [318, 200],
      labelAt: [384, 204],
      labelAnchor: 'start',
      shape: <path className="membrane" fill="none" d="M300 130 Q330 200 300 270" />,
    },
    {
      id: 'red-blood-cell',
      label: 'Red blood cell',
      anchor: [344, 150],
      labelAt: [384, 120],
      labelAnchor: 'start',
      shape: (
        <g>
          <ellipse className="rbc o2-poor" cx="300" cy="338" rx="12" ry="7" transform="rotate(-20 300 338)" />
          <ellipse className="rbc o2-poor" cx="338" cy="282" rx="12" ry="7" transform="rotate(-70 338 282)" />
          <ellipse className="rbc o2-rich" cx="344" cy="150" rx="12" ry="7" transform="rotate(80 344 150)" />
          <ellipse className="rbc o2-rich" cx="304" cy="66" rx="12" ry="7" transform="rotate(40 304 66)" />
        </g>
      ),
    },
  ],
  legend: [
    { swatch: 'air', text: 'Air space' },
    { swatch: 'o2-poor', text: 'Oxygen-poor (hatched)' },
    { swatch: 'o2-rich', text: 'Oxygen-rich (solid)' },
  ],
};

// ------------------------------------------------------ tissue and cell

const TISSUE: DiagramDef = {
  id: 'tissue',
  title: 'Systemic capillary, muscle fibre and mitochondrion',
  description:
    'Schematic of a systemic capillary running above a skeletal-muscle fibre. Blood enters on the left (arterial end, PO₂ about 100 mmHg) and leaves on the right (venous end, PO₂ about 40 mmHg). Red blood cells change from oxygen-rich (solid) to oxygen-poor (hatched). An inset shows hemoglobin with four subunits. O₂ diffuses down through the capillary wall and the muscle cell membrane to a mitochondrion; CO₂ diffuses up into the blood. The mitochondrion shows outer membrane and folded inner membrane (cristae), where O₂ is reduced to water.',
  viewBox: [460, 420],
  background: (
    <g>
      <text className="note" x="20" y="186">arterial end · PO₂ ≈ 100</text>
      <text className="note" x="440" y="186" textAnchor="end">venous end · PO₂ ≈ 40</text>
    </g>
  ),
  foreground: (
    <g aria-hidden="true">
      <path className="arrow o2" d="M190 168 L216 258" markerEnd="url(#arrow)" />
      <text className="arrow-label" x="168" y="228">O₂</text>
      <path className="arrow co2" d="M330 270 L350 170" markerEnd="url(#arrow)" />
      <text className="arrow-label" x="352" y="232">CO₂</text>
      <path className="leader" d="M118 104 L150 140" />
      <text className="note" x="300" y="402" textAnchor="middle">At the inner membrane: O₂ + 4e⁻ + 4H⁺ → 2H₂O</text>
    </g>
  ),
  regions: [
    {
      id: 'skeletal-muscle',
      label: 'Skeletal muscle fibre',
      anchor: [80, 300],
      labelAt: [20, 410],
      labelAnchor: 'start',
      shape: (
        <g>
          <rect className="muscle" x="22" y="200" width="416" height="180" rx="26" />
          <path className="striation" d="M60 214 L60 366 M90 214 L90 366 M120 214 L120 366 M400 214 L400 366 M370 214 L370 366" />
          <ellipse className="nucleus" cx="96" cy="300" rx="22" ry="12" />
        </g>
      ),
    },
    {
      id: 'cell-membrane',
      label: 'Cell membrane',
      anchor: [300, 201],
      labelAt: [440, 214],
      labelAnchor: 'end',
      shape: <rect className="membrane" fill="none" x="22" y="200" width="416" height="180" rx="26" />,
    },
    {
      id: 'mitochondrion',
      label: 'Mitochondrion',
      anchor: [270, 310],
      labelAt: [440, 360],
      labelAnchor: 'end',
      shape: (
        <g>
          <ellipse className="organelle" cx="270" cy="300" rx="96" ry="46" />
          <path className="cristae" d="M190 300 Q196 270 206 300 Q214 330 222 300 Q230 266 240 300 Q248 334 258 300 Q266 266 276 300 Q284 334 294 300 Q302 266 312 300 Q320 334 330 300 Q338 270 348 300" />
        </g>
      ),
    },
    {
      id: 'systemic-capillary',
      label: 'Systemic capillary',
      anchor: [240, 140],
      labelAt: [440, 112],
      labelAnchor: 'end',
      shape: <rect className="vessel capillary-gradient-h" x="10" y="124" width="440" height="40" rx="20" />,
    },
    {
      id: 'red-blood-cell',
      label: 'Red blood cell',
      anchor: [150, 144],
      labelAt: [440, 72],
      labelAnchor: 'end',
      shape: (
        <g>
          <ellipse className="rbc o2-rich" cx="70" cy="144" rx="16" ry="9" />
          <ellipse className="rbc o2-rich" cx="150" cy="144" rx="16" ry="9" />
          <ellipse className="rbc o2-poor" cx="300" cy="144" rx="16" ry="9" />
          <ellipse className="rbc o2-poor" cx="390" cy="144" rx="16" ry="9" />
        </g>
      ),
    },
    {
      id: 'hemoglobin',
      label: 'Hemoglobin (inset)',
      anchor: [84, 64],
      labelAt: [150, 30],
      labelAnchor: 'start',
      shape: (
        <g>
          <circle className="inset" cx="84" cy="62" r="46" />
          <circle className="subunit" cx="66" cy="46" r="15" />
          <circle className="subunit" cx="102" cy="46" r="15" />
          <circle className="subunit" cx="66" cy="80" r="15" />
          <circle className="subunit" cx="102" cy="80" r="15" />
          <rect className="heme" x="61" y="41" width="10" height="10" />
          <rect className="heme" x="97" y="41" width="10" height="10" />
          <rect className="heme" x="61" y="75" width="10" height="10" />
          <rect className="heme" x="97" y="75" width="10" height="10" />
        </g>
      ),
    },
  ],
  legend: [
    { swatch: 'o2-rich', text: 'Oxygen-rich (solid)' },
    { swatch: 'o2-poor', text: 'Oxygen-poor (hatched)' },
    { swatch: 'tissue', text: 'Muscle tissue' },
  ],
};

export const DIAGRAMS: Record<DiagramId, DiagramDef> = { body: BODY, heart: HEART, lung: LUNG, tissue: TISSUE };
