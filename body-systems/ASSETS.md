# Asset licences

| Asset | Origin | Licence |
|---|---|---|
| Diagrams in `src/diagrams/defs.tsx` (body overview, heart, alveolus, tissue/cell) | Original schematic SVG drawn for this project. Relationships checked against OpenStax A&P 2e 19.1, 22.1 and 22.2, but no OpenStax figure was traced or copied | Same as the repository |
| Concept map (`src/pages/ConceptPages.tsx`) | Generated from content data | Same as the repository |
| KaTeX fonts and CSS | `katex` npm package | MIT |
| Charting | `recharts` npm package | MIT |
| UI framework | `react`, `react-dom`, `react-router-dom` | MIT |
| 3D body model `public/models/body.glb` | Built by `tools/build_body_glb.py` from **BodyParts3D 4.0** (part-of tree, `partof_BP3D_4.0_obj_99.zip`), © The Database Center for Life Science (DBCLS), https://dbarchive.biosciencedbc.jp/en/bodyparts3d/. Meshes merged per organ, polygon-reduced and Draco-compressed in Blender 5.3; shapes are not edited | The licence page (checked 2026-11-15) states **CC BY 4.0**. The OBJ files themselves carry a **CC BY-SA 2.1 Japan** notice, so this derived model file is shared under **CC BY-SA**. The share-alike applies to the model, not to the app's code. Attribution: "BodyParts3D, © The Database Center for Life Science" |
| Lung lobes and thigh muscles inside `body.glb` | Extracted by `tools/extract_zanatomy.py` from **Z-Anatomy** (`Z-Anatomy.zip` → `Startup.blend`, https://github.com/Z-Anatomy/Models-of-human-anatomy). It includes 5 lung lobes and 13 thigh muscles per side. They were aligned to BodyParts3D coordinates with a uniform scale (0.989) and a translation, fitted by least squares on 15 shared landmarks (RMSE 6.5 mm). Shapes are not edited | **CC BY-SA 4.0**. Attribution: "Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0", and via it "BodyParts3D - The Database Center for Life Science". Z-Anatomy's non-commercial parts (the inner ear, CC BY-NC-SA, and a kidney model, CC BY-NC) are **not** used. Because of these parts, the combined `body.glb` is shared under **CC BY-SA 4.0** |
| Draco decoder `public/draco/` | `three` npm package (Google Draco) | Apache 2.0 |
| 3D rendering | `three` npm package | MIT |

No other third-party images, icons, 3D models or videos are bundled. Videos are external links.

### What the 3D model does and doesn't show

- **Covered organs:**
  - lungs (Z-Anatomy lobes);
  - bronchial tree, trachea and heart;
  - aorta, venae cavae, and pulmonary arteries and veins;
  - diaphragm;
  - thigh muscles (Z-Anatomy).

  Each opens the full lesson content.
- **Context organs, marked Planned:** brain, esophagus, liver, stomach, pancreas, kidneys, intestines, bladder, plus the skeleton and the skin.
- **Filling the two gaps:** BodyParts3D 4.0 has no lung-surface mesh and no thigh-muscle meshes. Both come from Z-Anatomy, a published atlas built on the same data. **Nothing was sculpted, generated or approximated.**

To rebuild the model:

1. Download BodyParts3D (`partof_BP3D_4.0_obj_99.zip`) and Z-Anatomy (`Z-Anatomy.zip`).
2. Run the extraction. The Z-Anatomy file is third-party, so open it with scripts disabled:
   `blender -b --disable-autoexec <Z-Anatomy/Startup.blend> -P tools/extract_zanatomy.py -- tools/za_to_bp.json za_parts.blend` (refit with `tools/fit_za_to_bp.py`)
   The transform file holds `{"scale": 0.989, "t": [0.0001, -0.0969, -0.0529]}`.
3. Build the model:
   `blender -b -P tools/build_body_glb.py -- <bp3d dir> public/models/body.glb za_parts.blend`

The diagrams are schematic and not to scale. They show the relative positions needed for this release, such as anterior view, heart apex to the patient's left, three right and two left lung lobes, and the right pulmonary artery passing behind the ascending aorta. They are not a substitute for an anatomical atlas.
