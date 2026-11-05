from pathlib import Path
p=Path('D:/Miao/scripts/build_xijiang_map.py')
s=p.read_text(encoding='utf-8')
s=s.replace('Run through blender_map_bridge.py.', 'Run with Blender --background --python.')
s=s.replace("fields = [material", "soil = material('Terrace risers and exposed soil', (.15,.13,.076))\npebbles = material('River gravel', (.33,.35,.31))\nleaf = material('Rice shoots', (.22,.38,.056))\nlinen = material('Indigo drying cloth', (.026,.073,.13))\nlantern = material('Lantern paper', (.43,.21,.06))\nfields = [material")
s=s.replace("    return value\n", """    # A wooded rim rises into distinct foothills, rather than a flat oval tabletop.
    edge=max(abs(x)/34,abs(z)/29)
    rim=max(0,min(1,(edge-.89)/.42))
    ridges=4.2+3.1*math.sin(x*.13+.6)**2+2.4*math.sin(z*.19-x*.09)**2
    return value + rim*rim*ridges
""",1)
s=s.replace("rings,steps=48,144", "rings,steps=72,180")
s=s.replace("x=38*r/rings*math.cos(t)\n        z=33*r/rings*math.sin(t)", "edge=1+.025*math.sin(5*t)+.018*math.sin(9*t)\n        x=46*r/rings*math.cos(t)*edge\n        z=39*r/rings*math.sin(t)*edge")
s=s.replace("ribbon([(x*.25,-.12,river(x*.25)) for x in range(-148,149)],3.65,water)", "ribbon([(x*.25,-.12,river(x*.25)) for x in range(-181,182)],3.65,water)")
s=s.replace("for index,x in enumerate([-18,0,18]):\n    z=river(x);tag='bridge' if index==1 else ''", "for index,x in enumerate([-26,-18,-9,0,9,18,26]):\n    z=river(x);tag='bridge' if x==0 else ''")
s=s.replace("# Back slope contour lanes and two switchback spines are all connected.\n", """def contour(row,x):
    return river(x)-2.75-row*3.4 + (.48*math.sin(x*.19+row*.83)+.18*math.sin(x*.37-row*.62) if row else 0)

# Contour lanes follow the hillside; all share a connected path graph.
""")
s=s.replace("x=-27+j*.5;z=river(x)+offset", "x=-27+j*.5;z=contour(row,x)")
s=s.replace("x=-27+col*2.3+rng.uniform(-.28,.28);z=river(x)-4.45-row*3.4+rng.uniform(-.17,.17)", "x=-27+col*2.3+rng.uniform(-.55,.55);z=contour(row,x)-1.7+rng.uniform(-.26,.26)")
s=s.replace("rng.uniform(-.09,.09))", "-math.atan((contour(row,x+.1)-contour(row,x-.1))/.2)+rng.uniform(-.13,.13))")
s=s.replace("rng.uniform(-.12,.12))", "rng.uniform(-.30,.30))")
s=s.replace("x=-27+col*2.45;z=river(x)+4.7+row*2.9", "x=-27+col*2.45+rng.uniform(-.35,.35);z=river(x)+4.7+row*2.9+rng.uniform(-.22,.22)")
s=s.replace("    if abs(x)<1.5 or abs(x+18)<1.4", "    if any(abs(x-b['x'])<1.45 for b in bridges)")
s=s.replace("# Nested curved paddies occupy the open foreground shoulder.", "# Nested curved paddies occupy the open foreground shoulder.")
s=s.replace("ribbon(pts,.91,water if row%4==0 else fields[row%3]);ribbon([(x,y+.03,z+.51) for x,y,z in pts],.16,greens[2])", """ribbon(pts,.91,water if row%4==0 else fields[row%3])
        ribbon([(x,y-.025,z+.53) for x,y,z in pts],.23,soil)
        ribbon([(x,y+.03,z+.51) for x,y,z in pts],.13,greens[2])
        # Water channels and regularly planted shoots within irregular field boundaries.
        for k,(x,y,z) in enumerate(pts):
            if k%2==0 and row%4!=0:
                for off in [-.28,0,.28]:
                    meshpart(leaf,[(x-.025,y,z+off),(x+.025,y,z+off),(x+.015,y+.17,z+off+.03)],[(0,1,2)])
        for j in [13,30]:
            if j<len(pts):
                x,y,z=pts[j];ribbon([(x,y+.018,z-.48),(x+.15,y+.018,z+.48)],.09,soil)""")
s=s.replace("for i in range(650):\n    x=rng.uniform(-36,36);z=rng.uniform(-31,29)\n    if (x/37)**2+(z/32)**2>.97", "for i in range(1500):\n    x=rng.uniform(-43,43);z=rng.uniform(-36,35)\n    if (x/45)**2+(z/38)**2>.97")
s=s.replace("    tree(x,z,rng.uniform(.6,1.25))", "    tree(x,z,rng.uniform(.75,1.8) if abs(x)>32 or abs(z)>27 else rng.uniform(.6,1.25))")
s=s.replace("'version':'2026-09-08'", "'version':'2026-09-09'")
s=s.replace("result={'buildings':len(houses)", "result={'version':'2026-09-09','bridges':len(bridges),'triangles':sum(len(poly.vertices)-2 for obj in scene.objects if obj.type=='MESH' for poly in obj.data.polygons),'buildings':len(houses)")
s += "\n(SOURCE/'model-report.json').write_text(json.dumps(result,indent=2),encoding='utf-8')\nprint(json.dumps(result))\n"
p.write_text(s,encoding='utf-8')
