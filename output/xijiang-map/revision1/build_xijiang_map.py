"""Research-led, schematic Xijiang diorama. Run through blender_map_bridge.py.
All coordinates are authored scene units, not surveyed metres/geographic data.
News images are reference-only and are not embedded as textures or AI input.
"""
import bpy
import math
import json
import random
from pathlib import Path
from mathutils import Vector

ROOT = Path('D:/Miao')
OUT = ROOT / 'public/map-assets/models'
SOURCE = ROOT / 'output/xijiang-map'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
rng = random.Random(90826)
scene = bpy.data.scenes.new('Xijiang • Research diorama')
bpy.context.window.scene = scene
buckets = {}
materials = {}

def material(name, color, emission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = .82
    if emission:
        p.inputs['Emission Color'].default_value = (*color, 1)
        p.inputs['Emission Strength'].default_value = emission
    materials[name] = m
    return name

earth = material('Earth • moss and soil', (.22,.29,.20))
cliff = material('Cut earth • layered edge', (.16,.20,.17))
stone = material('River embankments • grey stone', (.36,.39,.35))
pathmat = material('Walking lanes • pale stone', (.40,.41,.34))
wood = material('Timber • aged chestnut', (.24,.13,.075))
wood2 = material('Timber • warm variation', (.34,.22,.13))
dark = material('Posts and balcony rails', (.12,.08,.055))
roofs = [material('Grey tile '+str(i), c) for i,c in enumerate([(.16,.19,.20),(.22,.24,.23),(.27,.28,.26),(.19,.22,.24)])]
window = material('Window glow', (.92,.52,.18), .2)
water = material('Baishui River', (.13,.38,.39))
materials[water].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.24
greens = [material('Forest '+str(i), c) for i,c in enumerate([(.13,.25,.17),(.19,.32,.20),(.27,.38,.23)])]
fields = [material('Rice terraces '+str(i), c) for i,c in enumerate([(.39,.48,.22),(.49,.55,.28),(.57,.57,.31)])]

def meshpart(mat, verts, faces, tag=''):
    key = (mat,tag)
    v,f = buckets.setdefault(key, ([],[]))
    offset = len(v)
    # Three x,y,z -> Blender x,-z,y; exporter restores Three coordinates.
    v.extend((x,-z,y) for x,y,z in verts)
    f.extend(tuple(offset+i for i in face) for face in faces)

def box(mat, x,y,z, w,h,d, angle=0, tag=''):
    verts=[]
    for a,b,c in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:
        dx,dz=a*w/2,c*d/2
        verts.append((x+dx*math.cos(angle)+dz*math.sin(angle), y+b*h/2,z-dx*math.sin(angle)+dz*math.cos(angle)))
    meshpart(mat,verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)],tag)

def river(x): return 5 + 3.4*math.sin(x*.092) + .65*math.sin(x*.21)
def height(x,z):
    distance=abs(z-river(x))
    if distance<1.85: return -.62
    bank=.32 + max(0,distance-3.1)*(.58 if z<river(x) else .27)
    undulation=(math.sin(x*.15)*.5+math.cos(z*.17)*.3)*min(1,max(0,distance-3.1)/5)
    return bank+undulation

# An oval cutaway contains a continuous valley rather than a square lawn.
verts=[(0,height(0,0),0)]
rings,steps=70,192
for r in range(1,rings+1):
    for i in range(steps):
        t=i*math.tau/steps
        x=38*r/rings*math.cos(t)
        z=33*r/rings*math.sin(t)
        verts.append((x,height(x,z),z))
faces=[]
for i in range(steps): faces.append((0,1+(i+1)%steps,1+i))
for r in range(1,rings):
    for i in range(steps):
        a=1+(r-1)*steps+i;b=1+(r-1)*steps+(i+1)%steps;c=b+steps;d=a+steps
        faces.append((a,b,c,d))
