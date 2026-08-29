export type WaxPhase = "intro" | "warm" | "draw" | "dye" | "oxidize" | "finish";

export type WaxToolId = "knife" | "heater" | "cloth" | "vat" | "drying_rack" | "beeswax";

export interface WaxToolInfo {
  id: WaxToolId;
  name: string;
  subname: string;
  description: string;
  heritageTip: string;
  glbPath?: string;
  icon: string;
}

export const WAX_TOOLS_DATA: Record<WaxToolId, WaxToolInfo> = {
  heater: {
    id: "heater",
    name: "铜蜡炉与熔蜡碗",
    subname: "保温供蜡器具",
    description: "内盛优质天然蜂蜡，底部置微炭火保温，维持蜡液在恒定熔化温度（约65℃-70℃）。",
    heritageTip: "苗家手艺人善用炭火余烬温蜡，过热则蜡烟焦枯断线，过冷则凝固滞刀。",
    glbPath: "/蜡染/game-assets/3d/02-wax-heater.glb",
    icon: "🔥",
  },
  knife: {
    id: "knife",
    name: "苗族铜柄双面蜡刀",
    subname: "核心画蜡工具",
    description: "由两片极薄的半圆形黄铜片合成，夹于竹柄中，利用毛细吸附原理储存与流淌蜡液。",
    heritageTip: "双铜片间隙仅0.2-0.5毫米，刀角倾斜时蜡液顺畅流淌，转角自如，是点线精髓所在。",
    glbPath: "/蜡染/game-assets/3d/01-wax-knife.glb",
    icon: "🗡️",
  },
  cloth: {
    id: "cloth",
    name: "丹寨纯棉平纹土布",
    subname: "天然草木载体",
    description: "经由手织木机织成，经温水脱胶、捶布石压实平整，具备极佳的蜡封与透染吸附力。",
    heritageTip: "上蜡前须将布面捶打密实，使蜡线不渗化走偏，染出清晰分明的白底蓝纹。",
    glbPath: "/蜡染/game-assets/3d/03-guided-cloth.glb",
    icon: "📜",
  },
  vat: {
    id: "vat",
    name: "古法杉木靛蓝染缸",
    subname: "天然草木发酵染液",
    description: "取板蓝根、蓼蓝之叶发酵沉淀为靛泥，配以米酒、草木灰水调和还原，染液深邃芬芳。",
    heritageTip: "染液表面浮起一层蓝绿紫光微沫（称'蓝靛花'），表明菌群活跃，还原良好。",
    glbPath: "/蜡染/game-assets/3d/05-indigo-vat.glb",
    icon: "🏺",
  },
  drying_rack: {
    id: "drying_rack",
    name: "山间高挂晾布竹架",
    subname: "空气氧化与成色",
    description: "出缸湿布透绿，需挂于高竿让空气充分接触隐色体，令绿色靛白氧化还原为恒久靛蓝。",
    heritageTip: "每一次氧化称作'一浸一晒'，多轮复染后方成黔东南盛装的月夜深蓝。",
    glbPath: "/蜡染/game-assets/3d/06-oxidizing-textile.glb",
    icon: "🎋",
  },
  beeswax: {
    id: "beeswax",
    name: "野生纯净天然蜂蜡",
    subname: "植物防染介质",
    description: "取自深山中华蜜蜂蜂巢提炼，质地柔润，熔点适中，冷却后形成独特冰裂冰纹。",
    heritageTip: "蜂蜡与少量松香调配，能使蜡质既附着牢固又具韧性，浸染时产生天然冰纹。",
    icon: "🍯",
  },
};

export interface PatternTemplate {
  id: string;
  name: string;
  symbol: string;
  meaning: string;
  difficulty: "初学" | "进阶" | "大师";
  previewImg?: string;
}

export const PATTERN_TEMPLATES: PatternTemplate[] = [
  {
    id: "butterfly",
    name: "蝴蝶妈妈 (MaiX Bx)",
    symbol: "🦋",
    meaning: "苗族神话中的始祖与万物创生图腾，象征生命生生不息与母性福佑。",
    difficulty: "初学",
    previewImg: "/蜡染/game-assets/2d/03-guided-cloth.png",
  },
  {
    id: "sunbird",
    name: "太阳鸟与神木纹",
    symbol: "🦅",
    meaning: "引导苗民迁徙、寻找阳光与沃土的吉鸟，展翅飞翔于天地之间。",
    difficulty: "进阶",
    previewImg: "/蜡染/game-assets/2d/04-wax-sealed-cloth.png",
  },
  {
    id: "fern_scroll",
    name: "水涡蕨草回纹",
    symbol: "🌀",
    meaning: "山间清泉与蔓生卷草，表达人与山川万物和合共生的哲学智慧。",
    difficulty: "进阶",
  },
  {
    id: "freehand",
    name: "自由创作 · 苗家心意",
    symbol: "✨",
    meaning: "不设拘束，以铜刀为笔、热蜡为墨，挥洒你心中的山水与花鸟。",
    difficulty: "大师",
  },
];

export interface CraftMetrics {
  knifeTemp: number; // 0 to 3
  waxLoad: number; // 0 to 2
  waxStrokes: number;
  coverageRatio: number; // 0 to 100
  sealedStatus: "empty" | "drawing" | "sealed";
  dyePasses: number; // 0 to 3
  dyeDurationSec: number;
  oxidationRatio: number; // 0 to 100
  score: number;
}
