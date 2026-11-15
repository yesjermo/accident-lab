/**
 * Escape fan: a swimmer in a rip channel, the gap between two sandbars, with
 * the beach in front. The pointer sets the heading you swim off on; once you
 * are out of the rip you turn for the beach. Dots trace where 60 s of
 * swimming at 1 m/s takes you, current and all. Head straight for the beach
 * and the rip carries you out; swim parallel and you are ashore. The swimmer
 * is bright at rest; the chosen path takes the bright dots. The slider is the
 * rip's speed, in m/s.
 *
 * The same physics as lab/physics.py drowning(): v_net = v_swim + v_rip.
 */
const {
  Cam, clamp, facing, fit, open, poly, prism, proj, rings, rrect, ringAt, spring, stepS, unproj,
  disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const X0 = 0, X1 = 140, Y0 = 0, SHORE = 92, Y1 = 108;   // sea from y 0 to the shore at 92, sand to 108 (1 unit = 1 m)
const CH = 70, HALF = 13;                                 // the rip channel: centre x, half-width
const START = [CH, 62], SWIM = 1.0, T = 60, NDOT = 30;

/** 60 s from START heading `a` (radians, 0 = straight for the beach), turning for the beach once clear of the rip. */
function path(a, rip) {
  let [x, y] = START, out = [];
  for (let t = 0; t <= T; t += 0.5) {
    if (t % (T / NDOT) < 0.5) out.push([x, y]);
    if (y >= SHORE - 1) { out.push([x, SHORE - 1]); break; }
    const inRip = Math.abs(x - CH) < HALF && y > 14;
    const h = inRip ? a : 0;                                // clear of the rip: straight in
    const fy = inRip ? 1 - Math.max(0, (36 - y) / 22) : 0;  // the rip fades toward its head, out at sea
    x += SWIM * Math.sin(h) * 0.5;
    y += (SWIM * Math.cos(h) - rip * (1 - (Math.abs(x - CH) / HALF) ** 2) * fy * (inRip ? 1 : 0)) * 0.5;
    y = Math.max(y, 2);
  }
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rip = value, last = null;
  const C = Cam(45, 0.5, 1.9);
  fit(C, [[X0, Y0, -3], [X1, Y1, -3], [X1, Y0, -3], [X0, Y1, -3], [CH, START[1], 8]], 200, 160);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [sr, si] = rings(X0, Y0, X1, Y1, 8, 2);
  put(solid(g), prism(P, front, sr, si, -3, 0));
  mk("path", { d: open([P(X0 + 3, SHORE, 0), P(X1 - 3, SHORE, 0)]), class: "nf" }, g);            // the waterline
  for (const y of [SHORE + 6, SHORE + 11]) mk("path", { d: open([P(X0 + 10, y, 0), P(X1 - 10, y, 0)]), class: "nf lo" }, g);
  // the sandbars either side of the channel: where the waves break
  for (const [x0, x1] of [[6, CH - HALF], [CH + HALF, X1 - 6]]) {
    const [br, bi] = rings(x0, 40, x1, 58, 7, 1.2);
    put(solid(g), prism(P, front, br, bi, 0, 2.2));
  }
  // the rip itself: a column of dim dots running out through the gap
  for (let k = 0; k < 7; k++) place(flatDot(g, C, 0.7, "dot m"), P(CH, 84 - k * 11, 0));

  const trail = [];
  for (let k = 0; k <= NDOT; k++) trail.push(flatDot(g, C, 1.0, "dot off"));

  // the swimmer: shoulders at the waterline and a head, facing the beach
  const sw = mk("g", {}, g), body = solid(sw), head = mk("path", { class: "sil" }, sw);
  const sx = spring(START[0]), sy = spring(START[1]);
  let drawn = "";
  function drawSwimmer() {
    const key = sx.x.toFixed(2) + "," + sy.x.toFixed(2);
    if (key === drawn) return;
    drawn = key;
    const [x, y] = [sx.x, sy.x];
    const [r, i] = rings(x - 4, y - 1.6, x + 4, y + 1.6, 1.5, 0.6);
    put(body, prism(P, front, r, i, 0, 1.8));
    const c = P(x, y + 0.3, 4.2);
    head.setAttribute("d", poly(Array.from({ length: 16 }, (_, a) => [c[0] + 4.6 * Math.cos(a * Math.PI / 8), c[1] + 4.6 * Math.sin(a * Math.PI / 8)])));
  }

  const B = register(stage, (dt) => { const m = stepS(sx, dt) | stepS(sy, dt); drawSwimmer(); return !!m; });
  bag.add(B.unregister);

  function choose(over) {
    last = over;
    if (!over) {
      trail.forEach((el) => el.setAttribute("class", "dot off"));
      trail.forEach((el) => place(el, P(START[0], START[1], 0)));
      sx.t = START[0]; sy.t = START[1];
      body.sil.classList.add("hi"); head.classList.add("hi");
      read.textContent = "rest";
      B.wake();
      return;
    }
    // the heading from you to the pointer, measured from straight-for-the-beach
    const a = clamp(Math.atan2(over[0] - START[0], over[1] - START[1]), -Math.PI / 2, Math.PI / 2);
    const pts = path(a, rip), end = pts[pts.length - 1];
    trail.forEach((el, k) => {
      const q = pts[Math.min(k, pts.length - 1)];
      place(el, P(q[0], q[1], 0));
      el.setAttribute("class", "dot");
    });
    sx.t = end[0]; sy.t = end[1];
    body.sil.classList.remove("hi"); head.classList.remove("hi");
    const deg = Math.round(Math.abs(a) * 180 / Math.PI);
    read.textContent = end[1] >= SHORE - 1 ? `${deg}° · ashore` : `${deg}° · ${Math.round(SHORE - end[1])} m out`;
    B.wake();
  }
  choose(null);

  bag.add(pointer(stage, { move: (p) => choose(unproj(C, p[0], p[1], 0)), leave: () => choose(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rip = v; choose(last); }, destroy: bag.dispose };
}

hairline({
  name: "escape",
  means: "Point the way you swim off: straight for the beach the rip carries you out; parallel to it you get ashore.",
  rules: [3, 4, 5, 8],
  range: [0.8, 1.5, 2.2],
  tour: [[150, 190], [262, 150], [245, 215], null],
  mount,
});
