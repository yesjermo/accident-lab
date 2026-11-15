# Content sources

All checking was done on **2026-11-15**. Each claim was checked against the fetched text of the source listed. **No subject-expert review has taken place.**

| Source | Used for | Access during checking | Licence / how used |
|---|---|---|---|
| OpenStax *Anatomy and Physiology 2e* (Betts et al., 2022): 19.1, 20.3, 22.1, 22.2, 22.3, 22.4, 22.5, 26.4, 26.5 | Heart anatomy, capillary exchange, airway zones, alveolar cells, membrane thickness (~0.5 µm), lobes, Boyle's law, partial pressures (Table 22.2: atmospheric PO₂ 158.8, alveolar ~104/40, venous ~40/45), V/Q matching, O₂ and CO₂ transport (98.5/1.5%; 70/20/7–10%), chloride shift, Haldane effect, pH 7.35–7.45, 20:1 ratio | Full text | CC BY-NC-SA 4.0; OpenStax terms also restrict generative-AI use. **Linked and cited only; no text or figures copied.** |
| OpenStax *Biology 2e* (Clark, Douglas, Choi, 2018): 7.4, 39.4 | Electron transport chain, complex IV, chemiosmosis, cyanide inhibiting cytochrome c oxidase, the ATP yield varying (so no number is given), sigmoid curve, curve shifts | Full text | As above |
| OpenStax *Chemistry 2e* (Flowers et al., 2019): 14.6 | General Henderson–Hasselbalch form; blood bicarbonate buffer | Full text | As above. The page's blood pKa values are internally inconsistent (7.35 vs 6.4), so the clinical constants 6.1/0.03 remain **Draft** |
| Severinghaus JW (1979) *J Appl Physiol* 46(3):599–602, doi:10.1152/jappl.1979.46.3.599 | Eq. 1 (standard curve), Eq. 3 (temperature coefficient), Eq. 4 (Bohr coefficient), ±0.0055 fit | Abstract via Europe PMC (PMID 35496); citation via Crossref | Equations cited; paper not reproduced |
| StatPearls: *Alveolar Gas Equation* (Hendrix & Burns, NBK482268) | Worked example 99.7 mmHg (0.21 × (760 − 47) − 40/0.8) | Abstract via Europe PMC (Bookshelf full text blocked by a browser check) | Linked only |
| StatPearls: *Physiology, Bohr Effect* (NBK526028) | Bohr effect description | Abstract | Linked only |
| StatPearls: *Physiology, Oxyhemoglobin Dissociation Curve* (NBK499818) | Most O₂ bound to Hb | Abstract | Linked only |
| StatPearls: *Physiology, Oxygen Transport* (Rhodes, Denault, Varacallo; NBK538336) | Unloading factors | Abstract. The O₂-content equation was **not** confirmed, so it stays Draft | Linked only |
| StatPearls: *Carbon Monoxide Poisoning* (PMID 32491811) | CO affinity ~200–250× O₂; pulse oximetry falsely reassuring | Abstract | Linked only |
| Khan Academy Medicine, *Bohr effect vs. Haldane effect* (YouTube) | Curated video | Title and channel confirmed via oEmbed | Linked, not embedded |
| Ninja Nerd, *Oxygen-Hemoglobin Dissociation Curve* (YouTube) | Curated video | Title and channel confirmed via oEmbed | Linked, not embedded |

## Corrections made during checking

- Atmospheric PO₂ uses OpenStax's **158.8 mmHg**, not the rounded 160.
- The ATP yield per glucose is **not stated** as a number, because the source says it varies.
- The ODC temperature and pH corrections use the paper's own Eq. 3 and Eq. 4. A commonly quoted "virtual PO₂" constant set could not be confirmed in an accessible source, so it was **not used**. The separate PCO₂ term was dropped for the same reason.
- Reference ranges for PaCO₂ and HCO₃⁻ are not shown as single ranges, because OpenStax gives sex-specific and venous values that differ from the commonly quoted ones.

## Still Draft

Listed live in the app at `#/sources`:

- Henderson–Hasselbalch constants (6.1, 0.03)
- O₂-content equation (1.34, 0.003), and the anemia statement that depends on it
- Fick's law written as an equation (the qualitative factors are verified)
- Concept-map link r3 (an inference)