meshpart(earth,verts,faces)
for i in range(steps):
    a=verts[1+(rings-1)*steps+i];b=verts[1+(rings-1)*steps+(i+1)%steps]
    meshpart(cliff,[a,b,(b[0],-2,b[2]),(a[0],-2,a[2])],[(0,1,2,3)])

def ribbon(points,width,mat,tag=''):
    vs=[]
    for i,p in enumerate(points):
        prev=points[max(0,i-1)];nxt=points[min(len(points)-1,i+1)]
        dx,dz=nxt[0]-prev[0],nxt[2]-prev[2]
        length=max(.001,math.hypot(dx,dz))
        vs.extend([(p[0]-dz/length*width/2,p[1],p[2]+dx/length*width/2),(p[0]+dz/length*width/2,p[1],p[2]-dx/length*width/2)])
    meshpart(mat,vs,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(points)-1)],tag)

ribbon([(x*.25,-.12,river(x*.25)) for x in range(-148,149)],3.65,water)
paths=[]
def addpath(points,width=.85,kind='lane'):
    paths.append({'points':points,'width':width,'kind':kind})
    ribbon(points,width,pathmat)

for side in [-1,1]:
    pts=[]
    for j in range(121):
        x=-30+j*.5;z=river(x)+side*2.75
        pts.append([x,.40,z])
        if j<120:
            box(stone,x,.02,river(x)+side*1.95,.54,.74,.22)
    addpath(pts,1.1)

def roof(x,y,z,w,d,rise,mat,angle=0,tag=''):
    # Shallow gables, modest overhangs and layered eaves; no fantasy spires.
    points=[(-w/2,0,-d/2),(w/2,0,-d/2),(-w/2,rise,0),(w/2,rise,0),(-w/2,0,d/2),(w/2,0,d/2)]
    vs=[(x+a*math.cos(angle)+c*math.sin(angle),y+b,z-a*math.sin(angle)+c*math.cos(angle)) for a,b,c in points]
    meshpart(mat,vs,[(0,2,3,1),(2,4,5,3),(0,4,2),(1,3,5)],tag)
    box(mat,x,y+rise,z,w+.04,.07,.08,angle,tag)

houses=[]
def house(x,z,w=1.8,d=1.5,stories=2,angle=0,tag=''):
    h=height(x,z);floor=h+.40;wall=stories*.64
    mat=wood if rng.random()<.6 else wood2
    box(stone,x,h+.05,z,w,.2,d,angle,tag)
    box(mat,x,floor+wall/2,z,w,wall,d,angle,tag)
    for sx in [-.4,.4]:
        for sz in [-.36,.36]:
            xx=x+sx*w*math.cos(angle)+sz*d*math.sin(angle);zz=z-sx*w*math.sin(angle)+sz*d*math.cos(angle)
            bottom=min(height(xx,zz)-.1,h)
            box(dark,xx,(bottom+floor)/2,zz,.10,floor-bottom,.10,angle,tag)
    roof(x,floor+wall+.05,z,w+.35,d+.38,.43,roofs[rng.randrange(4)],angle,tag)
    # Balcony and lit window ribbons follow the front facade.
    dz=d/2+.10
    xx=x+dz*math.sin(angle);zz=z+dz*math.cos(angle)
    box(dark,xx,floor+.62,zz,w+.15,.09,.34,angle,tag)
    box(dark,xx,floor+.95,zz,w+.1,.065,.07,angle,tag)
    for off in [-.32,0,.32]:
        xx=x+off*w*math.cos(angle)+(d/2+.015)*math.sin(angle);zz=z-off*w*math.sin(angle)+(d/2+.015)*math.cos(angle)
        box(window,xx,floor+wall-.28,zz,.21,.24,.025,angle,tag)
        box(dark,xx,floor+.79,zz,.045,.34,.08,angle,tag)
    houses.append({'x':x,'z':z,'radius':math.hypot(w,d)/2+.25,'tag':tag})

# Back slope contour lanes and two switchback spines are all connected.
for row in range(1,7):
    offset=-2.75-row*3.4
    pts=[]
    for j in range(109):
        x=-27+j*.5;z=river(x)+offset
        pts.append([x,height(x,z)+.08,z])
    addpath(pts,.72)
