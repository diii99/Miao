"""Research-led, schematic Xijiang diorama. Run with Blender --background --python.
Terrain sectional grades use sampled GLO-30 at equal 10 m/unit scales.
River, streets and buildings remain authored schematic geometry.
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
soil = material('Terrace risers and exposed soil', (.15,.13,.076))
pebbles = material('River gravel', (.33,.35,.31))
leaf = material('Rice shoots', (.22,.38,.056))
linen = material('Indigo drying cloth', (.026,.073,.13))
lantern = material('Lantern paper', (.43,.21,.06))
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

import sys
sys.path.insert(0,str(ROOT/'scripts'))
from xijiang_terrain import river, height, natural_height, PADS, make_walkway_grader, DATA as TERRAIN_DATA

# An oval cutaway contains a continuous valley rather than a square lawn.
verts=[(0,height(0,0),0)]
rings,steps=180,360
for r in range(1,rings+1):
    for i in range(steps):
        t=i*math.tau/steps
        edge=1+.025*math.sin(5*t)+.018*math.sin(9*t)
        x=46*r/rings*math.cos(t)*edge
        z=39*r/rings*math.sin(t)*edge
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

ribbon([(x*.25,-.12,river(x*.25)) for x in range(-181,182)],3.65,water)
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

def beam(mat,a,b,width=.045,tag=''):
    direction=Vector(b)-Vector(a)
    u=direction.cross(Vector((0,1,0)))
    if u.length<.0001: u=direction.cross(Vector((1,0,0)))
    u.normalize();u*=width/2
    v=direction.normalized().cross(u)
    vs=[tuple(Vector(p)+su*u+sv*v) for p in [a,b] for su,sv in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    meshpart(mat,vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],tag)

houses=[]
foundation_supports=[]
def house(x,z,w=1.8,d=1.5,stories=2,angle=0,tag=''):
    if not tag:
        ca,sa=math.cos(angle),math.sin(angle)
        for path in paths:
            margin=path['width']/2+.08
            for q in path['points'][::2]:
                dx,dz=q[0]-x,q[2]-z
                if abs(dx*ca-dz*sa)<w/2+margin and -d/2-margin<dx*sa+dz*ca<d/2+.37+margin: return
    h=height(x,z)
    footprint=[(x+a*math.cos(angle)+c*math.sin(angle),z-a*math.sin(angle)+c*math.cos(angle)) for a in [-w/2,w/2] for c in [-d/2,d/2]]
    floor=max(h+.40,max(height(xx,zz) for xx,zz in footprint)+.16);wall=stories*.64
    mat=wood if rng.random()<.6 else wood2
    def pos(a,y,c): return (x+a*math.cos(angle)+c*math.sin(angle),y,z-a*math.sin(angle)+c*math.cos(angle))
    def part(m,a,y,c,ww,hh,dd):
        xx,_,zz=pos(a,y,c);box(m,xx,y,zz,ww,hh,dd,angle,tag)
    def face(m,a,y,c,ww,hh):
        meshpart(m,[pos(a-ww/2,y-hh/2,c),pos(a+ww/2,y-hh/2,c),pos(a+ww/2,y+hh/2,c),pos(a-ww/2,y+hh/2,c)],[(0,1,2,3) if c>=0 else (3,2,1,0)],tag)
    box(dark,x,floor-.07,z,w,.14,d,angle,tag)
    # Separate rear stone footings and variable downhill timber supports.
    for a in [-w*.38,w*.38]:
        xx,_,zz=pos(a,0,-d*.38);ground=height(xx,zz)
        box(stone,xx,ground+.10,zz,.30,.20,.28,angle,tag)
        foundation_supports.append((xx,zz,ground,.30,.28,angle,tag))
    box(mat,x,floor+wall/2,z,w,wall,d,angle,tag)
    # Tall downhill posts, cross-braces and exposed underside reveal the stilt structure.
    for side in [-1,1]:
        bases=[]
        for a in [-w*.42,0,w*.42]:
            xx,_,zz=pos(a,0,side*d*.41)
            bottom=height(xx,zz)-.12
            part(dark,a,(bottom+floor)/2,side*d*.41,.075,floor-bottom,.075)
            part(stone,a,bottom+.06,side*d*.41,.17,.12,.17)
            foundation_supports.append((xx,zz,bottom,.17,.17,angle,tag))
            bases.append((a,bottom+.10))
        beam(wood2,pos(bases[0][0],bases[0][1],side*d*.41),pos(bases[-1][0],floor-.04,side*d*.41),.045,tag)
    roofmat=roofs[rng.randrange(4)]
    roof(x,floor+wall+.05,z,w+.35,d+.38,.43,roofmat,angle,tag)
    # Exposed rafters under both eaves and thick ridge/end tiles.
    for side in [-1,1]:
        for i in range(max(4,int(w/.27))):
            part(wood2,-w/2+i*.27,floor+wall+.015,side*(d/2+.08),.055,.07,.27)
        part(dark,0,floor+wall-.025,side*(d/2+.04),w+.2,.09,.095)
    # Two long timber facades, each with floor beams, plank joints and window lattice.
    for side in [-1,1]:
        c=side*(d/2+.022)
        for level in range(stories):
            fy=floor+level*.64
            face(wood2,0,fy+.035,c,w+.10,.07)
            for a in [-w*.44,-w*.16,w*.16,w*.44]: face(dark,a,fy+.32,c,.042,.59)
            for a in [-w*.30,0,w*.30]:
                face(window,a,fy+.35,c+side*.014,.22,.29)
                face(wood2,a,fy+.20,c+side*.025,.25,.025)
                face(wood2,a,fy+.50,c+side*.025,.25,.025)
                for off in [-.07,0,.07]: face(dark,a+off,fy+.35,c+side*.028,.012,.28)
                face(dark,a,fy+.37,c+side*.029,.22,.015)
    # Continuous upper balcony, fine upright rails and corner braces.
    balcony=floor+.64 if stories>1 else floor+.08
    front=d/2+.19
    part(dark,0,balcony,front,w+.14,.075,.42)
    part(wood2,0,balcony+.31,front+.17,w+.14,.045,.045)
    part(wood2,0,balcony+.075,front+.17,w+.14,.03,.035)
    for i in range(max(5,int(w/.13))+1):
        a=-w/2+i*w/max(5,int(w/.13))
        part(dark,a,balcony+.19,front+.17,.026,.29,.03)
    for a in [-w*.44,w*.44]:
        beam(wood2,pos(a,balcony-.23,d/2),pos(a,balcony-.015,front+.13),.045,tag)
    # A recessed door, panel joints and small domestic variations at pedestrian scale.
    face(dark,-w*.18,floor+.25,d/2+.045,.28,.5)
    part(wood2,-w*.18,floor+.5,d/2+.05,.33,.045,.06)
    part(stone,-w*.18,floor-.04,d/2+.14,.40,.08,.24)
    if len(houses)%9==0:
        face(linen,w*.18,balcony+.16,front+.195,.36,.30)
    if len(houses)%7==0:
        part(lantern,w*.37,floor+wall-.18,d/2+.15,.12,.17,.12)
        part(dark,w*.37,floor+wall-.31,d/2+.15,.025,.10,.025)
    houses.append({'x':x,'z':z,'radius':math.hypot(w,d)/2+.25,'tag':tag,'floorY':floor,'footprint':[[xx,height(xx,zz),zz] for xx,zz in footprint]})

def contour(row,x):
    return river(x)-2.75-row*3.4 + (.48*math.sin(x*.19+row*.83)+.18*math.sin(x*.37-row*.62) if row else 0)

# Contour lanes follow the hillside; all share a connected path graph.
for row in range(1,7):
    offset=-2.75-row*3.4
    pts=[]
    for j in range(109):
        x=-27+j*.5;z=contour(row,x)
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
for index,x in enumerate([-26,-18,-9,0,9,18,26]):
    z=river(x);tag='bridge' if x==0 else ''
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

# Stone-faced bridge piers, corridor seats and vertical balusters visible in river photos.
for bridge in bridges:
    x,z=bridge['x'],bridge['z']
    tag='bridge' if x==0 else ''
    for dz in [-1.8,1.8]: box(stone,x,-.16,z+dz,1.12,1.05,.46,tag=tag)
    for side in [-1,1]:
        box(wood2,x+side*.46,.70,z,.18,.11,4.9,tag=tag)
        for j in range(26): box(dark,x+side*.56,.68,z-2.5+j*.2,.035,.48,.035,tag=tag)
        for dz in [-2,0,2]:
            box(lantern,x+side*.48,1.78,z+dz,.13,.23,.13,tag=tag)
            box(dark,x+side*.48,1.6,z+dz,.025,.10,.025,tag=tag)

# Jointed retaining walls, riverside rails, drainage slots and shallow gravel shoals.
for side in [-1,1]:
    for j in range(119):
        x=-29.5+j*.5;zz=river(x)+side*1.96
        if any(abs(x-b['x'])<.82 for b in bridges): continue
        for row in range(3):
            xx=x+(row%2)*.24
            box(pebbles if (j+row)%4==0 else stone,xx,-.25+row*.20,river(xx)+side*1.94,.45,.17,.24)
        if j%3==0:
            box(stone,x,.57,river(x)+side*2.08,.12,.50,.12)
            nxt=x+1.5
            beam(dark,(x,.79,river(x)+side*2.08),(nxt,.79,river(nxt)+side*2.08),.065)
        if j%11==0: box(dark,x,.12,river(x)+side*1.80,.17,.075,.025)
    for j in range(90):
        x=-29+j*.64;zz=river(x)+side*(1.35+.18*math.sin(x*.8))
        if any(abs(x-b['x'])<.85 for b in bridges): continue
        rock_rng=random.Random(j+1000*side)
        x+=rock_rng.uniform(-.18,.18);zz+=rock_rng.uniform(-.18,.18)
        rx=rock_rng.uniform(.13,.29);rz=rock_rng.uniform(.09,.18)
        vs=[]
        for yy,scale in [(-.16,1),(-.075,.78)]:
            for k in range(7):
                t=k*math.tau/7+j*.73;r=1+rock_rng.uniform(-.18,.18)
                vs.append((x+math.cos(t)*rx*r*scale,yy,zz+math.sin(t)*rz*r*scale))
        meshpart(pebbles,vs,[tuple(range(7,14))]+[(k,(k+1)%7,(k+1)%7+7,k+7) for k in range(7)])

# Deliberate clearings: each interaction point has a path-side entrance.
pois=[
 {'id':'gate','x':-28,'z':river(-28)+2.75},
 {'id':'lusheng','x':-6,'z':river(-6)-6.0},
 {'id':'bridge','x':0,'z':river(0)},
 {'id':'batik','x':-12,'z':river(-12)-6.15},
 {'id':'silver','x':-25,'z':river(-25)-9.55},
 {'id':'embroidery','x':12,'z':river(12)-12.95},
 {'id':'banquet','x':9,'z':river(9)+2.75},
 {'id':'lookout','x':-10,'z':24},
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
# Each entrance stays on the contour path that owns it as the lanes bend.
entrance_rows={'batik':1,'silver':2,'embroidery':3,'museum':2,'ancient-street':2,'gaga':1,'yedong':5,'guzang':5,'necklace':1,'performance':1}
for p in pois:
    if p['id'] in entrance_rows: p['z']=contour(entrance_rows[p['id']],p['x'])
# Across-river lookout is reached by a continuous switchback trail above the far bank.
lookout_turns=[(-9,river(-9)+2.75),(-9,11),(-14,14),(-9,17.5),(-14,21),(-10,24)]
lookout_points=[]
for a,b in zip(lookout_turns,lookout_turns[1:]):
    count=max(2,math.ceil(math.hypot(b[0]-a[0],b[1]-a[1])/.16))
    for i in range(count):
        x=a[0]+(b[0]-a[0])*i/count;z=a[1]+(b[1]-a[1])*i/count
        lookout_points.append([x,height(x,z)+.09,z])
lookout_points.append([-10,height(-10,24)+.09,24])
addpath(lookout_points,.85,'steps')
for i,p in enumerate(lookout_points):
    if i%3==0:
        prev=lookout_points[max(0,i-1)];angle=math.atan2(p[0]-prev[0],p[2]-prev[2])
        box(stone,p[0],p[1]-.02,p[2],.89,.09,.17,angle)
for row in range(7):
    for col in range(24):
        x=-27+col*2.3+rng.uniform(-.55,.55);z=contour(row,x)-1.7+rng.uniform(-.26,.26)
        if (x/35)**2+(z/30)**2>.91: continue
        if -14<x<9 and river(x)-13<z<river(x)-2.3: continue
        if any(abs(x-s)<1.15 for s in [-25,-12,0,12,25]): continue
        if any(math.hypot(x-p['x'],z-p['z'])<2.65 for p in pois): continue
        house(x,z-.54,rng.uniform(1.6,2),rng.uniform(.85,1.0),rng.choice([2,2,3]),-math.atan((contour(row,x+.1)-contour(row,x-.1))/.2)+rng.uniform(-.13,.13))
        if rng.random()<.84:
            house(x+rng.uniform(-.18,.18),z+.62,rng.uniform(1.5,1.95),rng.uniform(.85,1.0),rng.choice([1,2,2]),rng.uniform(-.30,.30))
for row in range(3):
    for col in range(17):
        x=-27+col*2.45+rng.uniform(-.35,.35);z=river(x)+4.7+row*2.9+rng.uniform(-.22,.22)
        if any(abs(x-b['x'])<1.45 for b in bridges) or any(math.hypot(x-p['x'],z-p['z'])<2.7 for p in pois): continue
        house(x,z,1.8,1.5,rng.choice([1,2,2]),rng.uniform(-.30,.30))

# Irregular infill at the settlement edges, leaving civic spaces and all paths open.
# A separate seed makes this deterministic without shifting landmark design choices.
infill_rng=random.Random(92026)
added=0
for attempt in range(16000):
    if added>=195: break
    x=infill_rng.uniform(-37,36);z=infill_rng.uniform(-32,26)
    if (x/39)**2+(z/35)**2>.93: continue
    if abs(z-river(x))<3.6 or (x>10 and z>14): continue
    if -14<x<9 and river(x)-16<z<river(x)-2.3: continue
    if any(math.hypot(x-p['x'],z-p['z'])<3.4 for p in pois): continue
    if any(math.hypot(x-h['x'],z-h['z'])<h['radius']+.58 for h in houses): continue
    if any(any(math.hypot(x-q[0],z-q[2])<1.65 for q in path['points'][::2]) for path in paths): continue
    count_before=len(houses)
    house(x,z,infill_rng.uniform(1.1,1.65),infill_rng.uniform(.85,1.2),infill_rng.choice([2,2,3]),infill_rng.uniform(-.32,.32))
    added+=len(houses)-count_before

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
            xx=x+dx
            # Dense connector follows the graded site and joins the actual contour.
            end_z=contour(2,xx)
            points=[]
            for i in range(65):
                zz=(river(xx)-2.75)+(end_z-(river(xx)-2.75))*i/64
                yy=y if abs(xx-x)<=4 and abs(zz-z)<=2.15 else height(xx,zz)+.08
                points.append([xx,yy,zz])
            addpath(points,.9)
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
            box(dark,x,y+.65,z+1,3.5,.07,.08,tag=tag)
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
        ribbon(pts,.91,water if row%4==0 else fields[row%3])
        ribbon([(x,y-.025,z+.53) for x,y,z in pts],.23,soil)
        ribbon([(x,y+.03,z+.51) for x,y,z in pts],.13,greens[2])
        # Water channels and regularly planted shoots within irregular field boundaries.
        for k,(x,y,z) in enumerate(pts):
            if k%2==0 and row%4!=0:
                for off in [-.28,0,.28]:
                    meshpart(leaf,[(x-.025,y,z+off),(x+.025,y,z+off),(x+.015,y+.17,z+off+.03)],[(0,1,2)])
        for j in [13,30]:
            if j<len(pts):
                x,y,z=pts[j];ribbon([(x,y+.018,z-.48),(x+.15,y+.018,z+.48)],.09,soil)

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
for i in range(1500):
    x=rng.uniform(-43,43);z=rng.uniform(-36,35)
    if (x/45)**2+(z/38)**2>.97 or abs(z-river(x))<4: continue
    if x>10 and z>14: continue
    if -14<x<9 and river(x)-16<z<river(x)-2.3: continue
    if any(math.hypot(x-h['x'],z-h['z'])<h['radius']+.6 for h in houses): continue
    if any(math.hypot(x-p['x'],z-p['z'])<2.3 for p in pois): continue
    if any(any(math.hypot(x-q[0],z-q[2])<.75 for q in path['points'][::2]) for path in paths): continue
    tree(x,z,rng.uniform(.75,1.8) if abs(x)>32 or abs(z)>27 else rng.uniform(.6,1.25))

# Original procedural textures: grain, overlapping tiles and small-scale stone joints.
# They are generated from a fixed seed; no reference photographs are distributed.
def surface_texture(name,kind):
    size=128;image=bpy.data.images.new(name,width=size,height=size)
    pixels=[];noise=random.Random(410 if kind=='wood' else 420 if kind=='roof' else 430)
    for j in range(size):
        for i in range(size):
            grain=noise.uniform(-.04,.04)
            if kind=='wood':
                value=.83+.08*math.sin(i*.55+1.2*math.sin(j*.065))+grain
                if i%32<1: value=.48
            elif kind=='roof':
                value=.79+.09*math.sin((i%16)/16*math.pi)+grain
                if j%32<2: value=.43
                if i%16<1: value*=.73
            else:
                value=.78+.07*math.sin((i//32)*4+(j//24)*3)+grain
                if j%24<2 or (i+(16 if (j//24)%2 else 0))%32<2: value=.44
            pixels.extend((value,value,value,1))
    image.pixels=pixels;image.pack()
    return image
textures={kind:surface_texture('Xijiang procedural '+kind,kind) for kind in ['wood','roof','stone']}
for name in [wood,wood2,*roofs,stone,pathmat]:
    m=materials[name];nodes=m.node_tree.nodes;links=m.node_tree.links
    kind='wood' if name in [wood,wood2] else 'roof' if name in roofs else 'stone'
    tex=nodes.new('ShaderNodeTexImage');tex.image=textures[kind]
    # glTF exports the image plus a material tint. Restore the tint after export below.
    links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])

# Cut/fill lane benches after every path is known; same equation as runtime terrain.
walkway_grade=make_walkway_grader(paths)
# Extend footings down through any new road cut, maintaining ground contact.
for xx,zz,old_bottom,ww,dd,angle,tag in foundation_supports:
    ground=walkway_grade(xx,zz,height(xx,zz))-.04
    if ground<old_bottom:
        box(stone,xx,(ground+old_bottom+.03)/2,zz,ww,old_bottom+.03-ground,dd,angle,tag)
for building in houses:
    for point in building['footprint']: point[1]=walkway_grade(point[0],point[2],point[1])
for terrain_material in [earth,cliff]:
    vv,_=buckets[(terrain_material,'')]
    for i,(xx,zz,yy) in enumerate(vv):
        if yy>-1.9: vv[i]=(xx,zz,walkway_grade(xx,-zz,yy))

for (mat,tag),(vs,fs) in buckets.items():
    mesh=bpy.data.meshes.new(mat)
    mesh.from_pydata(vs,[],fs);mesh.update()
    if mat in [wood,wood2,*roofs,stone,pathmat]:
        uv=mesh.uv_layers.new(name='Surface UV')
        scale=2.6 if mat in [wood,wood2] else 1.7 if mat in roofs else .65
        for poly in mesh.polygons:
            axis=max(range(3),key=lambda i:abs(poly.normal[i]))
            for li in poly.loop_indices:
                v=mesh.vertices[mesh.loops[li].vertex_index].co
                axes=(0,1) if axis==2 else (0,2) if axis==1 else (1,2)
                uv.data[li].uv=(v[axes[0]]*scale,v[axes[1]]*scale)
    if mat == earth:
        for poly in mesh.polygons: poly.use_smooth=True
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
bpy.ops.export_scene.gltf(filepath=str(SOURCE/'xijiang-valley.next.glb'),export_format='GLB',use_active_scene=True,export_extras=True,export_cameras=False,export_lights=False,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
# Preserve authored linear material colors alongside the procedural texture.
import struct
export_path=SOURCE/'xijiang-valley.next.glb'
blob=export_path.read_bytes()
json_length=struct.unpack_from('<I',blob,12)[0]
gltf=json.loads(blob[20:20+json_length])
gltf['asset']['copyright']=TERRAIN_DATA['attribution']
gltf['asset']['extras']={'terrainMethod':TERRAIN_DATA['method'],'source':TERRAIN_DATA['tileUrl'],'liabilityNotice':TERRAIN_DATA['liabilityNotice']}
for m in gltf.get('materials',[]):
    if m['name'] in materials:
        m.setdefault('pbrMetallicRoughness',{})['baseColorFactor']=list(materials[m['name']].diffuse_color)
encoded=json.dumps(gltf,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
rest=blob[20+json_length:]
patched_path=SOURCE/'xijiang-valley.patched.glb'
patched_path.write_bytes(struct.pack('<III',0x46546c67,2,20+len(encoded)+len(rest))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+rest)
data={'version':'2026-09-09','status':'research-based spatial illustration','coordinateSystem':'authored x/y/z; sampled terrain profiles use 10 metres/unit horizontally and vertically; no geographic registration or surveyed building scale','terrainSource':TERRAIN_DATA['tileUrl'],'terrainPads':PADS,'paths':paths,'bridges':bridges,'pois':pois,'buildings':houses,'walkableAreas':[{'kind':'plaza','x':p['x'],'z':p['z'],'y':.60,'halfWidth':4.0,'halfDepth':2.15} for p in pois if p['id']=='lusheng']}
import os
def atomic_json(target,payload):
    staging=SOURCE/(target.name+'.next')
    staging.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    os.replace(staging,target)
atomic_json(ROOT/'src/map-3d/xijiang-terrain-pads.json',PADS)
atomic_json(ROOT/'src/map-3d/xijiang-layout.json',data)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'xijiang-valley.blend'),copy=True)
# Publish only the completed, attributed asset; avoid truncating the actively served GLB.
import os
os.replace(patched_path,OUT/'xijiang-valley.glb')
result={'version':'2026-09-09','bridges':len(bridges),'triangles':sum(len(poly.vertices)-2 for obj in scene.objects if obj.type=='MESH' for poly in obj.data.polygons),'buildings':len(houses),'meshes':len(buckets),'paths':len(paths),'terrainSource':TERRAIN_DATA['tileSha256'],'terrainCalibration':'GLO-30 transects; 10 m/unit, no vertical exaggeration','glbBytes':(OUT/'xijiang-valley.glb').stat().st_size,'blend':str(SOURCE/'xijiang-valley.blend')}

(SOURCE/'model-report.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
