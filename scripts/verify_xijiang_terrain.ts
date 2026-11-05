import { strict as assert } from 'node:assert'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import data from '../src/map-3d/xijiang-terrain.json'
import pads from '../src/map-3d/xijiang-terrain-pads.json'
import layout from '../src/map-3d/xijiang-layout.json'
import { riverCenter, naturalTerrainHeight, ungradedTerrainHeight, getTerrainHeight } from '../src/map-3d/terrain'
import { routeTo, snapToWalkway, walkableStep } from '../src/map-3d/navigation'

type Point = {x:number;y:number;z:number}
const failures: Array<{check:string;details:unknown}> = []
const checks: Record<string,unknown> = {}
const check = (condition:boolean, label:string, details:unknown) => { if (!condition) failures.push({check:label,details}) }
const round = (v:number) => Math.round(v*1e6)/1e6
const insidePad = (x:number,z:number) => pads.some(p=>Math.abs(x-p.x)<p.halfWidth+p.feather && Math.abs(z-p.z)<p.halfDepth+p.feather)
const inRoadBench = (x:number,z:number) => layout.paths.some(path=>path.kind!=='bridge'&&path.points.some((a,i)=>{
  if(i===path.points.length-1)return false
  const b=path.points[i+1],dx=b[0]-a[0],dz=b[2]-a[2],length2=dx*dx+dz*dz
  if(length2<1e-10)return false
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/length2))
  return Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)<=path.width/2+.20+.28
}))
const sourceAt = (values:number[], d:number) => {
  const i = data.distancesM.findIndex((value,index)=>index<data.distancesM.length-1 && d>=value && d<=data.distancesM[index+1])
  assert(i>=0,'Source distance is outside profile bounds')
  return values[i]+(values[i+1]-values[i])*(d-data.distancesM[i])/(data.distancesM[i+1]-data.distancesM[i])
}
check(data.horizontalMetresPerUnit===data.verticalMetresPerUnit,'No vertical exaggeration',{horizontal:data.horizontalMetresPerUnit,vertical:data.verticalMetresPerUnit})
check(JSON.stringify(layout.terrainPads)===JSON.stringify(pads),'Exported terrain pads match runtime pads',{})

// Decode the exact shipped surface, independently of the height helper.
const glbPath = new URL('../public/map-assets/models/xijiang-valley.glb',import.meta.url)
const glb = readFileSync(glbPath), jsonLength = glb.readUInt32LE(12)
const document = JSON.parse(glb.toString('utf8',20,20+jsonLength))
const binary = glb.subarray(20+jsonLength+8)
const terrainNode = document.nodes.find((node:any)=>node.name==='Earth • moss and soil')
assert(terrainNode && !terrainNode.matrix && !terrainNode.translation && !terrainNode.rotation && !terrainNode.scale,'Terrain mesh must have identity export transform for this surface audit')
const primitive = document.meshes[terrainNode.mesh].primitives[0]
const require = createRequire(import.meta.url)
const factory = require('../public/map-assets/draco/draco_wasm_wrapper.js')
const module = await factory({wasmBinary:readFileSync(new URL('../public/map-assets/draco/draco_decoder.wasm',import.meta.url))})
const decoder = new module.Decoder(), buffer = new module.DecoderBuffer(), mesh = new module.Mesh()
const extension = primitive.extensions.KHR_draco_mesh_compression, view = document.bufferViews[extension.bufferView]
const compressed = binary.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength)
buffer.Init(new Int8Array(compressed.buffer,compressed.byteOffset,compressed.byteLength),compressed.byteLength)
const decoded = decoder.DecodeBufferToMesh(buffer,mesh)
assert(decoded.ok(),decoded.error_msg())
const attr = decoder.GetAttributeByUniqueId(mesh,extension.attributes.POSITION), values = new module.DracoFloat32Array()
decoder.GetAttributeFloatForAllPoints(mesh,attr,values)
const vertices:Point[] = Array.from({length:mesh.num_points()},(_,i)=>({x:values.GetValue(i*3),y:values.GetValue(i*3+1),z:values.GetValue(i*3+2)}))
const face = new module.DracoInt32Array(), triangles:number[][]=[]
for(let i=0;i<mesh.num_faces();i++){decoder.GetFaceFromMesh(mesh,i,face);triangles.push([face.GetValue(0),face.GetValue(1),face.GetValue(2)])}
for(const value of [face,values,mesh,buffer,decoder]) module.destroy(value)
const bins = new Map<string,number[]>()
triangles.forEach((ids,id)=>{
  const ps=ids.map(i=>vertices[i]), minX=Math.floor(Math.min(...ps.map(p=>p.x))),maxX=Math.floor(Math.max(...ps.map(p=>p.x))),minZ=Math.floor(Math.min(...ps.map(p=>p.z))),maxZ=Math.floor(Math.max(...ps.map(p=>p.z)))
  for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){const key=`${x},${z}`;if(!bins.has(key))bins.set(key,[]);bins.get(key)!.push(id)}
})
function surface(x:number,z:number):number|undefined {
  for(const id of bins.get(`${Math.floor(x)},${Math.floor(z)}`)||[]){
    const [a,b,c]=triangles[id].map(i=>vertices[i]),den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z)
    if(Math.abs(den)<1e-9)continue
    const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den,w=1-u-v
    if(u>=-1e-6&&v>=-1e-6&&w>=-1e-6)return u*a.y+v*b.y+w*c.y
  }
}
checks.surfaceMesh={vertices:vertices.length,triangles:triangles.length,sha256:createHash('sha256').update(glb).digest('hex')}
let maxVertexResidual=0
for(const p of vertices)maxVertexResidual=Math.max(maxVertexResidual,Math.abs(p.y-getTerrainHeight(p.x,p.z)))
checks.surfaceMeshVertexResidual=round(maxVertexResidual)
// 14-bit Draco quantization can shift vertices across the deliberate hard river-bank boundary;
// use off-bank surface sections below to assess terrain fidelity without that discontinuity.

