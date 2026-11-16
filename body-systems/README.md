# Body Systems Explorer

An interactive study app for premedical and medical students that connects anatomy, physiology, biology and chemistry across scales:

**body system → organ → tissue → cell → molecular mechanism → clinical application.**

The first release covers the cardiovascular and respiratory systems. They are joined by one guided journey, **Follow an Oxygen Molecule**, which traces O₂ from inhalation, through gas exchange and transport in blood, to delivery in tissue and use in the mitochondrion, and then follows CO₂ back out.

> Educational only. Nothing here is a diagnosis, a patient-specific prediction or a treatment recommendation. Content is source-checked by the author; **no subject-expert review has taken place yet.**

## Run it

Requires Node 18+.

```bash
cd body-systems
npm install
npm run dev        # http://localhost:5173
npm test           # 60 tests: science, study logic, content integrity, UI flows
npm run build      # static site in dist/ (relative paths, hash routing)
```

The build is a static site, so it can be served from any sub-path. The repo's Pages workflow builds it into `web/body-systems/`.

## What a student can do

| Acceptance criterion | Where |
|---|---|
| Explore in 3D | **3D body** (`#/explore/3d`): a transparent full body built from BodyParts3D anatomical meshes. Rotate, zoom, and click an organ to open its panel; the skin and skeleton layers can be toggled. An organ list gives keyboard access, and the 2D diagrams are the fallback without WebGL |
| Select the heart or lungs | **Explore the body** (`#/explore/body`). Click or Tab+Enter on the drawing, or use the structure list under it |
| Complete the oxygen journey | **Follow an Oxygen Molecule** (`#/journey`): 7 steps, synchronised diagram, objectives, prerequisites, glossary, a knowledge check per step |
| Go from anatomy to biology and chemistry | Detail panel tabs (Anatomy / Physiology / Biology / Chemistry / Clinical / Study). "Why does this happen?" links open layered mechanism pages with a **Back to …** link |
| Use the dissociation-curve experiment | `#/experiment`: predict the direction of change first, then reveal. Shows the baseline, readouts, a table view, equations, assumptions and the valid range |
| Labeling and quiz with feedback | `#/practice/label` (tap or keyboard `select`s) and `#/practice` (every choice explained) |
| Note, bookmark, flashcards | Every structure, concept and journey step has a note and a bookmark; flashcards are at `#/review` |
| Reload without losing progress | Versioned localStorage via `StudyRepository` |
| Inspect sources | Expandable provenance under every item, plus `#/sources` |
| Keyboard and tablet | All controls are focusable; diagrams are SVG button groups with text-list alternatives. The layout adapts at 1180 px and 920 px |

## Architecture

```
src/
  domain/types.ts        Data model: systems, structures, concepts, relationships, lessons,
                         questions, flashcards, labeling, resources, simulations, sources, provenance
  content/               Editorial content as typed data (no JSX), plus ContentRepository
    sources.ts           Source registry and section references (REF.*)
    structures.ts        28 structures × 5 lenses, at two reading levels
    concepts.ts          8 mechanisms with "Why" layers, equations, concept-map edges, glossary
    lesson.ts            The oxygen journey (7 steps, 7 objectives)
    questions.ts         19 MCQs; every choice has an explanation
    practice.ts          Flashcards, labeling exercises, curated resources, simulation spec
    repository.ts        ContentRepository interface + StaticContentRepository
  science/               Pure, tested functions
    odc.ts               Severinghaus 1979 dissociation curve + temperature/pH coefficients
    gas.ts               Alveolar gas equation, O₂ content, Henderson–Hasselbalch
  study/                 User data: pure logic, no React
    model.ts             StudyData v1 (shareable records carry ownerId/collectionId/visibility)
    reducer.ts           All state transitions
    srs.ts               Five-box Leitner schedule (documented below)
    progress.ts          Progress by objective; lesson completion kept separate from evidence
    persistence.ts       StudyRepository interface, localStorage impl, versioned parse/migrate, import/export
    anki.ts              Anki-compatible CSV export
    grading.ts           Quiz scoring and labeling grading
  diagrams/              Original schematic SVG definitions (regions, anchors, labels)
  components/Body3D.tsx  three.js viewer for public/models/body.glb; catalogue in content/body3d.ts
tools/build_body_glb.py  Blender script: BodyParts3D OBJ → per-organ, Draco-compressed GLB
  components/            Diagram, DetailPanel, QuestionCard, WhyExplainer, Provenance, StudyTools, states
  pages/                 Route screens
```

**Content is kept apart from presentation.** Components only ever receive a `ContentBundle` from `ContentRepository.loadBundle()`. To move content to a backend, add an `HttpContentRepository` that fetches the same JSON shapes (for example `GET /content/bundle`) from FastAPI and Postgres, and pass it to `<App contentRepo={…} />`.

**User data has the same seam.** `StudyRepository` (`load` / `save` / `clear`) is implemented for localStorage today. A later `ApiStudyRepository` can sync to FastAPI. Notes, bookmarks, attached resources and user flashcards already carry `ownerId`, `collectionId` and `visibility`, so shared collections and group annotations need no migration of existing data.

