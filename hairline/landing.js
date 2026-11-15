/**
 * Landing pads: a tower, and in front of it four things to land on: concrete,
 * grass, a car roof and a foam pit, each as thick as the distance it lets a
 * body stop over. The pointer picks one; the body drops onto it and the pad
 * gives by that stopping distance, so the deeper the give, the gentler the
 * stop: a = v²/2d. At rest the body stands at the roof edge, bright. The
 * slider is the height of the fall, in metres.
 *
 * Same numbers as lab/physics.py fall(): 2 cm on concrete, 10 grass, 25 car, 100 foam.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, ringAt, rings, rrect, run, tween, tset, tval, tdone,
  disposer, mk, pointer, put, register, solid,
} = HL;

const G = 9.81, ZS = 12;                                // z units per metre of give, drawn large so it reads
const PADS = [                                          // name, stopping distance (m), thickness drawn, footprint x
  ["concrete", 0.02, 3, 0], ["grass", 0.10, 6, 30], ["car roof", 0.25, 11, 60], ["foam", 1.0, 22, 90],
];
const PW = 24, PY0 = 30, PY1 = 56, TOWER = [-8, -30, 112, 4];   // pad width, pads' y span; tower footprint
const TH = 62;                                                     // tower height drawn

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let h = value, act = -1;
  const C = Cam(45, 0.5, 1.5);
  fit(C, [[-8, -30, 0], [114, PY1 + 4, 0], [114, -30, 0], [-8, PY1 + 4, 0], [-8, -30, TH]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // ground, then the tower: a block with a roof ledge and a row of windows on its face
  const [gr, gi] = rings(-12, -34, 118, PY1 + 8, 7, 1.8);
  put(solid(g), prism(P, front, gr, gi, -3, 0));
  const [tr, ti] = rings(...TOWER, 3, 1.4);
  put(solid(g), prism(P, front, tr, ti, 0, TH));
  for (let f = 0; f < 4; f++) for (let k = 0; k < 6; k++) {
    const x = 4 + k * 18, z = 10 + f * 13;
    mk("path", { d: poly([P(x, 4, z), P(x + 9, 4, z), P(x + 9, 4, z + 7), P(x, 4, z + 7)]), class: "lo" }, g);
  }

  // the pads, back to front by x + y
  const pads = PADS.map(([name, d, thick, x]) => {
    const el = solid(g), [r, i] = rings(x, PY0, x + PW, PY1, 3.2, 1.1);
    return { name, d, thick, r, i, el, give: tween(0) };
  });
  // the body: a dummy, upright on the roof edge at rest, lying on its pad when chosen
  const dummy = mk("g", {}, g), torso = solid(dummy), head = mk("path", { class: "sil" }, dummy);
  const pos = { x: tween(52), z: tween(TH), lie: tween(0) };

  function drawPad(p, now) {
    const give = tval(p.give, now);
    put(p.el, prism(P, front, p.r, p.i, 0, Math.max(0.8, p.thick - give)));
  }
  function drawDummy(now) {
    const x = tval(pos.x, now), z = tval(pos.z, now), lie = tval(pos.lie, now);
    const y = lie > 0.5 ? (PY0 + PY1) / 2 : 0;
    const len = 15, wid = 4.6, th = 4;
    // standing: a tall block; lying: the same block laid along x
    const footU = rrect(x - wid / 2 - (len / 2) * lie, y - wid / 2, x + wid / 2 + (len / 2) * lie, y + wid / 2, 1.6, 3);
    const inner = rrect(x - wid / 2 - (len / 2) * lie + 0.8, y - wid / 2 + 0.8, x + wid / 2 + (len / 2) * lie - 0.8, y + wid / 2 - 0.8, 1, 3);
    const top = z + th + (len - th) * (1 - lie);
    torso.sil.setAttribute("d", poly(hull(ringAt(P, footU, z).concat(ringAt(P, footU, top)))));
    torso.cr.setAttribute("d", open(ringAt(P, run(inner, front), top)));
    const hc = lie > 0.5 ? P(x + len / 2 + 2.5, y, z + 2.5) : P(x, y, top + 2.6);
    head.setAttribute("d", poly(Array.from({ length: 16 }, (_, a) => [hc[0] + 3.8 * Math.cos(a * Math.PI / 8), hc[1] + 3.8 * Math.sin(a * Math.PI / 8)])));
  }

  const B = register(stage, (_dt, now) => {
    let m = false;
    pads.forEach((p) => { drawPad(p, now); if (!tdone(p.give, now)) m = true; });
    drawDummy(now);
    for (const t of [pos.x, pos.z, pos.lie]) if (!tdone(t, now)) m = true;
    if (act >= 0) pads[act].el.g.after(dummy); else g.append(dummy);
    return m;
  });
  bag.add(B.unregister);

  function choose(a) {
    if (a === act) return;
    act = a;
    const now = performance.now();
    pads.forEach((p, i) => {
      tset(p.give, i === a ? Math.min(p.thick - 0.8, p.d * ZS) : 0, now, Math.abs(i - Math.max(a, 0)) * 40);
      p.el.sil.classList.toggle("hi", i === a);
    });
    if (a < 0) { tset(pos.x, 52, now, 0); tset(pos.z, TH, now, 0); tset(pos.lie, 0, now, 0); }
    else {
      const p = pads[a];
      tset(pos.x, PADS[a][3] + PW / 2, now, 0); tset(pos.z, p.thick - Math.min(p.thick - 0.8, p.d * ZS), now, 0); tset(pos.lie, 1, now, 0);
    }
    torso.sil.classList.toggle("hi", a < 0); head.classList.toggle("hi", a < 0);
    if (a < 0) read.textContent = "rest";
    else read.textContent = `${pads[a].name} · ${Math.round(h / pads[a].d)} g`;     // a/g = v²/2gd = h/d
    B.wake();
  }
  choose(-2);
  choose(-1);

  // hit: each pad's RESTING top (rule 01): the pointer is put on that pad's own top plane, and the pad
  // that holds it nearest its middle wins, so a tall pad never loses its top to the ground behind it
  function hit(p) {
    let best = -1, bestD = Infinity;
    PADS.forEach(([, , thick, x], i) => {
      const w = HL.unproj(C, p[0], p[1], thick);
      if (w[0] < x - 3 || w[0] > x + PW + 3 || w[1] < PY0 - 4 || w[1] > PY1 + 4) return;
      const d = Math.hypot(w[0] - (x + PW / 2), w[1] - (PY0 + PY1) / 2);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { h = v; const a = act; act = -2; choose(a); }, destroy: bag.dispose };
}

hairline({
  name: "landing",
  means: "Pick what you land on: the more it gives, the gentler the stop. Concrete gives 2 cm, a foam pit a metre.",
  rules: [1, 2, 5, 8],
  range: [3, 6, 12],
  tour: [[140, 200], [190, 222], [250, 250], null],
  mount,
});