const sections:unknown[]=[]
let maxFormulaError=0,maxMeshError=0,maxGradedMeshError=0,sectionCount=0,offRoadSections=0,gradedSections=0; const outsideCutaway:any[]=[]
for(const profile of data.profiles) for(const side of ['ne','sw'] as const){
  const samples=[]
  for(const d of [31,40,60,80,100,120,140,160,180,200,220,240,260,280,300]){
    const x=profile.sceneX,z=riverCenter(x)+(side==='ne'?-1:1)*d/data.horizontalMetresPerUnit
    const expected=.32+Math.max(0,sourceAt(profile[side],d)-sourceAt(profile[side],31))/data.verticalMetresPerUnit
    const actual=naturalTerrainHeight(x,z),formulaError=Math.abs(actual-expected)
    maxFormulaError=Math.max(maxFormulaError,formulaError)
    if(!insidePad(x,z)){
      const model=surface(x,z)
      if(model===undefined) {
        const angle=Math.atan2(z/39,x/46),edge=1+.025*Math.sin(5*angle)+.018*Math.sin(9*angle),radial=Math.hypot(x/46,z/39);
        check(radial>=edge-.015,'No interior terrain holes in measured sections',{profile:profile.id,side,d,x,z,radial,edge});
        outsideCutaway.push({profile:profile.id,side,d,x,z,reason:'Outside authored oval extent'});
      }
      if(model!==undefined){
        const roadBench=inRoadBench(x,z),graded=getTerrainHeight(x,z),error=Math.abs(model-expected),gradedError=Math.abs(model-graded)
        maxGradedMeshError=Math.max(maxGradedMeshError,gradedError)
        if(roadBench)gradedSections++;else{maxMeshError=Math.max(maxMeshError,error);offRoadSections++}
        sectionCount++;samples.push({d,roadBench,sourceRiseM:round((expected-.32)*data.verticalMetresPerUnit),modelRiseM:round((model-.32)*data.verticalMetresPerUnit),authoredRoadGradeM:round((graded-expected)*data.verticalMetresPerUnit),sourceErrorM:round(error*data.verticalMetresPerUnit),meshToRuntimeErrorM:round(gradedError*data.verticalMetresPerUnit)})
      }
    }
  }
  sections.push({station:profile.id,sceneX:profile.sceneX,side,samples})
}
check(maxFormulaError<1e-9,'Runtime sectional grade matches independent source interpolation',{maxFormulaError})
// 0.15 scene units = 1.5m, substantially smaller than the 30m source cell spacing.
check(maxMeshError<=.15,'Off-road exported sectional surface matches source grades within mesh tessellation tolerance',{maxMeshError,metres:maxMeshError*data.verticalMetresPerUnit})
check(maxGradedMeshError<=.15,'Exported sectional surface matches final runtime ground',{maxGradedMeshError,metres:maxGradedMeshError*data.verticalMetresPerUnit});
checks.sections={sectionCount,offRoadSections,gradedSections,maxFormulaError,maxMeshError,maxGradedMeshError,sections,outsideCutaway}
const coreSamples=[]
for(const x of [-20,-12,0,12,20])for(const d of [100,150,200]){const z=riverCenter(x)-d/10;if(!insidePad(x,z))coreSamples.push({x,d,height:ungradedTerrainHeight(x,z),final:getTerrainHeight(x,z),natural:naturalTerrainHeight(x,z)})}
check(coreSamples.every(p=>Math.abs(p.height-p.natural)<1e-9)&&coreSamples.filter(p=>p.height>1).length>=8,'Former wide flat hillside is absent',{coreSamples})
checks.ungradedCore=coreSamples
let unchangedOffRoad=0,maxUnintendedGrade=0;for(let x=-35;x<=35;x+=1)for(let z=-32;z<=30;z+=1){if(!inRoadBench(x,z)){unchangedOffRoad++;maxUnintendedGrade=Math.max(maxUnintendedGrade,Math.abs(getTerrainHeight(x,z)-ungradedTerrainHeight(x,z)))}}
check(maxUnintendedGrade<1e-9,'Road grading remains localized to exported walkway footprints',{unchangedOffRoad,maxUnintendedGrade});checks.roadGradeScope={unchangedOffRoad,maxUnintendedGrade}

