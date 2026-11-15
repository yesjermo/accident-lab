/**
 * Smoke room: a room in cut-away with a sofa burning in the corner. Hot smoke
 * fills it from the ceiling down: a layer whose underside sinks as the fire
 * grows (drawn unfilled: smoke is not a plate). Two people: one standing, one crawling. The pointer's place across
 * the floor sets how long the fire has burned; the layer drops on a spring,
 * and whoever has their head in the smoke takes the bright stroke. At rest,
 * 8 s in, the layer is still high and the crawler is the bright mark. The
 * slider is how fast the fire grows (α, kW/s²).
 *
 * The same model as lab/physics.py burns(): a t² fire, plume entrainment
 * ṁ = 0.071 Q^⅓ z^⁵ᐟ³, smoke at 0.75 kg/m³.
 */
const {
  Cam, clamp, facing, fit, open, poly, prism, proj, ringAt, rings, spring, stepS, unproj,
  disposer, mk, pointer, put, register, solid,
} = HL;

const W = 100, D = 70, CEIL = 2.5, ZM = 26, AREA = 24, T1 = 60;     // room in world units; ZM units per metre of height
const STAND = 1.65, CRAWL = 0.62, REST_T = 8;                      // head heights (m); rest is 8 s in

/** Layer height (m) after t seconds of a fire burning since -60 s, growth alpha. */
function layer(t, alpha) {
  let z = CEIL - 0.1;
  for (let s = 0; s < t; s += 0.25) {
    const q = Math.min(1500, alpha * (s + 60) ** 2);
    z = Math.max(0.5, z - (0.071 * (0.7 * q) ** (1 / 3) * z ** (5 / 3)) / (0.75 * AREA) * 0.25);
  }
  return z;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let alpha = value, last = null;
  const C = Cam(45, 0.5, 1.85);
  fit(C, [[0, 0, 0], [W, D, 0], [W, 0, 0], [0, D, 0], [0, 0, CEIL * ZM]], 200, 162);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // floor and the two far walls
  const [fr, fi] = rings(0, 0, W, D, 4, 1.4);
  put(solid(g), prism(P, front, fr, fi, -3, 0));
  const [wr, wi] = rings(0, 0, W, 3, 1.4, 0.6);
  put(solid(g), prism(P, front, wr, wi, 0, CEIL * ZM));
  const [lr, li] = rings(0, 0, 3, D, 1.4, 0.6);
  put(solid(g), prism(P, front, lr, li, 0, CEIL * ZM));
  // the door, in the back wall
  mk("path", { d: poly([P(70, 3, 0), P(84, 3, 0), P(84, 3, 2.05 * ZM), P(70, 3, 2.05 * ZM)]), class: "lo" }, g);

  // the sofa in the corner, burning: a seat, a back, and flames as tall cones of line
  const [sr, si] = rings(6, 6, 40, 20, 3, 1);
  put(solid(g), prism(P, front, sr, si, 0, 11));
  const [br, bi] = rings(6, 6, 40, 10, 2, 0.8);
  put(solid(g), prism(P, front, br, bi, 11, 22));
  for (const [x, hgt] of [[12, 30], [20, 40], [28, 34], [35, 24]]) {
    mk("path", { d: poly([P(x - 3, 13, 11), P(x, 13, 11 + hgt), P(x + 3, 13, 11)]), class: "nf" }, g);
  }

  // the smoke: a slab from the ceiling down to the layer's underside, painted before the people standing in it
  // smoke is not a plate: a dim, unfilled volume from the ceiling down, its underside a dashed line
  const smokeVol = mk("path", { class: "nf lo" }, g), smokeFloor = mk("path", { class: "nf dash" }, g);
  const [kr, ki] = rings(3, 3, W, D, 3, 1.2);
  const sp = spring(layer(REST_T, alpha));
  let drawn = NaN;
  function drawSmoke() {
    if (sp.x === drawn) return;
    drawn = sp.x;
    smokeVol.setAttribute("d", prism(P, front, kr, ki, sp.x * ZM, CEIL * ZM).sil);
    smokeFloor.setAttribute("d", poly(ringAt(P, kr, sp.x * ZM)));
  }

  // the people: one standing, one on hands and knees, both facing the door
  function person(x, y, head, lying) {
    const grp = mk("g", {}, g), parts = [];
    if (!lying) {                                  // two legs, a torso wider than them
      for (const dx of [-1.3, 1.3]) {
        const [a, b] = rings(x + dx - 0.9, y - 0.9, x + dx + 0.9, y + 0.9, 0.8, 0.3);
        const s = solid(grp); put(s, prism(P, front, a, b, 0, 0.85 * ZM)); parts.push(s);
      }
      const [a, b] = rings(x - 2.6, y - 1.7, x + 2.6, y + 1.7, 1.5, 0.6);
      const s = solid(grp); put(s, prism(P, front, a, b, 0.85 * ZM, (head - 0.12) * ZM)); parts.push(s);
    } else {                                       // a low body on two posts
      for (const dx of [-5, 5]) {
        const [a, b] = rings(x + dx - 1, y - 1, x + dx + 1, y + 1, 0.9, 0.4);
        const s = solid(grp); put(s, prism(P, front, a, b, 0, (head - 0.2) * ZM)); parts.push(s);
      }
      const [a, b] = rings(x - 7, y - 2, x + 7, y + 2, 1.8, 0.7);
      const s = solid(grp); put(s, prism(P, front, a, b, (head - 0.25) * ZM, (head - 0.1) * ZM)); parts.push(s);
    }
    const c = P(lying ? x + 8 : x, y, head * ZM), hd = mk("path", { class: "sil" }, grp);
    hd.setAttribute("d", poly(Array.from({ length: 16 }, (_, a) => [c[0] + 4.2 * Math.cos(a * Math.PI / 8), c[1] + 4.2 * Math.sin(a * Math.PI / 8)])));
    return { parts, hd, head };
  }
  const people = [person(60, 40, STAND, false), person(52, 58, CRAWL, true)];

  const B = register(stage, (dt) => { const m = stepS(sp, dt); drawSmoke(); return m; });
  bag.add(B.unregister);

  function scrub(over) {
    last = over;
    const t = over ? Math.round(clamp(over[0] / W, 0, 1) * T1) : REST_T;
    sp.t = layer(t, alpha);
    people.forEach((p, k) => {
      const lit = over ? p.head > sp.t : k === 1;        // in the smoke; at rest the crawler is the mark
      p.parts.forEach((q) => q.sil.classList.toggle("hi", lit));
      p.hd.classList.toggle("hi", lit);
    });
    read.textContent = over ? `${t} s · ${sp.t.toFixed(1)} m` : "rest";
    drawn = NaN;
    B.wake();
  }
  scrub(null);

  bag.add(pointer(stage, { move: (p) => scrub(unproj(C, p[0], p[1], 0)), leave: () => scrub(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { alpha = v; scrub(last); }, destroy: bag.dispose };
}

hairline({
  name: "smoke",
  means: "Scrub across the room to let the fire burn longer: the smoke layer comes down and reaches the standing head first.",
  rules: [3, 5, 6, 8],
  range: [0.012, 0.047, 0.19],
  tour: [[130, 175], [215, 200], [275, 205], null],
  mount,
});
