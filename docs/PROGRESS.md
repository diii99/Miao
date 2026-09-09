# Progress and resume checkpoint

Last updated: 2026-09-08 (America/New_York).
Workspace: `D:/Miao`.

## Recording agreement

The user asked to keep recording progress so work can resume after a usage limit or interrupted session. While working on this project, update this file after each meaningful milestone and before expensive operations or stopping. Keep the current checkpoint concise; append dated entries to the activity log below. Record actual completed work separately from planned or attempted work. Do not store credentials, tokens, or private environment values.

For each checkpoint capture: current objective, completed changes, files/artifacts, checks and their outcomes, pending work, blockers, and the exact next action. An interrupted operation is not a successful operation: inspect its outputs before retrying. Do not depend on the chat history or a running process for recovery.

## Current checkpoint

**Status:** Third panorama-based visual revision implemented and verified. Final browser regression session 15816 exited 0; no pending generation/verification process. Not deployed.

**Current artifact:** `public/map-assets/models/xijiang-valley.glb`, 6,305,016 bytes; 332 buildings, 91 meshes, 114,805 triangles, 27 paths, 18 UI nodes. Editable copy: `output/xijiang-map/xijiang-valley.blend`. Prior version statistics below are historical. Second version backup: `output/xijiang-map/revision2/`.

**Changes:** Panorama-driven grey slate/deep timber palette, neutral daytime lighting and dark windows; roof/facade detail; denser irregular hillside housing; broadleaf trees and water/green terraces; enclosed Lusheng square with concentric paving; three silver rings at necklace square; framed bridge galleries; requested HUD subtitle removed.

**Evidence:** Read `docs/research/xijiang-map/06-panorama-revision.md`. Current visuals: `output/xijiang-map/revision3-overview.png`, `revision3-plaza.png`, `revision3-necklace.png`, `revision3-bridge.png`, `revision3-museum.png`. Reference `confirmed-pano-*` captures were checked; earlier `pano-*` names do not reliably identify their scenes due autoplay.

**Next action on resume:** Read 06-panorama-revision.md and the new user direction. Do not regenerate automatically. Full geographic reconstruction and all seven numbered bridge placements were not performed; do not claim them.

### Historical first revision (superseded by the current checkpoint above)

**Objective delivered:** Redesign the map model from `docs/research/xijiang-map/`, using Blender where useful. See `docs/research/xijiang-map/03-implementation.md` for the full implementation and evidence record.

**First-revision artifact (backup in output/xijiang-map/revision1):** `xijiang-valley.glb` — 5,039,456 bytes; 267 illustrative houses; 47 meshes; 94,158 triangles; 3 unnumbered illustrative bridges; 20 walkway paths. Editable source: `output/xijiang-map/xijiang-valley.blend`.

**Design decisions:** Valley and curved river, dense hillside roofs, terraces and trees; museum and lookout are separate; virtual workshops are identified as cultural experiences. Coordinates, dimensions, bridges and topography are authored spatial illustrations, not surveyed positions. No DEM or authoritative georeferenced base map was obtained. Do not claim real-world navigation or a digital twin. News images were not embedded or submitted as generation inputs. Existing Lux3D assets were retained; no remote Lux3D generation was submitted.

**Changed implementation:**

- `src/map-3d/villageBuilder.ts`: GLB lifecycle and source-linked POI metadata.
- `src/map-3d/MiaoVillageScene.tsx`: map integration, walking, portrait camera framing, day/night lighting, loading/retry, embedded details and cleanup.
- `src/map-3d/navigation.ts`: shared walkway graph, A* click routes, constrained manual movement.
- `src/map-3d/xijiang-layout.json`: generated geometry/navigation metadata; keep synchronized with the GLB.
- `src/main.tsx`: map museum semantics and evidence labels/links.
- `src/map-background.css`: map loading/details and mobile return-button overlap fix.
- `scripts/build_xijiang_map.py`, `scripts/blender_map_bridge.py`: repeatable model generation through the installed Blender addon.
- `scripts/verify_xijiang_navigation.ts`, `scripts/verify_xijiang_map.cjs`: verification scripts.

