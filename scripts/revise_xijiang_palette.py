from pathlib import Path
p=Path('scripts/build_xijiang_map.py');s=p.read_text()
# Values are linear RGB; keep weathered wood and slate dark under ACES daylight.
changes={"(.22,.29,.20)":"(.055,.12,.025)","(.16,.20,.17)":"(.065,.070,.052)","(.36,.39,.35)":"(.23,.25,.24)","(.40,.41,.34)":"(.32,.33,.32)","(.24,.13,.075)":"(.075,.042,.024)","(.34,.22,.13)":"(.13,.073,.037)","(.12,.08,.055)":"(.033,.025,.020)","[(.16,.19,.20),(.22,.24,.23),(.27,.28,.26),(.19,.22,.24)]":"[(.035,.041,.043),(.055,.059,.058),(.080,.084,.078),(.043,.048,.050)]","(.13,.38,.39)":"(.075,.17,.13)","[(.13,.25,.17),(.19,.32,.20),(.27,.38,.23)]":"[(.025,.095,.018),(.055,.17,.026),(.11,.24,.040)]","[(.39,.48,.22),(.49,.55,.28),(.57,.57,.31)]":"[(.19,.34,.035),(.27,.43,.055),(.12,.29,.023)]"}
for a,b in changes.items():
 assert a in s,a
 s=s.replace(a,b)
# Visible plank divisions and full-height balcony framing, kept in material batches.
s=s.replace("    houses.append({'x':x", """    for level in range(stories):
        fy=floor+level*.64
        for off in [-.45,-.15,.15,.45]:
            xx=x+off*w*math.cos(angle)+(d/2+.035)*math.sin(angle)
            zz=z-off*w*math.sin(angle)+(d/2+.035)*math.cos(angle)
            box(dark,xx,fy+.31,zz,.025,.60,.035,angle,tag)
        xx=x+(d/2+.08)*math.sin(angle);zz=z+(d/2+.08)*math.cos(angle)
        box(wood2,xx,fy+.04,zz,w+.12,.045,.12,angle,tag)
    houses.append({'x':x""")
# Layered overlapping courses replace perfectly flat roof sheets.
s=s.replace('    box(mat,x,y+rise,z,w+.04,.07,.08,angle,tag)', '''    box(mat,x,y+rise,z,w+.04,.07,.08,angle,tag)
    for side in [-1,1]:
        for row in range(1,5):
            localz=side*d*.5*row/5
            yy=y+rise*(1-row/5)+.012
            box(mat,x+localz*math.sin(angle),yy,z+localz*math.cos(angle),w,.022,.028,angle,tag)''')
# Water-filled rice pockets alongside planted terraces, green low field banks.
s=s.replace("ribbon(pts,.91,fields[row%3]);ribbon([(x,y+.01,z+.51) for x,y,z in pts],.12,stone)","ribbon(pts,.91,water if row%4==0 else fields[row%3]);ribbon([(x,y+.03,z+.51) for x,y,z in pts],.16,greens[2])")
p.write_text(s,encoding='utf-8')
p=Path('src/map-3d/MiaoVillageScene.tsx');s=p.read_text();s=s.replace('sky: 0xb7cecc','sky: 0xdce4e8').replace('fog: 0xb7cecc','fog: 0xdce4e8').replace('sunColor: 0xfff3d6','sunColor: 0xfffaf2').replace('sunIntensity: 2.4','sunIntensity: 1.7').replace('hemiIntensity: 1.35','hemiIntensity: 1.15').replace('windowEmissive: 0.2','windowEmissive: 0');p.write_text(s,encoding='utf-8')
