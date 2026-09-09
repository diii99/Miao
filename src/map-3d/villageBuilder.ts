import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import layout from './xijiang-layout.json'
import { snapToWalkway } from './navigation'

export interface LandmarkPOI {
  id: string
  name: string
  title: string
  note: string
  detail: string
  kind: 'gate' | 'lusheng' | 'bridge' | 'batik' | 'silver' | 'embroidery' | 'banquet' | 'lookout' | 'museum' | 'ancient-street' | 'youfang' | 'gaga' | 'yedong' | 'guzang' | 'terraces' | 'necklace' | 'performance' | 'baishui'
  position: [number, number, number]
  actionPrompt: string
  lore: string
  evidence: string
  sources: string[]
}
const source = {
  official: 'https://www.xjqhmz.com/news/detail?id=958772957063258114&type=news-notice',
  aerial: 'https://www.chinanews.com.cn/tp/2024/06-29/10242966.shtml',
  culture: 'https://www.gz.news.cn/20240723/dfb962c6220e4927a9bb9d61d1c51d8b/c.html',
}
const definitions: Array<[LandmarkPOI['kind'], string, string, string, string]> = [
  ['gate', '河谷入口', '沿河入寨', '从河谷步道开始，经过廊桥进入坡地聚落。这是场景入口，不对应景区西门或北门。', '了解河谷聚落'],
  ['lusheng', '芦笙广场（芦笙场）', '古街与游方街之间', '芦笙场位于古街和游方街之间，是节庆聚会与歌舞活动的公共空间。参考全景重做围合木楼、阶梯端部与同心弧线石铺地，两侧联系街道。', '近观苗族芦笙'],
  ['bridge', '风雨桥', '跨越白水河', '廊桥连接两岸步道，桥面具有独立通行高度。桥号、具体位置与建筑细节尚待实地核验。', '了解风雨桥'],
  ['batik', '蜡染体验', '蓝靛与蜡纹', '进入虚拟蜡染体验。木楼表现苗乡工坊意象，不代表已定位的现场店铺。', '开始蜡染体验'],
  ['silver', '银饰体验', '锤錾与银花', '进入虚拟银饰制作体验。体验内容与村寨空间关联，建筑和店址为艺术示意。', '开始千锤成银'],
  ['embroidery', '苗绣展览', '针线里的记忆', '在坡地木楼里浏览苗绣文化。展览入口为虚拟内容，不提供现场地址。', '打开苗绣展览'],
  ['banquet', '长桌宴体验', '共席与相聚', '体验苗族长桌宴文化。此处为虚拟活动入口，不表示常设宴席或现场经营点。', '入席长桌宴'],
  ['lookout', '观景台', '层叠屋顶 · 河谷全景', '从高处观察坡地住宅、白水河和梯田之间的关系。官方游线确认观景台为独立节点，此模型的位置和形制仍为示意。', '从观景台看河谷'],
  ['museum', '西江苗族博物馆', '历史与非遗记忆', '博物馆与观景台分别建档。景区资料介绍馆舍由六栋两层建筑组合而成；模型保留六栋木楼组团，并调整为深色木构、灰瓦与连续阳台。', '查看苗族非遗全览'],
  ['ancient-street','古街','寨内文化主街','古街与游方街共同联系核心游览区，芦笙场位于两街之间。模型表现街道关系，不提供实测长度。','了解古街'],
  ['youfang','游方街','沿河慢行','沿河步行空间，与古街及芦笙场形成游览联系。道路曲线为示意。','了解游方街'],
  ['gaga','嘎歌古巷','生活与传统工艺','报道记载古巷有原住民生活和苗绣、酿酒、蜡染、古歌等文化内容；不将虚拟体验当作现场店址。','了解嘎歌古巷'],
  ['yedong','也东寨','坡地聚落','官方历史游线列出的寨区节点。以顺坡木楼与台阶表达传统生活空间，边界与定位待核。','了解也东寨'],
  ['guzang','鼓藏文化节点','鼓藏堂 · 位置待核','研究资料列出鼓藏堂。此处为鼓藏文化介绍节点，不冒充已核实的鼓藏堂入口，不标开放时间。','了解鼓藏文化'],
  ['terraces','田园观光区','村寨与稻作','梯田和田园是河谷聚落的重要组成部分。保留开阔田园与步道，表现农耕景观。','了解田园'],
  ['necklace','银项圈广场','公共活动空间','官方活动资料将银项圈广场与芦笙场分别列出。参考全景中的石铺广场、中央基座与三组银色项圈装置重做外观。','了解银项圈广场'],
  ['performance','歌舞表演场','美丽西江 · 场所示意','歌舞表演场与芦笙场分开表达，避免把所有演出集中到同一广场。位置与建筑形式待进一步核实，不提供实时演出场次。','了解歌舞表演'],
  ['baishui','白水河','穿寨河谷','白水河穿过坡地聚落；在岸边停留，观察两岸吊脚楼与跨河风雨桥。','了解白水河'],

]
const landmarkSources: Partial<Record<LandmarkPOI['kind'], string[]>> = {
  lusheng: ['https://gzstv.com/a/6f52e4d9008148bea48b9f048cb021ed', 'https://www.xjqhmz.com/news/detail?id=676750551442104322&type=news-notice'],
  museum: ['https://www.xjqhmz.com/news/detail?id=958067099572477953&type=news-notice'],
  necklace: ['https://www.xjqhmz.com/news/detail?id=958067099572477953&type=news-notice'],
  'ancient-street': ['https://gzstv.com/a/6f52e4d9008148bea48b9f048cb021ed'],
  youfang: ['https://gzstv.com/a/6f52e4d9008148bea48b9f048cb021ed'],
  gaga: ['https://gzstv.com/a/6f52e4d9008148bea48b9f048cb021ed'],
  yedong: ['https://www.xjqhmz.com/news/detail?id=828296979686727682&type=news-notice'],
  guzang: ['https://gy.bendibao.com/tour/2025427/75367.shtm'],
  performance: ['https://www.sohu.com/a/423294223_122223'],
}
export const LANDMARK_POIS: LandmarkPOI[] = definitions.map(([kind, name, note, detail, actionPrompt]) => {
  const location = layout.pois.find(p => p.id === kind)!
  const point = snapToWalkway(location.x, location.z)
  const virtual = ['batik', 'silver', 'embroidery', 'banquet', 'gate'].includes(kind)
  return { id: kind, kind, name, title: `${name} · ${note}`, note, detail, actionPrompt,
    position: [point.x, point.y, point.z],
    evidence: virtual ? '虚拟文化体验 · 非现场地址' : '地标与聚落空间示意 · 位置待核',
    sources: [...(landmarkSources[kind] ?? (virtual ? [source.culture] : [source.official, source.aerial])), ...(!virtual ? ['https://www.720yun.com/vr/246jtpkfOf2'] : [])],
    lore: '依据景区游线与新闻航拍研究建立文化场景。资料日期 2026-09-08；无测绘底图，距离、北向和建筑位置不用于实地导航。',
  }
})

