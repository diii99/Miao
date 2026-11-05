from pathlib import Path
p=Path('D:/Miao/scripts/build_xijiang_map.py')
s=p.read_text(encoding='utf-8')
needle="\nfor row in range(7):\n"
replacement="""
# Each entrance stays on the contour path that owns it as the lanes bend.
entrance_rows={'batik':1,'silver':2,'embroidery':3,'museum':2,'ancient-street':2,'gaga':1,'yedong':5,'guzang':5,'necklace':1,'performance':1,'lookout':6}
for p in pois:
    if p['id'] in entrance_rows: p['z']=contour(entrance_rows[p['id']],p['x'])
for row in range(7):
"""
assert needle in s
s=s.replace(needle,replacement,1)
p.write_text(s,encoding='utf-8')
