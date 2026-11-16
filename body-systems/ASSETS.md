# Asset licences

| Asset | Origin | Licence |
|---|---|---|
| Diagrams in `src/diagrams/defs.tsx` (body overview, heart, alveolus, tissue/cell) | Original schematic SVG drawn for this project. Relationships checked against OpenStax A&P 2e 19.1, 22.1 and 22.2, but no OpenStax figure was traced or copied | Same as the repository |
| Concept map (`src/pages/ConceptPages.tsx`) | Generated from content data | Same as the repository |
| KaTeX fonts and CSS | `katex` npm package | MIT |
| Charting | `recharts` npm package | MIT |
| UI framework | `react`, `react-dom`, `react-router-dom` | MIT |
| 3D body model `public/models/body.glb` | Built by `tools/build_body_glb.py` from **BodyParts3D 4.0** (part-of tree, `partof_BP3D_4.0_obj_99.zip`), © The Database Center for Life Science (DBCLS), https://dbarchive.biosciencedbc.jp/en/bodyparts3d/. Meshes merged per organ, polygon-reduced and Draco-compressed in Blender 5.3; shapes are not edited | The licence page (checked 2026-11-15) states **CC BY 4.0**. The OBJ files themselves carry a **CC BY-SA 2.1 Japan** notice, so this derived model file is shared under **CC BY-SA**. The share-alike applies to the model, not to the app's code. Attribution: "BodyParts3D, © The Database Center for Life Science" |
| Draco decoder `public/draco/` | `three` npm package (Google Draco) | Apache 2.0 |
| 3D rendering | `three` npm package | MIT |

No other third-party images, icons, 3D models or videos are bundled. Videos are external links.

### What the 3D model does and doesn't show

- **Covered organs:** lungs, trachea and bronchi, heart, aorta, venae cavae, pulmonary arteries and veins, diaphragm. Each opens the full lesson content.
- **Context organs, marked Planned:** brain, esophagus, liver, stomach, pancreas, kidneys, intestines, bladder, plus the skeleton and the skin.
- **Gaps in the dataset:** it has no lung-surface mesh, so the lungs appear as their bronchial, arterial and venous trees. It has no individual thigh-muscle meshes, so the representative muscle tissue appears only in the 2D tissue diagram. **Nothing was sculpted, generated or approximated to fill either gap.**

To rebuild the model, download BodyParts3D, then run:
`blender -b -P tools/build_body_glb.py -- <bp3d dir> public/models/body.glb`

The diagrams are schematic and not to scale. They show the relative positions needed for this release, such as anterior view, heart apex to the patient's left, three right and two left lung lobes, and the right pulmonary artery passing behind the ascending aorta. They are not a substitute for an anatomical atlas.