const pathBelow:any[]=[],pathEdgeBelow:any[]=[],steep:any[]=[]
let pathSamples=0,minimumCenterClearance=Infinity,maximumGrade=0
layout.paths.forEach((path,pathIndex)=>{
  for(let i=0;i<path.points.length-1;i++){
    const a=path.points[i],b=path.points[i+1],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),grade=length?Math.abs(b[1]-a[1])/length:0
    maximumGrade=Math.max(maximumGrade,grade)
    if(grade>1)steep.push({pathIndex,kind:path.kind,segment:i,grade,a,b})
    const steps=Math.max(1,Math.ceil(length/.1))
    for(let k=0;k<=steps;k++){
      const t=k/steps,x=a[0]+dx*t,z=a[2]+dz*t,y=a[1]+(b[1]-a[1])*t,ground=surface(x,z)
      if(ground===undefined)continue
      pathSamples++;minimumCenterClearance=Math.min(minimumCenterClearance,y-ground)
      if(y<ground-.03)pathBelow.push({pathIndex,kind:path.kind,segment:i,x,y,z,ground,penetration:ground-y})
      if(path.kind==='bridge'||!length)continue
      for(const sign of [-1,1]){
        const xx=x+sign*(-dz/length)*path.width*.4,zz=z+sign*(dx/length)*path.width*.4,edge=surface(xx,zz)
        if(edge!==undefined&&y<edge-.05)pathEdgeBelow.push({pathIndex,kind:path.kind,segment:i,x:xx,y,z:zz,ground:edge,penetration:edge-y})
      }
    }
  }
})
check(!pathBelow.length,'Exported path centerlines remain above actual terrain',{count:pathBelow.length,worst:pathBelow.sort((a,b)=>b.penetration-a.penetration).slice(0,12)})
check(!pathEdgeBelow.length,'Walkable path widths do not pass beneath terrain',{count:pathEdgeBelow.length,worst:pathEdgeBelow.sort((a,b)=>b.penetration-a.penetration).slice(0,12)})
check(!steep.length,'Path connections avoid slopes exceeding 45 degrees',{count:steep.length,worst:steep.sort((a,b)=>b.grade-a.grade).slice(0,12)})
checks.paths={count:layout.paths.length,samples:pathSamples,minimumCenterClearance,maximumGrade,centerPenetrations:pathBelow.length,edgePenetrations:pathEdgeBelow.length}

