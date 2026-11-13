"""
Accident Lab - physics engine (standard library only).

Every scenario returns a dict:
  {
    "id", "title",
    "inputs":   {...}            # the assumptions, so you can change them
    "results":  [(label, value, unit, explanation), ...]
    "tables":   {name: {"columns": [...], "rows": [[...], ...]}}
    "anim":     {"fps", "duration", "actors": {name: [[t,x,y,z,rx,ry,rz], ...]}}
  }

Coordinates follow Blender: metres, Z is up, rotations in radians (XYZ Euler).
"""

import math

G = 9.81          # m/s^2
FPS = 24
BODY_HALF_THICKNESS = 0.12          # mannequin lying flat: lift it so it isn't sunk into the ground
LYING_PITCH = -3 * math.pi / 2      # rotation about Y that lays the mannequin flat


def kmh(v):        # km/h -> m/s
    return v / 3.6


def sample(fn, duration, fps=FPS, dense=(), dense_dt=1 / 600):
    """Call fn(t) -> (x,y,z,rx,ry,rz) at every frame and return keyframe rows.
    `dense` windows [[t0, t1, ...]] (the slow-motion windows) are sampled every
    dense_dt, so a ×1/13 film shows real motion instead of a straight line
    between two 24 fps keys."""
    ts = {round(i / fps, 5) for i in range(int(duration * fps) + 1)}
    for w in dense:
        t0, t1 = w[0], min(w[1], duration)
        ts |= {round(t0 + i * dense_dt, 5) for i in range(int((t1 - t0) / dense_dt) + 1)}
    return [[round(t, 5)] + [round(c, 5) for c in fn(t)] for t in sorted(ts)]


def hip_to_feet(hip, rx, ry, rz, hip_h=0.93):
    """Pose with the origin between the feet, from a hip position and rotation.
    Bodies tumble about their centre of mass (near the hips), not about their
    feet, so the motion is planned at the hip and the feet follow."""
    cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
    up = (cz * sy * cx + sz * sx, sz * sy * cx - cz * sx, cy * cx)   # R(rx,ry,rz) · (0, 0, 1)
    return (hip[0] - hip_h * up[0], hip[1] - hip_h * up[1], hip[2] - hip_h * up[2], rx, ry, rz)


def series(fn, t_end, dt=1 / 120, breaks=()):
    """Sample fn(t) for graphs/HUD. `breaks` are instants where fn jumps (impact
    pulses), sampled on both sides so millisecond spikes aren't lost."""
    ts = {round(i * dt, 5) for i in range(int(t_end / dt) + 1)}
    for b in breaks:
        ts |= {round(b - 1e-4, 5), round(b, 5), round(b + 1e-4, 5)}
    return [[t, round(fn(t), 4)] for t in sorted(ts) if 0 <= t <= t_end]


def speed_of(pose_fn, h=1e-3):
    """|velocity| of a pose function (x,y,z,...) by central difference, m/s."""
    def v(t):
        a, b = pose_fn(max(0, t - h)), pose_fn(t + h)
        return math.dist(a[:3], b[:3]) / (t + h - max(0, t - h))
    return v


def pulse(t, start, length, value):
    return value if start <= t < start + length else 0.0


def hic_constant_pulse(delta_v, stop_dist):
    """Head Injury Criterion for a constant-deceleration pulse.
    a = v^2 / 2d, dt = 2d / v, HIC = dt * (a/g)^2.5"""
    a = delta_v ** 2 / (2 * stop_dist)
    dt = 2 * stop_dist / delta_v
    return dt * (a / G) ** 2.5, a / G, dt