**Versioning.** Study data has a `schemaVersion` (currently 1) and a `MIGRATIONS` table in `persistence.ts`. Data from a newer schema is refused with a clear message. Corrupt stored data is kept in a side key, never silently destroyed. Content has a bundle version, and every item has its own semantic version.

### Spaced review (documented schedule)

A five-box Leitner schedule, chosen to be simple and predictable:

| Rating | New box | Next due |
|---|---|---|
| Again | 1 | 10 minutes |
| Good | box + 1 (max 5) | box interval |
| Easy | box + 2 (max 5) | box interval |

Box intervals are 1, 3, 7, 16 and 35 days. A card never reviewed is "new", not "due". The review queue holds due cards plus questions whose latest answer was wrong.

### Progress versus understanding

Completing a lesson's steps marks the lesson complete, and that is all it does. A learning objective becomes **Demonstrated** only when the latest answers to at least two of its questions (or all, if it has fewer) are correct and none of its latest answers is wrong. A later wrong answer moves it to **Needs review**. The app never says "mastered".

## The dissociation-curve model

- **Standard curve:** Severinghaus JW, *J Appl Physiol* 1979;46:599–602, Eq. 1: S = (23400/(PO₂³ + 150·PO₂) + 1)⁻¹, at 37 °C and pH 7.40, fitting within ±0.0055 saturation.
- **Temperature and pH:** the coefficients from the same paper, Eq. 3 (d ln PO₂/dT) and Eq. 4 (d ln PO₂/dpH). They are applied as a constant shift, evaluated on the standard curve. That combination is this app's first-order approximation and is stated in the UI.
- **Supported range:** pH 7.10–7.60, 34–41 °C, PO₂ 0–150 mmHg. The functions throw outside this range.
- **Not modelled:** 2,3-BPG, CO, fetal or abnormal hemoglobins, and a separate PCO₂ term. CO₂ acts through pH only.
- **Tested reference values:** P50 ≈ 26.9 mmHg; SO₂ ≈ 75% at 40 mmHg and 97–98% at 100 mmHg. At pH 7.20 the coefficient-derived P50 is ≈ 34.1 mmHg; at 40 °C it is ≈ 33.2 mmHg.

## Content provenance

Every structure, concept, relationship, lesson, question, flashcard, labeling exercise and simulation stores `sources` (with section), `version`, `lastVerified`, `reviewStatus` (`draft` | `source-checked` | `expert-reviewed`) and `notes`. A test (`content.test.ts`) enforces these rules:

- every item has at least one resolvable source;
- `draft` items explain what is unverified and carry no verification date;
- nothing claims `expert-reviewed`;
- every equation variable has a unit, and every equation states its limits.

Items still marked **Draft**, because a claim wasn't found in an accessible source at checking time:

- the clinical Henderson–Hasselbalch constants (6.1, 0.03);
- Fick's law written as an equation;
- the anemia statement, which depends on the O₂-content equation;
- one concept-map inference.

See [CONTENT_SOURCES.md](CONTENT_SOURCES.md) and [ASSETS.md](ASSETS.md).

## Accessibility

- Diagram structures are `role="button"` SVG groups with names, and Enter/Space selects them. A list of the same structures sits under each drawing.
- Highlight and selection use outline weight, dashes and bold labels, not color alone. Oxygen-poor blood is hatched.
- The panel uses ARIA tabs (arrow keys, Home and End). Questions are native radio groups.
- Labeling works by tap or by a native `select` for each marker.
- Focus is visible everywhere. Touch targets are at least 40–44 px.
- `prefers-reduced-motion` and `prefers-color-scheme` are honoured.
- The chart has a table view and a text readout.

## Known limitations

- No subject-expert review yet. StatPearls was checked from abstracts only, because full text was blocked by a browser check at the time.
- The diagrams are deliberately schematic. They are not to scale and not a substitute for an atlas.
- The 3D body is limited by BodyParts3D 4.0:
  - The lungs appear as their bronchial and vascular trees, because the dataset has no lung-surface mesh.
  - Thigh muscle appears only in 2D, because the dataset has no individual thigh-muscle meshes.
  - Organs outside the cardiorespiratory system are context only and marked Planned.
- There is one experiment, one learning path, and two systems in depth.
- Progress lives in one browser. Use Export/Import to move it.
- Anki header lines need Anki 2.1.55 or later. On older versions, delete the first four lines before importing.

## Next steps

1. Expert review of every item, recorded as `expert-reviewed` with the reviewer's name.
2. Find accessible sources for the draft items, or rewrite them.
3. Add a FastAPI + PostgreSQL backend behind `ContentRepository` and `StudyRepository`, then accounts and sync.
4. Add shared study collections, using the `collectionId` and `visibility` fields.
5. Add more experiments (alveolar gas equation, O₂ content versus Hb) and more systems (renal acid–base, control of breathing).
6. Add 3D lessons for the context organs. Consider the larger BodyParts3D IS-A set or Z-Anatomy for lung surfaces and muscles, after a licence check.
