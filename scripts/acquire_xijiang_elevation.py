import urllib.request,math,json
from pathlib import Path
out=Path('D:/Miao/output/xijiang-map/elevation');out.mkdir(exist_ok=True)
name='Copernicus_DSM_COG_10_N26_00_E108_00_DEM'
url=f'https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif'
try:
 with urllib.request.urlopen(url,timeout=40) as r:
  data=r.read();(out/'copernicus-N26-E108.tif').write_bytes(data);print('copernicus',len(data))
except Exception as e: print('copernicus',repr(e))
query='[out:json];way["waterway"](26.483,108.155,26.507,108.185);out geom;'
try:
 req=urllib.request.Request('https://overpass-api.de/api/interpreter',data=('data='+__import__('urllib.parse',fromlist=['quote']).quote(query)).encode(),headers={'User-Agent':'MiaoTerrainResearch/1.0'})
 with urllib.request.urlopen(req,timeout=35) as r:
  data=r.read();(out/'osm-waterways.json').write_bytes(data);print('waterways',len(data))
except Exception as e: print('overpass',repr(e))