# ---------------------------------------------------------------------------
# 1. Pedestrian struck by a car
# ---------------------------------------------------------------------------
def pedestrian(speed_kmh=50, car_mass=1500, ped_mass=75, mu_brake=0.8,
               mu_body=0.7, reaction_time=1.5):
    v0 = kmh(speed_kmh)
    car_front = 2.2                      # car origin -> front bumper (m)
    start_gap = 20.0                     # bumper to pedestrian at t=0
    t_hit = start_gap / v0

    # Momentum: pedestrian is swept up to (almost) the car's speed.
    # Perfectly plastic collision gives the upper bound.
    v_ped = v0 * car_mass / (car_mass + ped_mass)

    # Bumper hits the leg just below the knee. The lower leg (~10 kg effective)
    # is accelerated to car speed over ~15 ms of bumper crush.
    leg_force = 10 * v0 / 0.015

    # Head swings into the windscreen at ~70% of car speed; glass + frame
    # deflect ~5 cm.
    hic_ws, g_ws, dt_ws = hic_constant_pulse(0.7 * v0, 0.05)

    # Throw: carried briefly on the bonnet, then launched.
    t_wrap = 0.15
    # Hips leave the bonnet at 1.11 m with 2 m/s upward (the wrap rotation lifts
    # the body); the car keeps braking underneath, so the body lands ahead of it.
    launch_h, launch_vz = 1.11, 2.0
    vx_launch = 0.95 * v_ped
    t_air = (launch_vz + math.sqrt(launch_vz ** 2 + 2 * G * (launch_h - BODY_HALF_THICKNESS))) / G
    air_dist = vx_launch * t_air
    vx_land = 0.7 * vx_launch           # energy lost on first ground impact
    slide_dist = vx_land ** 2 / (2 * mu_body * G)
    t_slide = vx_land / (mu_body * G)
    throw = air_dist + slide_dist

    # Head hitting the road: falls ~1.1 m plus horizontal speed; with stopping
    # distance 1 cm on asphalt it is often worse than the windscreen.
    v_head_ground = math.sqrt(2 * G * launch_h + launch_vz ** 2)
    hic_gr, g_gr, _ = hic_constant_pulse(v_head_ground, 0.01)

    # Car stopping distance if the driver had seen them 1.5 s earlier
    stop_total = v0 * reaction_time + v0 ** 2 / (2 * mu_brake * G)

    ke = 0.5 * car_mass * v0 ** 2

    def fatality_risk(v):  # Rosén & Sander (2009) logistic fit, v in km/h
        return 1 / (1 + math.exp(6.9 - 0.090 * v))

    # --- animation -------------------------------------------------------
    t_brake_stop = v0 / (mu_brake * G)
    duration = t_hit + t_wrap + t_air + t_slide + 1.5

    def car(t):
        if t < t_hit:
            x = -start_gap - car_front + v0 * t
        else:
            tb = min(t - t_hit, t_brake_stop)
            x = -car_front + v0 * tb - 0.5 * mu_brake * G * tb ** 2
        return (x, 0, 0, 0, 0, 0)

    # The wrap, planned in the car's frame (x forward from the car origin, z up):
    # the bumper sweeps the legs, the hips slide back onto the bonnet and the
    # body pitches back until the head meets the windscreen, at t_ws.
    hip_h = 0.93
    stand_x = 0.08                               # leg radius: the bumper reaches the shins at t_hit
    hip_rest = (car_front + stand_x, hip_h)      # standing, hips just ahead of the bumper
    hip_bonnet = (1.55, launch_h)                # on the bonnet, 10 cm above the panel
    head_r, head_arm = 0.11, 1.64 - hip_h
    ws_a, ws_b = (1.0, 1.04), (0.25, 1.62)       # windscreen line in the car profile (render_scenario.car)
    k_ws = 0.10 / t_wrap                         # head reaches the glass 100 ms into the wrap

    def head_gap(pitch):
        hx, hz = hip_bonnet[0] + head_arm * math.sin(pitch), hip_bonnet[1] + head_arm * math.cos(pitch)
        dx, dz = ws_b[0] - ws_a[0], ws_b[1] - ws_a[1]
        return ((hx - ws_a[0]) * dz - (hz - ws_a[1]) * dx) / math.hypot(dx, dz) - head_r

    lo, hi = 0.0, -math.pi / 2                   # pitch where the head just touches the glass
    for _ in range(60):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if head_gap(mid) > 0 else (lo, mid)
    pitch_ws = lo
    lying = math.pi / 2                          # flat on the road, head toward the direction of travel

    def ease(k):
        k = max(0.0, min(1.0, k))
        return k * k * (3 - 2 * k)

    def ped_hip(t):
        """Hip position and rotation: (x, y, z, rx, ry, rz)."""
        if t < t_hit:
            return (stand_x, 0, hip_h, 0, 0, 0)
        tt = t - t_hit
        if tt < t_wrap:
            # first the bumper sweeps the legs up (pitch), then the hips slide back along the bonnet
            k = tt / (k_ws * t_wrap)
            lx = hip_rest[0] + (hip_bonnet[0] - hip_rest[0]) * ease((k - 0.25) / 0.75)
            lz = hip_rest[1] + (hip_bonnet[1] - hip_rest[1]) * ease(k)
            return (car(t)[0] + lx, 0, lz, 0, pitch_ws * ease(k / 0.7), 0)
        tt -= t_wrap
        x0 = car(t_hit + t_wrap)[0] + hip_bonnet[0]
        if tt < t_air:                  # airborne: the hips fly a parabola, the body tumbles about them
            z = launch_h + launch_vz * tt - 0.5 * G * tt ** 2          # lands at BODY_HALF_THICKNESS at t_air
            # forward roll over the hips once clear of the bonnet: the head swings up and ahead
            pitch = pitch_ws + (lying - pitch_ws) * ease((tt / t_air - 0.35) / 0.65)
            return (x0 + vx_launch * tt, 0, z, 0.4 * tt, pitch, 0)
        tt -= t_air
        ts = min(tt, t_slide)
        x = x0 + air_dist + vx_land * ts - 0.5 * mu_body * G * ts ** 2
        return (x, 0, BODY_HALF_THICKNESS, 0.4 * t_air, lying, 0.6 * ts)

    def ped(t):
        """Origin between the feet, as the film and the viewer expect."""
        x, y, z, rx, ry, rz = ped_hip(t)
        return hip_to_feet((x, y, z), rx, ry, rz, hip_h)

    speeds = [20, 30, 40, 50, 60, 70, 80]
    table_rows = []
    for s in speeds:
        v = kmh(s)
        h, _, _ = hic_constant_pulse(0.7 * v, 0.05)
        table_rows.append([s, round(0.5 * car_mass * v * v / 1000, 1),
                           round(v * reaction_time + v * v / (2 * mu_brake * G), 1),
                           round(h), f"{fatality_risk(s) * 100:.0f}%"])

    # --- story: what the video shows, all derived from the numbers above ---
    m_head = 4.5
    t_ws = t_hit + 0.10                          # head reaches the glass during the wrap
    t_land = t_hit + t_wrap + t_air
    _, _, dt_gr = hic_constant_pulse(v_head_ground, 0.01)

    def force_kn(t):
        f = pulse(t, t_hit, 0.015, leg_force)
        f += pulse(t, t_ws, dt_ws, m_head * g_ws * G)
        f += pulse(t, t_land, dt_gr, m_head * g_gr * G)
        if t_land + dt_gr <= t < t_land + t_slide:
            f += mu_body * ped_mass * G          # sliding friction on the road
        return f / 1000

    breaks = [t_hit, t_hit + 0.015, t_ws, t_ws + dt_ws, t_land, t_land + dt_gr, t_land + t_slide]
    story = {
        "slowmo": [[t_hit - 0.03, t_hit + 0.16, 1 / 13], [t_land - 0.02, t_land + 0.03, 1 / 13]],
        "series": {
            "force": series(force_kn, duration, breaks=breaks),
            "v_ped": series(lambda t: speed_of(ped_hip)(t) * 3.6, duration, breaks=breaks),   # centre of mass
            "v_car": series(lambda t: speed_of(car)(t) * 3.6, duration),
        },
        "hud": [{"sym": "F", "series": "force", "unit": "kN", "fmt": "{:.1f}", "note": "contact force on the body"},
                {"sym": "v_ped", "series": "v_ped", "unit": "km/h", "fmt": "{:.0f}"}],
        "captions": [
            [0, f"Hit at {speed_kmh} km/h.", f"{ke / 1000:.0f} kJ of kinetic energy  ·  real physics, every frame"],
            [t_hit, "Bumper meets knee.", f"{leg_force / 1000:.1f} kN on the tibia, which breaks at ~4 kN"],
            [t_ws, "Head into the windscreen.", f"{g_ws:.0f} g for {dt_ws * 1000:.0f} ms  ·  HIC {hic_ws:.0f}"],
            [t_hit + t_wrap, "Launched.", f"momentum carries the body at {v_ped * 3.6:.0f} km/h"],
            [t_land, "Second impact: the road.", f"1 cm of asphalt stops the head  ·  {g_gr:.0f} g"],
            [t_land + 0.4, f"Thrown {throw:.1f} m.",
             f"at 30 km/h the risk of death falls from {fatality_risk(speed_kmh) * 100:.0f}% to {fatality_risk(30) * 100:.1f}%"],
        ],
        "callouts": [
            [0, t_hit - 0.15, "car", [2.2, 0.9, 0.7], f"{speed_kmh} km/h  ·  {car_mass} kg"],
            [t_hit, t_hit + 0.12, "victim", [0, 0, 0.5], f"bumper: {leg_force / 1000:.1f} kN at the knee"],
            [t_ws - 0.005, t_ws + 0.06, "victim", [0, 0, 1.64], f"head: {g_ws:.0f} g"],
            [t_land, t_land + 0.8, "victim", [0, 0, 1.64], f"head vs road: HIC {hic_gr:.0f}"],
        ],
        "graphs": [
            {"title": "speed (km/h)", "lines": [["v_ped", "pedestrian", "accent"], ["v_car", "car", "ink"]]},
            {"title": "force on body (kN)", "lines": [["force", "contact", "accent"]], "refs": [[4.0, "tibia breaks"]]},
        ],
        "eqs": [f"v_ped = m_car·v0 / (m_car + m_ped) = {v_ped * 3.6:.1f} km/h",
                f"a = v²/2d = {g_ws:.0f} g      HIC = Δt·(a/g)^2.5 = {hic_ws:.0f}",
                f"d_stop = v·t_react + v²/2μg = {stop_total:.1f} m"],
    }

    return {
        "story": story,
        "id": "pedestrian", "title": "Pedestrian struck by a car",
        "inputs": dict(speed_kmh=speed_kmh, car_mass_kg=car_mass, ped_mass_kg=ped_mass,
                       brake_friction=mu_brake, body_road_friction=mu_body,
                       reaction_time_s=reaction_time),
        "results": [
            ("Car speed", v0, "m/s", f"{speed_kmh} km/h / 3.6"),
            ("Car kinetic energy", ke / 1000, "kJ", "KE = ½mv². Energy goes up with the square of speed"),
            ("Pedestrian speed after impact", v_ped, "m/s", "Momentum conservation: v = m_car·v0 / (m_car + m_ped)"),
            ("Bumper force on lower leg", leg_force / 1000, "kN", "F = mΔv/Δt with 10 kg leg, 15 ms. Tibia breaks at ~4 kN"),
            ("Head vs windscreen: deceleration", g_ws, "g", "a = v²/2d, head at 0.7·v0, 5 cm glass deflection"),
            ("Head vs windscreen: HIC", hic_ws, "", "HIC > 1000 means a high risk of serious brain injury"),
            ("Head vs road: HIC", hic_gr, "", "1 cm stopping distance on asphalt. The secondary impact often kills"),
            ("Throw distance", throw, "m", f"air {air_dist:.1f} m + slide {slide_dist:.1f} m (μ = {mu_body})"),
            ("Stopping distance if seen 1.5 s earlier", stop_total, "m", "d = v·t_react + v²/(2μg)"),
            ("Fatality risk at this speed", fatality_risk(speed_kmh) * 100, "%", "Logistic fit to real crash data (Rosén & Sander 2009)"),
        ],
        "tables": {"Speed matters": {
            "columns": ["km/h", "Car KE (kJ)", "Stopping dist (m)", "Windscreen HIC", "Fatality risk"],
            "rows": table_rows}},
        "anim": {"fps": FPS, "duration": duration,
                 "actors": {"car": sample(car, duration, dense=story["slowmo"]),
                            "victim": sample(ped, duration, dense=story["slowmo"])}},
    }