**Verified in the completed implementation session:**

- `bun run build`: passed; existing large main-bundle warning remains.
- `bun scripts/verify_xijiang_navigation.ts`: all 9 POIs reachable, cross-river routes use bridge heights, non-bridge river movement rejected.
- `node scripts/verify_xijiang_map.cjs`: desktop embedded map and mobile `/map`, day/night rendering, museum arrival, details open/close, follow camera, failed GLB request followed by successful retry and onReady.
- `output/xijiang-map/browser-errors.json`: empty array; re-read when this checkpoint was written.
- `output/xijiang-map/model-report.json`: final geometry statistics; re-read when this checkpoint was written.
- Screenshots: `desktop-day.png`, `desktop-night.png`, `mobile-day.png`, `mobile-night.png`, `desktop-street.png`, `mobile-street.png` under `output/xijiang-map/`.
- Blender render: `output/xijiang-map/blender-overview.png0001.png`.

**Verification limits:** Chrome testing used software WebGL and phone-sized viewport, not a physical phone performance benchmark. No measured 30 FPS claim. Full physical collision/navmesh accuracy, every cultural game flow and exact geographic placement were not comprehensively validated. No before-version browser screenshots were taken; three original source files are backed up in `output/xijiang-map/before/`.

## Resume procedure

1. Read this checkpoint, then `docs/research/xijiang-map/05-revision2-delivery.md` and `04-landmark-research.md`; `03-implementation.md` describes the historical first revision; use `01-sources-and-visual-evidence.md` and `02-redesign-plan.md` for research. Their older “research only / do not implement” wording describes the preceding research session and does not override the user's subsequent implementation request.
2. Inspect the current files and any new user direction before changing anything. The previous task is complete; do not regenerate or redeploy merely to resume the session.
3. If a new map iteration is requested, append its objective and immediate next action here before editing. Preserve `/map`, `/miniapp/map`, the shared Shell, the four bottom tabs, and unrelated culture/experience pages.
4. Check live services; these are volatile: local preview was `http://127.0.0.1:5173/miniapp/map`, Blender addon was listening at `127.0.0.1:9876`. If needed start the app with `bun run dev --host 127.0.0.1 --port 5173`.
5. For model changes edit `scripts/build_xijiang_map.py`, then run `python scripts/blender_map_bridge.py scripts/build_xijiang_map.py` with Blender open and its addon enabled. This generates a new scene and overwrites the GLB, layout JSON and saved Blender copy. Inspect the current Blender scene first if the user may have made manual edits. The terrain sampler in `villageBuilder.ts` must remain consistent if the height formula changes.
6. Re-run the relevant navigation/browser checks after geometry or scene changes; finish with `bun run build`. Update this checkpoint with outcomes and actual artifacts.

### Environment/recovery notes

- Blender executable observed: `E:/Blender/blender.exe`, version 5.2.1 LTS. The installed addon uses null-byte-delimited JSON `{type: 'execute', code, strict_json: true}`, handled by the bridge script.
- Use Bun for dependency/build workflows. Run the Playwright verification script with **Node**, not Bun; Bun's browser launch hung in this session, whereas Node succeeded.
- The browser script currently references the installed Playwright runtime and Chrome by absolute paths. Verify those paths if moved to another machine.
- The existing `/map` cold-entry intro sends the app to home when skipped; the browser test then follows the 地图 tab. `/miniapp/map` opens directly.
- `scripts/integrate_xijiang_map.py` is a one-shot migration used during the completed implementation. **Do not rerun it against the updated source**; the replacements are not idempotent. Edit the current files directly.
- Windows sandbox process/image helpers failed with `helper_unknown_error: apply deny-read ACLs`. Approved escalated PowerShell commands worked. This was an environment initialization failure, not a project build failure. Do not weaken filesystem ACLs to work around it.
- Original map assets and source backups remain. No Git workflow was used in this checkout; do not assume changes are committed.

## Pending / future options

Third-revision implementation and checks are complete. See the current checkpoint and 06-panorama-revision.md. Optional future work: authoritative geographic data and physical-device performance measurements. Deployment is not requested.

