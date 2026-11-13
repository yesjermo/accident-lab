"""
Accident Lab - Blender scene builder in a technical-illustration style:
white clay models, ink outlines (Freestyle), one crimson accent, vertical 9:16
video with a live physics HUD, serif captions, callouts and graphs.

Everything on screen comes from out/scenarios.json (run `python3 lab/build.py`).

  blender --python blender/render_scenario.py -- pedestrian            # open and explore
  blender -b --python blender/render_scenario.py -- all --render       # MP4s into out/
  blender -b --python blender/render_scenario.py -- fall --still 60    # one PNG frame
  blender -b --python blender/render_scenario.py -- all --glb          # web/models/*.glb for the viewer
  blender -b --python blender/render_scenario.py -- drowning --render --from 790   # redo the end, keep 1-789

Scenario ids: pedestrian, drowning, fall, electrocution, burns, all
"""

import json
import math
import os
import shutil
import sys

import bpy
from mathutils import Euler, Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
_VALUED = {"--still", "--frames", "--from"}                                 # flags that take the next argument
SID = next((a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or argv[i - 1] not in _VALUED)),
           "pedestrian")
RENDER = "--render" in argv
MAX_FRAMES = int(argv[argv.index("--frames") + 1]) if "--frames" in argv else None
STILL = [int(f) for f in argv[argv.index("--still") + 1].split(",")] if "--still" in argv else None   # one or a,b,c
GLB = "--glb" in argv
FROM = int(argv[argv.index("--from") + 1]) if "--from" in argv else 1   # re-render frames FROM..end only

with open(os.path.join(ROOT, "out", "scenarios.json")) as f:
    DATA = {s["id"]: s for s in json.load(f)}

FPS = 24
RES = (720, 1280)
WHEEL_R = 0.38                      # tyre radius (m)
HUD_DEPTH = 0.3                 # HUD plane distance in front of the camera (m)
FONT_DIR = "/System/Library/Fonts/Supplemental"


# --------------------------------------------------------------------------- colour
def lin(c):
    """sRGB 0-255 tuple -> linear RGBA for Blender sockets."""
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (ch(c[0]), ch(c[1]), ch(c[2]), 1.0)


PAPER = (246, 245, 242)
CLAY = (236, 235, 232)
CLAY_DARK = (205, 205, 203)
ROAD = (226, 226, 224)
INK = (28, 28, 34)
MUTED = (120, 120, 128)
ACCENT = (176, 22, 48)
GREEN = (30, 120, 70)
AMBER = (214, 140, 20)
GLASS = (214, 220, 226)
SEA = (206, 224, 232)
RIP = (170, 198, 212)
SAND = (240, 232, 214)
NAMED = {"accent": ACCENT, "ink": INK, "green": GREEN, "amber": AMBER, "muted": MUTED}


# --------------------------------------------------------------------------- basics
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    world = bpy.data.collections.new("World")
    hud = bpy.data.collections.new("HUD")
    sc.collection.children.link(world)
    sc.collection.children.link(hud)
    bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection.children["World"]
    return world, hud


_mats = {}


def clay(rgb=CLAY, rough=0.85):
    key = ("clay", rgb, rough)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(f"clay_{rgb}")
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = lin(rgb)
    p.inputs["Roughness"].default_value = rough
    _mats[key] = m
    return m


def flat(rgb, alpha=1.0):
    """Unlit colour (for HUD, flames, sparks). Optional alpha for plates."""
    key = ("flat", rgb, alpha)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(f"flat_{rgb}_{alpha}")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = lin(rgb)
    if alpha < 1:
        tr = nt.nodes.new("ShaderNodeBsdfTransparent")
        mix = nt.nodes.new("ShaderNodeMixShader")
        mix.inputs["Fac"].default_value = alpha
        nt.links.new(tr.outputs[0], mix.inputs[1])
        nt.links.new(em.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], out.inputs["Surface"])
        for attr, val in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
            if hasattr(m, attr):
                setattr(m, attr, val)
    else:
        nt.links.new(em.outputs[0], out.inputs["Surface"])
    _mats[key] = m
    return m


def prim(kind, name, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0), mat=None, parent=None,
         bevel=0.0, smooth=False, **kw):
    getattr(bpy.ops.mesh, f"primitive_{kind}_add")(location=loc, rotation=rot, **kw)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if mat:
        o.data.materials.append(mat)
    if parent:
        o.parent = parent
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL")
        b.width = bevel
        b.segments = 3
        b.limit_method = "ANGLE"
    if smooth:
        for poly in o.data.polygons:
            poly.use_smooth = True
    return o


def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    bpy.context.view_layer.active_layer_collection.collection.objects.link(o)
    if parent:
        o.parent = parent
    return o