# ---------------------------------------------------------------------------
# 2. Drowning in a rip current
# ---------------------------------------------------------------------------
def pose_from_axes(f, u):
    """Blender XYZ Euler for the swimmer rig, from where the face (f) and the head (u) point.
    The rig's body faces the actor's +y, so the actor axes are x = f × u, y = f, z = u. That keeps
    face-down and face-up poses (the whole drowning story) away from XYZ gimbal lock."""
    x = (f[1] * u[2] - f[2] * u[1], f[2] * u[0] - f[0] * u[2], f[0] * u[1] - f[1] * u[0])
    m = [[x[i], f[i], u[i]] for i in range(3)]                     # columns: x, y, z of the actor
    b = math.asin(max(-1.0, min(1.0, -m[2][0])))
    if abs(math.cos(b)) > 1e-6:
        return math.atan2(m[2][1], m[2][2]), b, math.atan2(m[1][0], m[0][0])
    return math.atan2(m[0][1] if b > 0 else -m[0][1], m[1][1]), b, 0.0


def unwrap(rows, cols):
    """Keep Euler angles continuous between keys (no 2π jumps for the interpolator)."""
    for i in range(1, len(rows)):
        for c in cols:
            d = rows[i][c] - rows[i - 1][c]
            rows[i][c] -= round(d / math.tau) * math.tau
    return rows


def norm(v):
    n = math.sqrt(sum(c * c for c in v)) or 1.0
    return tuple(c / n for c in v)


def lerp(a, b, k):
    k = max(0.0, min(1.0, k))
    return tuple(x + (y - x) * k for x, y in zip(a, b))


