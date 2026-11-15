import {
  OutOfRangeError,
  STANDARD_CONDITIONS,
  STANDARD_P50,
  curve,
  p50,
  saturation,
  shiftDirection,
  standardSaturation,
  temperatureCoefficient,
  bohrCoefficient,
} from './odc';
import { alveolarPo2, bicarbonatePh, inspiredPo2, oxygenContent } from './gas';

/*
 * Reference values.
 * - Standard human curve (Severinghaus 1979 Eq. 1): P50 ≈ 26.8 mmHg; SO2 ≈ 75% at PO2 40 (mixed venous);
 *   SO2 ≈ 97–98% at PO2 100 (arterial). The abstract reports a fit
 *   within ±0.0055 fractional saturation.
 * - Alveolar gas equation on room air at sea level: ≈ 100 mmHg.
 * - Henderson–Hasselbalch at HCO3− 24 mmol/L, PCO2 40 mmHg: pH ≈ 7.40.
 */

describe('Severinghaus standard curve', () => {
  it('has P50 of about 26.8 mmHg', () => {
    expect(STANDARD_P50).toBeCloseTo(26.86, 1);
    expect(standardSaturation(26.8)).toBeCloseTo(0.5, 2);
  });

  it('gives about 75% at a mixed-venous PO2 of 40 mmHg', () => {
    expect(standardSaturation(40) * 100).toBeCloseTo(75, 0);
  });

  it('gives 97–98% at an arterial PO2 of 100 mmHg', () => {
    const s = standardSaturation(100) * 100;
    expect(s).toBeGreaterThan(97);
    expect(s).toBeLessThan(98.5);
  });

  it('is 0 at PO2 0 and monotonic increasing', () => {
    expect(standardSaturation(0)).toBe(0);
    const pts = curve(STANDARD_CONDITIONS, 1);
    for (let i = 1; i < pts.length; i++) expect(pts[i].so2).toBeGreaterThan(pts[i - 1].so2);
  });

  it('is sigmoid: steepest between 10 and 40 mmHg, flat above 70', () => {
    const slope = (a: number) => standardSaturation(a + 1) - standardSaturation(a);
    expect(slope(25)).toBeGreaterThan(slope(5));
    expect(slope(25)).toBeGreaterThan(slope(80) * 5);
  });
});

describe('temperature and pH corrections (Severinghaus Eq. 3 and 4)', () => {
  it('coefficients match the published equations at P50', () => {
    // Eq. 3 at 26.86 mmHg: 0.058 / ((0.243·0.2686)^3.88 + 1) + 0.013 ≈ 0.0710 per °C
    expect(temperatureCoefficient(STANDARD_P50)).toBeCloseTo(0.071, 3);
    // Eq. 4 at 26.86 mmHg: (26.86/26.6)^0.184 − 2.2 ≈ −1.198 per pH unit
    expect(bohrCoefficient(STANDARD_P50)).toBeCloseTo(-1.198, 3);
  });

  it('standard conditions leave the curve unchanged', () => {
    expect(p50()).toBeCloseTo(STANDARD_P50, 10);
    expect(saturation(40)).toBeCloseTo(standardSaturation(40), 6);
  });

  it('acidosis shifts the curve right (Bohr effect)', () => {
    const c = { ...STANDARD_CONDITIONS, pH: 7.2 };
    expect(shiftDirection(c)).toBe('right');
    // 26.86 · exp(1.198 · 0.2) ≈ 34.1 mmHg
    expect(p50(c)).toBeCloseTo(34.1, 1);
  });

  it('alkalosis shifts left', () => {
    expect(shiftDirection({ ...STANDARD_CONDITIONS, pH: 7.6 })).toBe('left');
  });

  it('fever shifts right, hypothermia shifts left', () => {
    // 26.86 · exp(0.0710 · 3) ≈ 33.2 mmHg
    expect(p50({ ...STANDARD_CONDITIONS, temperatureC: 40 })).toBeCloseTo(33.2, 1);
    expect(shiftDirection({ ...STANDARD_CONDITIONS, temperatureC: 40 })).toBe('right');
    expect(shiftDirection({ ...STANDARD_CONDITIONS, temperatureC: 34 })).toBe('left');
  });

  it('saturation and P50 agree: S(P50 under c) = 0.5', () => {
    const c = { pH: 7.25, temperatureC: 39.5 };
    expect(saturation(p50(c), c)).toBeCloseTo(0.5, 4);
  });

  it('every supported corner gives a monotonic curve', () => {
    for (const pH of [7.1, 7.6]) {
      for (const temperatureC of [34, 41]) {
        const pts = curve({ pH, temperatureC }, 1);
        for (let i = 1; i < pts.length; i++) expect(pts[i].so2).toBeGreaterThan(pts[i - 1].so2);
      }
    }
  });

  it('exercising muscle (pH 7.3, 39 °C) unloads more O2 at PO2 40', () => {
    expect(saturation(40, { pH: 7.3, temperatureC: 39 })).toBeLessThan(saturation(40) - 0.05);
  });

  it('refuses conditions outside the supported range', () => {
    expect(() => saturation(40, { ...STANDARD_CONDITIONS, pH: 6.9 })).toThrow(OutOfRangeError);
    expect(() => saturation(40, { ...STANDARD_CONDITIONS, temperatureC: 43 })).toThrow(OutOfRangeError);
    expect(() => saturation(200)).toThrow(OutOfRangeError);
    expect(() => saturation(Number.NaN)).toThrow(OutOfRangeError);
  });
});

describe('gas and acid–base equations', () => {
  it('alveolar gas equation gives ~100 mmHg on room air at sea level', () => {
    // 0.21 × (760 − 47) − 40 / 0.8 = 149.73 − 50 = 99.73
    expect(alveolarPo2(0.21, 40)).toBeCloseTo(99.73, 2);
  });

  it('inspired PO2 at sea level is ~150 mmHg after humidification', () => {
    expect(inspiredPo2(0.21)).toBeCloseTo(149.73, 2);
  });

  it('oxygen content: Hb 15 g/dL, SaO2 0.98, PaO2 100 → ~20 mL/dL, mostly bound', () => {
    const c = oxygenContent(15, 0.98, 100);
    expect(c.bound).toBeCloseTo(19.70, 2);
    expect(c.dissolved).toBeCloseTo(0.3, 5);
    expect(c.total).toBeCloseTo(20.0, 1);
    expect(c.dissolved / c.total).toBeLessThan(0.02);
  });

  it('anemia lowers content even with normal saturation', () => {
    expect(oxygenContent(8, 0.98, 100).total).toBeLessThan(oxygenContent(15, 0.98, 100).total * 0.6);
  });

  it('Henderson–Hasselbalch: HCO3− 24, PCO2 40 → pH 7.40', () => {
    expect(bicarbonatePh(24, 40)).toBeCloseTo(7.4, 2);
  });

  it('hypoventilation (PCO2 60, HCO3− 24) → acidemia below 7.35', () => {
    expect(bicarbonatePh(24, 60)).toBeLessThan(7.35);
  });
});
