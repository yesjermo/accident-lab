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
def drowning(rip_speed=1.5, swim_speed=1.0, rip_half_width=15, rip_length=90,
             start_offshore=40, endurance_s=150, water_temp_c=15):
    """Top-down 2D sim. x = along the beach, y = distance offshore (+ out to sea)."""

    def current(x, y):
        if abs(x) < rip_half_width and y < rip_length:
            # strongest in the middle, fades towards the edges and the rip head
            fx = 1 - (x / rip_half_width) ** 2
            fy = 1 if y < rip_length * 0.7 else (rip_length - y) / (rip_length * 0.3)
            return 0, rip_speed * fx * fy
        return 0, 0

    def simulate(strategy, t_max=240, dt=1 / FPS):
        x, y, t, energy = 0.0, float(start_offshore), 0.0, endurance_s
        path, sank_at, safe_at = [], None, None
        while t <= t_max:
            path.append((t, x, y, energy))
            if y <= 0:
                safe_at = safe_at or t
                y = 0
            elif energy <= 0:
                sank_at = sank_at or t
            if safe_at is None and sank_at is None:
                cx, cy = current(x, y)
                if strategy == "fight":            # swim straight at the beach
                    sx, sy, effort = 0, -swim_speed, 1.0
                elif strategy == "parallel":       # swim parallel until free, then in
                    in_rip = abs(x) < rip_half_width + 2 and y < rip_length
                    sx, sy = (swim_speed, 0) if in_rip else (0, -swim_speed)
                    effort = 1.0
                else:                              # float and wave
                    sx, sy, effort = 0, 0, 0.15
                x += (sx + cx) * dt
                y += (sy + cy) * dt
                energy -= effort * dt
            t += dt
        return path, sank_at, safe_at

    runs = {k: simulate(k) for k in ("fight", "parallel", "float")}

    # Drag power while swimming: P = ½ ρ Cd A v³
    rho, CdA = 1025, 0.35 * 0.12
    p_swim = 0.5 * rho * CdA * swim_speed ** 3 / 0.08   # ~8% mechanical efficiency
    net_fight = swim_speed - rip_speed

    # Buoyancy: body density with full vs empty lungs
    vol_body = 0.0703                                    # m^3 for 70 kg
    dens_full = 70 / (vol_body + 0.003)                  # +3 L inhaled air
    dens_empty = 70 / (vol_body - 0.0015)                # forced exhale: −1.5 L
    buoy_full = (rho - dens_full) * (vol_body + 0.003) * G

    # Cold shock / survival rough guide (US Coast Guard style curve)
    exhaustion_h = max(0.25, 0.0785 * math.exp(0.1786 * water_temp_c))

    def track(name):
        path, sank, _ = runs[name]
        rows = []
        for (t, x, y, e) in path:
            z = 0.0
            if sank is not None and t > sank:
                z = -min(4.0, (t - sank) * 0.5)
            rows.append([round(t, 3), round(x, 3), round(y, 3), round(z, 3), 0, 0, 0])
        return rows

    def outcome(name):
        _, sank, safe = runs[name]
        if safe is not None:
            return f"reaches the beach at t = {safe:.0f} s"
        if sank is not None:
            return f"exhausted at t = {sank:.0f} s, then submerges"
        return "still afloat at 240 s, waving for rescue"

    duration = 240

    def path_series(name, col, every=12, scale=1.0):
        path = runs[name][0]
        return [[round(p[0], 3), round(max(0, p[col]) * scale, 3)] for p in path[::every]]

    red = runs["fight"][0]
    v_red = [[round(red[i][0], 3), round((red[i][2] - red[i - 12][2]) / (red[i][0] - red[i - 12][0]), 3)]
             for i in range(12, len(red), 12)]
    sank, safe_green = runs["fight"][1], runs["parallel"][2]
    escape_t = (rip_half_width + 2) / swim_speed
    story = {
        "speed": 8,                                   # 8x real time, no slow-motion
        "series": {
            "y_fight": path_series("fight", 2), "y_parallel": path_series("parallel", 2),
            "y_float": path_series("float", 2), "v_red": v_red,
            "e_fight": path_series("fight", 3), "e_parallel": path_series("parallel", 3),
        },
        "hud": [{"sym": "v_net", "series": "v_red", "unit": "m/s", "fmt": "{:+.2f}",
                 "note": "red swimmer, + means out to sea"},
                {"sym": "d_red", "series": "y_fight", "unit": "m", "fmt": "{:.0f}"}],
        "captions": [
            [0, "Caught in a rip.", f"{rip_speed} m/s current  ·  the swimmer manages {swim_speed} m/s"],
            [8, "Red swims for the beach.", f"v_net = {swim_speed} − {rip_speed} = {net_fight:+.1f} m/s: going backwards"],
            [escape_t, "Green swims sideways.", f"out of the rip in {escape_t:.0f} s, then turns for shore"],
            [safe_green or 80, "Green is on the beach.", f"t = {safe_green or 0:.0f} s"],
            [sank or 150, "Red is exhausted.", f"{sank or 0:.0f} s fighting a current that couldn't be beaten"],
            [(sank or 150) + 25, "Yellow is still floating.", "flip · float · follow  ·  wave for help"],
        ],
        "callouts": [
            [0, 240, None, [0, rip_length * 0.55, 0], f"rip current {rip_speed} m/s"],
            [0, 70, "swimmer_fight", [0, 0, 0], "fights the rip"],
            [0, 60, "swimmer_parallel", [0, 0, 0], "swims parallel"],
            [0, 240, "swimmer_float", [0, 0, 0], "floats"],
        ],
        "graphs": [
            {"title": "distance offshore (m)",
             "lines": [["y_fight", "red", "accent"], ["y_parallel", "green", "green"], ["y_float", "yellow", "amber"]]},
            {"title": "energy left (s of hard swimming)",
             "lines": [["e_fight", "red", "accent"], ["e_parallel", "green", "green"]]},
        ],
        "eqs": [f"v_net = v_swim − v_rip = {net_fight:+.1f} m/s",
                f"P = ½ρC_dAv³ / η = {p_swim:.0f} W",
                f"escape: {rip_half_width + 2} m ÷ {swim_speed} m/s = {escape_t:.0f} s"],
    }
    return {
        "story": story,
        "id": "drowning", "title": "Drowning in a rip current",
        "inputs": dict(rip_speed_ms=rip_speed, swim_speed_ms=swim_speed,
                       rip_width_m=2 * rip_half_width, start_offshore_m=start_offshore,
                       hard_swim_endurance_s=endurance_s, water_temp_c=water_temp_c),
        "results": [
            ("Net speed swimming straight at the beach", net_fight, "m/s",
             "v_net = v_swim − v_rip. A negative number means you go backwards"),
            ("Metabolic power to swim at 1 m/s", p_swim, "W", "P = ½ρCdAv³ / efficiency (~8%)"),
            ("Time to escape sideways", (rip_half_width + 2) / swim_speed, "s", "Rip width / 2 ÷ swim speed"),
            ("Buoyant force with full lungs", buoy_full, "N", "(ρ_water − ρ_body)·V·g. Positive means you float"),
            ("Body density with full lungs", dens_full, "kg/m³", "Sea water is 1025. Below that you float"),
            ("Body density after exhaling", dens_empty, "kg/m³", "Closer to water: panic and lost air make you sink"),
            ("Strategy A (fight)", 0, "", outcome("fight")),
            ("Strategy B (swim parallel)", 0, "", outcome("parallel")),
            ("Strategy C (float)", 0, "", outcome("float")),
            ("Expected survival time in water", exhaustion_h, "h", f"Rough cold-water curve at {water_temp_c} °C"),
        ],
        "tables": {"Hypoxia timeline after going under": {
            "columns": ["Time", "What happens in the body"],
            "rows": [["0–60 s", "Breath-hold. CO₂ rises. Panic"],
                     ["60–90 s", "Involuntary gasp: water enters the airway. Laryngospasm"],
                     ["~2 min", "Unconscious. SpO₂ < 60%"],
                     ["3–4 min", "Bradycardia, then cardiac arrest (PEA/asystole)"],
                     ["4–6 min", "Irreversible brain injury begins (warm water)"],
                     ["> 30 min", "Survival rare, except in ice-cold water (hypothermia protects the brain)"]]}},
        "anim": {"fps": FPS, "duration": duration, "time_scale": 8,
                 "actors": {"swimmer_fight": track("fight"),
                            "swimmer_parallel": track("parallel"),
                            "swimmer_float": track("float")},
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