# ---------------------------------------------------------------------------
# 2. Drowning in a rip current: told as if it happens to you
# ---------------------------------------------------------------------------
def drowning(rip_speed=1.5, swim_speed=1.0, rip_half_width=15, rip_length=90,
             start_offshore=20, endurance_s=100, water_temp_c=18, mass=70):
    """You are 20 m out when a rip current takes you. You fight it, tire, go under,
    and a lifeguard brings you back. x = along the beach, y = offshore (+ out to sea), z = up."""
    rho, body_vol = 1025, 0.0703                                   # sea water; 70 kg adult, lungs at rest
    seabed = [(-40, 1.6), (-12, 0.9), (-2, 0.15), (0, 0.0), (10, -0.8), (20, -1.6), (35, -2.6),
              (55, -3.6), (80, -4.6), (100, -5.0), (160, -5.2)]

    def bed(y):
        for (y0, z0), (y1, z1) in zip(seabed, seabed[1:]):
            if y <= y1:
                return z0 + (z1 - z0) * max(0.0, (y - y0) / (y1 - y0))
        return seabed[-1][1]

    def current(x, y):
        if abs(x) < rip_half_width and 0 < y < rip_length:
            fx = 1 - (x / rip_half_width) ** 2
            fy = 1 if y < rip_length * 0.7 else (rip_length - y) / (rip_length * 0.3)
            return rip_speed * fx * fy
        return 0.0

    # --- what each choice gets you (2D, from the surface) -------------------
    def simulate(strategy, t_max=300, dt=0.05):
        x, y, t, energy = 0.0, float(start_offshore), 0.0, float(endurance_s)
        while t <= t_max:
            if y <= 0:
                return "safe", t
            if energy <= 0:
                return "exhausted", t
            if strategy == "fight":
                sx, sy, effort = 0, -swim_speed, 1.0
            elif strategy == "parallel":
                sx, sy = (swim_speed, 0) if abs(x) < rip_half_width + 2 and y < rip_length else (0, -swim_speed)
                effort = 1.0
            else:
                sx, sy, effort = 0, 0, 0.12
            x += sx * dt
            y += (sy + current(x, y)) * dt
            energy -= effort * dt
            t += dt
        return "afloat", t_max

    outcomes = {k: simulate(k) for k in ("fight", "parallel", "float")}

    def outcome(k):
        what, t = outcomes[k]
        return {"safe": f"on the beach at t = {t:.0f} s", "exhausted": f"exhausted at t = {t:.0f} s",
                "afloat": "still floating at 5 min, waving: easy to spot and rescue"}[what]

    # --- buoyancy: why you can't keep your head up --------------------------
    head_vol, head_mass = 0.0045, 5.0
    F_rest = (rho * body_vol - mass) * G                           # lungs at rest: whole body under
    F_head_out = F_rest - rho * head_vol * G                       # lift the whole head clear
    F_face_out = F_rest - rho * head_vol / 3 * G                   # float on your back, face only
    vol_wet = body_vol - 0.0015                                    # breathed out to residual volume
    m_wet = mass + 1.0                                             # ~1 L of water aspirated
    F_sink = (rho * vol_wet - m_wet) * G                           # negative: you sink
    CdA = 0.6 * 0.5                                                # a limp body tumbling
    v_sink = math.sqrt(2 * abs(F_sink) / (rho * CdA))
    p_swim = 0.5 * rho * 0.35 * 0.12 * swim_speed ** 3 / 0.08     # drag power / 8 % efficiency

    # --- your path -----------------------------------------------------------
    dt = 0.05
    y, t, energy = float(start_offshore), 0.0, float(endurance_s)
    while energy > 0:                                              # fighting straight for the beach
        if y <= 0:
            raise ValueError(f"with a {rip_speed} m/s rip you swim out of it and reach the beach: "
                             "this story needs the rip to be faster than you (rip_speed > swim_speed)")
        y += (current(0, y) - swim_speed) * dt
        energy -= dt
        t += dt
    t_tired, y_tired = t, y
    t_sub = t_tired + 40                                           # instinctive drowning response: 20–60 s
    t_gasp = t_sub + 22                                            # breath-hold break point, exhausted
    t_alert = t_sub + 18                                           # a friend notices you are gone

    def you_y_drift(t0, y0, t1, k=1.0):
        yy, tt = y0, t0
        while tt < t1:
            yy += k * current(0, yy) * dt
            tt += dt
        return yy

    y_sub = you_y_drift(t_tired, y_tired, t_sub)
    y_gasp = you_y_drift(t_sub, y_sub, t_gasp)
    hip_hang = -1.05                                               # head just under the surface
    t_bottom = t_gasp + (hip_hang - (bed(y_gasp) + 0.14)) / v_sink
    y_bottom = you_y_drift(t_gasp, y_gasp, t_bottom, 0.4)
    depth = -bed(y_bottom)

    # The lifeguard: from the tower, into the water, out *with* the rip, then a search.
    lg_speed, tow_speed = 1.2, 0.8
    t_run = t_alert + 3.0
    t_wade = t_run + 2.5
    yl, t = 6.0, t_wade
    while yl < y_sub - 2:
        yl += (lg_speed + current(0, yl)) * dt
        t += dt
    t_arrive = t
    t_dive = t_arrive + 16                                         # last-seen point, murky water
    t_grab = t_dive + (y_bottom - (y_sub - 2) + abs(depth)) / 1.1
    t_surface = t_grab + abs(depth + 1.0) / 0.8
    x_out = -(rip_half_width + 5)
    t_side = t_surface + abs(x_out) / tow_speed
    t_shore = t_side + (y_bottom - 1.0) / tow_speed
    t_beach = t_shore + 7
    t_breaths = t_beach + 8                                        # 5 rescue breaths first
    t_cpr = t_breaths
    t_rosc = t_cpr + 50
    duration = t_rosc + 14
    duration_est = duration
    submerged = t_surface - t_sub

    # --- oxygen: PaO2 falls while you can't breathe, SpO2 follows the dissociation curve
    def pao2(t):
        if t < t_tired:
            return 95.0
        if t < t_sub:
            return 95 - 25 * (t - t_tired) / (t_sub - t_tired)        # snatched breaths, some water
        p_low = 70 * math.exp(-(min(t, t_surface + 8) - t_sub) / 86)
        if t < t_surface + 8:
            return p_low
        if t < t_beach:                                            # in-water rescue breaths while towing
            return 45 + (p_low - 45) * math.exp(-(t - t_surface - 8) / 40)
        p_b = 45 + (p_low - 45) * math.exp(-(t_beach - t_surface - 8) / 40)
        if t < t_breaths:
            return p_b
        return 90 + (p_b - 90) * math.exp(-(t - t_breaths) / 25)

    def spo2(t):
        p = pao2(t)
        return 100 / (23400 / (p ** 3 + 150 * p) + 1)               # Severinghaus

    t_uncon = next(tt / 10 for tt in range(int(t_sub * 10), int(duration * 10)) if spo2(tt / 10) < 60)

    # --- film pacing: 12× most of the time, real time for the moments that matter
    story_speed = 12
    slowmo = [[t_tired + 4, t_tired + 10, 1], [t_gasp - 2, t_gasp + 4, 1],
              [t_surface + 4, t_shore - 4, 30], [t_cpr, t_cpr + 7, 1]]

    ft_step, ft_table = 0.02, [0.0]                                # film seconds at every 20 ms of sim time
    for i in range(int(duration_est / ft_step) + 2):
        tt = i * ft_step
        r = next((w[2] for w in slowmo if w[0] <= tt < w[1]), story_speed)
        ft_table.append(ft_table[-1] + ft_step / r)

    def film_time(t):
        x = max(0.0, t) / ft_step
        i = min(int(x), len(ft_table) - 2)
        return ft_table[i] + (ft_table[i + 1] - ft_table[i]) * (x - i)

    # --- poses ---------------------------------------------------------------
    UP, SHORE, SEA, DOWN = (0, 0, 1), (0, -1, 0), (0, 1, 0), (0, 0, -1)
    LEFT = (-1, 0, 0)                                              # along the beach, out of the rip

    def turn(a, b, k, via):
        """Direction part-way from a to b; goes through `via` so opposite directions never cancel."""
        k = max(0.0, min(1.0, k))
        if sum(x * y for x, y in zip(norm(a), norm(b))) < -0.9:
            return norm(lerp(a, via, 2 * k)) if k < 0.5 else norm(lerp(via, b, 2 * k - 1))
        return norm(lerp(a, b, k))

    def pitch(theta):
        """Upright and facing the sea at 0; head toward the sea at π/2; head down at π."""
        return (0, math.cos(theta), -math.sin(theta)), (0, math.sin(theta), math.cos(theta))

    def body(hip, f, u, hip_h=0.93):
        u = norm(u)
        d = sum(x * y for x, y in zip(f, u))
        f = norm(tuple(x - d * y for x, y in zip(f, u)))           # make the face square to the spine
        rx, ry, rz = pose_from_axes(f, u)
        return (hip[0] - hip_h * u[0], hip[1] - hip_h * u[1], hip[2] - hip_h * u[2], rx, ry, rz)

    def lying_z(y, u):
        """Hip height for a body lying flat: clear of the seabed under the hips and the head."""
        return max(bed(y), bed(y + 0.75 * u[1])) + 0.15

    def ease(k):
        k = max(0.0, min(1.0, k))
        return k * k * (3 - 2 * k)

    f_idr, swim_z, idr_z = norm(lerp(SHORE, UP, 0.15)), -0.12, -0.66

    def you(t):
        if t < t_tired:                                            # front crawl at the surface, toward the beach
            yy = start_offshore + (y_tired - start_offshore) * t / t_tired
            return body((0, yy, swim_z), DOWN, SHORE)
        if t < t_sub:                                              # IDR: upright, head back, bobbing
            k = (t - t_tired) / (t_sub - t_tired)
            e = ease((t - t_tired) / 2.5)                          # 2.5 s to come upright
            yy = y_tired + (y_sub - y_tired) * k
            bob = e * (0.10 + 0.18 * k) * math.sin(math.tau * film_time(t) * 0.9)
            z = swim_z + (idr_z - 0.25 * k - swim_z) * e + bob
            return body((0, yy, z), turn(DOWN, f_idr, e, SHORE), turn(SHORE, lerp(UP, SHORE, 0.08 * k), e, UP))
        if t < t_gasp:                                             # hanging just below the surface
            k = (t - t_sub) / (t_gasp - t_sub)
            yy = y_sub + (y_gasp - y_sub) * k
            return body((0, yy, idr_z - 0.25 + (hip_hang - idr_z + 0.25) * k),
                        lerp(f_idr, DOWN, 0.4 * k), lerp(lerp(UP, SHORE, 0.08), SHORE, 0.25 * k))
        f_hang, u_hang = lerp(f_idr, DOWN, 0.4), lerp(lerp(UP, SHORE, 0.08), SHORE, 0.25)
        if t < t_grab:                                             # sinking, then face down on the bottom
            k = min(1.0, (t - t_gasp) / (t_bottom - t_gasp))
            yy = y_gasp + (y_bottom - y_gasp) * k
            u = lerp(u_hang, SHORE, ease(k))
            z = hip_hang + (lying_z(yy, SHORE) - hip_hang) * k
            return body((0, yy, max(z, lying_z(yy, norm(u)) if k > 0.8 else z)), lerp(f_hang, DOWN, ease(k)), u)
        y_up = y_bottom - 0.6
        if t < t_surface:                                          # brought up, rolled face to the sky
            k = (t - t_grab) / (t_surface - t_grab)
            z0 = lying_z(y_bottom, SHORE)
            return body((0, y_bottom - 0.6 * k, z0 + (-0.1 - z0) * k),
                        turn(DOWN, UP, k, (1, -1, 0)), turn(SHORE, LEFT, k, (-1, -1, 0)))
        if t < t_side:                                             # towed sideways, out of the rip
            k = (t - t_surface) / (t_side - t_surface)
            return body((x_out * k, y_up, -0.1), UP, LEFT)
        if t < t_shore:                                            # towed to the beach, head first
            k = (t - t_side) / (t_shore - t_side)
            yy = y_up + (1.0 - y_up) * k
            u = turn(LEFT, SHORE, min(1, k * 5), (-1, -1, 0))
            return body((x_out, yy, max(-0.1, lying_z(yy, u))), UP, u)
        if t < t_beach:                                            # dragged up the sand
            k = (t - t_shore) / (t_beach - t_shore)
            yy = 1.0 - 5.0 * k
            return body((x_out, yy, lying_z(yy, SHORE)), UP, SHORE)
        return body((x_out, -4.0, lying_z(-4.0, SHORE)), UP, SHORE)

    tower = (6.0, -12.0)
    chest_beach = (x_out, -4.0 - 0.32)
    wade_u = norm(lerp(UP, SEA, 0.25))

    def lifeguard(t):
        if t < t_alert:                                            # on the tower, watching
            return body((tower[0], tower[1], bed(tower[1]) + 1.8 + 0.93), SEA, UP)
        if t < t_run:                                              # down and across the sand
            k = (t - t_alert) / (t_run - t_alert)
            x, yy = tower[0] + (0.6 - tower[0]) * k, tower[1] * (1 - k)
            return body((x, yy, bed(yy) + 0.93 + 1.8 * max(0.0, 1 - k * 3)), SEA, UP)
        if t < t_wade:                                             # wading in, feet on the bottom
            k = (t - t_run) / (t_wade - t_run)
            yy = 6.0 * k
            u = lerp(UP, wade_u, k)
            return body((0.6, yy, bed(yy) + 0.93 * norm(u)[2] + 0.03), SEA, u)
        if t < t_arrive:                                           # dives forward and swims out with the rip
            k = (t - t_wade) / (t_arrive - t_wade)
            e = ease((t - t_wade) / 1.5)
            z0 = bed(6.0) + 0.93 * wade_u[2] + 0.03
            return body((0.6, 6.0 + (y_sub - 8.0) * k, z0 + (swim_z - z0) * e), turn(SEA, DOWN, e, SEA),
                        turn(wade_u, SEA, e, SEA))
        if t < t_dive:                                             # treading water, looking for you
            e = ease((t - t_arrive) / 1.5)
            look = norm(lerp(SEA, (1, 0, 0), 0.4 * math.sin((t - t_arrive) * 0.5)))
            return body((0.6, y_sub - 2, swim_z + (-0.62 - swim_z) * e + 0.05 * math.sin(math.tau * film_time(t) * 0.7)),
                        turn(DOWN, look, e, SEA), turn(SEA, UP, e, SEA))
        if t < t_grab:                                             # duck dive, head first, down to you
            k = (t - t_dive) / (t_grab - t_dive)
            f, u = pitch(2.4 * ease(k * 2.5))
            yy = (y_sub - 2) + (y_bottom - 1.2 - (y_sub - 2)) * k
            z = -0.62 + ((lying_z(y_bottom, SHORE) + 0.75) + 0.62) * ease(k)
            return body((0.6, yy, z), f, u)
        if t < t_surface:                                          # kicks up with you
            k = (t - t_grab) / (t_surface - t_grab)
            f, u = pitch(2.4 * (1 - ease(k * 1.5)))
            z0 = lying_z(y_bottom, SHORE) + 0.75
            return body((0.6 + (-1.2 - 0.6) * k, (y_bottom - 1.2) + 0.6 * k, z0 + (-0.4 - z0) * k), f, u)
        if t < t_side:                                             # tows you sideways
            k = (t - t_surface) / (t_side - t_surface)
            e = ease((t - t_surface) / 2.0)
            return body((x_out * k - 1.2, y_bottom - 0.6, -0.4 + (swim_z + 0.4) * e), turn(SEA, DOWN, e, SEA),
                        turn(UP, LEFT, e, UP))
        if t < t_shore:                                            # and in to the beach
            k = (t - t_side) / (t_shore - t_side)
            yy = (y_bottom - 0.6) + (1.0 - y_bottom + 0.6) * k - 1.2
            stand = ease((2.5 - yy) / 2.5)
            u = turn(turn(LEFT, SHORE, min(1, k * 5), (-1, -1, 0)), UP, stand, SHORE)
            return body((x_out, yy, max(swim_z, bed(yy) + 0.93 * u[2] + 0.06, lying_z(yy, u))), turn(DOWN, SHORE, stand, SHORE), u)
        if t < t_beach:                                            # turns round, walks backwards dragging you
            k = (t - t_shore) / (t_beach - t_shore)
            yy = -0.2 - 5.0 * k
            return body((x_out, yy, bed(yy) + 0.93), turn(SHORE, SEA, ease(k * 3), (1, 0, 0)), UP)
        # kneeling at your side: 5 breaths at your head, then compressions on the chest.
        # Hips 0.45 m up, torso leaning 35° over you: shoulders land 0.6 m (an arm) above your sternum.
        hip = (chest_beach[0] - 0.45, chest_beach[1], bed(-4.3) + 0.45)
        e = ease((t - t_beach) / 1.2)
        lean = math.radians(35)
        u_k = (math.sin(lean), 0, math.cos(lean))
        f_k = (math.cos(lean), 0, -math.sin(lean))
        if t < t_breaths:
            bump = 0.04 * math.sin(math.tau * (t - t_beach) / 1.6)
            stand = (x_out, -5.2, bed(-5.2) + 0.93)
            target = (hip[0] + 0.05, hip[1] - 0.4, hip[2] + bump)       # at your head for the breaths
            lean_b = math.radians(55)
            return body(lerp(stand, target, e), turn(SEA, (math.cos(lean_b), 0, -math.sin(lean_b)), e, (1, 0, 0)),
                        turn(UP, (math.sin(lean_b), 0, math.cos(lean_b)), e, UP))
        push = 0.05 * max(0.0, math.sin(math.tau * 1.85 * (t - t_cpr))) if t < t_rosc else 0.0
        k = ease((t - t_breaths) / 1.0)
        return body(lerp((hip[0] + 0.05, hip[1] - 0.4, hip[2]), (hip[0], hip[1], hip[2] - push), k), f_k, u_k)

    def joints_you(t):
        ph = math.tau * film_time(t) * 0.75
        if t < t_tired:                                            # crawl arms, flutter kick
            return {"shoulder_L": (0, -math.pi + ph, 0), "shoulder_R": (0, ph, 0),
                    "hip_L": (0, 0.3 * math.sin(3 * ph), 0), "hip_R": (0, -0.3 * math.sin(3 * ph), 0), "neck": (0, 0.25, 0)}
        if t < t_sub:                                              # arms pressing down at the sides, head back
            flap = 0.3 * math.sin(math.tau * film_time(t) * 1.2)
            return {"shoulder_L": (1.2 + flap, -0.2, 0), "shoulder_R": (-1.2 - flap, -0.2, 0),
                    "hip_L": (0, 0.12 * math.sin(ph), 0), "hip_R": (0, -0.12 * math.sin(ph), 0), "neck": (0, -0.55, 0)}
        if t < t_surface:                                          # limp
            return {"shoulder_L": (0.45, -0.5, 0), "shoulder_R": (-0.45, -0.5, 0),
                    "hip_L": (0.05, -0.15, 0), "hip_R": (-0.05, -0.1, 0), "neck": (0, 0.35, 0)}
        return {"shoulder_L": (0.25, 0, 0), "shoulder_R": (-0.25, 0, 0),
                "hip_L": (0.04, 0, 0), "hip_R": (-0.04, 0, 0), "neck": (0, -0.25, 0)}

    def joints_lifeguard(t):
        ph = math.tau * film_time(t) * 0.9
        if t < t_alert:
            return {"shoulder_L": (0.1, 0, 0), "shoulder_R": (-0.1, 0, 0), "hip_L": (0, 0, 0), "hip_R": (0, 0, 0), "neck": (0, 0, 0)}
        if t < t_wade:                                             # running
            s_ = math.sin(ph * 2)
            return {"shoulder_L": (0.1, 0.7 * s_, 0), "shoulder_R": (-0.1, -0.7 * s_, 0),
                    "hip_L": (0, -0.6 * s_, 0), "hip_R": (0, 0.6 * s_, 0), "neck": (0, 0, 0)}
        if t < t_arrive or t_surface <= t < t_shore:               # front crawl
            return {"shoulder_L": (0, -math.pi + ph, 0), "shoulder_R": (0, ph, 0),
                    "hip_L": (0, 0.3 * math.sin(3 * ph), 0), "hip_R": (0, -0.3 * math.sin(3 * ph), 0), "neck": (0, 0.3, 0)}
        if t < t_dive:                                             # treading water
            s_ = math.sin(ph * 1.5)
            return {"shoulder_L": (1.3 + 0.2 * s_, 0, 0), "shoulder_R": (-1.3 - 0.2 * s_, 0, 0),
                    "hip_L": (0, 0.4 * s_, 0), "hip_R": (0, -0.4 * s_, 0), "neck": (0, 0, 0)}
        if t < t_surface:                                          # diving: arms reach ahead
            return {"shoulder_L": (0, -math.pi + 0.3, 0), "shoulder_R": (0, -math.pi + 0.3, 0),
                    "hip_L": (0, 0.35 * math.sin(3 * ph), 0), "hip_R": (0, -0.35 * math.sin(3 * ph), 0), "neck": (0, 0, 0)}
        if t < t_beach:
            return {"shoulder_L": (0.2, -0.8, 0), "shoulder_R": (-0.2, -0.8, 0),
                    "hip_L": (0, 0.4 * math.sin(ph), 0), "hip_R": (0, -0.4 * math.sin(ph), 0), "neck": (0, 0, 0)}
        # kneeling: arms straight down onto your chest (52° forward of the leaning torso),
        # legs folded back so the feet reach the sand
        return {"shoulder_L": (0.12, -0.9, 0), "shoulder_R": (-0.12, -0.9, 0),
                "hip_L": (0, 0.45, 0), "hip_R": (0, 0.45, 0), "neck": (0, 0.35, 0)}

    def head_depth(t):
        x, yy, z, rx, ry, rz = you(t)
        cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
        uz = cy * cx                                               # actor z-axis, world z component
        return max(0.0, -(z + 1.6 * uz))

    dense = [w for w in slowmo if w[2] <= 1]                       # real-time windows need dense keys
    rows_you = unwrap(sample(you, duration, dense=dense), (4, 5, 6))
    rows_lg = unwrap(sample(lifeguard, duration, dense=dense), (4, 5, 6))

    def joint_rows(fn):
        ts = sorted({r[0] for r in rows_you})
        out = {}
        for tt in ts:
            for name, rot in fn(tt).items():
                out.setdefault(name, []).append([tt] + [round(c, 4) for c in rot])
        return {k: unwrap(v, (1, 2, 3)) for k, v in out.items()}

    story = {
        "speed": story_speed,
        "slowmo": slowmo,
        "series": {
            "spo2": series(spo2, duration, dt=0.5),
            "depth": series(head_depth, duration, dt=0.5),
            "y_you": series(lambda t: max(0.0, you(t)[1] + 0.93), duration, dt=0.5),
            "y_lifeguard": series(lambda t: max(0.0, lifeguard(t)[1]), duration, dt=0.5),
        },
        "hud": [{"sym": "SpO₂", "series": "spo2", "unit": "%", "fmt": "{:.0f}", "note": "oxygen in your blood"},
                {"sym": "depth", "series": "depth", "unit": "m", "fmt": "{:.1f}"}],
        "captions": [
            [0, f"You're {start_offshore} m out. The water pulls.",
             f"a rip current: {rip_speed} m/s out to sea, faster than you can swim"],
            [6, "You swim for the beach.",
             f"{swim_speed} − {rip_speed} = {swim_speed - rip_speed:+.1f} m/s: you go backwards, burning {p_swim:.0f} W"],
            [t_tired, "Your arms give out.", f"{endurance_s} s of hard swimming. You're {y_tired:.0f} m out"],
            [t_tired + 4, "Instinctive drowning response.", "upright, head back, arms pressing down. You can't shout or wave"],
            [t_sub, "You go under.", f"holding your whole head up costs {-F_head_out:.0f} N more than your lungs give"],
            [t_gasp, "The breath-hold breaks.", "an involuntary gasp pulls water into your airway"],
            [t_gasp + 6, "You sink.", f"lungs empty, water in: {F_sink:+.1f} N, down at {v_sink:.2f} m/s"],
            [t_uncon, "You black out.", f"SpO₂ under 60% after {t_uncon - t_sub:.0f} s underwater"],
            [t_alert, "Someone notices you're gone.", "the lifeguard rides the rip out: "
             f"{lg_speed} + {rip_speed} = {lg_speed + rip_speed:.1f} m/s"],
            [t_grab, f"Found, {depth:.1f} m down.", f"{t_grab - t_sub:.0f} s after you went under"],
            [t_surface + 3, "Towed sideways, out of the rip.", "then in to the beach, with rescue breaths on the way"],
            [t_beach, "5 rescue breaths first.", "drowning stops the heart through lack of oxygen"],
            [t_cpr + 8, "Then 30 compressions : 2 breaths.", "5–6 cm deep, 100–120 a minute"],
            [t_rosc, "A cough. A pulse.", "what would have saved you: flip onto your back, float, follow the current"],
        ],
        "callouts": [
            [0, t_tired, None, [0, 45, 0.3], f"rip current {rip_speed} m/s"],
            [2, t_tired, "you", [0, 0, 1.6], f"v_net = {swim_speed - rip_speed:+.1f} m/s"],
            [t_tired + 2, t_sub, "you", [0, 0, 1.62], "can't shout, can't wave"],
            [t_gasp - 1, t_gasp + 12, "you", [0, 0, 1.55], "water in the airway"],
            [t_bottom, t_grab, "you", [0, 0, 1.2], f"{depth:.1f} m down"],
            [t_alert, t_arrive, "lifeguard", [0, 0, 1.75], "lifeguard"],
            [t_beach, t_rosc + 10, "lifeguard", [0, 0, 1.5], "rescue breaths, then CPR"],
        ],
        "graphs": [
            {"title": "distance from the beach (m)",
             "lines": [["y_you", "you", "accent"], ["y_lifeguard", "lifeguard", "ink"]]},
            {"title": "blood oxygen SpO₂ (%)", "lines": [["spo2", "you", "accent"]],
             "refs": [[90, "hypoxia"], [60, "unconscious"]]},
        ],
        "eqs": [f"v_net = v_swim − v_rip = {swim_speed - rip_speed:+.1f} m/s",
                f"F_b = (ρV − m)g = {F_rest:+.0f} N   head out: {F_head_out:+.0f} N",
                f"v_sink = √(2|F| / ρC_dA) = {v_sink:.2f} m/s"],
    }
    story["captions"].sort(key=lambda c: c[0])
    return {
        "story": story,
        "id": "drowning", "title": "Drowning in a rip current",
        "inputs": dict(rip_speed_ms=rip_speed, swim_speed_ms=swim_speed, rip_width_m=2 * rip_half_width,
                       start_offshore_m=start_offshore, hard_swim_endurance_s=endurance_s,
                       water_temp_c=water_temp_c, mass_kg=mass),
        "results": [
            ("Your net speed swimming for the beach", swim_speed - rip_speed, "m/s",
             "v_net = v_swim − v_rip. Negative: the rip wins"),
            ("Metabolic power to swim at 1 m/s", p_swim, "W", "P = ½ρC_dAv³ / efficiency (~8%)"),
            ("Time until your arms give out", t_tired, "s", f"{endurance_s} s of hard swimming for an untrained adult"),
            ("Buoyancy with lungs at rest", F_rest, "N", "(ρ_water·V − m)·g. Positive: you float"),
            ("Buoyancy with your whole head out", F_head_out, "N", "the head's 4.5 L no longer helps: negative, you sink"),
            ("Buoyancy floating on your back, face out", F_face_out, "N", "only a third of the head out: still positive"),
            ("Buoyancy after breathing out and inhaling water", F_sink, "N", "residual lungs, ~1 L of water: you sink"),
            ("Sinking speed", v_sink, "m/s", "terminal velocity: v = √(2|F| / ρC_dA)"),
            ("Time under water before rescue", submerged, "s", "brain injury starts after 4–6 min in warm water"),
            ("Unconscious after", t_uncon - t_sub, "s", "SpO₂ below 60% (Severinghaus curve from falling PaO₂)"),
            ("If you fight the rip", 0, "", outcome("fight")),
            ("If you swim parallel to the beach", 0, "", outcome("parallel")),
            ("If you float and wave", 0, "", outcome("float")),
        ],
        "tables": {"Hypoxia timeline after going under": {
            "columns": ["Time", "What happens in the body"],
            "rows": [["0–60 s", "Breath-hold. CO₂ rises, panic"],
                     ["20–60 s", "Involuntary gasp: water enters the airway. Laryngospasm"],
                     ["~1–2 min", "Unconscious. SpO₂ < 60%"],
                     ["3–4 min", "Slow heart, then cardiac arrest (PEA/asystole)"],
                     ["4–6 min", "Irreversible brain injury begins (warm water)"],
                     ["> 30 min", "Survival rare, except in ice-cold water (hypothermia protects the brain)"]]}},
        "anim": {"fps": FPS, "duration": duration,
                 "actors": {"you": rows_you, "lifeguard": rows_lg},
                 "joints": {"you": joint_rows(joints_you), "lifeguard": joint_rows(joints_lifeguard)},
                 "seabed": seabed, "tower": list(tower),
                 "rip": {"half_width": rip_half_width, "length": rip_length}},
    }


