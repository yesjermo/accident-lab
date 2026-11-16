"""
Build public/models/body.glb from BodyParts3D 4.0 (part-of tree, 99% reduced OBJ).

Source: BodyParts3D, (c) The Database Center for Life Science (DBCLS).
https://dbarchive.biosciencedbc.jp/en/bodyparts3d/
Current licence page: CC BY 4.0. The 2011 OBJ files carry a CC BY-SA 2.1 JP
header, so the derived model is distributed under CC BY-SA (see ASSETS.md).

Usage (Blender 4+/5):
  blender -b -P tools/build_body_glb.py -- <dir with partof_element_parts.txt and partof_BP3D_4.0_obj_99/> <out.glb> [za_parts.blend]

The optional za_parts.blend (made by tools/extract_zanatomy.py) adds Z-Anatomy's
lung-lobe surfaces and thigh muscles, already aligned to BodyParts3D coordinates.
BodyParts3D has neither; without it the lungs show only as bronchial trees.

Each group below becomes one named mesh in the GLB. Group names match
structure IDs in src/content (structures.ts, organs.ts), so every mesh opens
its lesson. Mesh shapes are not edited, only merged
and decimated, so anatomy stays as published.
"""
import os
import sys

import bpy

# (group name, FMA concept IDs, decimate ratio). Order = priority: an element file
# claimed by an earlier group is not reused by a later one.
GROUPS = [
    ('pulmonary-arteries', ['FMA8612', 'FMA50872', 'FMA50873', 'PA-INTRAPULMONARY'], 0.6),
    ('pulmonary-veins', ['FMA49911', 'FMA49913', 'FMA49914', 'FMA49916', 'PV-INTRAPULMONARY'], 0.6),
    ('aorta', ['FMA3734'], 0.6),
    ('vena-cava', ['FMA4720', 'FMA10951'], 0.6),
    ('trachea', ['FMA7394', 'FMA7395', 'FMA7396'], 0.6),
    ('heart', ['FMA7088'], 0.35),
    ('bronchial-tree', ['FMA7309', 'FMA7310'], 0.35),
    ('diaphragm', ['FMA13295'], 0.5),
    ('brain', ['FMA50801'], 0.15),
    ('esophagus', ['FMA7131'], 0.5),
    ('liver', ['FMA7197'], 0.2),
    ('stomach', ['FMA7148'], 0.4),
    ('pancreas', ['FMA7198'], 0.4),
    ('kidneys', ['FMA7204', 'FMA7205'], 0.4),
    ('small-intestine', ['FMA7200'], 0.3),
    ('large-intestine', ['FMA7201'], 0.3),
    ('urinary-bladder', ['FMA15900'], 0.5),
    ('skeleton', ['FMA23876'], 0.08),
    ('skin', ['FMA7163'], 0.12),
]


def main():
    argv = sys.argv[sys.argv.index('--') + 1 :]
    src, out = argv[0], argv[1]
    za_parts = argv[2] if len(argv) > 2 else None
    objdir = os.path.join(src, 'partof_BP3D_4.0_obj_99')

    elements: dict[str, list[str]] = {}
    with open(os.path.join(src, 'partof_element_parts.txt'), encoding='utf-8') as f:
        next(f)
        for line in f:
            concept, _name, fj = line.rstrip('\n').split('\t')
            elements.setdefault(concept, []).append(fj)

    # BodyParts3D 4.0 has no lung-surface mesh: the lung concepts are made of
    # segmental bronchial trees, arteries and veins. Route each element to the
    # group it actually is, so colours (oxygen-rich / oxygen-poor / airway) are right.
    def english_name(fj: str) -> str:
        with open(os.path.join(objdir, f'{fj}.obj'), encoding='utf-8', errors='replace') as fh:
            for line in fh:
                if line.startswith('# English name :'):
                    return line.split(':', 1)[1].strip().lower()
                if line.startswith('v '):
                    break
        return ''

    for lung in ('FMA7309', 'FMA7310'):
        for fj in elements.get(lung, []):
            n = english_name(fj)
            if 'artery' in n:
                elements.setdefault('PA-INTRAPULMONARY', []).append(fj)
            elif 'vein' in n:
                elements.setdefault('PV-INTRAPULMONARY', []).append(fj)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    claimed: set[str] = set()
    report = []

    for name, concepts, ratio in GROUPS:
        files = []
        for c in concepts:
            for fj in elements.get(c, []):
                if fj not in claimed:
                    claimed.add(fj)
                    files.append(fj)
        if not files:
            raise SystemExit(f'no elements for {name}')
        before = set(bpy.data.objects)
        for fj in files:
            # BodyParts3D is millimetres, Z up, patient's right at -X, anterior at -Y.
            bpy.ops.wm.obj_import(filepath=os.path.join(objdir, f'{fj}.obj'), forward_axis='Y', up_axis='Z', global_scale=0.001)
        new = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
        bpy.ops.object.select_all(action='DESELECT')
        for o in new:
            o.select_set(True)
        bpy.context.view_layer.objects.active = new[0]
        if len(new) > 1:
            bpy.ops.object.join()
        obj = bpy.context.view_layer.objects.active
        obj.name = name
        obj.data.name = name
        for slot in list(obj.material_slots):
            obj.active_material_index = 0
            bpy.ops.object.material_slot_remove()
        tris_before = sum(len(p.vertices) - 2 for p in obj.data.polygons)
        if ratio < 1:
            mod = obj.modifiers.new('decimate', 'DECIMATE')
            mod.ratio = ratio
            bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.ops.object.shade_smooth()
        tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
        report.append((name, len(files), tris_before, tris))

    # Z-Anatomy additions: (name in za_parts.blend, mesh name in GLB, decimate ratio).
    if za_parts:
        additions = [('za-lungs', 'lungs', 0.6), ('za-thigh-muscles', 'thigh-muscles', 0.2)]
        with bpy.data.libraries.load(za_parts) as (src_data, dst_data):
            dst_data.objects = [n for n, _, _ in additions if n in src_data.objects]
        for (src_name, name, ratio), obj in zip(additions, dst_data.objects):
            bpy.context.scene.collection.objects.link(obj)
            obj.name = name
            obj.data.name = name
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            tris_before = sum(len(p.vertices) - 2 for p in obj.data.polygons)
            mod = obj.modifiers.new('decimate', 'DECIMATE')
            mod.ratio = ratio
            bpy.ops.object.modifier_apply(modifier=mod.name)
            bpy.ops.object.shade_smooth()
            report.append((name + ' (Z-Anatomy)', 0, tris_before, sum(len(p.vertices) - 2 for p in obj.data.polygons)))

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_normals=True,
        export_materials='NONE',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_extras=False,
    )
    total = 0
    for name, n, b, a in report:
        total += a
        print(f'{name:26s} files={n:4d} tris {b:7d} -> {a:7d}')
    print(f'TOTAL tris {total}  ->  {out} ({os.path.getsize(out) / 1e6:.2f} MB)')


main()