for x in [-25,-12,0,12,25]:
    pts=[]
    for j in range(103):
        z=river(x)-2.75-j*.2
        pts.append([x,height(x,z)+.09,z])
    addpath(pts,.75,'steps')
    for p in pts[::2]: box(stone,p[0],p[1]-.035,p[2],.80,.10,.26)

# River crossings use independent flat bridge-deck heights and connect both paths.
bridges=[]
for index,x in enumerate([-18,0,18]):
    z=river(x);tag='bridge' if index==1 else ''
    bridges.append({'x':x,'z':z,'halfLength':2.95,'halfWidth':.68,'height':.46})
    addpath([[x,.46,z-2.75],[x,.46,z+2.75]],1.15,'bridge')
    box(wood,x,.35,z,1.3,.22,5.9,tag=tag)
    for sx in [-.55,.55]:
        box(dark,x+sx,.87,z,.065,.07,5.7,tag=tag)
        for dz in [-2.6,-1.3,0,1.3,2.6]: box(dark,x+sx,1.1,z+dz,.09,1.35,.09,tag=tag)
    for dz in [-1.9,0,1.9]: roof(x,1.86,z+dz,2.1,1.9,.45,roofs[0],math.pi/2,tag)

# Deliberate clearings: each interaction point has a path-side entrance.
pois=[
 {'id':'gate','x':-28,'z':river(-28)+2.75},
 {'id':'lusheng','x':-6,'z':river(-6)-2.75},
 {'id':'bridge','x':0,'z':river(0)},
 {'id':'batik','x':-12,'z':river(-12)-6.15},
 {'id':'silver','x':-25,'z':river(-25)-9.55},
 {'id':'embroidery','x':12,'z':river(12)-12.95},
 {'id':'banquet','x':9,'z':river(9)+2.75},
 {'id':'lookout','x':0,'z':river(0)-23.15},
 {'id':'museum','x':5,'z':river(5)-6.15},
]
for row in range(7):
    for col in range(24):
        x=-27+col*2.3+rng.uniform(-.28,.28);z=river(x)-4.45-row*3.4+rng.uniform(-.17,.17)
        if (x/35)**2+(z/30)**2>.91: continue
        if any(abs(x-s)<1.15 for s in [-25,-12,0,12,25]): continue
        if any(math.hypot(x-p['x'],z-p['z'])<2.65 for p in pois): continue
        house(x,z-.54,rng.uniform(1.6,2),rng.uniform(.85,1.0),rng.choice([2,2,3]),rng.uniform(-.09,.09))
        if rng.random()<.84:
            house(x+rng.uniform(-.18,.18),z+.62,rng.uniform(1.5,1.95),rng.uniform(.85,1.0),rng.choice([1,2,2]),rng.uniform(-.12,.12))
for row in range(3):
    for col in range(17):
        x=-27+col*2.45;z=river(x)+4.7+row*2.9
        if abs(x)<1.5 or abs(x+18)<1.4 or any(math.hypot(x-p['x'],z-p['z'])<2.7 for p in pois): continue
        house(x,z,1.8,1.5,rng.choice([1,2,2]),rng.uniform(-.12,.12))

for p in pois:
    x,z=p['x'],p['z'];tag=p['id'];y=height(x,z)+.1
    if tag in ['silver','batik','embroidery','museum']:
        # Model behind the path, keep its entrance clear.
        house(x,z-1.8,2.5 if tag=='museum' else 2,1.8,2,0,tag)
        addpath([[x,y,z],[x,height(x,z-1)+.1,z-1]],.65)
    elif tag in ['lookout','lusheng']:
        box(stone,x,y-.07,z,3.6,.25,2.1,tag=tag)
        if tag=='lookout':
            for dx in [-1.7,1.7]: box(dark,x+dx,y+.35,z,.08,.65,2,tag=tag)
            box(dark,x,y+.65,z-1,3.5,.07,.08,tag=tag)
    elif tag=='banquet':
        box(wood2,x,y+.45,z+1.0,3,.13,.55,tag=tag)
        for dx in [-1.2,1.2]: box(dark,x+dx,y+.2,z+1,.1,.45,.45,tag=tag)