# ---------------------------------------------------------------------------
# 3. Fall from height
# ---------------------------------------------------------------------------
def fall(height=6.0, mass=70):
    v = math.sqrt(2 * G * height)
    t_fall = math.sqrt(2 * height / G)
    surfaces = [  # (name, stopping distance m)
        ("Concrete, stiff legs", 0.02),
        ("Concrete, bent knees + roll", 0.30),
        ("Grass / soil", 0.10),
        ("Car roof", 0.25),
        ("Foam pit", 1.0),
    ]
    rows = []
    for name, d in surfaces:
        a = v ** 2 / (2 * d)
        rows.append([name, d, round(a / G), round(mass * a / 1000, 1),
                     "fatal/critical" if a / G > 150 else "serious" if a / G > 50 else "survivable"])
    heights = []
    for h in [2, 3, 6, 10, 15, 20, 30]:
        vh = math.sqrt(2 * G * h)
        heights.append([h, round(h / 3), round(vh, 1), round(vh * 3.6),
                        round(vh ** 2 / (2 * 0.02) / G)])

    duration = t_fall + 2.0
    roof = height

    def victim(t):
        if t < 0.5:
            return (0, 0, roof, 0, 0, 0)          # standing on the edge
        tt = t - 0.5
        x = 0.6 + 0.4 * min(tt, t_fall)
        if tt < t_fall:                          # feet-first, slight forward lean
            z = roof - 0.5 * G * tt ** 2
            return (x, 0, max(0, z), 0, 0.1 * tt, 0)
        k = min(1.0, (tt - t_fall) / 0.4)        # legs buckle, body collapses
        return (x, 0, BODY_HALF_THICKNESS * k, 0, 0.1 * t_fall + (math.pi / 2 - 0.1 * t_fall) * k, 0)

    t_imp = 0.5 + t_fall
    a_stiff = v ** 2 / (2 * 0.02) / G
    a_bent = v ** 2 / (2 * 0.30) / G
    dt_stiff = 2 * 0.02 / v

    def z_of(t):
        return victim(t)[2]

    def speed(t):
        if t < 0.5:
            return 0.0
        return G * min(t - 0.5, t_fall) * 3.6 if t < t_imp else 0.0

    story = {
        "slowmo": [[t_imp - 0.06, t_imp + 0.04, 1 / 20], [t_imp + 0.04, t_imp + 0.45, 1 / 3]],
        "series": {
            "z": series(z_of, duration),
            "v": series(speed, duration, breaks=[t_imp]),
            "a": series(lambda t: pulse(t, t_imp, dt_stiff, a_stiff), duration,
                        dt=1 / 240, breaks=[t_imp, t_imp + dt_stiff]),
        },
        "hud": [{"sym": "a", "series": "a", "unit": "g", "fmt": "{:.0f}", "note": "deceleration of the body"},
                {"sym": "v", "series": "v", "unit": "km/h", "fmt": "{:.0f}"}],
        "captions": [
            [0, f"{height:.0f} metres up.", "about a second-floor window  ·  real physics, every frame"],
            [0.5, f"{t_fall:.2f} s of falling.", "v = √(2gh), air drag is negligible this low"],
            [t_imp, f"{v * 3.6:.0f} km/h into concrete.", f"stopped in 2 cm  ·  {a_stiff:.0f} g for {dt_stiff * 1000:.1f} ms"],
            [t_imp + 0.4, "Bend, land, roll.", f"30 cm of stopping distance instead: {a_bent:.0f} g"],
        ],
        "callouts": [
            [0, 0.5, "victim", [0, 0, 1.64], f"h = {height:.1f} m"],
            [t_imp, t_imp + 0.6, "victim", [0, 0, 0.05], "calcaneus: the heel shatters"],
            [t_imp + 0.01, t_imp + 0.7, "victim", [0, 0, 1.05], "axial load: L1 burst fracture"],
        ],
        "graphs": [
            {"title": "speed (km/h)", "lines": [["v", "falling", "accent"]]},
            {"title": "deceleration (g)", "lines": [["a", "stiff legs", "accent"]],
             "refs": [[a_bent, "knees bent"]]},
        ],
        "eqs": [f"v = √(2gh) = {v:.1f} m/s = {v * 3.6:.0f} km/h",
                f"a = v²/2d = {a_stiff:.0f} g  (d = 2 cm)   vs  {a_bent:.0f} g  (d = 30 cm)",
                f"F = m·a = {mass * a_stiff * G / 1000:.0f} kN"],
    }

    return {
        "story": story,
        "id": "fall", "title": "Fall from height",
        "inputs": dict(height_m=height, mass_kg=mass),
        "results": [
            ("Impact speed", v, "m/s", "v = √(2gh). Air drag is negligible below ~20 m"),
            ("Impact speed", v * 3.6, "km/h", "Same as being hit by a car at this speed"),
            ("Fall time", t_fall, "s", "t = √(2h/g)"),
            ("Energy at impact", mass * G * height / 1000, "kJ", "E = mgh"),
            ("Peak deceleration on concrete (2 cm)", v ** 2 / (2 * 0.02) / G, "g", "a = v²/(2d). Stopping distance is everything"),
            ("Peak deceleration with knees bent (30 cm)", v ** 2 / (2 * 0.30) / G, "g", "Bending and rolling spread the stop over 15× the distance"),
        ],
        "tables": {"Landing surface": {"columns": ["Surface", "Stop dist (m)", "Peak g", "Peak force (kN)", "Likely"],
                                        "rows": rows},
                   "Height": {"columns": ["Height (m)", "≈ Storeys", "Impact (m/s)", "Impact (km/h)", "g on concrete"],
                              "rows": heights}},
        "anim": {"fps": FPS, "duration": duration,
                 "actors": {"victim": sample(victim, duration, dense=story.get("slowmo", []))},
                 "building_height": height},
    }


