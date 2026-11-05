from pathlib import Path
p=Path('D:/Miao/scripts/build_xijiang_map.py')
s=p.read_text(encoding='utf-8')
start=s.index('houses=[]\ndef house(')
end=s.index('\ndef contour(',start)
s=s[:start]+'''def beam(mat,a,b,width=.045,tag=''):
    direction=Vector(b)-Vector(a)
    u=direction.cross(Vector((0,1,0)))
    if u.length<.0001: u=direction.cross(Vector((1,0,0)))
    u.normalize();u*=width/2
    v=direction.normalized().cross(u)
    vs=[tuple(Vector(p)+su*u+sv*v) for p in [a,b] for su,sv in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    meshpart(mat,vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],tag)

houses=[]
def house(x,z,w=1.8,d=1.5,stories=2,angle=0,tag=''):
    h=height(x,z);floor=h+.40;wall=stories*.64
    mat=wood if rng.random()<.6 else wood2
    def pos(a,y,c): return (x+a*math.cos(angle)+c*math.sin(angle),y,z-a*math.sin(angle)+c*math.cos(angle))
    def part(m,a,y,c,ww,hh,dd):
        xx,_,zz=pos(a,y,c);box(m,xx,y,zz,ww,hh,dd,angle,tag)
    def face(m,a,y,c,ww,hh):
        meshpart(m,[pos(a-ww/2,y-hh/2,c),pos(a+ww/2,y-hh/2,c),pos(a+ww/2,y+hh/2,c),pos(a-ww/2,y+hh/2,c)],[(0,1,2,3)],tag)
    box(stone,x,h+.02,z,w,.14,d,angle,tag)
    box(mat,x,floor+wall/2,z,w,wall,d,angle,tag)
    # Tall downhill posts, cross-braces and exposed underside reveal the stilt structure.
    for side in [-1,1]:
        bases=[]
        for a in [-w*.42,0,w*.42]:
            xx,_,zz=pos(a,0,side*d*.41)
            bottom=min(height(xx,zz)-.12,h-.12)
            part(dark,a,(bottom+floor)/2,side*d*.41,.075,floor-bottom,.075)
            part(stone,a,bottom+.06,side*d*.41,.17,.12,.17)
            bases.append((a,bottom+.10))
        beam(wood2,pos(bases[0][0],bases[0][1],side*d*.41),pos(bases[-1][0],floor-.04,side*d*.41),.045,tag)
    roofmat=roofs[rng.randrange(4)]
    roof(x,floor+wall+.05,z,w+.35,d+.38,.43,roofmat,angle,tag)
    # Exposed rafters under both eaves and thick ridge/end tiles.
    for side in [-1,1]:
        for i in range(max(4,int(w/.18))):
            part(wood2,-w/2+i*.18,floor+wall+.015,side*(d/2+.08),.055,.07,.27)
        part(dark,0,floor+wall-.025,side*(d/2+.04),w+.2,.09,.095)
    # Two long timber facades, each with floor beams, plank joints and window lattice.
    for side in [-1,1]:
        c=side*(d/2+.022)
        for level in range(stories):
            fy=floor+level*.64
            part(wood2,0,fy+.035,c,w+.10,.07,.05)
            for a in [-w*.44,-w*.16,w*.16,w*.44]: part(dark,a,fy+.32,c,.042,.59,.03)
            for a in [-w*.30,0,w*.30]:
                face(window,a,fy+.35,c+side*.014,.22,.29)
                part(wood2,a,fy+.20,c+side*.025,.25,.025,.035)
                part(wood2,a,fy+.50,c+side*.025,.25,.025,.035)
                for off in [-.07,0,.07]: part(dark,a+off,fy+.35,c+side*.028,.012,.28,.025)
                part(dark,a,fy+.37,c+side*.029,.22,.015,.025)
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
    houses.append({'x':x,'z':z,'radius':math.hypot(w,d)/2+.25,'tag':tag})
''' +s[end:]
insert=s.index('# Deliberate clearings:')
s=s[:insert]+'''# Stone-faced bridge piers, corridor seats and vertical balusters visible in river photos.
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
        box(pebbles,x,-.085,zz,.26+.12*math.sin(j)**2,.11,.18+.12*math.cos(j)**2,j*.73)

''' +s[insert:]
# Add procedural surface images rather than bundle reference photos. UVs are world aligned per face.
insert=s.index('for (mat,tag),(vs,fs) in buckets.items():')
s=s[:insert]+'''# Original procedural textures: grain, overlapping tiles and small-scale stone joints.
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

''' +s[insert:]
s=s.replace("mesh.from_pydata(vs,[],fs);mesh.update()", """mesh.from_pydata(vs,[],fs);mesh.update()
    if mat in [wood,wood2,*roofs,stone,pathmat]:
        uv=mesh.uv_layers.new(name='Surface UV')
        scale=2.6 if mat in [wood,wood2] else 1.7 if mat in roofs else .65
        for poly in mesh.polygons:
            axis=max(range(3),key=lambda i:abs(poly.normal[i]))
            for li in poly.loop_indices:
                v=mesh.vertices[mesh.loops[li].vertex_index].co
                axes=(0,1) if axis==2 else (0,2) if axis==1 else (1,2)
                uv.data[li].uv=(v[axes[0]]*scale,v[axes[1]]*scale)""")
# glTF material baseColorFactor may be white when linked to a texture: tint the exported materials.
s=s.replace("data={'version':", """# Preserve authored linear material colors alongside the procedural texture.
import struct
export_path=OUT/'xijiang-valley.glb'
blob=export_path.read_bytes()
json_length=struct.unpack_from('<I',blob,12)[0]
gltf=json.loads(blob[20:20+json_length])
for m in gltf.get('materials',[]):
    if m['name'] in materials:
        m.setdefault('pbrMetallicRoughness',{})['baseColorFactor']=list(materials[m['name']].diffuse_color)
encoded=json.dumps(gltf,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
rest=blob[20+json_length:]
export_path.write_bytes(struct.pack('<III',0x46546c67,2,20+len(encoded)+len(rest))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+rest)
data={'version':""")
p.write_text(s,encoding='utf-8')
