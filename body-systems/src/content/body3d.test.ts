import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BODY3D_PARTS } from './body3d';
import { STRUCTURES } from './structures';

/** Read mesh names from the GLB's JSON chunk (no WebGL needed). */
function glbMeshNames(path: string): string[] {
  const buf = readFileSync(path);
  expect(buf.toString('ascii', 0, 4)).toBe('glTF');
  const jsonLength = buf.readUInt32LE(12);
  expect(buf.toString('ascii', 16, 20)).toBe('JSON');
  const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLength));
  return json.nodes.filter((n: { mesh?: number }) => n.mesh !== undefined).map((n: { name: string }) => n.name);
}

describe('3D body model', () => {
  const names = glbMeshNames(resolve(process.cwd(), 'public/models/body.glb'));

  it('has exactly the meshes the catalogue describes', () => {
    expect(new Set(names)).toEqual(new Set(BODY3D_PARTS.map((p) => p.mesh)));
  });

  it('links covered meshes to real structures and marks the rest planned', () => {
    const ids = new Set(STRUCTURES.map((s) => s.id));
    for (const p of BODY3D_PARTS) {
      if (p.structureId) expect(ids.has(p.structureId), p.mesh).toBe(true);
      else expect(p.planned, p.mesh).toBe(true);
    }
  });

  it('stays small enough for tablets', () => {
    expect(readFileSync(resolve(process.cwd(), 'public/models/body.glb')).length).toBeLessThan(3_000_000);
  });
});