# ---------------------------------------------------------------------------
# 4. Electrocution
# ---------------------------------------------------------------------------
def electrocution(voltage=120, condition="wet", contact_s=1.0):
    resist = {"dry": 100_000, "wet": 1_000, "broken skin": 500}
    r = resist[condition]
    i = voltage / r
    heat = i ** 2 * r * contact_s

    def effect(mA):
        if mA < 1: return "not felt"
        if mA < 5: return "tingle"
        if mA < 15: return "painful, can still let go"
        if mA < 50: return "can't let go (muscle tetany)"
        if mA < 100: return "breathing stops"
        if mA < 2000: return "ventricular fibrillation (VF)"
        return "cardiac standstill + deep burns"

    rows = []
    for V in [12, 120, 240, 480, 7200]:
        for cond in ["dry", "wet"]:
            R = resist[cond] if V < 500 else 500     # skin breaks down at high V
            I = V / R * 1000
            rows.append([V, cond, R, round(I, 1), effect(I)])

    duration = 6.0

    def victim(t):
        if t < 2.0:
            return (-1.5 + 0.6 * t, 0, 0, 0, 0, 0)
        if t < 4.5:   # tetanic shaking, locked on
            j = 0.03 * math.sin(t * 90)
            return (-0.3 + j, j, 0, j, 0, 0)
        tt = min(1.0, (t - 4.5) / 0.4)
        return (-0.3 - 0.6 * tt, 0, BODY_HALF_THICKNESS * tt, 0, -math.pi / 2 * tt, 0)

    on, off = 2.0, 4.5
    i_ma = i * 1000
    story = {
        "slowmo": [[1.9, 2.3, 1 / 4]],
        "series": {
            "I": series(lambda t: i_ma if on <= t < off else 0.0, duration, breaks=[on, off]),
            "Q": series(lambda t: i ** 2 * r * min(max(0.0, t - on), off - on), duration, breaks=[on, off]),
        },
        "hud": [{"sym": "I", "series": "I", "unit": "mA", "fmt": "{:.0f}", "note": "current through the chest"},
                {"sym": "Q", "series": "Q", "unit": "J", "fmt": "{:.1f}"}],
        "captions": [
            [0, "A downed line. Wet ground.", f"{voltage} V  ·  {condition} skin is about {r:,} Ω"],
            [on, f"{i_ma:.0f} mA through the chest.", "Ohm's law: I = V / R"],
            [on + 0.4, "The grip locks.", "AC above ~15 mA clamps the flexor muscles: can't let go"],
            [on + 1.0, "Ventricular fibrillation.", "100 mA+ across the heart: it quivers, no pulse"],
            [off, "Collapse.", "don't touch them: cut the power, then CPR and an AED"],
        ],
        "callouts": [
            [on, off, "victim", [0, 0.27, 0.83], "entry wound"],
            [on + 0.2, off, "victim", [0, -0.1, 0.03], "exit wound"],
            [on + 1.0, off + 1.0, "victim", [0, 0, 1.3], "heart in the current path"],
        ],
        "graphs": [
            {"title": "current (mA)", "lines": [["I", "body", "accent"]],
             "refs": [[15, "let-go limit"], [100, "VF"]]},
            {"title": "heat deposited (J)", "lines": [["Q", "Q = I²Rt", "accent"]]},
        ],
        "eqs": [f"I = V/R = {voltage} / {r:,} = {i_ma:.0f} mA",
                f"Q = I²Rt = {i ** 2 * r:.1f} J per second of contact",
                "GFCI trips at 5 mA in < 40 ms: before VF"],
    }

    return {
        "story": story,
        "id": "electrocution", "title": "Electrocution",
        "inputs": dict(voltage_V=voltage, skin=condition, contact_time_s=contact_s),
        "results": [
            ("Body resistance (hand to hand)", r, "Ω", "Skin is most of it. Water lowers it 100×"),
            ("Current through body", i * 1000, "mA", "Ohm's law: I = V/R"),
            ("Effect", 0, "", effect(i * 1000)),
            ("Heat deposited", heat, "J", "Q = I²Rt (Joule heating, most of it at the entry/exit points)"),
            ("Heart in the current path?", 0, "", "Hand to hand or hand to foot both cross the chest. That is why it kills"),
        ],
        "tables": {"Voltage × skin": {"columns": ["Volts", "Skin", "R (Ω)", "Current (mA)", "Effect"],
                                       "rows": rows}},
        "anim": {"fps": FPS, "duration": duration, "actors": {"victim": sample(victim, duration, dense=story.get("slowmo", []))},
                 "shock_window": [2.0, 4.5]},
    }


