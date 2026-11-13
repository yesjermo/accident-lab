# Design

The page carries the world of the Blender films so the film and the live scene read as one drawing: a technical illustration on paper.

## Colour (Restrained: neutrals plus one accent)

| Token | Value | Use |
|---|---|---|
| paper | #f6f5f2 | page and 3D background, fog |
| paper-2 | #eeede9 | end-of-film hold on the timeline |
| clay | #ecebe8 | every 3D surface |
| rule | #d6d5d1 | table rows, minor dividers |
| ink | #1c1c22 | text, 1px frames, 3D outlines, leader lines |
| ink-2 / muted | #4a4a52 / #6c6c74 | secondary text, axis labels |
| accent | #b01630 | the quantity that hurts: force readout, slow-mo bands, playhead, callout dots, burned regions, list markers |
| accent-wash | #b016301a | slow-mo bands, the first-aid safety note |
| green / amber | #1e7846 / #b4720c | data series only (drowning strategies) |

The 3D palette (glass #d6dce2, sea #cee0e8, rip #aac6d4, sand #f0e8d6, road #e2e2e0) matches `blender/render_scenario.py`.

## Type

Georgia throughout, the face in the films. Bold for titles and tabs; italic for notes, units, axis labels, equations and callouts. Numbers use tabular figures where the face allows. Body 17px, measure capped at 68ch.

## Components

- **Masthead:** brand, a persistent emergency-number line, scenario tabs as text with a 2px crimson underline on the active one.
- **Theatre:** the film (9:16) and the live 3D scene side by side, each in a 1px ink frame. On phones the film is an inset over the 3D scene with a round swap button.
- **Live overlay:** `t`, a slow-motion badge, the crimson primary readout with its note, a secondary readout, then the caption as a serif title with an italic line under it. Captions rise in with a short blur-to-sharp ease-out.
- **Callouts:** SVG leader lines from a crimson ring on the body to an italic label, re-projected every frame.
- **Transport:** a round ink play button that turns crimson on hover, the time, an ink rail timeline (crimson slow-mo bands, caption ticks, crimson progress and playhead) and a segmented ½× / 1× control.
- **Readings:** two line graphs with a moving cursor and dots, plus the equations.
- **Notes:** two reading columns: physics (results table, data tables) and the body (mechanism, prevention, first aid as numbered steps, X-ABCDE as a definition list, surgery).

## 3D

Lambert clay under hemisphere light and one soft-shadow sun. Hard edges are drawn as ink hairlines (EdgesGeometry, 28°); round parts get a thin back-face ink hull for their silhouette. Ground planes and translucent effects stay unoutlined.

## Motion

The film is the master clock; everything else follows it. The one authored transition is the caption rise. `prefers-reduced-motion` stops autoplay and transitions.
