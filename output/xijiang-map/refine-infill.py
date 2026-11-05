from pathlib import Path
p=Path('D:/Miao/scripts/build_xijiang_map.py')
s=p.read_text(encoding='utf-8')
s=s.replace('for attempt in range(5000):','for attempt in range(16000):').replace('if added>=115: break','if added>=195: break')
s=s.replace("x=infill_rng.uniform(-32,31);z=infill_rng.uniform(-26,19)","x=infill_rng.uniform(-37,36);z=infill_rng.uniform(-32,26)")
s=s.replace("if (x/35)**2+(z/30)**2>.90: continue", "if (x/39)**2+(z/35)**2>.93: continue")
s=s.replace("    house(x,z,infill_rng.uniform(1.1,1.65),", "    count_before=len(houses)\n    house(x,z,infill_rng.uniform(1.1,1.65),")
s=s.replace("    added+=1\n", "    added+=len(houses)-count_before\n")
p.write_text(s,encoding='utf-8')