# ---------------------------------------------------------------------------
# 5. Burns in a house fire
# ---------------------------------------------------------------------------
def burns(mass=70, burned=("front_torso", "right_arm", "left_arm"), heat_flux_kw=20):
    rule_of_nines = {"head": 9, "right_arm": 9, "left_arm": 9, "front_torso": 18,
                     "back_torso": 18, "right_leg": 18, "left_leg": 18, "groin": 1}
    tbsa = sum(rule_of_nines[b] for b in burned)
    parkland = 4 * mass * tbsa                       # mL over 24 h

    # Skin as a semi-infinite solid: ΔT_surface = 2q √(t / (π k ρ c))
    k, rho_c = 0.37, 1000 * 3600
    def t_to_burn(q_kw, dT=27):                      # 33 °C -> 60 °C = instant cell death
        q = q_kw * 1000
        return math.pi * k * rho_c * (dT / (2 * q)) ** 2

    rows = [[q, label, round(t_to_burn(q), 1)] for q, label in
            [(1, "Midday sun"), (2.5, "Pain limit for firefighters"),
             (10, "Near a burning sofa"), (20, "Flashover threshold"),
             (80, "Inside a flashed-over room")]]

    duration = 7.0

    def victim(t):
        if t < 3.0:                                   # runs (worst idea: fans flames)
            return (-3 + 1.8 * t, 0, 0, 0, 0, 0)
        if t < 3.6:                                   # stop + drop
            k = (t - 3.0) / 0.6
            return (2.4, 0, BODY_HALF_THICKNESS * k, math.pi / 2 * k, 0, 0)
        tt = t - 3.6                                  # roll side to side about the long axis
        dx = 0.6 * math.sin(tt * 2)
        return (2.4 + dx, 0, BODY_HALF_THICKNESS, math.pi / 2, dx / 0.15, 0)  # no-slip: angle = x / r

    t_out = 4.4                                       # flames smothered by the roll

    def flux(t):
        if t < 3.6:
            return heat_flux_kw
        return max(0.0, heat_flux_kw * (t_out - t) / (t_out - 3.6))

    def t_skin(t):
        q = heat_flux_kw * 1000
        hot = lambda tt: 33 + 2 * q * math.sqrt(tt / (math.pi * k * rho_c))
        if t < 3.6:
            return hot(t)
        return 37 + (hot(3.6) - 37) * math.exp(-(t - 3.6) / 6)   # cools once the fire is out

    t_burn = t_to_burn(heat_flux_kw)
    story = {
        "series": {"q": series(flux, duration), "T": series(t_skin, duration)},
        "hud": [{"sym": "q", "series": "q", "unit": "kW/m²", "fmt": "{:.0f}", "note": "heat flux on the skin"},
                {"sym": "T_skin", "series": "T", "unit": "°C", "fmt": "{:.0f}"}],
        "captions": [
            [0, "Clothes on fire.", f"{heat_flux_kw} kW/m² on the skin  ·  real physics, every frame"],
            [t_burn, "Skin reaches 60 °C.", f"after {t_burn:.1f} s: cells die on contact"],
            [2.3, "Running fans the flames.", "more air, more fire"],
            [3.0, "Stop. Drop.", "get low, cover the face with the hands"],
            [3.6, "Roll.", "smother the flames against the floor"],
            [5.0, f"{tbsa}% of the body burned.", f"Parkland: {parkland / 1000:.1f} L of fluid in the first 24 h"],
        ],
        "callouts": [
            [0.6, 3.0, "victim", [0, 0, 1.25], "front torso: 18%"],
            [1.2, 3.0, "victim", [0, 0.27, 1.1], "each arm: 9%"],
            [5.0, 7.0, "victim", [0, 0, 1.2], f"{tbsa}% TBSA  ·  burn centre"],
        ],
        "graphs": [
            {"title": "skin surface temperature (°C)", "lines": [["T", "skin", "accent"]],
             "refs": [[44, "pain"], [60, "cell death"]]},
            {"title": "heat flux (kW/m²)", "lines": [["q", "flames", "accent"]]},
        ],
        "eqs": ["ΔT = 2q·√(t / πkρc)   (skin as a semi-infinite solid)",
                f"60 °C after t = πkρc·(ΔT/2q)² = {t_burn:.1f} s",
                f"Parkland = 4 mL × {mass} kg × {tbsa}% = {parkland / 1000:.1f} L"],
    }

    return {
        "story": story,
        "id": "burns", "title": "Burns in a house fire",
        "inputs": dict(mass_kg=mass, burned_areas=list(burned), heat_flux_kW_m2=heat_flux_kw),
        "results": [
            ("Total body surface area burned", tbsa, "%", "Rule of nines (adult)"),
            ("Parkland fluid, 24 h", parkland, "mL", "4 mL × kg × %TBSA of Ringer's lactate"),
            ("Of which in first 8 h", parkland / 2, "mL", "Half of it, timed from the burn, not from arrival"),
            ("Time to full-thickness skin damage", t_to_burn(heat_flux_kw), "s",
             f"Semi-infinite solid conduction at {heat_flux_kw} kW/m²"),
            ("Smoke at head height", 0, "", "CO and cyanide kill more fire victims than flames. Crawl low"),
        ],
        "tables": {"Radiant heat": {"columns": ["kW/m²", "Source", "Seconds to burn"], "rows": rows}},
        "anim": {"fps": FPS, "duration": duration, "actors": {"victim": sample(victim, duration, dense=story.get("slowmo", []))},
                 "burned_parts": list(burned)},
    }


ALL = [pedestrian, drowning, fall, electrocution, burns]
