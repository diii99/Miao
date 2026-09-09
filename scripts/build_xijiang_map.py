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

earth = material('Earth • moss and soil', (.055,.12,.025))
cliff = material('Cut earth • layered edge', (.065,.070,.052))
stone = material('River embankments • grey stone', (.23,.25,.24))
pathmat = material('Walking lanes • pale stone', (.32,.33,.32))
wood = material('Timber • aged chestnut', (.075,.042,.024))
wood2 = material('Timber • warm variation', (.13,.073,.037))
dark = material('Posts and balcony rails', (.033,.025,.020))
roofs = [material('Grey tile '+str(i), c) for i,c in enumerate([(.050,.056,.058),(.068,.072,.071),(.095,.099,.092),(.058,.064,.066)])]
window = material('Window glow', (.045,.057,.049), 0)
water = material('Baishui River', (.075,.17,.13))
materials[water].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.24
greens = [material('Forest '+str(i), c) for i,c in enumerate([(.025,.095,.018),(.055,.17,.026),(.11,.24,.040)])]
silver_metal = material('Necklace • brushed silver', (.52,.55,.57))
materials[silver_metal].node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.72
materials[silver_metal].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.32
plaza_dark = material('Plaza • charcoal stone inlay', (.075,.080,.078))
plaza_light = material('Plaza • pale limestone inlay', (.44,.43,.39))
fields = [material('Rice terraces '+str(i), c) for i,c in enumerate([(.19,.34,.035),(.27,.43,.055),(.12,.29,.023)])]

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
    value=bank+undulation
    # Broad, level civic core between the two streets. Dimensions are illustrative.
    def smooth(a,b,v):
        t=max(0,min(1,(v-a)/(b-a)))
        return t*t*(3-2*t)
    if z < river(x)-3.1:
        core=(1-smooth(11,19,abs(x+2)))*(1-smooth(15,23,distance))
        value=value*(1-core)+.48*core
    return value

# An oval cutaway contains a continuous valley rather than a square lawn.
verts=[(0,height(0,0),0)]
rings,steps=48,144
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
    if kind != 'plaza': ribbon(points,width,pathmat)

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
    for side in [-1,1]:
        for row in range(1,5):
            localz=side*d*.5*row/5
            yy=y+rise*(1-row/5)+.012
            verts=[]
            for dx,dz in [(-w/2,-.014),(w/2,-.014),(w/2,.014),(-w/2,.014)]:
                zz=localz+dz
                verts.append((x+dx*math.cos(angle)+zz*math.sin(angle),yy,z-dx*math.sin(angle)+zz*math.cos(angle)))
            meshpart(mat,verts,[(0,3,2,1)],tag)

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
    for level in range(stories):
        fy=floor+level*.64
        for off in [-.45,-.15,.15,.45]:
            xx=x+off*w*math.cos(angle)+(d/2+.035)*math.sin(angle)
            zz=z-off*w*math.sin(angle)+(d/2+.035)*math.cos(angle)
            verts=[(xx+dx*math.cos(angle),fy+dy,zz-dx*math.sin(angle)) for dx,dy in [(-.012,0),(.012,0),(.012,.60),(-.012,.60)]]
            meshpart(dark,verts,[(0,1,2,3)],tag)
        xx=x+(d/2+.08)*math.sin(angle);zz=z+(d/2+.08)*math.cos(angle)
        box(wood2,xx,fy+.04,zz,w+.12,.045,.12,angle,tag)
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
    # Covered timber bridge: a long gabled corridor, raised central pavilion,
    # substantial paired columns and transverse beams, as visible in reference 2.
    roof(x,2.05,z,6.15,2.05,.60,roofs[0],math.pi/2,tag)
    roof(x,2.62,z,2.25,2.28,.56,roofs[1],math.pi/2,tag)
    for dz in [-2.6,-1.3,0,1.3,2.6]:
        for sx in [-.56,.56]: box(wood2,x+sx,1.32,z+dz,.13,1.95,.13,tag=tag)
        box(wood2,x,1.95,z+dz,1.4,.13,.12,tag=tag)
        for sx in [-.42,.42]: box(dark,x+sx,1.72,z+dz,.10,.40,.10,tag=tag)
    for end in [-1,1]:
        for dx in [-.74,.74]:
            box(stone,x+dx,.18,z+end*2.7,.25,.52,.35,tag=tag)