def mesh_from(name, verts, faces, mat, parent=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.view_layer.active_layer_collection.collection.objects.link(o)
    me.materials.append(mat)
    if parent:
        o.parent = parent
    return o


def extrude_profile(name, pts, width, mat, parent=None, bevel=0.05):
    """Side profile (x, z) polygon extruded across y = ±width/2."""
    n = len(pts)
    h = width / 2
    verts = [(x, -h, z) for x, z in pts] + [(x, h, z) for x, z in pts]
    faces = [list(range(n))[::-1], list(range(n, 2 * n))]
    faces += [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    o = mesh_from(name, verts, faces, mat, parent)
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL")
        b.width = bevel
        b.segments = 4
    return o


# --------------------------------------------------------------------------- models
def dummy(name, accent_parts=(), cap=True):
    """Jointed crash-test dummy. Origin between the feet; head centre at z = 1.64."""
    root = empty(name)
    body = clay(CLAY)
    joint = clay(CLAY_DARK)
    hot = clay(ACCENT, rough=0.7)

    def m(part):
        return hot if part in accent_parts else body

    prim("uv_sphere", f"{name}_head", (0, 0, 1.64), (0.1, 0.095, 0.12), mat=m("head"), parent=root,
         smooth=True, segments=32, ring_count=16)
    if cap and "head" not in accent_parts:
        prim("uv_sphere", f"{name}_cap", (0.0, 0, 1.69), (0.106, 0.1, 0.085), mat=hot, parent=root,
             smooth=True, segments=32, ring_count=16)
    prim("cylinder", f"{name}_neck", (0, 0, 1.49), (0.04, 0.04, 0.05), mat=joint, parent=root, vertices=20)
    prim("cube", f"{name}_chest", (0, 0, 1.25), (0.11, 0.17, 0.2), mat=m("front_torso"), parent=root, bevel=0.06)
    prim("cube", f"{name}_pelvis", (0, 0, 0.93), (0.1, 0.15, 0.09), mat=m("pelvis"), parent=root, bevel=0.04)
    for side, sy in (("L", 1), ("R", -1)):
        arm = "left_arm" if side == "L" else "right_arm"
        leg = "left_leg" if side == "L" else "right_leg"
        prim("uv_sphere", f"{name}_shoulder{side}", (0, 0.205 * sy, 1.4), (0.055,) * 3, mat=joint, parent=root, smooth=True)
        prim("cylinder", f"{name}_uarm{side}", (0, 0.235 * sy, 1.25), (0.042, 0.042, 0.13), rot=(0.12 * sy, 0, 0),
             mat=m(arm), parent=root, vertices=20, bevel=0.015)
        prim("uv_sphere", f"{name}_elbow{side}", (0, 0.25 * sy, 1.1), (0.042,) * 3, mat=joint, parent=root, smooth=True)
        prim("cylinder", f"{name}_farm{side}", (0, 0.265 * sy, 0.97), (0.036, 0.036, 0.12), mat=m(arm), parent=root,
             vertices=20, bevel=0.012)
        prim("uv_sphere", f"{name}_hand{side}", (0, 0.27 * sy, 0.83), (0.04, 0.03, 0.05), mat=body, parent=root, smooth=True)
        prim("cylinder", f"{name}_thigh{side}", (0, 0.09 * sy, 0.72), (0.065, 0.065, 0.19), mat=m(leg), parent=root,
             vertices=20, bevel=0.02)
        prim("uv_sphere", f"{name}_knee{side}", (0, 0.09 * sy, 0.5), (0.055,) * 3, mat=joint, parent=root, smooth=True)
        prim("cylinder", f"{name}_shin{side}", (0, 0.09 * sy, 0.28), (0.05, 0.05, 0.2), mat=m(leg), parent=root,
             vertices=20, bevel=0.02)
        prim("cube", f"{name}_foot{side}", (0.05, 0.09 * sy, 0.035), (0.12, 0.05, 0.035), mat=body, parent=root, bevel=0.02)
    return root


def rig(name, cap_rgb=ACCENT, tube=False):
    """Crash dummy with joints (neck, shoulders, hips) for the stories with people who move.
    The body sits inside the actor turned 90° (it faces the actor's +y) so face-down and
    face-up poses stay clear of Euler gimbal lock; physics.pose_from_axes assumes the same."""
    root = empty(name)
    b = empty(f"{name}_body", parent=root)
    b.rotation_euler = (0, 0, math.pi / 2)
    body, joint, cap = clay(CLAY), clay(CLAY_DARK), clay(cap_rgb, rough=0.7)
    prim("cube", f"{name}_chest", (0, 0, 1.25), (0.11, 0.17, 0.2), mat=body, parent=b, bevel=0.06)
    prim("cube", f"{name}_pelvis", (0, 0, 0.93), (0.1, 0.15, 0.09), mat=body, parent=b, bevel=0.04)
    neck = empty(f"{name}_neck", (0, 0, 1.47), parent=b)
    prim("cylinder", f"{name}_neckbar", (0, 0, 0.02), (0.04, 0.04, 0.05), mat=joint, parent=neck, vertices=20)
    prim("uv_sphere", f"{name}_head", (0, 0, 0.17), (0.1, 0.095, 0.12), mat=body, parent=neck, smooth=True,
         segments=32, ring_count=16)
    prim("uv_sphere", f"{name}_cap", (0, 0, 0.22), (0.106, 0.1, 0.085), mat=cap, parent=neck, smooth=True,
         segments=32, ring_count=16)
    for side, sy in (("L", 1), ("R", -1)):
        sh = empty(f"{name}_shoulder_{side}", (0, 0.205 * sy, 1.4), parent=b)
        prim("uv_sphere", f"{name}_shoulderball{side}", (0, 0, 0), (0.055,) * 3, mat=joint, parent=sh, smooth=True)
        prim("cylinder", f"{name}_uarm{side}", (0, 0.03 * sy, -0.15), (0.042, 0.042, 0.13), rot=(0.12 * sy, 0, 0),
             mat=body, parent=sh, vertices=20, bevel=0.015)
        prim("uv_sphere", f"{name}_elbow{side}", (0, 0.045 * sy, -0.3), (0.042,) * 3, mat=joint, parent=sh, smooth=True)
        prim("cylinder", f"{name}_farm{side}", (0, 0.06 * sy, -0.43), (0.036, 0.036, 0.12), mat=body, parent=sh,
             vertices=20, bevel=0.012)
        prim("uv_sphere", f"{name}_hand{side}", (0, 0.065 * sy, -0.57), (0.04, 0.03, 0.05), mat=body, parent=sh, smooth=True)
        hip = empty(f"{name}_hip_{side}", (0, 0.09 * sy, 0.93), parent=b)
        prim("cylinder", f"{name}_thigh{side}", (0, 0, -0.21), (0.065, 0.065, 0.19), mat=body, parent=hip,
             vertices=20, bevel=0.02)
        prim("uv_sphere", f"{name}_knee{side}", (0, 0, -0.43), (0.055,) * 3, mat=joint, parent=hip, smooth=True)
        prim("cylinder", f"{name}_shin{side}", (0, 0, -0.65), (0.05, 0.05, 0.2), mat=body, parent=hip,
             vertices=20, bevel=0.02)
        prim("cube", f"{name}_foot{side}", (0.05, 0, -0.895), (0.12, 0.05, 0.035), mat=body, parent=hip, bevel=0.02)
    if tube:                                                     # rescue tube across the chest
        prim("cylinder", f"{name}_tube", (-0.16, 0, 1.15), (0.08, 0.08, 0.45), rot=(0.9, 0, 0),
             mat=clay(AMBER, rough=0.6), parent=b, vertices=20, bevel=0.03)
    return root


def animate_joints(person, joints, times):
    """Keyframe a rig's joint empties from physics rows [t, rx, ry, rz]."""
    for jname, rows in joints.items():
        o = bpy.data.objects.get(f"{person.name}_{jname}")
        if o is None:
            raise KeyError(f"physics gives joint '{jname}' but the rig '{person.name}' has no empty named {person.name}_{jname}")
        for f, t in enumerate(times, start=1):
            o.rotation_euler = interp(rows, t)
            o.keyframe_insert("rotation_euler", frame=f)


def water_profile_mesh(name, profile, x0, x1, mat):
    """A (y, z) section polygon extruded along x from x0 to x1 (the cut face is at x1)."""
    n = len(profile)
    verts = [(x0, y, z) for y, z in profile] + [(x1, y, z) for y, z in profile]
    faces = [list(range(n)), list(range(n, 2 * n))[::-1]]
    faces += [[i, n + i, n + (i + 1) % n, (i + 1) % n] for i in range(n)]
    return mesh_from(name, verts, faces, mat)


def car(name="car"):
    """White SUV. Origin at ground under the middle; front bumper at x = +2.2."""
    root = empty(name)
    paint = clay(CLAY, rough=0.35)
    glass = clay(GLASS, rough=0.1)
    dark = clay(CLAY_DARK, rough=0.5)
    tyre = clay((120, 120, 126), rough=0.9)
    body = [(2.2, 0.32), (2.24, 0.62), (2.1, 0.92), (1.0, 1.04), (0.25, 1.62), (-1.75, 1.66),
            (-2.18, 1.4), (-2.28, 0.95), (-2.28, 0.34), (-1.8, 0.3), (1.8, 0.3)]
    extrude_profile(f"{name}_body", body, 1.92, paint, root, bevel=0.07)
    side = [(0.95, 1.09), (0.3, 1.56), (-1.65, 1.6), (-2.05, 1.38), (-2.1, 1.09)]
    for sy in (0.963, -0.963):
        mesh_from(f"{name}_win", [(x, sy, z) for x, z in side], [list(range(len(side)))], glass, root)
        mesh_from(f"{name}_pillar", [(-0.55, sy * 1.001, 1.09), (-0.45, sy * 1.001, 1.09),
                                      (-0.45, sy * 1.001, 1.6), (-0.55, sy * 1.001, 1.6)], [[0, 1, 2, 3]], paint, root)
    ws = [(1.02, -0.86, 1.07), (1.02, 0.86, 1.07), (0.28, 0.8, 1.6), (0.28, -0.8, 1.6)]
    mesh_from(f"{name}_windscreen", [(x + 0.012, y, z + 0.008) for x, y, z in ws], [[0, 1, 2, 3]], glass, root)
    prim("cube", f"{name}_grille", (2.215, 0, 0.72), (0.03, 0.42, 0.14), mat=dark, parent=root, bevel=0.02)
    for i in range(-5, 6):
        prim("cube", f"{name}_slat", (2.25, i * 0.07, 0.72), (0.01, 0.008, 0.13), mat=paint, parent=root)
    for sy in (0.68, -0.68):
        prim("cube", f"{name}_lamp", (2.17, sy, 0.86), (0.04, 0.16, 0.04), mat=flat((255, 255, 255)), parent=root,
             bevel=0.015)
    for wx in (1.45, -1.45):
        for sy in (0.86, -0.86):
            # each wheel hangs on its own hub (an empty on the axle) so it can roll: angle = distance / radius
            hub = empty(f"{name}_wheel", (wx, sy, WHEEL_R), parent=root)
            prim("cylinder", f"{name}_tyre", (0, 0, 0), (WHEEL_R, WHEEL_R, 0.13), rot=(math.pi / 2, 0, 0),
                 mat=tyre, parent=hub, vertices=40, bevel=0.04)
            prim("cylinder", f"{name}_rim", (0, sy * 0.16, 0), (0.25, 0.25, 0.012), rot=(math.pi / 2, 0, 0),
                 mat=paint, parent=hub, vertices=40)
            for k in range(6):
                a = k * math.pi / 3
                prim("cube", f"{name}_spoke", (0.13 * math.cos(a), sy * 0.175, 0.13 * math.sin(a)),
                     (0.11, 0.01, 0.02), rot=(0, -a, 0), mat=dark, parent=hub)
    return root


def roll_wheels(car_obj, rows, times):
    """Keyframe each hub's spin from the distance the car has travelled (rolling without slip)."""
    hubs = [o for o in car_obj.children if o.name.startswith(f"{car_obj.name}_wheel")]
    x0 = interp(rows, 0)[0]
    for f, t in enumerate(times, start=1):
        angle = (interp(rows, t)[0] - x0) / WHEEL_R
        for h in hubs:
            h.rotation_euler = (0, angle, 0)
            h.keyframe_insert("rotation_euler", frame=f)


def building(name, x, y, w, d, h, windows=True, face=-1, side_windows=False):
    """Clay block with a window grid on the face pointing to y*face."""
    root = empty(name, (x, y, 0))
    prim("cube", f"{name}_block", (0, 0, h / 2), (w / 2, d / 2, h / 2), mat=clay(CLAY), parent=root)
    prim("cube", f"{name}_ledge", (0, 0, h + 0.1), (w / 2 + 0.1, d / 2 + 0.1, 0.1), mat=clay(CLAY), parent=root)
    if windows:
        cols = max(1, int(w / 2.2))
        for fl in range(int((h - 1) / 3)):
            for c in range(cols):
                wx = -w / 2 + (c + 0.5) * w / cols
                prim("cube", f"{name}_w", (wx, face * d / 2, 1.8 + fl * 3), (0.55, 0.05, 0.75),
                     mat=clay(GLASS, rough=0.2), parent=root)
            if side_windows:
                for c in range(max(1, int(d / 2.2))):
                    wy = -d / 2 + (c + 0.5) * d / max(1, int(d / 2.2))
                    prim("cube", f"{name}_sw", (w / 2, wy, 1.8 + fl * 3), (0.05, 0.55, 0.75),
                         mat=clay(GLASS, rough=0.2), parent=root)
    return root


def street(length=120, crossing=True):
    prim("plane", "road", (0, 0, 0), (length / 2, 4.5, 1), mat=clay(ROAD))
    for sy in (6.2, -6.2):
        prim("cube", f"kerb{sy}", (0, sy, 0.08), (length / 2, 1.7, 0.08), mat=clay(CLAY))
    paint = clay((252, 252, 250))
    for i in range(-int(length / 12), int(length / 12)):
        prim("plane", f"dash{i}", (i * 6 + 3, 0, 0.004), (1.4, 0.07, 1), mat=paint)
    if crossing:
        for i in range(8):
            prim("plane", f"zebra{i}", (0, -3.85 + i * 1.1, 0.005), (1.6, 0.3, 1), mat=paint)
    xs = -50
    while xs < 50:
        w = 7 + (abs(xs) * 7) % 5
        h = 9 + (abs(xs) * 13) % 10
        building(f"bld{xs}", xs + w / 2, 12, w - 0.4, 8, h, face=-1)
        xs += w
    for lx in range(-40, 41, 16):
        prim("cylinder", f"lamp{lx}", (lx, 7.2, 2.5), (0.06, 0.06, 2.5), mat=clay(CLAY), vertices=16)
        prim("cube", f"lamphead{lx}", (lx, 6.6, 5.0), (0.25, 0.6, 0.06), mat=clay(CLAY), bevel=0.03)


# --------------------------------------------------------------------------- render look
def look(sc, world_coll, sky=PAPER):
    engines = {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.fps = FPS
    sc.render.use_lock_interface = True                     # text changes in a frame handler
    sc.view_settings.view_transform = "Standard"
    try:
        sc.eevee.taa_render_samples = 24
    except AttributeError:
        pass
    w = bpy.data.worlds.new("World")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = lin(sky)
    w.node_tree.nodes["Background"].inputs[1].default_value = 1.0
    sc.world = w
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 2.2
    sun.angle = math.radians(8)
    s = bpy.data.objects.new("Sun", sun)
    s.rotation_euler = (math.radians(40), math.radians(10), math.radians(-35))
    world_coll.objects.link(s)
    # ink outlines on the 3D world only (not the HUD)
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = "ABSOLUTE"
    sc.render.line_thickness = 1.1
    vl = sc.view_layers[0]
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    fs.crease_angle = math.radians(140)
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("ink")
    ls.select_by_collection = True
    ls.collection = world_coll
    ls.select_by_visibility = True
    for attr in ("select_silhouette", "select_border", "select_crease", "select_external_contour"):
        setattr(ls, attr, True)
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new("ink")
    ls.linestyle.color = lin(INK)[:3]
    ls.linestyle.thickness = 1.3


# --------------------------------------------------------------------------- timeline
def build_timeline(story, duration):
    """Sim time for every output frame: slow-motion windows stretch it, a final hold pauses it."""
    base = story.get("speed", 1.0)
    slow = story.get("slowmo", [])

    def rate(t):
        for t0, t1, r in slow:
            if t0 <= t < t1:
                return r
        return base

    times, t = [], 0.0
    while t <= duration:
        times.append(t)
        t += rate(t) / FPS
    times += [duration] * int(1.5 * FPS)
    return times, rate


def interp(rows, t):
    """Linear interpolation in [[t, ...], ...] rows (sorted by t). Returns the values after t."""
    if t <= rows[0][0]:
        return rows[0][1:]
    if t >= rows[-1][0]:
        return rows[-1][1:]
    lo, hi = 0, len(rows) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if rows[mid][0] <= t:
            lo = mid
        else:
            hi = mid
    a, b = rows[lo], rows[hi]
    k = (t - a[0]) / ((b[0] - a[0]) or 1)
    return [a[j] + (b[j] - a[j]) * k for j in range(1, len(a))]


def pose_matrix(rows, t):
    x, y, z, rx, ry, rz = interp(rows, t)
    return Matrix.Translation((x, y, z)) @ Euler((rx, ry, rz), "XYZ").to_matrix().to_4x4()


def animate_actor(obj, rows, times):
    for f, t in enumerate(times, start=1):
        x, y, z, rx, ry, rz = interp(rows, t)
        obj.location = (x, y, z)
        obj.rotation_euler = (rx, ry, rz)
        obj.keyframe_insert("location", frame=f)
        obj.keyframe_insert("rotation_euler", frame=f)


def animate_camera(cam, times, target_fn, offset_fn, smooth=0.12, scale_fn=None, scale_smooth=0.08):
    """Keyframe a camera following target_fn(t). Returns the camera matrix for every frame.
    scale_fn(t), if given, multiplies the camera's distance from the target (smoothed): a pull-back."""
    mats, tgt, scale = [], None, None
    for f, t in enumerate(times, start=1):
        raw = Vector(target_fn(t))
        tgt = raw if tgt is None else tgt.lerp(raw, smooth)
        pos = Vector(offset_fn(tgt))
        if scale_fn:
            want = scale_fn(t)
            scale = want if scale is None else scale + (want - scale) * scale_smooth
            pos = tgt + (pos - tgt) * scale
        m = Matrix.Translation(pos) @ (tgt - pos).to_track_quat("-Z", "Y").to_matrix().to_4x4()
        cam.matrix_world = m
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
        mats.append(m.copy())
    return mats


# --------------------------------------------------------------------------- HUD
class Hud:
    """2D overlay parented to the camera. Units: u, v in [-1, 1] across the frame."""

    def __init__(self, cam, hud_coll):
        self.cam, self.coll = cam, hud_coll
        cam.data.sensor_fit = "VERTICAL"
        cam.data.sensor_height = 24
        self.hh = HUD_DEPTH * (12 / cam.data.lens)          # half height of the frame at HUD depth
        self.hw = self.hh * RES[0] / RES[1]
        self.fonts = {k: self._font(v) for k, v in
                      {"serif": "Georgia.ttf", "bold": "Georgia Bold.ttf", "italic": "Georgia Italic.ttf"}.items()}

    def _font(self, fn):
        p = os.path.join(FONT_DIR, fn)
        return bpy.data.fonts.load(p, check_existing=True) if os.path.exists(p) else None

    def pos(self, u, v, dz=0.0):
        return Vector((u * self.hw, v * self.hh, -HUD_DEPTH + dz))

    def _own(self, o):
        for c in list(o.users_collection):
            c.objects.unlink(o)
        self.coll.objects.link(o)
        o.parent = self.cam
        o.visible_shadow = False
        return o

    def text(self, body, u, v, size, color=INK, font="serif", align="CENTER", valign="CENTER"):
        cu = bpy.data.curves.new("hudtext", "FONT")
        cu.body = body
        cu.size = size * self.hh
        cu.align_x, cu.align_y = align, valign
        if self.fonts.get(font):
            cu.font = self.fonts[font]
        o = bpy.data.objects.new("hudtext", cu)
        self.coll.objects.link(o)
        cu.materials.append(flat(color))
        o.location = self.pos(u, v, 0.0002)
        return self._own(o)

    def rect(self, u0, v0, u1, v1, color=PAPER, alpha=1.0, dz=0.0):
        o = mesh_from("hudrect", [(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)], [[0, 1, 2, 3]], flat(color, alpha))
        o.location = self.pos(u0, v0, dz)
        o.scale = ((u1 - u0) * self.hw, (v1 - v0) * self.hh, 1)
        return self._own(o)

    def line(self, color=INK, width=0.004):
        """A unit segment along +x; place it with set_line()."""
        o = mesh_from("hudline", [(0, -0.5, 0), (1, -0.5, 0), (1, 0.5, 0), (0, 0.5, 0)], [[0, 1, 2, 3]], flat(color))
        o["w"] = width * self.hh
        return self._own(o)

    def set_line(self, o, a, b):
        a, b = Vector(a), Vector(b)
        d = b - a
        o.location = a + Vector((0, 0, 0.0001))
        o.rotation_euler = (0, 0, math.atan2(d.y, d.x))
        o.scale = (max(d.length, 1e-6), o["w"], 1)

    def polyline(self, pts_uv, color, width=0.006):
        """A graph trace: a ribbon of quads along the points, in the HUD plane."""
        w = width * self.hh / 2
        pts = [self.pos(u, v) for u, v in pts_uv]
        verts, faces = [], []
        for i, p in enumerate(pts):
            a = pts[max(0, i - 1)]
            b = pts[min(len(pts) - 1, i + 1)]
            d = (b - a)
            n = Vector((-d.y, d.x, 0)).normalized() * w if d.length > 1e-9 else Vector((0, w, 0))
            verts += [p + n, p - n]
            if i:
                k = 2 * i
                faces.append([k - 2, k - 1, k + 1, k])
        o = mesh_from("hudpoly", [tuple(v) for v in verts], faces, flat(color))
        o.location = (0, 0, 0.0001)
        return self._own(o)

    def dot(self, color, r=0.012):
        o = mesh_from("huddot", [(r * self.hh * math.cos(a), r * self.hh * math.sin(a), 0)
                                 for a in [i * math.tau / 20 for i in range(20)]], [list(range(20))], flat(color))
        return self._own(o)


def show(o, visible):
    o.hide_render = not visible
    o.hide_viewport = not visible


def build_hud(s, cam, hud_coll, times, rate, cam_mats):
    st = s["story"]
    series = st["series"]
    hud = Hud(cam, hud_coll)
    D = HUD_DEPTH

    # top plate: time, slow-mo badge, the two live readouts, title and subtitle
    hud.rect(-1, 0.68, 1, 1, PAPER, 0.9, dz=-0.0001)
    t_txt = hud.text("", -0.92, 0.945, 0.045, INK, "serif", "LEFT")
    badge_box = hud.rect(-0.92, 0.85, -0.68, 0.905, INK, 1.0)
    badge_in = hud.rect(-0.912, 0.856, -0.688, 0.899, PAPER, 1.0, dz=0.00005)
    badge = hud.text("", -0.8, 0.8775, 0.03, INK, "serif")
    c_spec, r_spec = st["hud"][0], st["hud"][1]
    c_txt = hud.text("", 0, 0.945, 0.055, ACCENT, "italic")
    hud.text(c_spec.get("note", ""), 0, 0.9, 0.022, MUTED, "italic")
    r_txt = hud.text("", 0.92, 0.945, 0.045, INK, "italic", "RIGHT")
    title = hud.text("", 0, 0.8, 0.065, INK, "bold")
    sub = hud.text("", 0, 0.735, 0.028, MUTED, "italic")

    # bottom panel: graphs and the equations
    hud.rect(-1, -1, 1, -0.4, PAPER, 0.98, dz=-0.0001)
    graphs = st["graphs"][:2]
    boxes = ([(-0.86, -0.63, -0.08, -0.47), (0.1, -0.63, 0.88, -0.47)] if len(graphs) == 2
             else [(-0.85, -0.63, 0.85, -0.47)])
    duration = s["anim"]["duration"]
    cursors = []
    for g, (u0, v0, u1, v1) in zip(graphs, boxes):
        vals = [p[1] for name, _, _ in g["lines"] for p in series[name]] + [r[0] for r in g.get("refs", [])] + [0]
        lo, hi = min(vals), max(vals)
        hi = hi + 0.12 * ((hi - lo) or 1)

        def to_uv(t, val, u0=u0, v0=v0, u1=u1, v1=v1, lo=lo, hi=hi):
            return (u0 + (u1 - u0) * min(t, duration) / duration, v0 + (v1 - v0) * (val - lo) / (hi - lo))

        hud.text(g["title"], u0, v1 + 0.04, 0.025, INK, "italic", "LEFT")
        leg_v = v1 + 0.005
        for name, label, col in g["lines"]:
            if len(g["lines"]) > 1:
                hud.text(f"— {label}", u1, leg_v, 0.02, NAMED[col], "serif", "RIGHT", "TOP")
                leg_v -= 0.025
        for a, b in (((u0, v0), (u1, v0)), ((u0, v0), (u0, v1))):
            ax = hud.line(MUTED, 0.003)
            hud.set_line(ax, hud.pos(*a), hud.pos(*b))
        hud.text(f"{hi:.0f}" if hi >= 10 else f"{hi:.1f}", u0 - 0.015, v1, 0.02, MUTED, "serif", "RIGHT")
        hud.text("0" if lo == 0 else (f"{lo:.0f}" if abs(lo) >= 10 else f"{lo:.1f}"), u0 - 0.015, v0, 0.02,
                 MUTED, "serif", "RIGHT")
        hud.text(f"{duration:.0f} s" if duration >= 10 else f"{duration:.1f} s", u1, v0 - 0.03, 0.02, MUTED,
                 "serif", "RIGHT")
        for val, label in g.get("refs", []):
            rl = hud.line(MUTED, 0.002)
            a, b = to_uv(0, val), to_uv(duration, val)
            hud.set_line(rl, hud.pos(*a), hud.pos(*b))
            hud.text(label, b[0], b[1] + 0.008, 0.018, MUTED, "italic", "RIGHT", "BOTTOM")
        dots = []
        for name, _, col in g["lines"]:
            pts = series[name]
            peak = max(abs(q[1]) for q in pts) or 1
            step = max(1, len(pts) // 400)
            # thin the trace, but keep every point of an impact spike
            keep = sorted({tuple(p) for p in pts[::step]} | {tuple(p) for p in pts if abs(p[1]) >= 0.3 * peak})
            hud.polyline([to_uv(t, v) for t, v in keep], NAMED[col], 0.007)
            dots.append((name, hud.dot(NAMED[col], 0.011)))
        cur = hud.line(INK, 0.0025)
        cursors.append((cur, dots, to_uv, v0, v1))
    for i, eq in enumerate(st["eqs"]):
        hud.text(eq, 0, -0.74 - i * 0.075, 0.034, INK, "italic")

    callouts = []
    for t0, t1, actor, local, label in st["callouts"]:
        callouts.append({"t0": t0, "t1": t1, "actor": actor, "local": Vector(local),
                         "dot": hud.dot(INK, 0.008), "line": hud.line(INK, 0.0025),
                         "text": hud.text(label, 0, 0, 0.03, INK, "italic", "LEFT")})

    def readout(spec, t):
        v = interp(series[spec["series"]], t)[0]
        return f'{spec["sym"]} = {spec["fmt"].format(v)} {spec["unit"]}'

    def update(fi):
        fi = max(0, min(len(times) - 1, fi))
        t = times[fi]
        t_txt.data.body = f"t = {t:.3f} s" if t < 10 else f"t = {t:.1f} s"
        r = rate(t) if fi < len(times) - 1 and times[fi + 1] != t else 0
        slow = r and abs(r - 1) > 0.01
        badge.data.body = (f"×1/{round(1 / r)}" if r < 1 else f"×{r:g}") if slow else ""
        for o in (badge_box, badge_in, badge):
            show(o, bool(slow))
        c_txt.data.body = readout(c_spec, t)
        r_txt.data.body = readout(r_spec, t)
        cap = [c for c in st["captions"] if c[0] <= t + 1e-9]
        title.data.body, sub.data.body = (cap[-1][1], cap[-1][2]) if cap else ("", "")
        for cur, dots, to_uv, v0, v1 in cursors:
            u = to_uv(t, 0)[0]
            hud.set_line(cur, hud.pos(u, v0), hud.pos(u, v1))
            for name, d in dots:
                d.location = hud.pos(*to_uv(t, interp(series[name], t)[0]), 0.0003)
        cam_inv = cam_mats[fi].inverted()
        for c in callouts:
            on = c["t0"] <= t <= c["t1"]
            p = None
            if on:
                world = (pose_matrix(s["anim"]["actors"][c["actor"]], t) @ c["local"]) if c["actor"] else c["local"]
                p = cam_inv @ world
                on = p.z < -0.1
            for k in ("dot", "line", "text"):
                show(c[k], on)
            if not on:
                continue
            a = p * (D / -p.z)
            a.z = -D + 0.0003
            u_a, v_a = a.x / hud.hw, a.y / hud.hh
            right = u_a < 0.2
            v_l = min(0.6, max(-0.35, v_a + 0.12))
            label = hud.pos(u_a + (0.2 if right else -0.2), v_l, 0.0003)
            c["dot"].location = a
            hud.set_line(c["line"], a, label)
            c["text"].data.align_x = "LEFT" if right else "RIGHT"
            c["text"].location = label + Vector((0.015 * hud.hw * (1 if right else -1), 0.0, 0))

    return update


# --------------------------------------------------------------------------- scenes
def make_camera(lens):
    cd = bpy.data.cameras.new("Camera")
    cd.lens = lens
    cd.clip_start = 0.05
    cd.clip_end = 600
    cam = bpy.data.objects.new("Camera", cd)
    bpy.context.view_layer.active_layer_collection.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def actor_hip(s, name, hip_h=0.93):
    """World position of an actor's hips (the origin is between the feet): what a camera should follow
    when the body runs, rolls or crawls ahead of its feet."""
    rows = s["anim"]["actors"][name]

    def at(t):
        r = interp(rows, t)
        return Vector(r[:3]) + Euler(r[3:6], "XYZ").to_matrix() @ Vector((0, 0, hip_h))
    return at


def actor_pos(s, name, lift=0.0):
    rows = s["anim"]["actors"][name]
    return lambda t: Vector(interp(rows, t)[:3]) + Vector((0, 0, lift))


def scene_pedestrian(s, times):
    street()
    c = car()
    v = dummy("victim")
    animate_actor(c, s["anim"]["actors"]["car"], times)
    roll_wheels(c, s["anim"]["actors"]["car"], times)
    animate_actor(v, s["anim"]["actors"]["victim"], times)
    cam = make_camera(28)
    track = actor_pos(s, "victim", 0.6)
    mats = animate_camera(cam, times, track, lambda g: (g.x + 12.0, g.y - 8.5, 2.3), smooth=0.08)
    return cam, mats


def scene_drowning(s, times):
    """The sea in cut-away: seabed section, surface, rip arrows; you and the lifeguard."""
    an = s["anim"]
    bed = an["seabed"]
    x0, x1 = -45.0, 6.0                                           # the sea runs back from the cut at x = 6

    def bed_z(y):
        return interp(bed, y)[0]

    beach = [(y, z) for y, z in bed if y <= 0] + [(0.0, -8.0), (bed[0][0], -8.0)]
    floor = [(y, z) for y, z in bed if y >= 0] + [(bed[-1][0], -8.0), (0.0, -8.0)]
    water_profile_mesh("beach", beach[::-1], x0, x1, clay(SAND))
    water_profile_mesh("seabed", floor[::-1], x0, x1, clay((196, 208, 204)))   # wet sand, seen through water
    deep = [(y, z) for y, z in bed if 0 < y] + [(bed[-1][0], 0.0), (0.0, 0.0)]
    water_profile_mesh("sea_back", deep[::-1], x0 - 0.2, x0, clay((178, 206, 220), rough=0.95))
    prim("plane", "sea_surface", ((x0 + x1) / 2, 80, 0.0), ((x1 - x0) / 2, 80, 1), mat=clay(SEA, rough=0.9))
    for y in range(4, 150, 7):                                    # swell lines: texture and speed from above
        prim("cube", f"swell{y}", ((x0 + x1) / 2, y + 0.5, 0.012), ((x1 - x0) / 2, 0.05, 0.004),
             mat=clay((236, 244, 247), rough=0.9))
    for y in range(12, an["rip"]["length"], 12):
        prim("cone", f"rip_arrow{y}", (0, y, 0.04), (1.0, 1.7, 0.04), rot=(0, 0, 0), mat=clay(ACCENT), vertices=3)
    for x in range(-43, 4, 7):
        if abs(x) > an["rip"]["half_width"] + 2:
            prim("cube", f"breaker{x}", (x, 26 + (x % 3), 0.05), (2.8, 0.45, 0.05), mat=clay((252, 252, 252)), bevel=0.15)
    tx, ty = an["tower"]
    tz = bed_z(ty)
    for dx in (-0.6, 0.6):
        for dy in (-0.6, 0.6):
            prim("cylinder", "tower_leg", (tx + dx, ty + dy, tz + 0.9), (0.06, 0.06, 0.9), mat=clay(CLAY_DARK), vertices=12)
    prim("cube", "tower_deck", (tx, ty, tz + 1.75), (0.8, 0.8, 0.05), mat=clay(CLAY), bevel=0.02)
    prim("cube", "tower_rail", (tx, ty + 0.78, tz + 2.2), (0.8, 0.03, 0.03), mat=clay(CLAY_DARK))
    for fx in (-32, 4):
        prim("cylinder", f"flagpole{fx}", (fx, -3, bed_z(-3) + 1.2), (0.04, 0.04, 1.2), mat=clay(CLAY_DARK), vertices=10)
        prim("cube", f"flag{fx}", (fx + 0.32, -3, bed_z(-3) + 2.15), (0.3, 0.01, 0.2), mat=clay(ACCENT))

    you = rig("you", ACCENT)
    guard = rig("lifeguard", AMBER, tube=True)
    for person in (you, guard):
        animate_actor(person, an["actors"][person.name], times)
        animate_joints(person, an["joints"][person.name], times)

    cam = make_camera(30)
    track = actor_pos(s, "you")

    def target(t):
        p = track(t)
        if p.y < 2:                                               # on the beach
            return (p.x, p.y, p.z + 0.4)
        if p.x < -1:                                              # towed: look a little ahead, toward the beach
            return (p.x, p.y - 2.5, p.z)
        return (p.x, p.y, min(p.z + 0.6, -0.3) if p.z < -0.6 else p.z + 0.4)

    def offset(g):
        """Side view through the cut, rising to an aerial view for the tow, then close on the sand."""
        side = Vector((x1 + 12.0, g.y - 1.0, -0.35))
        aerial = Vector((g.x + 6.0, g.y - 7.0, 8.0))
        beach = Vector((g.x + 4.5, g.y + 3.0, g.z + 1.8))
        p = side.lerp(aerial, max(0.0, min(1.0, (-g.x - 1.0) / 6.0)))
        return tuple(p.lerp(beach, max(0.0, min(1.0, (3.0 - g.y) / 4.0))))
    mats = animate_camera(cam, times, target, offset, smooth=0.45)
    return cam, mats


def scene_fall(s, times):
    h = s["anim"]["building_height"]
    prim("plane", "ground", (0, 0, 0), (60, 60, 1), mat=clay(ROAD))
    for i in range(-10, 11):
        prim("plane", f"slab{i}", (2 + i * 2.0, -6, 0.003), (0.98, 8, 1), mat=clay((232, 232, 230)))
    building("tower", -5.0, 0, 10, 12, h, face=-1, side_windows=True)
    for k in range(3):
        building(f"bg{k}", -6 - k * 11, 14, 10, 8, h + 6 + 5 * k, face=-1)
    prim("cube", "parapet", (-0.2, 0, h + 0.5), (0.2, 6, 0.3), mat=clay(CLAY))
    v = dummy("victim")
    animate_actor(v, s["anim"]["actors"]["victim"], times)
    cam = make_camera(26)
    track = actor_pos(s, "victim", 0.9)
    mats = animate_camera(cam, times, track, lambda g: (g.x + 7.5, g.y - 7.5, max(1.6, g.z * 0.6 + 1.2)), smooth=0.2)
    return cam, mats


def tube(name, a, b, r, mat, parent=None):
    """A thin cylinder from a to b (in the parent's space)."""
    a, b = Vector(a), Vector(b)
    o = prim("cylinder", name, tuple((a + b) / 2), (r, r, (b - a).length / 2),
             rot=tuple((b - a).to_track_quat("Z", "Y").to_euler()), mat=mat, parent=parent, vertices=10)
    return o


def scene_electrocution(s, times):
    """You reach for a sagging 120 V line; current runs hand → chest → feet; your neighbour cuts the power."""
    an = s["anim"]
    xs = an["x_stop"]
    prim("plane", "ground", (-4, 0, 0), (30, 30, 1), mat=clay((222, 226, 214)))
    prim("plane", "path", (-4, 0, 0.003), (14, 0.7, 1), mat=clay(ROAD))
    prim("cylinder", "puddle", (xs + 0.1, -0.2, 0.006), (1.5, 1.0, 0.002), mat=clay((190, 204, 214), rough=0.05), vertices=48)
    prim("cylinder", "pole", (2.6, 1.6, 4.5), (0.14, 0.14, 4.5), mat=clay(CLAY), vertices=24)
    prim("cube", "crossarm", (2.6, 1.6, 8.4), (0.08, 1.2, 0.08), mat=clay(CLAY), bevel=0.02)
    for yy in (0.6, 2.6):
        prim("cylinder", f"insulator{yy}", (2.6, yy, 8.6), (0.06, 0.06, 0.12), mat=clay(CLAY_DARK), vertices=16)
    hand = tuple(an["contact"])                                   # your palm, from the rig's forward kinematics
    end = tuple(an["line_end"])                                   # the broken end, lying in the puddle
    pts = [(2.6, 0.6, 8.6), (1.9, 0.3, 5.2), (1.0, -0.05, 2.4), hand,
           (hand[0] - 0.15, (hand[1] + end[1]) / 2, 0.6), end]
    cu = bpy.data.curves.new("wire", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.018
    sp = cu.splines.new("NURBS")
    sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts):
        p.co = (*q, 1)
    sp.use_endpoint_u = True
    sp.order_u = 3
    wire = bpy.data.objects.new("wire", cu)
    bpy.context.view_layer.active_layer_collection.collection.objects.link(wire)
    cu.materials.append(clay((60, 60, 66)))
    spark = flat((150, 205, 255))
    prim("ico_sphere", "spark", hand, (0.07,) * 3, mat=spark, subdivisions=1)
    prim("ico_sphere", "spark_end", end, (0.06,) * 3, mat=spark, subdivisions=1)
    for k in range(8):
        a = k * math.tau / 8
        prim("cone", f"bolt{k}", (hand[0] + 0.11 * math.cos(a), hand[1], hand[2] + 0.11 * math.sin(a)),
             (0.022, 0.022, 0.1), rot=(0, math.pi / 2 - a, 0), mat=spark, vertices=4)
    # step-voltage ring: 10 m round the line's end
    prim("torus", "ring_step", (end[0], end[1], 0.02), (1, 1, 1), mat=flat(AMBER), major_radius=10.0,
         minor_radius=0.035, major_segments=96, minor_segments=6)
    # the house wall and the breaker box
    bx, by = an["breaker"]
    prim("cube", "house_wall", (bx, by + 0.45, 1.6), (6.0, 0.15, 1.6), mat=clay(CLAY), bevel=0.02)
    prim("cube", "house_window", (bx + 3.0, by + 0.29, 1.7), (0.8, 0.02, 0.55), mat=clay(GLASS, rough=0.1))
    prim("cube", "breaker_box", (bx, by + 0.25, 1.45), (0.22, 0.06, 0.3), mat=clay(CLAY_DARK), bevel=0.01)
    prim("cube", "breaker_lever", (bx, by + 0.18, 1.5), (0.03, 0.03, 0.08), mat=clay(ACCENT))

    you = rig("you", ACCENT)
    nb = rig("neighbour", GREEN)
    # the current's path, drawn on the front of your body so it shows: hand → arm → chest → hips → feet
    hot = flat(ACCENT)
    tube("current_arm", (0.05, -0.02, 0), (0.05, -0.065, -0.6), 0.016, hot, bpy.data.objects["you_shoulder_R"])
    tube("current_torso", (0.12, -0.2, 1.4), (0.12, 0.0, 0.95), 0.018, hot, bpy.data.objects["you_body"])
    for side in ("L", "R"):
        tube(f"current_leg{side}", (0.075, 0, 0), (0.09, 0, -0.88), 0.016, hot, bpy.data.objects[f"you_hip_{side}"])
    aed = empty("aed")
    prim("cube", "aed_case", (0, 0, 0.09), (0.16, 0.12, 0.09), mat=clay(GREEN), parent=aed, bevel=0.02)
    prim("cube", "aed_handle", (0, 0, 0.2), (0.06, 0.015, 0.02), mat=clay(CLAY_DARK), parent=aed)
    aed.location = (xs - 2.35, 0.55, 0)                           # beside your head, clear of the CPR

    for person in (you, nb):
        animate_actor(person, an["actors"][person.name], times)
        animate_joints(person, an["joints"][person.name], times)

    on, off = an["shock_window"]
    t_power = an["t_power"]
    cam = make_camera(30)
    track_you, track_nb = actor_pos(s, "you"), actor_pos(s, "neighbour")

    def target(t):
        p = track_you(t)
        if off + 1.0 <= t < t_power + 1.0:                          # wide: you on the ground, your neighbour at the box
            return tuple((p + track_nb(t)) / 2 + Vector((0, 0, 0.8)))
        return (p.x, p.y, p.z + (0.9 if t < off else 0.4))

    # follow you; pull back for the wide shot while the target sits between you and your neighbour
    wide = lambda t: 2.6 if off + 1.0 <= t < t_power + 1.0 else 1.0
    mats = animate_camera(cam, times, target, lambda g: (g.x + 3.8, g.y - 5.0, g.z + 1.0), smooth=0.15,
                          scale_fn=wide)
    return cam, mats


def scene_burns(s, times):
    """Your living room: the sofa burning, smoke filling from the ceiling, you on fire, then stop, drop, roll."""
    an = s["anim"]
    sx, sy = an["sofa"]
    dx, dy = an["door"]
    prim("plane", "floor", (0, 0, 0), (9, 6, 1), mat=clay(ROAD))
    for i in range(-8, 9, 2):                                     # floorboards, for scale and speed
        prim("cube", f"board{i}", (i, 0, 0.002), (0.01, 6, 0.002), mat=clay(CLAY_DARK))
    prim("cube", "wall_back_l", ((-9 + dx - 0.6) / 2, 6, 1.4), ((dx - 0.6 + 9) / 2, 0.1, 1.4), mat=clay(CLAY))
    prim("cube", "wall_back_r", ((dx + 0.6 + 9) / 2, 6, 1.4), ((9 - dx - 0.6) / 2, 0.1, 1.4), mat=clay(CLAY))
    prim("cube", "lintel", (dx, 6, 2.45), (0.6, 0.1, 0.35), mat=clay(CLAY))
    prim("cube", "wall_left", (-9, 0, 1.4), (0.1, 6, 1.4), mat=clay(CLAY))
    prim("cube", "window", (-1.5, 5.88, 1.6), (1.1, 0.05, 0.6), mat=clay(GLASS, rough=0.1))
    prim("cube", "door_open", (dx + 0.55, 6.5, 1.05), (0.04, 0.55, 1.05), mat=clay(CLAY_DARK))
    prim("cube", "sofa", (sx, sy, 0.3), (1.5, 0.55, 0.3), mat=clay(CLAY), bevel=0.08)
    prim("cube", "sofa_back", (sx, sy + 0.5, 0.75), (1.5, 0.15, 0.4), mat=clay(CLAY), bevel=0.06)
    prim("cube", "lamp_table", (sx + 2.2, sy, 0.3), (0.3, 0.3, 0.3), mat=clay(CLAY_DARK), bevel=0.02)
    fire, fire2 = flat(ACCENT), flat((235, 120, 40))
    for i in range(7):
        o = prim("cone", f"sofa_fire{i}", (sx - 1.2 + i * 0.4, sy, 0.9 + (i % 3) * 0.15),
                 (0.22, 0.22, 0.5 + (i % 2) * 0.25), mat=fire if i % 2 else fire2, vertices=12)
        o["flame"] = True
        o["part"] = "sofa"
    # the smoke layer: puffs under the ceiling whose bottom follows physics (actor "smoke")
    smoke = empty("smoke")
    for i in range(14):
        prim("uv_sphere", f"smoke{i}", (-8 + i * 1.25, -4.5 + (i * 3.7) % 10, 0.45 + (i % 2) * 0.15),
             (1.1, 0.95, 0.45), mat=clay((206, 206, 206)), smooth=True, parent=smoke)
    pl = bpy.data.lights.new("fire_light", "POINT")
    pl.energy = 800
    pl.color = (1, 0.5, 0.25)
    po = bpy.data.objects.new("fire_light", pl)
    po.location = (sx, sy - 0.6, 1.4)
    bpy.context.view_layer.active_layer_collection.collection.objects.link(po)

    you = rig("you", CLAY_DARK)
    # burn patches: crimson skins over each part, shown once that skin passes 60 °C
    hot = clay(ACCENT, rough=0.7)
    for side, part, sgn in (("L", "left_arm", 1), ("R", "right_arm", -1)):
        sh = bpy.data.objects[f"you_shoulder_{side}"]
        prim("cylinder", f"burn_{part}_u", (0, 0.03 * sgn, -0.15), (0.047, 0.047, 0.125), rot=(0.12 * sgn, 0, 0),
             mat=hot, parent=sh, vertices=20)["part"] = part
        prim("cylinder", f"burn_{part}_f", (0, 0.06 * sgn, -0.43), (0.041, 0.041, 0.115), mat=hot, parent=sh,
             vertices=20)["part"] = part
        for j, z in enumerate((-0.2, -0.45)):                     # flames on the sleeve
            o = prim("cone", f"you_fire_{part}{j}", (0.04, 0.05 * sgn, z), (0.07, 0.07, 0.2),
                     mat=fire2 if j else fire, parent=sh, vertices=10)
            o["flame"] = True
            o["part"] = part
    body = bpy.data.objects["you_body"]
    prim("cube", "burn_front_torso", (0.035, 0, 1.25), (0.08, 0.175, 0.205), mat=hot, parent=body,
         bevel=0.05)["part"] = "front_torso"
    for j, (yy, zz) in enumerate(((0.08, 1.3), (-0.08, 1.15), (0.0, 1.45))):
        o = prim("cone", f"you_fire_torso{j}", (0.13, yy, zz), (0.09, 0.09, 0.26), mat=fire if j % 2 else fire2,
                 parent=body, vertices=10)
        o["flame"] = True
        o["part"] = "front_torso"

    animate_actor(you, an["actors"]["you"], times)
    animate_joints(you, an["joints"]["you"], times)
    animate_actor(smoke, an["actors"]["smoke"], times)

    cam = make_camera(30)
    hip = actor_hip(s, "you")
    mats = animate_camera(cam, times, lambda t: tuple(hip(t) + Vector((0, 0, 0.15))),
                          lambda g: (g.x + 2.2, g.y - 6.2, 1.3), smooth=0.25)
    return cam, mats


SCENES = {"pedestrian": scene_pedestrian, "drowning": scene_drowning, "fall": scene_fall,
          "electrocution": scene_electrocution, "burns": scene_burns}


def scene_extras(sid):
    """Per-frame effects that aren't plain transforms (sparks, flames)."""
    objs = bpy.data.objects
    if sid == "electrocution":
        an = DATA[sid]["anim"]
        on, off = an["shock_window"]
        pulse = [o for o in objs if o.name.startswith(("spark", "bolt", "current"))]
        ring = [o for o in objs if o.name.startswith("ring")]
        aed = [o for o in objs if o.name.startswith("aed_")]

        def upd(fi, t):
            for o in pulse:                                        # the current pulses while you're on the line
                show(o, on <= t < off and fi % 3 != 0)
            for o in ring:
                show(o, off + 1.0 <= t < an["t_power"])
            for o in aed:
                show(o, t >= an["t_aed"])
        return upd
    if sid == "burns":
        an = DATA[sid]["anim"]
        flames = [o for o in objs if o.get("flame")]
        burns = [o for o in objs if o.name.startswith("burn_")]
        base = {o.name: tuple(o.scale) for o in flames}

        def upd(fi, t):
            size = interp(an["flame"], t)[0]                      # physics: catch, grow while running, die rolling
            for i, o in enumerate(flames):
                part = o["part"]
                k = 1.0 if part == "sofa" else (size if t >= an["ignite"][part] else 0.0)
                wob = 1 + 0.18 * math.sin(fi * 1.7 + i * 2.1)
                sx_, sy_, sz_ = base[o.name]
                o.scale = (sx_ * k * wob, sy_ * k * wob, sz_ * k * (1 + 0.3 * math.sin(fi * 2.3 + i)))
                show(o, k > 0.02)
            for o in burns:                                       # the skin under it passes 60 °C
                show(o, t >= an["burn_at"][o["part"]])
        return upd
    return None


def build(sid):
    _mats.clear()
    world_coll, hud_coll = reset()
    s = DATA[sid]
    sc = bpy.context.scene
    look(sc, world_coll)
    times, rate = build_timeline(s["story"], s["anim"]["duration"])
    cam, cam_mats = SCENES[sid](s, times)
    hud_update = build_hud(s, cam, hud_coll, times, rate, cam_mats)
    extra = scene_extras(sid)

    def on_frame(scene, *_):
        fi = max(0, min(len(times) - 1, scene.frame_current - 1))
        hud_update(fi)
        if extra:
            extra(fi, times[fi])

    bpy.app.handlers.frame_change_pre.clear()
    bpy.app.handlers.frame_change_pre.append(on_frame)
    sc.frame_start, sc.frame_end = 1, len(times)
    sc.frame_set(1)

    sc.render.filepath = os.path.join(ROOT, "out", f"{sid}.mp4")
    try:
        sc.render.image_settings.media_type = "VIDEO"
    except (AttributeError, TypeError):
        pass
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format = "MPEG4"
    sc.render.ffmpeg.codec = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "out", f"{sid}.blend"))

    if GLB:
        export_glb(sid, sc, world_coll, times, extra)
    if STILL is not None:
        try:
            sc.render.image_settings.media_type = "IMAGE"
        except (AttributeError, TypeError):
            pass
        sc.render.image_settings.file_format = "PNG"
        for f in STILL:
            sc.frame_set(f)
            sc.render.filepath = os.path.join(ROOT, "out", "previews", f"{sid}_{f}.png")
            bpy.ops.render.render(write_still=True)
            print(f"Still out/previews/{sid}_{f}.png ({len(times)} frames total)")
    elif RENDER:
        # Render frame by frame: changing HUD text inside an animation render crashes
        # Blender 5.3, but updating it between still renders is safe.
        frames_dir = os.path.join(ROOT, "out", "frames", sid)
        os.makedirs(frames_dir, exist_ok=True)
        try:
            sc.render.image_settings.media_type = "IMAGE"
        except (AttributeError, TypeError):
            pass
        sc.render.image_settings.file_format = "PNG"
        n_frames = min(len(times), MAX_FRAMES or len(times))
        for f in range(FROM, n_frames + 1):                        # frames before FROM are kept from a previous run
            sc.frame_set(f)
            sc.render.filepath = os.path.join(frames_dir, f"{f:04d}.png")
            bpy.ops.render.render(write_still=True)
            if f % 25 == 0:
                print(f"{sid}: frame {f}/{n_frames}", flush=True)
        encode_video(frames_dir, n_frames, os.path.join(ROOT, "out", f"{sid}.mp4"))
        media = os.path.join(ROOT, "web", "media")                 # the web viewer plays it in sync
        os.makedirs(media, exist_ok=True)
        shutil.copy(os.path.join(ROOT, "out", f"{sid}.mp4"), media)
        print(f"Rendered out/{sid}.mp4 ({len(times)} frames)")


def export_glb(sid, sc, world_coll, times, extra):
    """The film's scene as glTF for the web viewer: same meshes, keyframes and camera.
    Animation time 0 = film frame 1, so the viewer drives it with video.currentTime.
    Effects the frame handler makes (sparks blinking, flames flickering) are baked
    into scale keys, because glTF has no visibility channel."""
    fx = [o for o in world_coll.all_objects
          if o.name.startswith(("spark", "bolt", "current", "ring", "aed_", "burn_")) or o.get("flame")]
    if extra and fx:
        base = {o.name: tuple(o.scale) for o in fx}
        for f in range(1, len(times) + 1):
            extra(f - 1, times[f - 1])
            for o in fx:
                if o.hide_render:
                    o.scale = (0, 0, 0)
                elif not o.get("flame"):
                    o.scale = base[o.name]
                o.keyframe_insert("scale", frame=f)
                show(o, True)
    bpy.ops.object.select_all(action="DESELECT")
    for o in world_coll.all_objects:
        if o.type in {"MESH", "CURVE", "EMPTY", "CAMERA"}:
            o.hide_set(False)
            o.select_set(True)
    out_dir = os.path.join(ROOT, "web", "models")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{sid}.glb")
    opts = dict(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
                export_cameras=True, export_lights=False, export_animations=True, export_force_sampling=True,
                export_frame_range=True, export_animation_mode="SCENE", export_anim_slide_to_zero=True,
                export_draco_mesh_compression_enable=False)
    for _ in range(len(opts)):                  # drop options this Blender's exporter doesn't know
        try:
            bpy.ops.export_scene.gltf(**opts)
            break
        except TypeError as e:
            bad = next((k for k in opts if f'"{k}"' in str(e) or f"'{k}'" in str(e)), None)
            if not bad:
                raise
            print(f"glTF exporter: no option {bad}, skipping it")
            opts.pop(bad)
    print(f"Exported web/models/{sid}.glb ({os.path.getsize(path) / 1e6:.1f} MB, {len(times)} frames)")


def encode_video(frames_dir, n, out_path):
    """Join a PNG sequence into an H.264 MP4 with Blender's own sequencer (no ffmpeg needed)."""
    bpy.app.handlers.frame_change_pre.clear()
    sc = bpy.data.scenes.new("encode")
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.resolution_percentage = 100
    sc.render.fps = FPS
    sc.view_settings.view_transform = "Standard"
    ed = sc.sequence_editor_create()
    strips = ed.strips if hasattr(ed, "strips") else ed.sequences
    strip = strips.new_image("frames", os.path.join(frames_dir, "0001.png"), 1, 1)
    for f in range(2, n + 1):
        strip.elements.append(f"{f:04d}.png")
    sc.frame_start, sc.frame_end = 1, n
    try:
        sc.render.image_settings.media_type = "VIDEO"
    except (AttributeError, TypeError):
        pass
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format = "MPEG4"
    sc.render.ffmpeg.codec = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.filepath = out_path
    bpy.ops.render.render(animation=True, scene=sc.name)


for sid in (SCENES if SID == "all" else [SID]):
    build(sid)