## Activity log

### 2026-09-08 — map redesign completed

Built through Blender MCP; refined from 159 to 267 houses; integrated the approximately 5 MB GLB; separated museum/lookout; verified connected paths; fixed mobile detail overlap and embedded loading recovery. Full details and limitations are in the implementation record.

### 2026-09-08 — resumable progress recording requested

User requested persistent progress checkpoints in case a plan usage limit interrupts work. Created this resume file from the implementation record and verified saved report files. Linked it from the project README. No application/model changes or new generation jobs made in this checkpoint-only step.

### 2026-09-08 — second redesign started

Current code inspected: 芦笙场 exists only as a small 3.6×2.1 platform and a rail entry, without a persistent on-map label; ordinary housing dominates the overview. New official search evidence confirms 芦笙场 as a performance/gathering place, separately lists 银项圈广场, and describes the museum as six two-storey buildings. Found a 2025 visitor-map page; inspect its actual map before inferring placement. Goal remains active.

### 2026-09-08 — second-round spatial evidence checkpoint

Created docs/research/xijiang-map/04-landmark-research.md with R21–R27 sources, explicit landmark requirements and remaining steps. R21 full article confirms 芦笙场 between 古街 and 游方街. R23 official index distinguishes 银项圈广场 and describes six museum buildings. Visitor bridge-position claims remain lower-confidence. Next: inspect imagery then rebuild the core plaza/street/museum layout and visible landmark controls. No second-version completion claim; no new model generated yet.

### 2026-09-08 — landmark discovery UI milestone

Implemented persistent projected labels for 芦笙广场, museum, lookout and bridge, a dedicated 芦笙广场在哪里 button, and a focused card with walking/details actions. Corrected plaza metadata to 古街与游方街之间 with R21 link. Changed MiaoVillageScene.tsx, villageBuilder.ts and map-background.css. `bun run build` passed. `node scripts/verify_xijiang_landmark_focus.cjs` passed at 430×932 with no page errors; screenshot output/xijiang-map/revision2-lusheng-focus.png. Preview had stopped (connection refused), restarted at 127.0.0.1:5173 and verified. Blender addon read-only check confirms 5.2.1 with 49 scene objects. Two image-search calls hit 429; use article images/other evidence next rather than repeated immediate image search.

Still incomplete: major landmark model expansion, actual plaza/museum geometry redesign, street relationships, performance comparison, label overlap/occlusion checks across all camera modes, and full two-route regression. The current GLB remains first-version geometry. Do not mark this goal complete based on the focus-control test alone.

### 2026-09-08 — second model geometry milestone

Generated revised GLB and Blender copy through MCP: 223 buildings, 79 meshes, 27 paths, 3,905,692 bytes. First-version GLB/layout/generator backed up under output/xijiang-map/revision1. Expanded plaza with steps/stage and connected approaches; six museum buildings; added ancient-street, youfang, gaga, yedong, guzang, terraces, necklace, performance, baishui nodes. All 18 nodes pass navigation tests; build passes. New source geometry is still awaiting visual correction/audit; terrain flattening and museum foundations particularly need inspection. Runtime metadata now exposes all 18 nodes; some are explicitly schematic cultural nodes with location pending. Goal still active; do not use prior 267-house report as current geometry. Next inspect revision2-lusheng-focus.png and broader overview, fix geometry/labels, then test rendering/performance and dual-route interactions.

### 2026-09-08 — second revision geometry correction and optimization

Visually inspected revision2 plaza focus: abrupt terrain wall was present. Replaced hard flattening with smooth blending and regenerated model; current GLB 3,882,916 bytes, 73,498 triangles, 79 meshes. Compared with revision1 5,039,456 bytes / 94,158 triangles / 47 meshes in output/xijiang-map/revision-comparison.json. Triangle/byte reduction is proven; draw calls increased due to separately tagged landmarks, so do not claim overall FPS improvement yet. 18-node route verification passes after regeneration.

