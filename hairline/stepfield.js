/**
 * Step field: a downed line's end lies at the middle of a field of pillars,
 * each as tall as the ground's voltage there, V = ρI/2πr. A person stands on
 * that surface where the pointer is, feet a stride apart along the slope, so
 * one foot stands higher than the other: the step voltage, the difference
 * between the feet, is what drives current up one leg and down the other.
 * Near the line the slope is steep; ten metres out it is nearly flat. The
 * line's end is bright at rest; the person takes the bright stroke when the
 * pointer places them. The slider is the current into the ground, in amps.
 *
 * The same numbers as lab/physics.py electrocution(): ρ 100 Ω·m, 0.8 m stride.
 */
const {
  Cam, clamp, facing, fit, open, poly, prism, proj, rings, spring, stepS, unproj,
  disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const N = 9, CELL = 14, FOOT = 11, EXT = N * CELL, MID = EXT / 2, UM = CELL / 2.5;   // 2.5 m cells: 22.5 m across
const RHO = 100, STRIDE = 0.8, VMAX = 180, HMAX = 46;                               // heights: HMAX at VMAX volts

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amps = value, last = null;
  const C = Cam(45, 0.5, 1.5);
  fit(C, [[-6, -6, -4], [EXT + 6, EXT + 6, -4], [EXT + 6, -6, -4], [-6, EXT + 6, -4], [0, 0, 40], [MID, MID, HMAX + 30]], 200, 168);
  const P = proj(C), front = facing(C);
  const volts = (rm) => clamp((RHO * amps) / (2 * Math.PI * Math.max(rm, 0.6)), 0, VMAX);
  // drawn on a square-root scale so the slope reads well away from the line, not just beside it
  const hOf = (x, y) => Math.sqrt(volts(Math.hypot(x - MID, y - MID) / UM) / VMAX) * HMAX;

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-6, -6, EXT + 6, EXT + 6, 9, 2.2);
  put(solid(g), prism(P, front, pr, pi, -4, 0));
  // the pole at the far corner and the line sagging down to the middle
  const [qr, qi] = rings(-2, -2, 3, 3, 2.4, 0.8);
  put(solid(g), prism(P, front, qr, qi, 0, 40));
  const cells = [];
  for (let s = 0; s <= 2 * (N - 1); s++) for (let i = 0; i < N; i++) {
    const j = s - i;
    if (j < 0 || j >= N) continue;
    const x0 = i * CELL + (CELL - FOOT) / 2, y0 = j * CELL + (CELL - FOOT) / 2;
    const [ring, inner] = rings(x0, y0, x0 + FOOT, y0 + FOOT, 2.4, 0.9);
    cells.push({ i, j, ring, inner, el: solid(g) });
  }
  const wire = mk("path", { class: "nf" }, g);
  const tip = flatDot(g, C, 1.3, "dot");

  // the person: two legs from each foot up to the hips, a torso, a head
  const man = mk("g", {}, g), legs = [solid(man), solid(man)], torso = solid(man), head = mk("path", { class: "sil" }, man);
  const sx = spring(EXT - 10), sy = spring(EXT - 22);

  function drawField() {
    cells.forEach((c) => {
      const h = Math.max(0.8, hOf((c.i + 0.5) * CELL, (c.j + 0.5) * CELL));
      put(c.el, prism(P, front, c.ring, c.inner, 0, h));
    });
    const top = hOf(MID, MID);
    wire.setAttribute("d", open([P(0.5, 0.5, 39), P(MID * 0.45, MID * 0.45, 30), P(MID * 0.8, MID * 0.8, top + 10), P(MID, MID, top)]));
    place(tip, P(MID, MID, top + 0.4));
  }
  let drawn = "";
  function drawMan() {
    const x = sx.x, y = sy.x, key = x.toFixed(2) + "," + y.toFixed(2) + "," + amps;
    if (key === drawn) return;
    drawn = key;
    const r = Math.hypot(x - MID, y - MID) || 1, ux = (x - MID) / r, uy = (y - MID) / r, half = (STRIDE * UM) / 2;
    const feet = [[x - ux * half, y - uy * half], [x + ux * half, y + uy * half]];
    const hips = Math.max(...feet.map(([fx, fy]) => hOf(fx, fy))) + 12;
    feet.forEach(([fx, fy], k) => {
      const [lr, li] = rings(fx - 1.5, fy - 1.5, fx + 1.5, fy + 1.5, 1.4, 0.5);
      put(legs[k], prism(P, front, lr, li, hOf(fx, fy), hips));
    });
    const [tr, ti] = rings(x - 3.4, y - 2.3, x + 3.4, y + 2.3, 2, 0.8);
    put(torso, prism(P, front, tr, ti, hips, hips + 11));
    const c = P(x, y, hips + 15);
    head.setAttribute("d", poly(Array.from({ length: 16 }, (_, a) => [c[0] + 4.8 * Math.cos(a * Math.PI / 8), c[1] + 4.8 * Math.sin(a * Math.PI / 8)])));
    // paint the person just after the pillar they stand on
    const i = clamp(Math.floor(x / CELL), 0, N - 1), j = clamp(Math.floor(y / CELL), 0, N - 1);
    cells.find((cc) => cc.i === i && cc.j === j).el.g.after(man);
  }

  drawField();
  const B = register(stage, (dt) => { const m = stepS(sx, dt) | stepS(sy, dt); drawMan(); return !!m; });
  bag.add(B.unregister);

  function place2(over) {
    last = over;
    const on = !!over;
    if (on) { sx.t = clamp(over[0], 4, EXT - 4); sy.t = clamp(over[1], 4, EXT - 4); }
    else { sx.t = EXT - 10; sy.t = EXT - 22; }
    [...legs, torso].forEach((s) => s.sil.classList.toggle("hi", on));
    head.classList.toggle("hi", on);
    tip.setAttribute("class", on ? "dot m" : "dot");
    if (on) {
      const rm = Math.hypot(sx.t - MID, sy.t - MID) / UM, a = Math.max(rm - STRIDE / 2, 0.4), b = rm + STRIDE / 2;
      const dv = volts(a) - volts(b);
      read.textContent = `${rm.toFixed(1)} m · ${dv < 10 ? dv.toFixed(1) : Math.round(dv)} V`;
    } else read.textContent = "rest";
    drawn = "";
    B.wake();
  }
  place2(null);

  bag.add(pointer(stage, { move: (p) => place2(unproj(C, p[0], p[1], 0)), leave: () => place2(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amps = v; drawField(); place2(last); }, destroy: bag.dispose };
}

hairline({
  name: "stepfield",
  means: "Stand anywhere near a downed line: the ground's voltage falls with distance, and the step between your feet is what shocks you.",
  rules: [1, 3, 5, 6],
  range: [2, 5, 10],
  tour: [[214, 150], [250, 190], [300, 200], null],
  mount,
});
