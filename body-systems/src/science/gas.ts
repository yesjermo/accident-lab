/**
 * Small, textbook gas and acid–base equations used in explanations.
 * Each function documents its units and the source of its constants.
 */

/** Saturated water vapour pressure at 37 °C, mmHg. */
export const PH2O_37C = 47;
/** Sea-level barometric pressure, mmHg. */
export const PATM_SEA_LEVEL = 760;

/**
 * Alveolar gas equation (simplified form).
 *   PAO2 = FiO2 · (Patm − PH2O) − PaCO2 / R
 * @param fio2 fraction of inspired O2 (0–1), 0.21 for room air
 * @param paco2 arterial PCO2, mmHg
 * @param r respiratory exchange ratio, ~0.8 on a mixed diet
 * @returns alveolar PO2, mmHg
 */
export function alveolarPo2(
  fio2: number,
  paco2: number,
  patm: number = PATM_SEA_LEVEL,
  r = 0.8,
  ph2o: number = PH2O_37C,
): number {
  if (fio2 < 0 || fio2 > 1) throw new RangeError('FiO2 must be between 0 and 1');
  if (r <= 0) throw new RangeError('R must be positive');
  return fio2 * (patm - ph2o) - paco2 / r;
}

/** Inspired PO2 after humidification in the airways, mmHg. */
export function inspiredPo2(fio2: number, patm: number = PATM_SEA_LEVEL): number {
  return fio2 * (patm - PH2O_37C);
}

/** mL O2 carried per gram of fully saturated hemoglobin (values of 1.34–1.39 are quoted). */
export const HUFNER = 1.34;
/** Solubility of O2 in plasma, mL O2 per dL blood per mmHg. */
export const O2_SOLUBILITY = 0.003;

/**
 * Arterial oxygen content.
 *   CaO2 = 1.34 · Hb · SaO2 + 0.003 · PaO2
 * @param hbGdl hemoglobin, g/dL
 * @param sao2 saturation as a fraction (0–1)
 * @param pao2 mmHg
 * @returns mL O2 per dL of blood
 */
export function oxygenContent(hbGdl: number, sao2: number, pao2: number) {
  const bound = HUFNER * hbGdl * sao2;
  const dissolved = O2_SOLUBILITY * pao2;
  return { bound, dissolved, total: bound + dissolved };
}

/** CO2 solubility in plasma, mmol/L per mmHg. */
export const CO2_SOLUBILITY = 0.03;
/** pKa of the carbonic acid / bicarbonate system in plasma at 37 °C. */
export const PKA_BICARB = 6.1;

/**
 * Henderson–Hasselbalch for the bicarbonate buffer.
 *   pH = 6.1 + log10( [HCO3−] / (0.03 · PCO2) )
 * @param hco3 mmol/L (= mEq/L)
 * @param pco2 mmHg
 */
export function bicarbonatePh(hco3: number, pco2: number): number {
  if (hco3 <= 0 || pco2 <= 0) throw new RangeError('HCO3− and PCO2 must be positive');
  return PKA_BICARB + Math.log10(hco3 / (CO2_SOLUBILITY * pco2));
}
