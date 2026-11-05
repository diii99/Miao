# Terrain calibration and literal first-person zoom — 2026-09-09

## Result

Replaced the invented .58/.27 hillside ramps and broad flat civic core with four measured Copernicus GLO-30 cross-valley profiles. At the core station (26.4961842 N, 108.1677604 E), the northeast 300 m transect rises **48.1 m (9.1°)** and southwest transect rises **121.5 m (22.0°)**. These are computed surface-profile averages, not surveyed lane inclinations. The downstream section includes a gentler southwest shoulder (30.2 m / 300 m, 5.8°), preserving the valley-to-fields transition.

- Actual 1° source tile: `Copernicus_DSM_COG_10_N26_00_E108_00_DEM`, 3600×3600 float32; SHA-256 `c7540fd030eb3296ea0170503cf676d172699c8f028e6310a2361fbcf86b4a15`.
- Native sample registration verified from TIFF tag1025=2: RasterPixelIsPoint. Tiepoint108°E,27°N; no half-cell offset. One arc second, about28m E/W and31m N/S here. Vertical datum EGM2008.
- Four origins projected onto OpenStreetMap way601048453, local WGS84 meridional/prime-vertical metre conversion. Bearings90°north profile,50°others. Bilinear sampling every20m to640m; this interpolates the approximately30m source, not extra precision.
- Raw absolute samples and provenance: `src/map-3d/xijiang-terrain.json`; computed300m statistics and source-footprint plot: `output/xijiang-map/elevation/`.
- Shared calibrated equations: `scripts/xijiang_terrain.py`, `src/map-3d/terrain.ts`. Equal horizontal/vertical10m/unit retains sectional grades. The profiles are blended along an authored river, not fully georegistered terrain. Transforming them along that river may alter the steepest mesh gradient. Normalizing at31m bank distance removes longitudinal river elevation differences. Flat river surface, stylized channel width, roads and building footprints remain authored.
- Former large flattened slope removed. Only five explicit civic pads and narrow cut/fill benches under walkways remain, stored in `xijiang-terrain-pads.json`; river channel stays outside their grading. Stilt floors clear the highest footprint ground and each post reaches its local terrain. Plaza connectors now follow dense terrain samples and meet their actual contour street.

## First-person zoom

Literal `PerspectiveCamera.zoom`: min0.1, default0.3, max0.5, with the existing65° base field of view. Effective vertical fields of view are162.1583°,129.5680°,103.7473° respectively. This is a real broader lens, not relabelled old magnification. +/- buttons select tenths; desktop wheel and mobile pinch are continuous and clamped. Eye position/bearing remain fixed during zoom. Returning to another preset restoreszoom1; entering first person resets0.3. Map-relative joystick behavior remains independent of avatar facing.

## Source and reproduction

1. `scripts/acquire_xijiang_elevation.py` downloads the public tile and OSM river geometry into ignored local output.
2. `scripts/sample_xijiang_terrain.py` decodes float-predictor TIFF (NumPy/tifffile/imagecodecs), computes profiles and plots, retaining raw heights. Decoder installation and source tile remain outside shipped assets.
3. `E:/Blender/blender.exe --background --factory-startup --python-exit-code 1 --python scripts/build_xijiang_map.py` rebuilds GLB, Blender source, path graph and pads from those profiles. The exporter stages the GLB, embeds attribution, saves layout and Blender source, then atomically publishes the completed asset to avoid a transient Windows file lock leaving mismatched data. Runtime has no external elevation-service dependency.
4. `bun run build`, `bun test tests/cameraNavigation.test.ts`, navigation and terrain scripts, and targeted Chrome zoom/visual checks validate behavior. Reports live under `output/xijiang-map/`; old revision4 captures and old full-rotation report predate this change.

Research and licensing links are in [08-terrain-source-notes.md](08-terrain-source-notes.md) and the shipped [terrain source page](../../../public/map-assets/terrain-sources.html). Modified-data copyright is also embedded in GLB asset metadata.

produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved

依法或受委托负责哥白尼计划的组织，不对 Copernicus WorldDEM-30 的任何使用承担责任。

## Final validation

Final decoded GLB terrain: 64,801 vertices / 129,240 terrain triangles; 106 source-section samples. Maximum off-road source/mesh difference is 0.06779 scene units (about0.68m of scaled elevation), an interpolation check rather than a statement of DSM ground accuracy. All10,025 path samples and their width samples clear terrain; all11,016 building footprint samples clear the surface. All18 landmark routes, seven direct bridge crossings and continuous plaza walking pass. Eight camera tests cover1,807 assertions. Final desktop/mobile browser zoom and scene captures are recorded separately in their output reports.

Foundation stone supports extend down where local road cuts lower their ground contact. Export commands use `--python-exit-code 1` so a Python exception fails the build. Layout JSON is atomically replaced along with the stagedGLB to avoid transient file truncation while Vite serves these files.
