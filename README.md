# Accident Lab

[![Live site](https://img.shields.io/badge/live%20site-yesjermo.github.io%2Faccident--lab-b01630?style=flat-square)](https://yesjermo.github.io/accident-lab/)
[![Deploy](https://img.shields.io/github/actions/workflow/status/yesjermo/accident-lab/pages.yml?branch=main&style=flat-square&label=deploy)](https://github.com/yesjermo/accident-lab/actions/workflows/pages.yml)
![Python](https://img.shields.io/badge/python-3%20·%20stdlib%20only-1c1c22?style=flat-square&logo=python&logoColor=white)
![Three.js](https://img.shields.io/badge/three.js-0.160-1c1c22?style=flat-square&logo=threedotjs&logoColor=white)
![Blender](https://img.shields.io/badge/blender-5.3-1c1c22?style=flat-square&logo=blender&logoColor=white)
![Scenarios](https://img.shields.io/badge/scenarios-6-1c1c22?style=flat-square)
[![Body Systems Explorer](https://img.shields.io/badge/body%20systems%20explorer-live-b01630?style=flat-square)](https://yesjermo.github.io/accident-lab/body-systems/)
![React](https://img.shields.io/badge/react-18%20·%20typescript-1c1c22?style=flat-square&logo=react&logoColor=white)

**Try it in the browser.** The site hosts two apps:

- **[Accident Lab](https://yesjermo.github.io/accident-lab/):** pick an accident, watch the Blender film and the live 3D scene play in sync, then read the physics and the medical notes under it.
- **[Body Systems Explorer](https://yesjermo.github.io/accident-lab/body-systems/):** a study app for premed and medical students. It connects anatomy, physiology, biology and chemistry, from a transparent 3D body down to the molecule. [Jump to it](#body-systems-explorer).

The rest of this section covers Accident Lab.

A study project that walks through six accidents three ways:

1. **Physics & engineering**: momentum, energy, deceleration, Head Injury Criterion, fluid drag, buoyancy, Ohm's law, Joule heating, heat conduction.
2. **3D simulation**: the same keyframes drive a Blender scene (renders to MP4) and a Three.js viewer in the browser.
3. **Medicine**: how the body gets hurt, prevention, bystander first aid, the emergency department's X-ABCDE survey, and what the surgeon does.

| Scenario | Key physics | Key surgery |
|---|---|---|
| Pedestrian hit by car | KE ∝ v², momentum transfer, HIC, throw distance, stopping distance | Damage-control laparotomy, craniotomy, IM nail, fasciotomy |
| Drowning in a rip current, told as if it happens to you | Rip vs swim speed, drag power, buoyancy (why you can't keep your head up), sinking terminal velocity, SpO₂ from the oxygen dissociation curve, 3 escape strategies compared | In-water rescue breaths, drowning CPR, ICU ventilation, ECMO rewarming |
| Fall from height | v = √(2gh), g-load vs stopping distance | TEVAR for aortic tear, spinal fusion, calcaneus fixation |
| Electrocution | I = V/R, skin resistance, current thresholds, Q = I²Rt | Fasciotomy, serial debridement |
| Burns in a house fire | Rule of nines, Parkland formula, skin as a semi-infinite solid | Escharotomy, excision, skin grafting |
| Choking on food | Boyle's law in the blocked lungs, ΔP·A against the food's grip, SpO₂ with no airflow | Laryngoscopy and Magill forceps, rigid bronchoscopy, emergency cricothyrotomy |

> Educational only. In a real emergency, call 911 / 112 / 999 first.

## Body Systems Explorer

**Live: [yesjermo.github.io/accident-lab/body-systems](https://yesjermo.github.io/accident-lab/body-systems/)**. The source is in [`body-systems/`](body-systems/) (React + TypeScript + Vite).

The app moves between scales: body system → organ → tissue → cell → molecular mechanism → clinical application.

| Feature | What a student can do |
|---|---|
| **3D body** | Rotate a transparent full body built from real anatomical meshes (BodyParts3D, with Z-Anatomy lung lobes and thigh muscles). Click any organ to open its lesson; the camera flies to it, and the skin, skeleton and other organs can be toggled |
| **Follow an Oxygen Molecule** | A 7-step guided path from inhalation, through gas exchange and hemoglobin and the left heart, to delivery in tissue, the mitochondrion, and CO₂ on the way back. Each step has a synchronised diagram |
| **Beyond the Lungs (3D tour)** | A 6-step 3D lesson on how other organs support oxygen transport: the brainstem's control of breathing, kidneys and EPO, red bone marrow, gut to liver, pH control and skin |
| **Organ panels** | 28 cardiorespiratory structures and 11 other organs, each with Anatomy, Physiology, Biology, Chemistry, Clinical and Study tabs, at Foundation or Medical Student level |
| **Why does this happen?** | Layered explanations from intuition to molecules, for diffusion, hemoglobin binding, membranes, mitochondria and ATP, and CO₂ and acid–base. Every equation explains each variable and unit and states its limits. A concept map explains each link |
| **Experiment** | The O₂–hemoglobin dissociation curve (Severinghaus 1979). Predict the shift, then see it, with the baseline, assumptions and supported range |
| **Practice and review** | Quiz with every answer explained, diagram labeling (tap or keyboard), Leitner flashcards, a review queue, and progress by learning objective |
| **Medical Student toolbar** | At that level, hover, tap or keyboard menus for clinical connections, an equation sheet, mechanisms and review |
| **Your study data** | Notes, bookmarks and attached links, saved in the browser. Anki CSV export of your own flashcards, plus JSON export and import |
| **Sources** | Every item records its sources, version, verification date and review status. Unverified items are marked *Draft*, and nothing claims expert review |

```bash
cd body-systems
npm install
npm run dev        # local dev server
npm test           # science, study logic, content integrity, UI flows
npm run build      # static site; the Pages workflow builds it into web/body-systems/
```

Details:

- [Architecture, scope and limits](body-systems/README.md)
- [Content sources](body-systems/CONTENT_SOURCES.md)
- [Asset licences](body-systems/ASSETS.md): the 3D model file is CC BY-SA 4.0, and the app code is not affected.

> Educational only. Body Systems Explorer does not diagnose or recommend treatment.

## Run it

```bash
python3 lab/build.py                 # physics -> out/scenarios.json, web/data.js, LESSONS.md
python3 lab/test_animation.py        # keyframe checks: nothing passes through the car or the ground
python3 lab/serve.py                 # then open http://localhost:8765 (serves web/ with byte ranges so the films can seek)
```

The viewer plays the rendered Blender film (`web/media/<id>.mp4`) and the live Three.js scene on one timeline. The film is the clock; the 3D scene, readouts, callouts and graphs follow it, so slow motion around each impact shows up in both. Crimson bands on the timeline mark the slow-motion windows. Drag to orbit the 3D view (pinch or ⌘ + scroll to zoom), press space to play or pause and use the arrow keys to step frames. On a phone the film sits in a corner of the 3D view; tap the swap button to enlarge it. Scenarios without a rendered film still play in 3D.

### Blender

Install Blender (free) from blender.org, or with Homebrew: `brew install --cask blender`. Then:

```bash
blender --python blender/render_scenario.py -- pedestrian            # open the scene to explore
blender -b --python blender/render_scenario.py -- all --render       # render every scenario to out/*.mp4
blender -b --python blender/render_scenario.py -- fall --still 50    # one test frame -> out/previews/
blender -b --python blender/render_scenario.py -- all --glb          # the same scenes as glTF -> web/models/ for the viewer
```

The videos are vertical (720×1280) in a technical-illustration style: white clay models with ink outlines (Freestyle) and one crimson accent. The HUD at the top shows `t`, a slow-motion badge (×1/13 around impacts) and two live readouts. Below that come a serif caption for each phase and callouts with leader lines. The bottom panel holds two graphs with a moving cursor, plus the equations with the numbers filled in. All of it is driven by the `story` block each scenario returns in `lab/physics.py`: series, captions, callouts, slow-mo windows and equations.

### How the browser 3D matches Blender

The viewer does not rebuild the scenes by hand. `--glb` exports each Blender scene to glTF (`web/models/<id>.glb`): the same meshes, the same per-frame keyframes and the film's camera, with the sparks and flames baked into scale keys. Three.js loads it with `GLTFLoader` and plays it with an `AnimationMixer` set to the video's current time. Animation time 0 is film frame 1, so the film and the 3D view always show the same instant. **Film camera** looks through Blender's camera; drag to leave it and orbit freely. If a `.glb` is missing, the viewer falls back to a simplified hand-built scene driven by the same keyframes.

After changing the physics, re-export both: `--render` for the films and `--glb` for the 3D.

Each run also saves `out/<scenario>.blend`. The HUD text is updated by a frame handler the script registers, so when you open a saved `.blend` on its own, the 3D animation plays but the HUD stays frozen. Open scenes through the script to get the live HUD.

### Interactive figures

Each scenario's physics section opens with a small interactive line figure, built with [Hairline](https://github.com/lucasmarkes/hairline) (MIT, by Lucas Markes). Your pointer drives the scenario's one key variable, using the same equations as `lab/physics.py`:

| Scenario | Figure | Your pointer sets | Slider |
|---|---|---|---|
| Pedestrian | `stopping` | the car's speed: it stops after reaction plus braking distance | reaction time |
| Drowning | `escape` | the way you swim off in a rip | rip speed |
| Fall | `landing` | what you land on: concrete, grass, a car roof, foam | height |
| Electrocution | `stepfield` | where you stand near a downed line: the voltage between your feet | current into the ground |
| House fire | `smoke` | how long the fire has burned: the smoke layer comes down | fire growth |
| Choking | `thrust` | how hard the thrust squeezes the blocked lungs (Boyle's law) | the food's grip |

Sources are in `hairline/<name>.js`; the built pages the site embeds are in `web/hairline/`. To change one, edit its source and rebuild with the Hairline skill's `build.mjs` (and `look.mjs` to check it), then copy `hairline/hairline-<name>.html` to `web/hairline/<name>.html`.

## Experiment

Every scenario is a function with its assumptions as arguments in [lab/physics.py](lab/physics.py). Change them and re-run `build.py`:

- `pedestrian(speed_kmh=30)`: watch the HIC and fatality risk fall.
- `drowning(endurance_s=40)`: you tire sooner, closer to the beach. `rip_speed=2.0` is a strong rip; `start_offshore=40` starts you further out.
- `fall(height=15)`: the 4-storey LD50.
- `electrocution(voltage=240, condition="dry")`
- `burns(burned=("front_torso", "back_torso", "right_leg"))`
- `choking(hold_n=2.5)`: food that sits looser comes out on an earlier thrust

Edit `ALL` at the bottom of `physics.py` (e.g. `lambda: physics.pedestrian(speed_kmh=30)`) to change what the viewer and Blender show.

## Files

- `lab/physics.py`: all the calculations and animation keyframes (standard library only)
- `lab/medical.py`: mechanism, prevention, first aid, hospital and surgery notes
- `lab/build.py`: runs both and writes the outputs
- `lab/test_animation.py`: checks the keyframes against the car and dummy geometry (no clipping, head meets the glass on cue, enough keys for slow motion)
- `blender/render_scenario.py`: builds each scene in Blender from the keyframes
- `web/index.html`: the viewer: film and live 3D in sync, graphs, physics tables and medical notes
- `web/media/`: rendered films, copied there by `render_scenario.py --render`
- `hairline/`, `web/hairline/`: the interactive figures' sources and built pages
- `LESSONS.md`: generated: the full write-up, readable on its own
- `body-systems/`: the Body Systems Explorer app (React + TypeScript). Content is in `src/content/`, tested science in `src/science/`, and the study-data logic in `src/study/`. `tools/` holds the Blender scripts that build `public/models/body.glb` from BodyParts3D and Z-Anatomy
- `.github/workflows/`: `pages.yml` deploys `web/` plus the built Body Systems Explorer; `body-systems-ci.yml` tests the app on PRs and on pushes to `main`
