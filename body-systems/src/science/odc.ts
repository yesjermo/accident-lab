/**
 * Oxygen–hemoglobin dissociation curve.
 *
 * Source: Severinghaus JW. Simple, accurate equations for human blood O2
 * dissociation computations. J Appl Physiol 1979;46(3):599–602.
 * doi:10.1152/jappl.1979.46.3.599 (PMID 35496). Equations as printed in the
 * abstract:
 *
 *   (1) S = 1 / ( 23400 / (PO2³ + 150·PO2) + 1 )
 *       standard human curve, 37 °C, pH 7.40; fits within ±0.0055 S.
 *   (3) Δln PO2 / ΔT  = 0.058 / ( (0.243·PO2/100)^3.88 + 1 ) + 0.013     [per °C]
 *   (4) Δln PO2 / ΔpH = (PO2 / 26.6)^0.184 − 2.2                        [per pH unit]
 *
 * How we combine them (our modelling choice, stated in the app):
 * at a given saturation S, let PO2s be the standard-curve PO2 from (1). Under
 * other conditions the PO2 giving the same S is
 *
 *   PO2 = PO2s · exp( c_T(PO2s)·(T − 37) + c_pH(PO2s)·(pH − 7.40) )
 *
 * i.e. the coefficients (3) and (4), evaluated on the standard curve, are
 * applied as constant over the change. This is a first-order approximation;
 * error grows with distance from 37 °C / pH 7.40, which is why the explorable
 * range is limited.
 *
 * CO2 is not a separate input: the paper gives no independent PCO2 term, and
 * most of the CO2 effect acts through pH. Not modelled: 2,3-BPG, carbon
 * monoxide, fetal or abnormal hemoglobins, methemoglobin, and anemia
 * (saturation does not depend on Hb concentration). Educational use only:
 * a population-average curve, not a prediction for any patient.
 */

export interface OdcConditions {
  /** Blood pH (dimensionless). */
  pH: number;
  /** Blood temperature, °C. */
  temperatureC: number;
}

export const STANDARD_CONDITIONS: Readonly<OdcConditions> = Object.freeze({
  pH: 7.4,
  temperatureC: 37,
});

/**
 * Ranges the app lets students explore: physiologically survivable for
 * minutes to hours, and close enough to standard that the first-order
 * correction stays reasonable. Outside them we refuse to compute.
 */
export const SUPPORTED_RANGE = Object.freeze({
  pH: { min: 7.1, max: 7.6 },
  temperatureC: { min: 34, max: 41 },
  po2: { min: 0, max: 150 },
});

export class OutOfRangeError extends RangeError {
  constructor(param: string, value: number, min: number, max: number) {
    super(`${param} = ${value} is outside the supported range ${min}–${max}.`);
    this.name = 'OutOfRangeError';
  }
}

function check(param: string, value: number, range: { min: number; max: number }) {
  if (!Number.isFinite(value) || value < range.min - 1e-9 || value > range.max + 1e-9) {
    throw new OutOfRangeError(param, value, range.min, range.max);
  }
}

export function validateConditions(c: OdcConditions): void {
  check('pH', c.pH, SUPPORTED_RANGE.pH);
  check('temperature', c.temperatureC, SUPPORTED_RANGE.temperatureC);
}

/** Eq. 1: saturation (0–1) on the standard curve at PO2 (mmHg). */
export function standardSaturation(po2: number): number {
  if (po2 <= 0) return 0;
  return 1 / (23400 / (po2 ** 3 + 150 * po2) + 1);
}

/** Eq. 3: temperature coefficient of ln PO2, per °C. */
export function temperatureCoefficient(po2: number): number {
  return 0.058 / (((0.243 * po2) / 100) ** 3.88 + 1) + 0.013;
}

/** Eq. 4: Bohr coefficient, change in ln PO2 per pH unit (negative). */
export function bohrCoefficient(po2: number): number {
  return (po2 / 26.6) ** 0.184 - 2.2;
}

/** PO2 that gives the same saturation under `c` as PO2s does under standard conditions. */
export function shiftedPo2(po2Standard: number, c: OdcConditions): number {
  validateConditions(c);
  if (po2Standard <= 0) return 0;
  const exponent =
    temperatureCoefficient(po2Standard) * (c.temperatureC - 37) +
    bohrCoefficient(po2Standard) * (c.pH - 7.4);
  return po2Standard * Math.exp(exponent);
}

/** Saturation (0–1) at a measured PO2 (mmHg) under the given conditions. */
export function saturation(po2: number, c: OdcConditions = STANDARD_CONDITIONS): number {
  check('PO2', po2, SUPPORTED_RANGE.po2);
  validateConditions(c);
  if (po2 <= 0) return 0;
  // shiftedPo2 is monotonic in PO2s over the supported range, so bisect.
  let lo = 0;
  let hi = 1000;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (shiftedPo2(mid, c) < po2) lo = mid;
    else hi = mid;
  }
  return standardSaturation((lo + hi) / 2);
}

/** PO2 at 50% saturation on the standard curve, solved from Eq. 1. */
export const STANDARD_P50 = (() => {
  let lo = 1;
  let hi = 100;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (standardSaturation(mid) < 0.5) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();

/** P50 (mmHg) under the given conditions. Higher P50 = right shift = lower affinity. */
export function p50(c: OdcConditions = STANDARD_CONDITIONS): number {
  return shiftedPo2(STANDARD_P50, c);
}

export type ShiftDirection = 'left' | 'right' | 'none';

/** Changes in P50 smaller than this are reported as "no meaningful shift". */
export const SHIFT_THRESHOLD_MMHG = 0.5;

export function shiftDirection(c: OdcConditions): ShiftDirection {
  const delta = p50(c) - STANDARD_P50;
  if (Math.abs(delta) < SHIFT_THRESHOLD_MMHG) return 'none';
  return delta > 0 ? 'right' : 'left';
}

/** Points for plotting, PO2 0..150 mmHg. Saturation returned as a percentage. */
export function curve(c: OdcConditions, stepMmHg = 2): { po2: number; so2: number }[] {
  const pts: { po2: number; so2: number }[] = [];
  for (let p = 0; p <= SUPPORTED_RANGE.po2.max; p += stepMmHg) {
    pts.push({ po2: p, so2: saturation(p, c) * 100 });
  }
  return pts;
}
