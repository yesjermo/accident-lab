/**
 * Stopping line: a road with a zebra crossing and a pedestrian on it. The
 * pointer's place along the road sets the car's speed, and the car settles
 * where it would stop: reaction distance plus braking distance, v·t + v²/2μg.
 * Dots along the kerb mark the two parts, dim for reaction and medium for
 * braking. The pedestrian is bright at rest; once the pointer sets a speed the
 * car takes the bright stroke. The slider is the driver's reaction time.
 *
 * Same numbers as lab/physics.py pedestrian(): μ = 0.8, 50 km/h from 38.6 m
 * stops just short of the crossing, 60 km/h does not.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, ringAt, rings, rrect, run, spring, stepS, unproj,
  disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const M = 1.8, MU = 0.8, G = 9.81;                 // world units per metre
const X0 = -10, X1 = 128, Y0 = 0, Y1 = 30;         // the road: long enough for 60 km/h at a 2.5 s reaction
const CROSS = 38.6 * M, CW = 14;                   // the crossing starts 38.6 m from where the driver reacts
const LANE = 21, CL = 18, CWID = 9;                // the car: lane centre, length, width
const PED = [CROSS + CW / 2, 7];                   // the pedestrian, on the far lane
const V0 = 20, V1 = 60, VREST = 40;

const stopM = (kmh, tr) => { const v = kmh / 3.6; return v * tr + (v * v) / (2 * MU * G); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let tr = value;
  const C = Cam(45, 0.5, 2.4);
  fit(C, [[X0, Y0, 0], [X1, Y1, 0], [X1, Y0, 0], [X0, Y1, 0], [PED[0], PED[1], 16]], 200, 172);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [rr, ri] = rings(X0, Y0, X1, Y1, 6, 1.6);
  put(solid(g), prism(P, front, rr, ri, -3, 0));
  mk("path", { d: open([P(X0 + 4, Y1 / 2, 0), P(CROSS - 4, Y1 / 2, 0)]), class: "nf dash" }, g);   // centre line
  for (let k = 0; k < 5; k++) {                     // zebra stripes: long in the direction of traffic
    const y = 2.5 + k * 5.6;
    mk("path", { d: poly(ringAt(P, rrect(CROSS, y, CROSS + CW, y + 2.8, 0.8, 2), 0)), class: "lo" }, g);
  }
  // kerb dots: the stopping distance, reaction part dim, braking part medium
  const kerb = [];
  for (let k = 0; k < 28; k++) kerb.push(flatDot(g, C, 0.7, "dot off"));

  // the pedestrian, walking across: two legs, a torso wider than them, a head
  const ped = mk("g", {}, g), legs = [solid(ped), solid(ped)], pb = solid(ped);
  [[-1.2, 0.8], [1.0, -0.6]].forEach(([dx, dy], k) => {
    const [lr, li] = rings(PED[0] + dx - 0.8, PED[1] + dy - 0.8, PED[0] + dx + 0.8, PED[1] + dy + 0.8, 0.7, 0.3);
    put(legs[k], prism(P, front, lr, li, 0, 6.5));
  });
  const [pr, pi] = rings(PED[0] - 2.2, PED[1] - 1.5, PED[0] + 2.2, PED[1] + 1.5, 1.4, 0.6);
  put(pb, prism(P, front, pr, pi, 6.5, 11.5));
  const hc = P(PED[0], PED[1], 13.6), head = mk("path", { class: "sil" }, ped);
  head.setAttribute("d", poly(Array.from({ length: 16 }, (_, a) => [hc[0] + 4.2 * Math.cos(a * Math.PI / 8), hc[1] + 4.2 * Math.sin(a * Math.PI / 8)])));

  // the car: a body, a cabin narrower than it with a sloping windscreen, near-side wheels
  const car = mk("g", {}, g);
  const body = solid(car), cab = solid(car), wheels = [mk("path", { class: "" }, car), mk("path", { class: "" }, car)];
  function drawCar(xf) {
    const xb = xf - CL, y0 = LANE - CWID / 2, y1 = LANE + CWID / 2;
    const [br, bi] = rings(xb, y0, xf, y1, 3, 1);
    put(body, prism(P, front, br, bi, 2.2, 7));
    const foot = rrect(xb + 2, y0 + 0.8, xf - 6, y1 - 0.8, 2, 4), top = rrect(xb + 3, y0 + 1.8, xf - 10, y1 - 1.8, 1.6, 4);
    const inner = rrect(xb + 4, y0 + 2.8, xf - 11, y1 - 2.8, 1, 4);
    cab.sil.setAttribute("d", poly(hull(ringAt(P, foot, 7).concat(ringAt(P, top, 11.5)))));
    cab.cr.setAttribute("d", open(ringAt(P, run(inner, front), 11.5)));
    [xb + 4.5, xf - 4.5].forEach((wx, k) => {
      const pts = [];
      for (let a = 0; a < 16; a++) pts.push(P(wx + 2.6 * Math.cos((a / 16) * 2 * Math.PI), y1 + 0.4, 2.6 + 2.6 * Math.sin((a / 16) * 2 * Math.PI)));
      wheels[k].setAttribute("d", poly(pts));
    });
  }

  let kmh = VREST, active = false, last = null;
  const front0 = 0, sp = spring(front0 + stopM(VREST, tr) * M);
  let drawn = NaN;
  function draw() {
    const xf = sp.x;
    if (xf === drawn) return;
    drawn = xf;
    drawCar(xf);
    // paint order: whichever is nearer (larger x + y) goes last
    if (xf - CL / 2 + LANE > PED[0] + PED[1]) ped.after(car); else car.after(ped);
    const reactM = (kmh / 3.6) * tr, total = stopM(kmh, tr);
    kerb.forEach((el, k) => {
      const m = (k / (kerb.length - 1)) * total;
      place(el, P(front0 + m * M, Y1 - 2.4, 0));
      el.setAttribute("class", "dot " + (m <= reactM ? "off" : "m"));
    });
  }

  const B = register(stage, (dt) => { const m = stepS(sp, dt); draw(); return m; });
  bag.add(B.unregister);

  function retarget(over) {
    last = over;
    active = !!over;
    if (over) kmh = Math.round(V0 + (V1 - V0) * clamp((over[0] - X0) / (X1 - X0), 0, 1));
    else kmh = VREST;
    sp.t = front0 + stopM(kmh, tr) * M;
    car.querySelectorAll(".sil").forEach((el) => el.classList.toggle("hi", active));
    pb.sil.classList.toggle("hi", !active);
    head.classList.toggle("hi", !active);
    read.textContent = active ? `${kmh} km/h · ${Math.round(stopM(kmh, tr))} m` : "rest";
    drawn = NaN;
    B.wake();
  }
  retarget(null);

  bag.add(pointer(stage, {
    move: (p) => retarget(unproj(C, p[0], p[1], 0)),
    leave: () => retarget(null),
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { tr = v; retarget(last); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "stopping",
  means: "Point along the road to set the speed: the car stops after reaction plus braking distance, short of the crossing or not.",
  rules: [3, 5, 8, 9],
  range: [0.8, 1.5, 2.5],
  tour: [[150, 150], [205, 175], [262, 205], null],
  mount,
});
