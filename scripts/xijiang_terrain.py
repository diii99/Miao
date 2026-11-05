"""Shared formula mirrored by src/map-3d/terrain.ts; values from sampled GLO-30."""
import math,json
from pathlib import Path
DATA=json.loads((Path(__file__).resolve().parents[1]/'src/map-3d/xijiang-terrain.json').read_text(encoding='utf-8'))
def river(x): return 5+3.4*math.sin(x*.092)+.65*math.sin(x*.21)
def interp(values,d):
    distances=DATA['distancesM'];v=max(0,min(d,distances[-1]));i=min(len(distances)-2,int(v/(distances[1]-distances[0])))
    t=(v-distances[i])/(distances[i+1]-distances[i]);return values[i]+(values[i+1]-values[i])*t
def natural_height(x,z):
    d=abs(z-river(x))
    if d<1.85: return -.62
    if d<=3.1: return .32
    profiles=DATA['profiles'];idx=next((i for i in range(len(profiles)-1) if x<=profiles[i+1]['sceneX']),len(profiles)-2)
    a,b=profiles[idx:idx+2];t=max(0,min(1,(x-a['sceneX'])/(b['sceneX']-a['sceneX'])))
    side='ne' if z<river(x) else 'sw'
    def rise(p): return max(0,interp(p[side],d*10)-interp(p[side],31))/10
    return .32+rise(a)*(1-t)+rise(b)*t
# Only the civic courtyard and individual landmark platforms are graded.
# The extensive former flat central hillside is deliberately removed.
PADS=[{'id':'lusheng','x':-6,'z':river(-6)-7.2,'halfWidth':5.9,'halfDepth':3.35,'y':.48,'feather':1.15}]
def contour(row,x): return river(x)-2.75-row*3.4+(.48*math.sin(x*.19+row*.83)+.18*math.sin(x*.37-row*.62) if row else 0)
for name,x,row,dz,w,d in [('museum',3,2,-3.45,4.4,3.55),('necklace',18,1,0,3.25,1.95),('performance',-19,1,-1.15,2.8,1.7),('lookout',-10,0,0,1.9,1.15)]:
    entrance_z=24 if name=='lookout' else contour(row,x)
    PADS.append({'id':name,'x':x,'z':entrance_z+dz,'halfWidth':w,'halfDepth':d,'y':natural_height(x,entrance_z),'feather':1.0})
def height(x,z):
    value=natural_height(x,z)
    for p in PADS:
        d=max(abs(x-p['x'])-p['halfWidth'],abs(z-p['z'])-p['halfDepth'],0)
        if d>=p['feather']: continue
        t=d/p['feather'];weight=1-t*t*(3-2*t)
        value=value*(1-weight)+p['y']*weight
    return value


def make_walkway_grader(paths):
    """Local cut/fill benches beneath walkways; retain the measured hills elsewhere."""
    cells={}
    for path in paths:
        if path['kind']=='bridge': continue
        radius=path['width']/2+.20
        for a,b in zip(path['points'],path['points'][1:]):
            dx,dz=b[0]-a[0],b[2]-a[2];length2=dx*dx+dz*dz
            if length2<1e-10: continue
            item=(a,b,dx,dz,length2,radius)
            margin=radius+.28
            for xx in range(math.floor(min(a[0],b[0])-margin),math.floor(max(a[0],b[0])+margin)+1):
                for zz in range(math.floor(min(a[2],b[2])-margin),math.floor(max(a[2],b[2])+margin)+1): cells.setdefault((xx,zz),[]).append(item)
    def grade(x,z,base):
        if abs(z-river(x))<1.85: return base
        best=None
        for a,b,dx,dz,length2,radius in cells.get((math.floor(x),math.floor(z)),[]):
            t=max(0,min(1,((x-a[0])*dx+(z-a[2])*dz)/length2))
            distance=math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)
            if distance>radius+.28: continue
            weight=1-max(0,min(1,(distance-radius)/.28))
            candidate=base*(1-weight)+(a[1]+(b[1]-a[1])*t-.10)*weight
            best=candidate if best is None else min(best,candidate)
        return base if best is None else best
    return grade
