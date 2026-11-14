"""Sanity checks on the keyframes the film and the web viewer both play.

    python3 lab/test_animation.py

Bodies must not pass through the car or the ground, the head must actually
reach the windscreen when the caption says it does, the speed graph must not
show spikes the physics does not have, and slow motion must have enough keys.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import physics  # noqa: E402

# Mannequin points in its own frame (origin between the feet), with radii,
# matching blender/render_scenario.py dummy().
BODY = {"head": ((0, 0, 1.64), 0.11), "chest": ((0, 0, 1.25), 0.11), "hip": ((0, 0, 0.93), 0.10),
        "knee": ((0, 0, 0.50), 0.055), "foot": ((0, 0, 0.035), 0.035)}
# Car side profile (x forward, z up) from render_scenario.car(), origin under the middle.
CAR = [(2.2, 0.32), (2.24, 0.62), (2.1, 0.92), (1.0, 1.04), (0.25, 1.62), (-1.75, 1.66),
       (-2.18, 1.4), (-2.28, 0.95), (-2.28, 0.34), (-1.8, 0.3), (1.8, 0.3)]


def rot(rx, ry, rz):
    """Blender XYZ Euler: R = Rz · Ry · Rx."""
    cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
    return [[cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx],
            [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx],
            [-sy, cy * sx, cy * cx]]


def world(row, p):
    m = rot(*row[4:7])
    return [row[1 + i] + sum(m[i][j] * p[j] for j in range(3)) for i in range(3)]


def interp(rows, t):
    lo, hi = 0, len(rows) - 1
    if t <= rows[0][0]:
        return rows[0]
    if t >= rows[-1][0]:
        return rows[-1]
    while hi - lo > 1:
        mid = (lo + hi) // 2
        lo, hi = (mid, hi) if rows[mid][0] <= t else (lo, mid)
    a, b = rows[lo], rows[hi]
    k = (t - a[0]) / (b[0] - a[0])
    return [a[i] + (b[i] - a[i]) * k for i in range(len(a))]


def profile_distance(x, z):
    """Signed distance from (x, z) to the car profile: negative inside."""
    best, inside = 1e9, False
    n = len(CAR)
    for i in range(n):
        (x1, z1), (x2, z2) = CAR[i], CAR[(i + 1) % n]
        dx, dz = x2 - x1, z2 - z1
        k = max(0, min(1, ((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz)))
        best = min(best, math.hypot(x - x1 - k * dx, z - z1 - k * dz))
        if (z1 > z) != (z2 > z) and x < x1 + (z - z1) * dx / dz:
            inside = not inside
    return -best if inside else best


failures = []


def check(ok, msg):
    print(("  ok    " if ok else "  FAIL  ") + msg)
    if not ok:
        failures.append(msg)


def frames(s, step=1 / 600):
    """Every instant the film can show: dense steps, not just the keyframes."""
    n = int(s["anim"]["duration"] / step)
    return [i * step for i in range(n + 1)]


for s in [f() for f in physics.ALL]:
    print(s["id"])
    actors = s["anim"]["actors"]
    if s["id"] == "drowning":
        bed = s["anim"]["seabed"]
        rig_turn = rot(0, 0, math.pi / 2)                    # the swimmer rig faces the actor's +y

        def rig_points(who, t):
            """Body points in the actor frame. Knees and feet hang from the hip joint, so they
            follow its rotation (crawl kick, kneeling) instead of assuming straight legs."""
            hip_rot = rot(*interp(s["anim"]["joints"][who]["hip_L"], t)[1:])
            pts = []
            for name, (p, r) in BODY.items():
                if name in ("knee", "foot"):
                    rel = (0.0, 0.0, p[2] - 0.93)
                    p = [(0, 0, 0.93)[i] + sum(hip_rot[i][j] * rel[j] for j in range(3)) for i in range(3)]
                pts.append((name, [sum(rig_turn[i][j] * p[j] for j in range(3)) for i in range(3)], r))
            return pts
        for who in ("you", "lifeguard"):
            worst = (1e9, 0, "")
            for t in frames(s, 1 / 24):
                row = interp(actors[who], t)
                for name, p, r in rig_points(who, t):
                    x, y, z = world(row, p)
                    worst = min(worst, (z - r - interp(bed, y)[1], t, name))
            check(worst[0] > -0.03, f"{who} never inside the seabed (lowest {worst[0]:+.3f} m: {worst[2]} at t={worst[1]:.1f})")
        caps = [c[0] for c in s["story"]["captions"]]
        check(caps == sorted(caps), "captions in time order")
    else:
        rows = actors["victim"]
        lowest = min((world(interp(rows, t), p)[2] - r, t, name)
                     for t in frames(s) for name, (p, r) in BODY.items())
        check(lowest[0] > -0.03, f"never below the ground (lowest {lowest[0]:+.3f} m: {lowest[2]} at t={lowest[1]:.3f})")
    # Euler angles near gimbal lock can swing wildly between two keys even when the poses are close:
    # the interpolated midpoint must stay between its two keys.
    def angle(a, b):
        tr = sum(a[i][j] * b[i][j] for i in range(3) for j in range(3))
        return math.acos(max(-1.0, min(1.0, (tr - 1) / 2)))
    for who in [w for w in s["anim"]["actors"] if w in ("victim", "you", "lifeguard")]:
        rows = s["anim"]["actors"][who]
        worst = (0.0, 0)
        for r0, r1 in zip(rows, rows[1:]):
            m0, m1 = rot(*r0[4:7]), rot(*r1[4:7])
            mid = rot(*[(a + b) / 2 for a, b in zip(r0[4:7], r1[4:7])])
            excess = max(angle(m0, mid), angle(mid, m1)) - angle(m0, m1)
            worst = max(worst, (excess, r0[0]))
        check(worst[0] < 0.05, f"{who}: no rotation glitches between keys (worst {worst[0]:.3f} rad at t={worst[1]:.2f})")
    for t0, t1, rate in s["story"].get("slowmo", []):
        if rate > 1:                               # a fast-forward window needs no extra keys
            continue
        keys = sum(1 for row in next(iter(actors.values())) if t0 <= row[0] <= t1)
        check(keys >= (t1 - t0) * 300, f"slow motion {t0:.2f}-{t1:.2f} s has {keys} keys (needs one per film frame)")

    if s["id"] == "pedestrian":
        car_rows = actors["car"]
        t_hit = next(c[0] for c in s["story"]["captions"] if c[1].startswith("Bumper"))
        t_ws = next(c[0] for c in s["story"]["captions"] if c[1].startswith("Head"))
        worst = (1e9, 0, "")
        for t in frames(s):
            if t < t_hit - 0.05 or t > t_hit + 0.6:
                continue
            row, cx = interp(actors["victim"], t), interp(car_rows, t)[1]
            for name, (p, r) in BODY.items():
                x, _, z = world(row, p)
                d = profile_distance(x - cx, z) - r
                worst = min(worst, (d, t, name))
        check(worst[0] > -0.03, f"body never inside the car (deepest {worst[0]:+.3f} m: {worst[2]} at t={worst[1]:.3f})")
        row, cx = interp(actors["victim"], t_ws), interp(car_rows, t_ws)[1]
        hx, _, hz = world(row, BODY["head"][0])
        gap = profile_distance(hx - cx, hz) - BODY["head"][1]
        check(abs(gap) < 0.03, f"head touches the windscreen at t_ws ({gap:+.3f} m from the glass)")
        v0 = s["inputs"]["speed_kmh"]
        peak = max(v for _, v in s["story"]["series"]["v_ped"])
        check(peak <= v0 * 1.02, f"pedestrian speed never exceeds the car's ({peak:.0f} km/h vs {v0} km/h)")

print("\n" + ("all good" if not failures else f"{len(failures)} failing"))
sys.exit(1 if failures else 0)
