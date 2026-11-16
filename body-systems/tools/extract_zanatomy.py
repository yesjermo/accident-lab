"""
Extract lung lobes and thigh muscles from Z-Anatomy into BodyParts3D coordinates.

Source: Z-Anatomy, "The libre 3D atlas of anatomy" (Kervyn, Zielinski et al.),
https://github.com/Z-Anatomy/Models-of-human-anatomy, CC BY-SA 4.0, derived from
BodyParts3D (DBCLS). Only the meshes listed below are used. The non-commercial
parts of Z-Anatomy (inner ear, kidney) are NOT used.

Usage (open the .blend with scripts disabled; it is third-party data):
  blender -b --disable-autoexec <Z-Anatomy/Startup.blend> -P tools/extract_zanatomy.py -- <za_to_bp.json> <out.blend>

za_to_bp.json holds {"scale": s, "t": [tx, ty, tz]}: the uniform scale and
translation mapping Z-Anatomy metres onto BodyParts3D metres, fitted by
least squares on 15 shared landmarks (femora, hip bones, sternum, clavicles,
humeri, tibia, trachea, frontal bone, sacrum, liver, kidney). RMSE was 6.5 mm.
"""
import json
import sys

import bpy
from mathutils import Matrix

GROUPS = {
    'lungs': [
        'Superior lobe of right lung',
        'Middle lobe of right lung',
        'Inferior lobe of right lung',
        'Superior lobe of left lung',
        'Inferior lobe of left lung',
    ],
    'thigh-muscles': [
        f'{m}.{side}'
        for side in ('r', 'l')
        for m in (
            'Rectus femoris muscle',
            'Vastus lateralis muscle',
            'Vastus medialis muscle',
            'Vastus intermedius muscle',
            'Sartorius muscle',
            'Gracilis muscle',
            'Adductor longus',
            'Adductor brevis',
            'Adductor magnus',
            'Long head of biceps femoris',
            'Short head of biceps femoris',
            'Semitendinosus muscle',
            'Semimembranosus muscle',
        )
    ],
}


def main():
    argv = sys.argv[sys.argv.index('--') + 1 :]
    fit = json.load(open(argv[0]))
    out = argv[1]
    s, (tx, ty, tz) = fit['scale'], fit['t']
    to_bp = Matrix.Translation((tx, ty, tz)) @ Matrix.Scale(s, 4)
    dg = bpy.context.evaluated_depsgraph_get()

    made = []
    for group, names in GROUPS.items():
        meshes = []
        for n in names:
            o = bpy.data.objects.get(n)
            if o is None or o.type != 'MESH':
                print('MISSING', n)
                continue
            m = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
            mw = o.matrix_world.copy()
            m.transform(to_bp @ mw)
            if mw.determinant() < 0:  # mirrored copies: keep normals pointing outward
                m.flip_normals()
            meshes.append(m)
        if not meshes:
            raise SystemExit(f'nothing found for {group}')
        # Join into one mesh object per group.
        objs = []
        for i, m in enumerate(meshes):
            ob = bpy.data.objects.new(f'{group}-{i}', m)
            bpy.context.scene.collection.objects.link(ob)
            objs.append(ob)
        with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, object=objs[0]):
            bpy.ops.object.join()
        joined = objs[0]
        joined.name = f'za-{group}'
        joined.data.name = f'za-{group}'
        joined.data.materials.clear()
        made.append(joined)
        print('GROUP', group, len(meshes), 'parts', len(joined.data.polygons), 'faces')

    bpy.data.libraries.write(out, set(made), fake_user=True)
    print('WROTE', out)


main()
