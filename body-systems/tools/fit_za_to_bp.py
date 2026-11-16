import json, os, sys
D=sys.argv[1]
za=json.load(open(f'{D}/za_bounds.json'))
pairs={'Femur.r':'FMA24474','Femur.l':'FMA24475','Trachea':'FMA7394','Body of sternum':'FMA7487','Hip bone.r':'FMA16586','Hip bone.l':'FMA16587','Frontal bone':'FMA52734','Sacrum':'FMA16178' if False else 'FMA16202','Clavicle.r':'FMA13322','Clavicle.l':'FMA13323','Humerus.r':'FMA23130','Humerus.l':'FMA23131','Tibia.r':'FMA24477','Liver':'FMA7197','Kidney.r':'FMA7204'}
el={}
for line in open(f'{D}/bp3d-dl/partof_element_parts.txt').read().splitlines()[1:]:
    c,_,f=line.split('\t'); el.setdefault(c,[]).append(f)
def bp_bounds(c):
    lo=[1e9]*3; hi=[-1e9]*3
    for f in el[c]:
        for line in open(f'{D}/bp3d-dl/partof_BP3D_4.0_obj_99/{f}.obj'):
            if line.startswith('v '):
                v=[float(x)/1000 for x in line.split()[1:4]]
                for i in range(3): lo[i]=min(lo[i],v[i]); hi[i]=max(hi[i],v[i])
    return lo,hi
rows=[]
for zn,c in pairs.items():
    if zn not in za: continue
    blo,bhi=bp_bounds(c); zlo,zhi=za[zn]
    for i in range(3):
        rows.append((i,(zlo[i]+zhi[i])/2,(blo[i]+bhi[i])/2,zn))
# per-axis fit bp = s*za + t with shared uniform s
import itertools
best=None
for s in [x/1000 for x in range(900,1101)]:
    t=[0,0,0]; err=0
    for i in range(3):
        r=[b - s*z for (ax,z,b,_) in rows if ax==i]; t[i]=sum(r)/len(r)
        err+=sum((b-(s*z+t[i]))**2 for (ax,z,b,_) in rows if ax==i)
    if best is None or err<best[0]: best=(err,s,t)
err,s,t=best
print('scale',s,'t',[round(x,4) for x in t],'rmse_mm',round((err/len(rows))**.5*1000,1))
for (i,z,b,n) in rows:
    r=(s*z+t[i])-b
    if abs(r)>0.02: print('  resid', n, 'xyz'[i], round(r*1000,1),'mm')
json.dump({'scale':s,'t':t},open(f'{D}/za_to_bp.json','w'))