# Deliberate clearings: each interaction point has a path-side entrance.
pois=[
 {'id':'gate','x':-28,'z':river(-28)+2.75},
 {'id':'lusheng','x':-6,'z':river(-6)-6.0},
 {'id':'bridge','x':0,'z':river(0)},
 {'id':'batik','x':-12,'z':river(-12)-6.15},
 {'id':'silver','x':-25,'z':river(-25)-9.55},
 {'id':'embroidery','x':12,'z':river(12)-12.95},
 {'id':'banquet','x':9,'z':river(9)+2.75},
 {'id':'lookout','x':0,'z':river(0)-23.15},
 {'id':'museum','x':3,'z':river(3)-9.55},
 {'id':'ancient-street','x':-17,'z':river(-17)-9.55},
 {'id':'youfang','x':7,'z':river(7)-2.75},
 {'id':'gaga','x':12,'z':river(12)-6.15},
 {'id':'yedong','x':12,'z':river(12)-19.75},
 {'id':'guzang','x':-12,'z':river(-12)-19.75},
 {'id':'terraces','x':23,'z':19},
 {'id':'necklace','x':18,'z':river(18)-6.15},
 {'id':'performance','x':-19,'z':river(-19)-6.15},
 {'id':'baishui','x':18,'z':river(18)+2.75},

]
for row in range(7):
    for col in range(24):
        x=-27+col*2.3+rng.uniform(-.28,.28);z=river(x)-4.45-row*3.4+rng.uniform(-.17,.17)
        if (x/35)**2+(z/30)**2>.91: continue
        if -14<x<9 and river(x)-13<z<river(x)-2.3: continue
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

# Irregular infill at the settlement edges, leaving civic spaces and all paths open.
# A separate seed makes this deterministic without shifting landmark design choices.
infill_rng=random.Random(92026)
added=0
for attempt in range(5000):
    if added>=115: break
    x=infill_rng.uniform(-32,31);z=infill_rng.uniform(-26,19)
    if (x/35)**2+(z/30)**2>.90: continue
    if abs(z-river(x))<3.6 or (x>10 and z>14): continue
    if -14<x<9 and river(x)-16<z<river(x)-2.3: continue
    if any(math.hypot(x-p['x'],z-p['z'])<3.4 for p in pois): continue
    if any(math.hypot(x-h['x'],z-h['z'])<h['radius']+.58 for h in houses): continue
    if any(any(math.hypot(x-q[0],z-q[2])<1.65 for q in path['points'][::2]) for path in paths): continue
    house(x,z,infill_rng.uniform(1.1,1.65),infill_rng.uniform(.85,1.2),infill_rng.choice([2,2,3]),infill_rng.uniform(-.32,.32))
    added+=1

