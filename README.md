# Accident Lab

[![Live site](https://img.shields.io/badge/live%20site-yesjermo.github.io%2Faccident--lab-b01630?style=flat-square)](https://yesjermo.github.io/accident-lab/)
[![Deploy](https://img.shields.io/github/actions/workflow/status/yesjermo/accident-lab/pages.yml?branch=main&style=flat-square&label=deploy)](https://github.com/yesjermo/accident-lab/actions/workflows/pages.yml)
![Python](https://img.shields.io/badge/python-3%20·%20stdlib%20only-1c1c22?style=flat-square&logo=python&logoColor=white)
![Three.js](https://img.shields.io/badge/three.js-0.160-1c1c22?style=flat-square&logo=threedotjs&logoColor=white)
![Blender](https://img.shields.io/badge/blender-5.3-1c1c22?style=flat-square&logo=blender&logoColor=white)
![Scenarios](https://img.shields.io/badge/scenarios-5-1c1c22?style=flat-square)

**Try it in the browser: [yesjermo.github.io/accident-lab](https://yesjermo.github.io/accident-lab/)**. Pick an accident and watch the Blender film and the live 3D scene play in sync, then read the physics and the medical notes under it.

A study project that walks through five accidents three ways:

1. **Physics & engineering**: momentum, energy, deceleration, Head Injury Criterion, fluid drag, buoyancy, Ohm's law, Joule heating, heat conduction.
2. **3D simulation**: the same keyframes drive a Blender scene (renders to MP4) and a Three.js viewer in the browser.
3. **Medicine**: how the body gets hurt, prevention, bystander first aid, the emergency department's X-ABCDE survey, and what the surgeon does.

| Scenario | Key physics | Key surgery |
|---|---|---|
| Pedestrian hit by car | KE ∝ v², momentum transfer, HIC, throw distance, stopping distance | Damage-control laparotomy, craniotomy, IM nail, fasciotomy |
| Drowning in a rip current | Vector velocity, drag power, buoyancy, 2D sim of 3 escape strategies | ICU ventilation, ECMO rewarming |
| Fall from height | v = √(2gh), g-load vs stopping distance | TEVAR for aortic tear, spinal fusion, calcaneus fixation |
| Electrocution | I = V/R, skin resistance, current thresholds, Q = I²Rt | Fasciotomy, serial debridement |
| Burns in a house fire | Rule of nines, Parkland formula, skin as a semi-infinite solid | Escharotomy, excision, skin grafting |

> Educational only. In a real emergency, call 911 / 112 / 999 first.

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

## Experiment

Every scenario is a function with its assumptions as arguments in [lab/physics.py](lab/physics.py). Change them and re-run `build.py`:

- `pedestrian(speed_kmh=30)`: watch the HIC and fatality risk fall.
- `drowning(rip_speed=0.8)`: now a strong swimmer *can* fight it, slowly.
- `fall(height=15)`: the 4-storey LD50.
- `electrocution(voltage=240, condition="dry")`
- `burns(burned=("front_torso", "back_torso", "right_leg"))`

Edit `ALL` at the bottom of `physics.py` (e.g. `lambda: physics.pedestrian(speed_kmh=30)`) to change what the viewer and Blender show.

## Files

- `lab/physics.py`: all the calculations and animation keyframes (standard library only)
- `lab/medical.py`: mechanism, prevention, first aid, hospital and surgery notes
- `lab/build.py`: runs both and writes the outputs
- `lab/test_animation.py`: checks the keyframes against the car and dummy geometry (no clipping, head meets the glass on cue, enough keys for slow motion)
- `blender/render_scenario.py`: builds each scene in Blender from the keyframes
- `web/index.html`: the viewer: film and live 3D in sync, graphs, physics tables and medical notes
- `web/media/`: rendered films, copied there by `render_scenario.py --render`
- `LESSONS.md`: generated: the full write-up, readable on its own
