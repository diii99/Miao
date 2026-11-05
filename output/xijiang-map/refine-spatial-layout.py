from pathlib import Path
p=Path('D:/Miao/scripts/build_xijiang_map.py')
s=p.read_text(encoding='utf-8')
s=s.replace(" {'id':'lookout','x':0,'z':river(0)-23.15},", " {'id':'lookout','x':-10,'z':24},")
s=s.replace(",'lookout':6", "")
s=s.replace("for row in range(7):\n", """# Across-river lookout is reached by a continuous switchback trail above the far bank.
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
""",1)
# Keep ordinary buildings clear of all walking corridors, using their oriented footprint.
s=s.replace("    h=height(x,z);floor=h+.40;wall=stories*.64\n", """    if not tag:
        ca,sa=math.cos(angle),math.sin(angle)
        for path in paths:
            margin=path['width']/2+.08
            for q in path['points'][::2]:
                dx,dz=q[0]-x,q[2]-z
                if abs(dx*ca-dz*sa)<w/2+margin and -d/2-margin<dx*sa+dz*ca<d/2+.37+margin: return
    h=height(x,z);floor=h+.40;wall=stories*.64
""",1)
s=s.replace("pos(a-ww/2,y+hh/2,c)],[(0,1,2,3)],tag)", "pos(a-ww/2,y+hh/2,c)],[(0,1,2,3) if c>=0 else (3,2,1,0)],tag)")
# Natural shallow-water rocks use irregular polygon silhouettes rather than regular paving cubes.
s=s.replace("        box(pebbles,x,-.085,zz,.26+.12*math.sin(j)**2,.11,.18+.12*math.cos(j)**2,j*.73)", """        rock_rng=random.Random(j+1000*side)
        x+=rock_rng.uniform(-.18,.18);zz+=rock_rng.uniform(-.18,.18)
        rx=rock_rng.uniform(.13,.29);rz=rock_rng.uniform(.09,.18)
        vs=[]
        for yy,scale in [(-.16,1),(-.075,.78)]:
            for k in range(7):
                t=k*math.tau/7+j*.73;r=1+rock_rng.uniform(-.18,.18)
                vs.append((x+math.cos(t)*rx*r*scale,yy,zz+math.sin(t)*rz*r*scale))
        meshpart(pebbles,vs,[tuple(range(7,14))]+[(k,(k+1)%7,(k+1)%7+7,k+7) for k in range(7)])""")
# Add low-frequency vegetation variation in the ground itself, not only separate trees.
s=s.replace("for name in [wood,wood2,*roofs,stone,pathmat]:", "for name in [wood,wood2,*roofs,stone,pathmat]:")
s=s.replace("    obj=bpy.data.objects.new", "    if mat == earth:\n        for poly in mesh.polygons: poly.use_smooth=True\n    obj=bpy.data.objects.new")
# Let the view deck look back toward the village from the opposite bank.
s=s.replace("z-1,3.5,.07,.08,tag=tag)", "z+1,3.5,.07,.08,tag=tag)")
p.write_text(s,encoding='utf-8')
p=Path('D:/Miao/src/map-3d/villageBuilder.ts')
s=p.read_text(encoding='utf-8').replace('从高处观察坡地住宅、白水河和梯田之间的关系。','从白水河对岸山坡观察层叠住宅、河谷与田园，沿折返步道上行。')
p.write_text(s,encoding='utf-8')