for p in pois:
    x,z=p['x'],p['z'];tag=p['id'];y=height(x,z)+.1
    if tag in ['silver','batik','embroidery']:
        # Model behind the path, keep its entrance clear.
        house(x,z-1.8,2.5 if tag=='museum' else 2,1.8,2,0,tag)
        addpath([[x,y,z],[x,height(x,z-1)+.1,z-1]],.65)
    elif tag=='lusheng':
        y=.60
        box(pathmat,x,y-.12,z,8.5,.24,4.7,tag=tag)
        for dz in [-2.7,2.7]:
            for step in range(3): box(stone,x,y+.10+step*.13,z+dz+(1 if dz>0 else -1)*step*.35,9.4,.22,.4,tag=tag)
        # Reference panorama: enclosed grey-stone courtyard, concentric paving,
        # stepped ends and a timber performance frontage rather than a lone gazebo.
        for radius in [1.35,1.62,1.92,2.20]:
            pts=[(x+math.cos(i*math.tau/96)*radius*1.65,y+.008,z+math.sin(i*math.tau/96)*radius) for i in range(97)]
            ribbon(pts,.055,plaza_light,tag)
        for dx in [-4.85,4.85]:
            for dz in [-1.65,.95]:
                house(x+dx,z+dz,1.7,2.25,2,math.pi/2,tag)
        box(stone,x,y+.18,z-3.30,7.7,.38,1.5,tag=tag)
        box(wood,x,y+1.20,z-3.72,6.0,2.05,.65,tag=tag)
        roof(x,y+2.35,z-3.72,6.6,1.75,.64,roofs[0],tag=tag)
        box(plaza_dark,x,y+1.35,z-3.36,3.45,1.42,.03,tag=tag)
        for dx in [-2.85,-2.1,2.1,2.85]: box(wood2,x+dx,y+1.25,z-3.25,.13,2.25,.13,tag=tag)
        for dz in [-2,0,2]: addpath([[x-4,y,z+dz],[x+4,y,z+dz]],1.3,'plaza')
        for dx in [-3,0,3]:
            addpath([[x+dx,.40,river(x+dx)-2.75],[x+dx,y,z],[x+dx,.56,river(x+dx)-9.55]],.9)
    elif tag=='museum':
        for dx in [-2.8,0,2.8]:
            for dz in [-2.7,-5.2]: house(x+dx,z+dz,2.3,1.65,2,tag=tag)
        box(stone,x,y,z-3.8,8.6,.16,5.7,tag=tag)
        box(wood,x,y+.9,z-1.6,8.6,.12,.48,tag=tag)
        addpath([[x,y,z],[x,y,z-1.2]],1.1)
    elif tag in ['guzang','yedong']:
        house(x-1.8,z-1.8,2.9,2.1,2,tag=tag)
        house(x+1.5,z-2.1,2.1,1.7,2,tag=tag)
        box(stone,x,y,z,2.4,.18,1.1,tag=tag)
    elif tag=='performance':
        box(stone,x,y,z-1,5.4,.3,3,tag=tag)
        roof(x,y+2.3,z-2,5.8,2,.65,roofs[0],tag=tag)
        for dx in [-2.4,2.4]: box(dark,x+dx,y+1.1,z-2,.18,2.3,.18,tag=tag)
    elif tag=='necklace':
        box(pathmat,x,y-.04,z,6.4,.18,3.8,tag=tag)
        box(wood,x,y+.22,z-.70,2.25,.38,.52,tag=tag)
        # Three silver necklace rings visible across the actual square.
        for ringx,radius in [(-2,.57),(0,.72),(2,.57)]:
            vs=[];fs=[]
            for i in range(48):
                a=i*math.tau/48
                for j in range(6):
                    t=j*math.tau/6
                    rr=radius+.055*math.cos(t)
                    vs.append((x+ringx+rr*math.cos(a),y+.95+rr*math.sin(a),z-.75+.055*math.sin(t)))
            for i in range(48):
                for j in range(6): fs.append((i*6+j,((i+1)%48)*6+j,((i+1)%48)*6+(j+1)%6,i*6+(j+1)%6))
            meshpart(silver_metal,vs,fs,tag)
    elif tag=='terraces':
        pts=[]
        for j in range(81):
            zz=river(23)+2.75+(19-river(23)-2.75)*j/80
            pts.append([23,height(23,zz)+.1,zz])
        addpath(pts,.85)
        box(wood,x,y,z,2,.14,1.1,tag=tag)
    elif tag in ['ancient-street','youfang','gaga']:
        for dx in [-.7,.7]: box(dark,x+dx,y+.8,z,.12,1.6,.12,tag=tag)
        box(wood,x,y+1.6,z,1.6,.24,.15,tag=tag)
    elif tag in ['lookout']:

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
        x=12+j*.38;z=15+row*1.15+1.0*math.sin((x-12)*.16+row*.13)+.20*math.sin(x*.55+row*.3)
        if (x/37)**2+(z/32)**2<.95: pts.append([x,height(x,z)+.10,z])
    if len(pts)>2:
        ribbon(pts,.91,water if row%4==0 else fields[row%3]);ribbon([(x,y+.03,z+.51) for x,y,z in pts],.16,greens[2])

def tree(x,z,size):
    y=height(x,z)
    box(dark,x,y+size*.45,z,.12,size*.9,.12)
    vs=[]
    for ring,(yy,rr) in enumerate([(.55,.38),(.95,.72),(1.42,.57),(1.65,.20)]):
        for i in range(7):
            a=i*math.tau/7+ring*.12
            radius=size*rr*(1+.13*math.sin(i*2.7+ring))
            vs.append((x+math.cos(a)*radius,y+size*yy,z+math.sin(a)*radius))
    fs=[tuple(range(21,28))]
    for ring in range(3):
        for i in range(7):
            fs.append((ring*7+i,ring*7+(i+1)%7,(ring+1)*7+(i+1)%7,(ring+1)*7+i))
    meshpart(greens[rng.randrange(3)],vs,fs)
for i in range(650):
    x=rng.uniform(-36,36);z=rng.uniform(-31,29)
    if (x/37)**2+(z/32)**2>.97 or abs(z-river(x))<4: continue
    if x>10 and z>14: continue
    if -14<x<9 and river(x)-16<z<river(x)-2.3: continue
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