export function getTerrainHeight(x: number, z: number): number {
  const river = 5 + 3.4 * Math.sin(x * .092) + .65 * Math.sin(x * .21)
  const distance = Math.abs(z - river)
  if (distance < 1.85) return -.62
  const value = .32 + Math.max(0, distance - 3.1) * (z < river ? .58 : .27)
    + (Math.sin(x * .15) * .5 + Math.cos(z * .17) * .3) * Math.min(1, Math.max(0, distance - 3.1) / 5)
  if (z >= river - 3.1) return value
  const core = (1 - THREE.MathUtils.smoothstep(Math.abs(x + 2), 11, 19)) * (1 - THREE.MathUtils.smoothstep(distance, 15, 23))
  return value * (1 - core) + .48 * core
}

export function buildMiaoVillage() {
  const group = new THREE.Group()
  const windowMaterials: THREE.MeshStandardMaterial[] = []
  const lanternLights: THREE.PointLight[] = []
  let disposed = false
  const release = (object: THREE.Object3D) => {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>()
    object.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      geometries.add(child.geometry)
      for (const m of Array.isArray(child.material) ? child.material : [child.material]) materials.add(m)
    })
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
  }
  const ready = new GLTFLoader().loadAsync('/map-assets/models/xijiang-valley.glb').then(gltf => {
    if (disposed) { release(gltf.scene); return }
    gltf.scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      for (const mat of Array.isArray(child.material) ? child.material : [child.material]) {
        if (mat instanceof THREE.MeshStandardMaterial && mat.name.startsWith('Window glow') && !windowMaterials.includes(mat)) windowMaterials.push(mat)
      }
    })
    group.add(gltf.scene)
  })
  return { group, ready, windowMaterials, lanternLights, updateScene: (_delta: number, _elapsed: number) => {},
    dispose: () => { disposed = true; release(group) } }
}
