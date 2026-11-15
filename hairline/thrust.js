/**
 * Thrust: two lungs and the windpipe between them, with a piece of food stuck
 * at the top. A complete blockage makes the lungs a closed box, so squeezing
 * them raises the pressure behind the food by Boyle's law, ΔP = P·ΔV/(V − ΔV),
 * and pushes on it with ΔP·A. The pointer's place across the plate sets how
 * hard the abdominal thrust squeezes (ΔV); the lungs shrink on a spring and
 * the food is pushed up the pipe, until the force beats its grip and it flies
 * out. The food is bright at rest; the squeezed lungs take the bright stroke,
 * and the food takes it back when it comes free. The slider is the grip, in N.
 *
 * The same numbers as lab/physics.py choking(): FRC 2.4 L, airway 2.5 cm².
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, ringAt, rings, rrect, run, spring, stepS, unproj,
  disposer, mk, pointer, put, register, solid,
} = HL;

const FRC = 2.4, PATM = 101.3, AREA = 2.5e-4, DV1 = 0.42;   // litres, kPa, m², the strongest squeeze
const X0 = 0, X1 = 110, Y0 = 0, Y1 = 60, PIPE = [55, 30], TOP = 74, LUNGZ = 46;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let grip = value, last = null;
  const C = Cam(45, 0.5, 1.75);
  fit(C, [[X0, Y0, 0], [X1, Y1, 0], [X1, Y0, 0], [X0, Y1, 0], [PIPE[0], PIPE[1], TOP + 34]], 200, 172);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [br, bi] = rings(X0, Y0, X1, Y1, 7, 1.8);
  put(solid(g), prism(P, front, br, bi, -4, 0));

  /** A lung: wider at its base than its top, scaled about its own middle by k. */
  function lungPaths(cx, cy, k) {
    const f = rrect(cx - 18 * k, cy - 16 * k, cx + 18 * k, cy + 16 * k, 12 * k, 4);
    const t = rrect(cx - 9 * k, cy - 9 * k, cx + 9 * k, cy + 9 * k, 7 * k, 4);
    const inner = rrect(cx - 8 * k, cy - 8 * k, cx + 8 * k, cy + 8 * k, 6 * k, 4);
    return {
      sil: poly(hull(ringAt(P, f, 2).concat(ringAt(P, t, 2 + LUNGZ * k)))),
      crease: open(ringAt(P, run(inner, front), 2 + LUNGZ * k)),
    };
  }
  const lungs = [solid(g)];                       // back to front: left lung, the pipe, the food, the right lung
  // the windpipe, its bronchi into each lung, and the larynx ring at the top
  const [tr, ti] = rings(PIPE[0] - 4, PIPE[1] - 4, PIPE[0] + 4, PIPE[1] + 4, 3.8, 1.2);
  const pipe = solid(g);
  put(pipe, prism(P, front, tr, ti, 26, TOP));
  for (const dx of [-20, 20]) mk("path", { d: open([P(PIPE[0], PIPE[1], 28), P(PIPE[0] + dx * 0.7, PIPE[1], 22)]), class: "nf" }, g);
  const [lr] = rings(PIPE[0] - 6, PIPE[1] - 6, PIPE[0] + 6, PIPE[1] + 6, 5.8, 1);
  mk("path", { d: poly(ringAt(P, lr, TOP - 6)), class: "nf lo" }, g);
  // the food: a small lump wedged at the top of the pipe
  const food = solid(g);
  lungs.push(solid(g));

  const sq = spring(1), fz = spring(TOP - 8);
  let drawn = "";
  function draw() {
    const key = sq.x.toFixed(3) + "," + fz.x.toFixed(2);
    if (key === drawn) return;
    drawn = key;
    [[PIPE[0] - 30, PIPE[1]], [PIPE[0] + 30, PIPE[1]]].forEach(([cx, cy], i) => put(lungs[i], lungPaths(cx, cy, sq.x)));
    const [r, ri] = rings(PIPE[0] - 3.4, PIPE[1] - 3.4, PIPE[0] + 3.4, PIPE[1] + 3.4, 3.2, 1);
    put(food, prism(P, front, r, ri, fz.x, fz.x + 6));
  }
  const B = register(stage, (dt) => { const m = stepS(sq, dt) | stepS(fz, dt); draw(); return !!m; });
  bag.add(B.unregister);

  function squeeze(over) {
    last = over;
    const dv = over ? DV1 * clamp((over[0] - X0) / (X1 - X0), 0, 1) : 0;
    const dp = (PATM * dv) / (FRC - dv), force = dp * 1000 * AREA, free = force > grip;
    sq.t = 1 - 0.3 * (dv / DV1);                    // a 0.42 L squeeze is 18% of the lungs: drawn larger so it reads
    fz.t = free ? TOP + 26 : TOP - 8 + 5 * clamp(force / grip, 0, 1);
    lungs.forEach((l) => l.sil.classList.toggle("hi", !!over && !free));
    food.sil.classList.toggle("hi", !over || free);
    read.textContent = over ? `${dv.toFixed(2)} L · ${dp.toFixed(1)} kPa` : "rest";
    drawn = "";
    B.wake();
  }
  squeeze(null);

  bag.add(pointer(stage, { move: (p) => squeeze(unproj(C, p[0], p[1], 0)), leave: () => squeeze(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { grip = v; squeeze(last); }, destroy: bag.dispose };
}

hairline({
  name: "thrust",
  means: "Squeeze the blocked lungs harder from left to right: the pressure behind the food rises until it beats the grip and flies out.",
  rules: [3, 4, 5, 8],
  range: [2.5, 3.5, 4.5],
  tour: [[130, 190], [200, 205], [280, 215], null],
  mount,
});