const buildingProblems:any[]=[]
let minimumFloorClearance=Infinity,buildingSamples=0,maxRecordedCornerError=0
layout.buildings.forEach((building,index)=>{
  const [a,b,c]=building.footprint
  for(const p of building.footprint)maxRecordedCornerError=Math.max(maxRecordedCornerError,Math.abs(p[1]-getTerrainHeight(p[0],p[2])))
  for(let i=0;i<=5;i++)for(let j=0;j<=5;j++){
    const u=i/5,v=j/5,x=a[0]+(b[0]-a[0])*u+(c[0]-a[0])*v,z=a[2]+(b[2]-a[2])*u+(c[2]-a[2])*v,ground=surface(x,z)
    if(ground===undefined){buildingProblems.push({index,tag:building.tag,x,z,reason:'No terrain beneath building'});continue}
    buildingSamples++;minimumFloorClearance=Math.min(minimumFloorClearance,building.floorY-ground)
    if(ground>building.floorY+.03)buildingProblems.push({index,tag:building.tag,x,z,floor:building.floorY,ground,penetration:ground-building.floorY})
  }
})
check(maxRecordedCornerError<1e-8,'Recorded footprint elevations match current terrain',{maxRecordedCornerError})
check(!buildingProblems.length,'Building floors clear terrain across full footprints',{count:buildingProblems.length,worst:buildingProblems.sort((a,b)=>(b.penetration||0)-(a.penetration||0)).slice(0,12)})
checks.buildings={count:layout.buildings.length,samples:buildingSamples,minimumFloorClearance,maxRecordedCornerError}

const routeProblems:any[]=[],start=snapToWalkway(layout.pois[1].x,layout.pois[1].z)
let routeSamples=0,maxRouteRise=0,maxRouteGrade=0
for(const poi of layout.pois){
  const route=routeTo(start,snapToWalkway(poi.x,poi.z))
  if(!route.length)routeProblems.push({poi:poi.id,reason:'Unreachable'})
  for(let i=0;i<route.length;i++){
    const p=route[i],ground=surface(p.x,p.z);routeSamples++
    if(!walkableStep(p.x,p.z))routeProblems.push({poi:poi.id,point:p,reason:'Nonwalkable'})
    if(ground!==undefined&&p.y<ground-.03)routeProblems.push({poi:poi.id,point:p,ground,reason:'Route below terrain'})
    if(i){const a=route[i-1],distance=Math.hypot(p.x-a.x,p.z-a.z),rise=Math.abs(p.y-a.y);maxRouteRise=Math.max(maxRouteRise,rise);maxRouteGrade=Math.max(maxRouteGrade,distance?rise/distance:0);if(rise>.25&&rise/Math.max(distance,.001)>1)routeProblems.push({poi:poi.id,from:a,to:p,rise,reason:'Abrupt vertical connection'})}
  }
}
check(!routeProblems.length,'All POI routes connect smoothly above terrain',{count:routeProblems.length,examples:routeProblems.slice(0,16)})
checks.routes={pois:layout.pois.length,samples:routeSamples,maxRouteRise,maxRouteGrade}
const fingerprints=Object.fromEntries(['src/map-3d/xijiang-layout.json','src/map-3d/xijiang-terrain.json','src/map-3d/xijiang-terrain-pads.json','src/map-3d/terrain.ts','src/map-3d/navigation.ts'].map(file=>[file,createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex')]));
const report={status:failures.length?'failed':'passed',createdAt:new Date().toISOString(),fingerprints,checks,failures}
writeFileSync(new URL('../output/xijiang-map/terrain-verification.json',import.meta.url),JSON.stringify(report,null,2))
console.log(JSON.stringify({status:report.status,checks:{surface:checks.surfaceMesh,sections:{count:sectionCount,maxMeshError,maxFormulaError},paths:checks.paths,buildings:checks.buildings,routes:checks.routes},failures},null,2))
process.exitCode=failures.length?1:0