# Nested curved paddies occupy the open foreground shoulder.
for row in range(9):
    pts=[]
    for j in range(51):
        x=12+j*.38;z=15+row*1.15+1.3*math.sin((x-12)*.13)
        if (x/37)**2+(z/32)**2<.95: pts.append([x,height(x,z)+.10,z])
    if len(pts)>2:
        ribbon(pts,.91,fields[row%3]);ribbon([(x,y+.01,z+.51) for x,y,z in pts],.12,stone)

def tree(x,z,size):
    y=height(x,z)
    box(dark,x,y+size*.45,z,.12,size*.9,.12)
    vs=[(x,y+size*1.8,z)]
    for ring in range(2):
        for i in range(7):
            a=i*math.tau/7
            vs.append((x+math.cos(a)*size*(.63 if ring==0 else .44),y+size*(.8 if ring==0 else 1.4),z+math.sin(a)*size*(.63 if ring==0 else .44)))
    fs=[(0,8+i,8+(i+1)%7) for i in range(7)]
    fs += [(1+i,1+(i+1)%7,8+(i+1)%7,8+i) for i in range(7)]
    meshpart(greens[rng.randrange(3)],vs,fs)
for i in range(650):
    x=rng.uniform(-36,36);z=rng.uniform(-31,29)
    if (x/37)**2+(z/32)**2>.97 or abs(z-river(x))<4: continue
    if x>10 and z>14: continue
    if any(math.hypot(x-h['x'],z-h['z'])<h['radius']+.6 for h in houses): continue
    if any(math.hypot(x-p['x'],z-p['z'])<2.3 for p in pois): continue
    if any(any(math.hypot(x-q[0],z-q[2])<.75 for q in path['points'][::2]) for path in paths): continue
    tree(x,z,rng.uniform(.6,1.25))

for (mat,tag),(vs,fs) in buckets.items():
    mesh=bpy.data.meshes.new(mat)
    mesh.from_pydata(vs,[],fs);mesh.update()
    obj=bpy.data.objects.new((tag+' • ' if tag else '')+mat,mesh)
    scene.collection.objects.link(obj);obj.data.materials.append(materials[mat])
    if tag: obj['poiId']=tag

scene.world=bpy.data.worlds.new('Soft overcast')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.76,.78,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
sun_data=bpy.data.lights.new('Afternoon sun','SUN');sun_data.energy=2;sun_data.angle=.3
sun=bpy.data.objects.new('Afternoon sun',sun_data);scene.collection.objects.link(sun);sun.rotation_euler=(.4,-.5,-.4)
cam_data=bpy.data.cameras.new('Valley overview');cam=bpy.data.objects.new('Valley overview',cam_data);scene.collection.objects.link(cam)
cam.location=(46,-65,53);direction=Vector((0,0,2))-cam.location;cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
cam_data.type='ORTHO';cam_data.ortho_scale=88;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(SOURCE/'blender-overview.png')
# Export geometry only, preserving map POI extras and shared materials.
bpy.ops.export_scene.gltf(filepath=str(OUT/'xijiang-valley.glb'),export_format='GLB',use_active_scene=True,export_extras=True,export_cameras=False,export_lights=False)
data={'version':'2026-09-08','status':'research-based spatial illustration','coordinateSystem':'authored x/y/z scene units; no surveyed scale or north','paths':paths,'bridges':bridges,'pois':pois,'buildings':houses}
(ROOT/'src/map-3d/xijiang-layout.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'xijiang-valley.blend'),copy=True)
result={'buildings':len(houses),'meshes':len(buckets),'paths':len(paths),'glbBytes':(OUT/'xijiang-valley.glb').stat().st_size,'blend':str(SOURCE/'xijiang-valley.blend')}