Manual walking now uses local spatial grid cells rather than scanning every navigation node. Added screen-label overlap rejection prioritizing lusheng. First full browser regression found outfit selector intercepting daylight button after locator addition; moved outfit/camera controls to top:125px and restarted regression. Live process handle at this checkpoint: exec session 83881; poll this handle, do not restart unless terminal. Current full overview screenshot was visually inspected; still requires portrait/nearview and all-landmark interaction audit. Source-backed gate/transit context, definitive visual references and overall performance comparison are still incomplete. Goal remains active.

### 2026-09-08 — second revision regression checkpoint

Session 83881 completed successfully (exit 0): desktop and mobile both loaded all 18 nodes, day/night views, museum arrival/open/close/follow camera passed; failed-GLB retry/onReady passed. Latest bun run build passed. No verification process remains running. Next: major-landmark source/geometry completeness audit including entrance/transit context, visual comparison of plaza/museum, and runtime performance measurement. Goal remains ACTIVE; current saved artifacts are intermediate revision2, not final acceptance.

### 2026-09-08 — second revision final checkpoint

Added west/north entrance and historical transit context; made all list items focus landmarks directly, with explicit walking/details actions. Verified 18 focus cards, plaza and six-building museum close-ups, full desktop/mobile day-night/museum/loading-retry regression and final build. All processes terminal-success; no live wait handle. Saved measured model/runtime comparisons and delivery audit in 05-revision2-delivery.md. Runtime median frame time unchanged in software WebGL; only size/triangle optimization and the measured sample are claimed. Reference precision limits retained in UI and docs. Final sources are linked per landmark rather than using one generic source for every new POI.

### 2026-09-08 — final record consistency check

Refreshed model-report.json directly from final GLB indices and node extras: 73,498 triangles, 79 meshes, 16 mesh POI tags; the river and virtual starting point bring the UI total to 18. Marked first-version checkpoint data historical and replaced stale pending text. Final browser error report remains empty and all 18 focus results passed. No required implementation work or running verification job remains.

### 2026-09-08 — panorama-based third revision started

User references: https://www.720yun.com/t/70vktlf9d77?scene_id=69280683 and https://www.720yun.com/vr/246jtpkfOf2. Web reader could not open either and CUA runtime failed initialization. Chrome Playwright reference capture is running as exec session 74782; inspect output/xijiang-map/reference-1/2.png and .json after completion. No visual claims or model changes yet. Requested HUD phrase occurs in MiaoVillageScene.tsx line 713. Next: inspect actual panorama pixels and scene names before selecting architectural changes.

### Third revision — palette source changes, landmark capture pending

Backed up revision2 GLB/layout/generator/scene component. Removed requested subtitle. Edited generator linear-RGB palette, facade framing and roof courses; changed neutral day lighting. Not exported yet. Blender MCP reachable, 81 objects, unnamed current file; builder preserves current scene by making a new scene. Panorama retry session 89255 is live; after it completes inspect actual image labels, not filenames (autoplay invalidated earlier captures). Evidence draft: 06-panorama-revision.md.

### Third revision — final geometry exported, final regression pending

Confirmed paused panorama captures: confirmed-pano-0.png shows Lusheng courtyard aerial with concentric paving; confirmed-pano-2.png shows three necklace rings; confirmed-pano-3/4/5 show bridge, overview and timber streetscape. Museum selected approach is greenery/stone lanes; no unobserved full museum facade claimed. Square now has enclosing wings and stage frontage, necklace square has three metal torus rings, bridges continuous timber halls. Infill final clearance 1.65 scene units from paths; final model 332 houses, 6,305,016 bytes (larger than revision2 due detail/density). Earlier 4.95/6.44 MB checkpoints are intermediate. Final regression 14727 was running across final clearance export; rerun regression once after it is terminal to bind evidence to final artifact. Then refresh delivery/current checkpoint.

### Third revision — final validation complete

Final unmodified-source regression session 15816 exited 0: desktop /miniapp/map and mobile /map, day/night, museum arrival, details, follow camera, failed GLB retry and onReady. browser-errors.json is empty. Final build passed; 18-node navigation passed; revision3 screenshot/removed-subtitle verification passed. No live verification/generation handles remain. The intermediate HMR failure was reproduced only during concurrent editing; the final stable run passed.
