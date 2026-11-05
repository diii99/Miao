"""Sample public GLO-30 transects for the schematic scene. No vertical exaggeration.
Run after acquire_xijiang_elevation.py. NumPy/tifffile/imagecodecs required.
GeoTIFF RasterPixelIsPoint is respected; samples include buildings/vegetation.
"""
import sys, json, math, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/xijiang-map/elevation'
sys.path.insert(0,str(OUT/'python-deps'))
import numpy as np
import tifffile
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
name='Copernicus_DSM_COG_10_N26_00_E108_00_DEM'
tile=OUT/'copernicus-N26-E108.tif'
with tifffile.TiffFile(tile) as f:
    page=f.pages[0];dem=page.asarray()
    scale=page.tags['ModelPixelScaleTag'].value
    tie=page.tags['ModelTiepointTag'].value
    keys=page.tags['GeoKeyDirectoryTag'].value
    raster_type=next(keys[i+3] for i in range(4,len(keys),4) if keys[i]==1025)
    assert raster_type==2, 'This sampler expects RasterPixelIsPoint'
def sample(lon,lat):
    x=(lon-tie[3])/scale[0];y=(tie[4]-lat)/scale[1]
    i,j=math.floor(x),math.floor(y);u,v=x-i,y-j
    return float((1-v)*((1-u)*dem[j,i]+u*dem[j,i+1])+v*((1-u)*dem[j+1,i]+u*dem[j+1,i+1]))
def offset(lon,lat,d,bearing):
    # WGS84 local meridional/prime-vertical metre scales at this latitude.
    phi=math.radians(lat);e2=0.00669437999014;a=6378137
    m=a*(1-e2)/(1-e2*math.sin(phi)**2)**1.5
    n=a/math.sqrt(1-e2*math.sin(phi)**2)
    return lon+math.degrees(d*math.sin(math.radians(bearing))/(n*math.cos(phi))),lat+math.degrees(d*math.cos(math.radians(bearing))/m)
river=json.loads((OUT/'osm-waterways.json').read_text())['elements'][0]
geo=river['geometry']
def river_point(lon,lat):
    candidates=[]
    for a,b in zip(geo,geo[1:]):
        ca=math.cos(math.radians(lat));vx=(b['lon']-a['lon'])*ca;vy=b['lat']-a['lat']
        t=max(0,min(1,((lon-a['lon'])*ca*vx+(lat-a['lat'])*vy)/(vx*vx+vy*vy)))
        x=a['lon']+(b['lon']-a['lon'])*t;y=a['lat']+(b['lat']-a['lat'])*t
        candidates.append((((x-lon)*ca)**2+(y-lat)**2,x,y))
    _,x,y=min(candidates);return x,y
settings=[('north',-26,108.16799,26.4985,90),('core',-6,108.16776,26.496184,50),('south',14,108.16979,26.494096,50),('downstream',34,108.1785,26.49,50)]
distances=list(range(0,641,20));profiles=[]
for name_,x,lon,lat,bearing in settings:
    lon,lat=river_point(lon,lat)
    p={'id':name_,'sceneX':x,'longitude':lon,'latitude':lat,'bearingDegrees':bearing,'riverSurfaceM':round(sample(lon,lat),3)}
    for label,sign in [('ne',1),('sw',-1)]:
        p[label]=[round(sample(*offset(lon,lat,d*sign,bearing)),3) for d in distances]
    profiles.append(p)
data={'source':'Copernicus DEM GLO-30, AWS 2021 mirror','tileUrl':f'https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif','tileSha256':hashlib.sha256(tile.read_bytes()).hexdigest(),'rasterType':'RasterPixelIsPoint','spacingArcSeconds':1,'sourceResolutionM':30,'retrieved':'2026-09-09','riverSource':f'https://www.openstreetmap.org/way/{river["id"]}','horizontalMetresPerUnit':10,'verticalMetresPerUnit':10,'distancesM':distances,'profiles':profiles,'method':'Bilinear source sampling, linear profile interpolation; equal horizontal and vertical scale. Transects are blended along authored river, bank-normalized at31m; local civic pads are designed. This is calibrated schematic terrain, not georeferenced reconstruction.'}
data['attribution']='produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved'
data['liabilityNotice']='依法或受委托负责哥白尼计划的组织，不对 Copernicus WorldDEM-30 的任何使用承担责任。'
data['verticalDatum']='EGM2008 metres'
(ROOT/'src/map-3d/xijiang-terrain.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
summary=[]
for p in profiles:
    row={'id':p['id'],'longitude':p['longitude'],'latitude':p['latitude'],'riverSurfaceM':p['riverSurfaceM']}
    for side in ['ne','sw']:
        rise=p[side][15]-p['riverSurfaceM']
        row[side]={'riseAt300m':round(rise,1),'averageAngleDegrees':round(math.degrees(math.atan(rise/300)),1),'elevationAt300m':p[side][15]}
    summary.append(row)
(OUT/'transect-summary.json').write_text(json.dumps(summary,indent=2))
fig,(ax,pr)=plt.subplots(1,2,figsize=(13,5.3),gridspec_kw={'width_ratios':[1,1.35]},layout='constrained')
left,right,bottom,top=108.161,108.184,26.487,26.503
x0,x1=round((left-108)*3600),round((right-108)*3600);y0,y1=round((27-top)*3600),round((27-bottom)*3600)
im=ax.imshow(dem[y0:y1,x0:x1],extent=[left,right,bottom,top],cmap='terrain',vmin=820,vmax=1120,aspect=1/math.cos(math.radians(26.495)))
ax.plot([p['lon'] for p in geo],[p['lat'] for p in geo],color='#087ea4',lw=1.7,label='OSM river')
for i,p in enumerate(profiles):
    color=plt.cm.tab10(i)
    ends=[offset(p['longitude'],p['latitude'],d,p['bearingDegrees']) for d in [-400,400]]
    ax.plot([q[0] for q in ends],[q[1] for q in ends],color=color,lw=1.4)
    ax.text(p['longitude'],p['latitude'],p['id'],fontsize=8,color='black')
    xs=[-d for d in reversed(distances[:26])]+distances[1:26]
    ys=list(reversed(p['sw'][:26]))+p['ne'][1:26]
    pr.plot(xs,ys,label=p['id'],color=color)
ax.set_xlim(left,right);ax.set_ylim(bottom,top);ax.set_title('Actual source footprint / elevation (m)');ax.tick_params(labelsize=8);fig.colorbar(im,ax=ax,shrink=.65)
pr.axvline(0,color='#087ea4',lw=1,ls='--');pr.set_xlabel('SW / lookout side  ←  distance from river (m)  →  NE / village side');pr.set_ylabel('Surface elevation (m)');pr.set_title('GLO-30 sampled cross-valley profiles');pr.grid(alpha=.2);pr.legend()
fig.suptitle('Xijiang: source transects used to calibrate the scene',fontsize=14)
fig.savefig(OUT/'terrain-transects.png',dpi=160)
print(json.dumps(summary,indent=2))
