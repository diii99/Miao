import {
  StrictMode,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import "@google/model-viewer";
import "./styles.css";
import "./heritage-interactions.css";
import "./wax-game.css";
import "./wax-workbench.css";
import "./silver-game.css";
import heritageHero from "./assets/heritage-hero.png";
import { WaxWorkbench3D } from "./wax-3d/WaxWorkbench3D";
import { WaxDrawingCanvas } from "./wax-3d/WaxDrawingCanvas";
import { waxAudio } from "./wax-3d/WaxAudio";
import type { WaxPhase, CraftMetrics, WaxToolId } from "./wax-3d/types";
import { SilverWorkbench3D, type SilverPhase } from "./silver-3d/SilverWorkbench3D";

type TabKey = "home" | "heritage" | "culture" | "more";
const tabs: {
  key: TabKey;
  label: string;
  to: "/" | "/heritage" | "/culture" | "/more";
  icon: string;
}[] = [
  { key: "home", label: "首页", to: "/", icon: "⌂" },
  { key: "heritage", label: "非遗", to: "/heritage", icon: "✦" },
  { key: "culture", label: "文化", to: "/culture", icon: "◌" },
  { key: "more", label: "其他", to: "/more", icon: "···" },
];

function Shell({
  active,
  title,
  children,
}: {
  active: TabKey;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mini-program">
      <header className="navigation-bar">
        <span className="page-title">{title}</span>
        <span className="capsule" aria-label="小程序胶囊按钮">
          <i />
          <b />
          <em />
        </span>
      </header>
      <section className="page-content">{children}</section>
      <nav className="tab-bar" aria-label="主导航">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            className={`tab-item ${active === tab.key ? "active" : ""}`}
            activeOptions={{ exact: true }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}

const outfits = [
  { id: "midnight", label: "靛蓝盛装" },
  { id: "scarlet", label: "朱红节装" },
  { id: "teal", label: "山野青衣" },
];
const jewelry = [
  { id: "silver", label: "银饰" },
  { id: "gold", label: "鎏金" },
  { id: "plain", label: "素雅" },
];
const headdresses = [
  { id: "crown", label: "银冠" },
  { id: "scarf", label: "头帕" },
  { id: "flower", label: "花饰" },
];

function HomePage() {
  const [outfit, setOutfit] = useState("midnight");
  const [jewel, setJewel] = useState("silver");
  const [headwear, setHeadwear] = useState("crown");
  const optionRow = (
    title: string,
    selected: string,
    items: { id: string; label: string }[],
    choose: (id: string) => void,
  ) => (
    <div className="dress-row">
      <span>{title}</span>
      <div>
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className={selected === item.id ? "chosen" : ""}
            onClick={() => choose(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <Shell active="home" title="黔苗行">
      <section className="dress-hero">
        <div className="dress-copy">
          <p>贵州 · 黔东南</p>
          <h1>
            穿上苗装
            <br />
            走进苗寨
          </h1>
          <span>挑选你的苗乡旅行造型</span>
        </div>
        <div className="village">
          <i className="building building-one" />
          <i className="building building-two" />
          <i className="building building-three" />
          <b />
        </div>
        <div
          className={`dress-avatar avatar outfit-${outfit} jewel-${jewel} head-${headwear}`}
          aria-label="正面站立的苗族服饰人物"
        >
          <div className="avatar-hair" />
          <div className="avatar-head">
            <i className="avatar-eye eye-left" />
            <i className="avatar-eye eye-right" />
            <b />
          </div>
          <div className="avatar-headdress">
            <i />
            <b />
            <em />
          </div>
          <div className="avatar-necklace">
            <i />
            <b />
            <em />
          </div>
          <div className="avatar-torso">
            <i className="sleeve sleeve-left" />
            <i className="sleeve sleeve-right" />
            <b className="embroidery">✦</b>
          </div>
          <div className="avatar-skirt">
            <i />
            <b />
          </div>
          <div className="avatar-leg leg-left" />
          <div className="avatar-leg leg-right" />
        </div>
        <div className="dress-seal">
          苗<br />装
        </div>
      </section>
      <section className="dress-panel">
        <div className="dress-panel-title">
          <div>
            <p>苗乡试穿</p>
            <h2>定制你的旅拍造型</h2>
          </div>
          <span>可即时预览</span>
        </div>
        {optionRow("服饰", outfit, outfits, setOutfit)}
        {optionRow("首饰", jewel, jewelry, setJewel)}
        {optionRow("头饰", headwear, headdresses, setHeadwear)}
      </section>
      <Heading
        eyebrow="旅行灵感"
        title="这一站，去苗寨"
        action="查看目的地 →"
      />
      <section className="story-card">
        <div className="story-image">
          <span>
            西<br />江
          </span>
          <i>黔东南 · 雷山</i>
        </div>
        <div className="story-copy">
          <small>苗寨目的地</small>
          <h3>西江千户苗寨，住进万家灯火</h3>
          <p>
            沿着吊脚楼与山间步道慢慢行走，感受苗乡晨雾、歌声与长桌宴的热闹。
          </p>
          <div className="author">
            <b>行</b>
            <span>苗乡旅行指南 · 雷山</span>
          </div>
        </div>
      </section>
    </Shell>
  );
}
function Heading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: string;
}) {
  return (
    <section className="section-heading">
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action && <a>{action}</a>}
    </section>
  );
}

type HeritageItem = {
  name: string;
  region: string;
  kind: string;
  index: string;
  symbol: string;
  color: string;
  media: "audio" | "video" | "three";
  summary: string;
  story: string;
  detail: string;
  sound: string;
  duration: string;
  object: string;
  archive: string;
  source: string;
};

const heritageItems: HeritageItem[] = [
  {
    index: "01",
    name: "苗族古歌",
    region: "黔东南 · 台江",
    kind: "民间文学",
    symbol: "歌",
    color: "#a65d43",
    media: "audio",
    summary: "以唱诵保存创世、迁徙与日常生活的集体记忆。",
    story:
      "在鼓社祭、婚丧、聚会与节日中，古歌由歌手和长者口传。它把宇宙起源、洪水、迁徙与生产生活连成一部仍在被唱出的“百科全书”。",
    detail: "先听声线和停顿，再读唱词里反复出现的山、水与迁徙意象。",
    sound: "古歌唱诵 · 口传声景",
    duration: "04:12",
    object: "声纹唱本",
    archive: "Ⅰ-1 · 2006 第一批",
    source: "https://www.ihchina.cn/project_details/12178.html",
  },
  {
    index: "02",
    name: "苗族蜡染技艺",
    region: "贵州 · 丹寨",
    kind: "传统技艺",
    symbol: "染",
    color: "#315d96",
    media: "video",
    summary: "蜡刀留白，靛蓝上色；布面裂纹是热蜡与冷染共同留下的时间。",
    story:
      "苗语称“务图”，意为“蜡染服”。从栽靛、织布、画蜡到浸染和剪裁，技艺在家庭与日常劳作中代代传承。",
    detail: "播放工序短片：勾蜡 → 入染 → 脱蜡；注意线条与裂纹如何显现。",
    sound: "蜡刀 · 染缸水声",
    duration: "02:18",
    object: "靛蓝工序片",
    archive: "Ⅷ-25 · 2006 第一批",
    source: "https://www.ihchina.cn/project_details/14300.html",
  },
  {
    index: "03",
    name: "苗绣",
    region: "黔东南 · 雷山",
    kind: "传统美术",
    symbol: "绣",
    color: "#ad4056",
    media: "three",
    summary: "鸟、蝶、涡纹与山形被绣进衣襟，成为可穿戴的记忆。",
    story:
      "丝线在布面上堆叠出颜色、方向与起伏。不同支系和场合的服饰纹样各有语汇，图案不只是装饰，也承载着故事与祝愿。",
    detail: "转动绣片，比较平绣与凸起针脚在侧光下的高低和丝线光泽。",
    sound: "针线 · 指尖摩擦",
    duration: "01:56",
    object: "立体绣片",
    archive: "地方代表性项目",
    source:
      "https://www.ihchina.cn/search_result/keyword/%E8%8B%97%E6%97%8F%E5%88%BA%E7%BB%A3.html",
  },
  {
    index: "04",
    name: "苗族银饰锻制技艺",
    region: "黔东南 · 剑河",
    kind: "传统技艺",
    symbol: "银",
    color: "#798c99",
    media: "three",
    summary: "熔炼、捶打、制花、编结焊接，让银角、项圈与胸锁逐渐成形。",
    story:
      "剑河银饰常取龙、虎、昆虫、花鸟等素材，配合绞花、錾花、压花与编花。一个完整工序可超过三十道，很多银花再焊接为一套饰件。",
    detail: "旋转银角，查看錾刻、拉丝与悬挂银花；放大后可看到层次关系。",
    sound: "银锤 · 清脆叮响",
    duration: "02:47",
    object: "银角冠",
    archive: "Ⅷ-40 · 2011 第三批扩展",
    source: "https://www.ihchina.cn/project_details/14335.html",
  },
  {
    index: "05",
    name: "苗族芦笙舞",
    region: "黔东南 · 榕江",
    kind: "传统舞蹈",
    symbol: "笙",
    color: "#617d54",
    media: "video",
    summary: "吹笙、转步与围场同时发生，节日里的声音和脚步共享一个节拍。",
    story:
      "芦笙舞常在祭祖、节日和喜庆活动中表演。贵州多地保存不同样式；有吹笙伴舞、吹笙领舞与自吹自舞等形式，舞曲也有礼乐、叙事、进行和舞曲之分。",
    detail: "观看圆场动线：先找笙手的位置，再看人群如何围绕节拍移动。",
    sound: "芦笙 · 环场脚步",
    duration: "03:16",
    object: "圆场影像",
    archive: "Ⅲ-23 · 2008 第二批扩展",
    source: "https://www.ihchina.cn/project_details/12958",
  },
  {
    index: "06",
    name: "苗年",
    region: "黔东南 · 雷山",
    kind: "民俗",
    symbol: "年",
    color: "#b87138",
    media: "audio",
    summary: "秋收之后，以祭祖、走寨、糯米粑与芦笙会迎来苗历新岁。",
    story:
      "苗年是清水江、都柳江流域苗族最重要的节日之一。各寨会协商轮流举办；节日期间有团年饭、串寨酒、赛歌、芦笙舞等活动，热闹可延续至早春。",
    detail: "进入声场模式，按“清晨祭祖—午后走寨—夜晚芦笙会”感受一天节奏。",
    sound: "走寨人声 · 芦笙会",
    duration: "03:55",
    object: "苗年声场",
    archive: "Ⅹ-83 · 2008 第二批",
    source: "https://www.ihchina.cn/project_details/15117.html",
  },
];

function playAmbientPing() {
  const AudioApi =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioApi) return;
  const context = new AudioApi();
  const now = context.currentTime;
  [0, 0.32, 0.66].forEach((offset, i) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = i === 1 ? "sine" : "triangle";
    oscillator.frequency.value = [392, 523.25, 659.25][i];
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.065, now + offset + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.32);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.35);
  });
  window.setTimeout(() => context.close(), 1300);
}

function HeritagePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [is3d, setIs3d] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState({ x: 8, y: -13 });
  const dragStart = useRef<{
    x: number;
    y: number;
    rotationX: number;
    rotationY: number;
  } | null>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = heritageItems[activeIndex];
  const chooseItem = (index: number) => {
    const item =
      heritageItems[(index + heritageItems.length) % heritageItems.length];
    setActiveIndex((index + heritageItems.length) % heritageItems.length);
    setIsPlaying(false);
    setIs3d(item.media === "three");
    setRotation({ x: 8, y: -13 });
  };
  const toggleAudio = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    if (next) playAmbientPing();
  };
  useEffect(() => {
    chipRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex]);
  const stageStyle = {
    "--stage-color": active.color,
    "--object-x": `${rotation.x}deg`,
    "--object-y": `${rotation.y}deg`,
  } as CSSProperties;
  const mediaLabel =
    active.media === "three"
      ? "3D 物件"
      : active.media === "video"
        ? "影像笔记"
        : "声音档案";
  return (
    <Shell active="heritage" title="苗族非遗">
      <section
        className="heritage-hero"
        style={{ backgroundImage: `url(${heritageHero})` }}
      >
        <div className="heritage-hero-overlay" />
        <div className="heritage-hero-copy">
          <p>MIAO · LIVING HERITAGE ARCHIVE</p>
          <h1>
            在场的
            <br />
            苗族非遗
          </h1>
          <span>6 项贵州苗族代表性项目 · 用对媒介，慢慢看</span>
        </div>
        <div className="heritage-orbit">
          <i />
          <i />
          <b>
            06
            <br />
            <small>项</small>
          </b>
        </div>
        <div className="hero-credit">视觉档案 · 苗族蜡染工坊</div>
        <div className="hero-scroll-hint">
          <i />
          向下，选择一项
        </div>
      </section>
      <section className="heritage-intro">
        <span className="archive-label">只收录苗族相关项目</span>
        <p>
          项目资料对应中国非遗数字博物馆条目。声音、影像与可旋转物件只在真正有帮助时出现；每一张卡都可回到来源核对。
        </p>
      </section>
      <section className="archive-navigation" aria-label="苗族非遗项目导航">
        <div className="archive-navigation-top">
          <span>选择一个现场</span>
          <b>
            {active.index} <i>/ 06</i>
          </b>
        </div>
        <section className="heritage-picker" aria-label="选择苗族非遗项目">
          {heritageItems.map((item, index) => (
            <button
              ref={(node) => {
                chipRefs.current[index] = node;
              }}
              type="button"
              className={`heritage-chip ${index === activeIndex ? "is-selected" : ""}`}
              key={item.name}
              onClick={() => chooseItem(index)}
              style={{ "--chip-color": item.color } as CSSProperties}
            >
              <span>
                {item.media === "three"
                  ? "3D"
                  : item.media === "video"
                    ? "影"
                    : "声"}
              </span>
              <b>{item.name}</b>
            </button>
          ))}
        </section>
        <div className="archive-stepper">
          <button
            type="button"
            aria-label="上一个项目"
            onClick={() => chooseItem(activeIndex - 1)}
          >
            ←
          </button>
          <div
            className="archive-progress"
            aria-label={`第 ${activeIndex + 1} 项，共 ${heritageItems.length} 项`}
          >
            <i
              style={{
                width: `${((activeIndex + 1) / heritageItems.length) * 100}%`,
              }}
            />
          </div>
          <button
            type="button"
            aria-label="下一个项目"
            onClick={() => chooseItem(activeIndex + 1)}
          >
            →
          </button>
        </div>
      </section>
      <section
        className={`heritage-stage media-${active.media} ${is3d ? "is-3d" : ""}`}
        style={stageStyle}
      >
        <div className="stage-noise" />
        <div className="stage-topline">
          <span>
            {active.kind} · {active.region}
          </span>
          <span className="media-badge">{mediaLabel}</span>
        </div>
        <div
          className="stage-object"
          aria-label={`${active.name} 展示物件${active.media === "three" ? "，可拖动旋转" : ""}`}
          onPointerDown={(event) => {
            if (active.media !== "three") return;
            dragStart.current = {
              x: event.clientX,
              y: event.clientY,
              rotationX: rotation.x,
              rotationY: rotation.y,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!dragStart.current) return;
            setRotation({
              x: Math.max(
                -35,
                Math.min(
                  35,
                  dragStart.current.rotationX -
                    (event.clientY - dragStart.current.y) / 4,
                ),
              ),
              y:
                dragStart.current.rotationY +
                (event.clientX - dragStart.current.x) / 3,
            });
          }}
          onPointerUp={() => {
            dragStart.current = null;
          }}
          onPointerCancel={() => {
            dragStart.current = null;
          }}
        >
          <i className="object-shadow" />
          <div className="object-aura" />
          <div className="object-core">
            <span>{active.symbol}</span>
            <b>{active.object}</b>
          </div>
          {active.media === "video" && (
            <div className="video-slate">
              <i>▶</i>
              <span>工序 / 动线笔记</span>
            </div>
          )}
          {active.media === "audio" && (
            <div className="audio-rings">
              <i />
              <i />
              <i />
            </div>
          )}
          {active.media === "three" && (
            <>
              <button
                type="button"
                className="mode-toggle object-mode"
                onClick={() => setIs3d(!is3d)}
                aria-pressed={is3d}
              >
                <i>◇</i>
                {is3d ? "暂停自动旋转" : "自动旋转"}
              </button>
              <em className="object-tag">拖动旋转</em>
            </>
          )}
        </div>
        <div className="stage-copy">
          <p className="stage-number">档案 / {active.archive}</p>
          <h2>{active.name}</h2>
          <h3>{active.summary}</h3>
          <p>{active.story}</p>
          <div className="focus-note">
            <span>如何看</span>
            {active.detail}
          </div>
          {active.name === "苗族蜡染技艺" && (
            <Link className="wax-game-entry" to="/wax-game">
              进入沉浸工坊 <b>→</b>
            </Link>
          )}
          {active.name === "苗族银饰锻制技艺" && (
            <Link className="wax-game-entry" to="/silver-game">
              进入银饰锻打工坊 <b>→</b>
            </Link>
          )}
        </div>
      </section>
      <section
        className="sound-player"
        style={{ "--sound-color": active.color } as CSSProperties}
      >
        <button
          type="button"
          className={`sound-button ${isPlaying ? "is-playing" : ""}`}
          onClick={toggleAudio}
          aria-label={isPlaying ? "暂停声景" : "试听声景"}
        >
          <i>{isPlaying ? "Ⅱ" : "▶"}</i>
        </button>
        <div className="sound-meta">
          <small>
            {isPlaying ? "正在播放 · 交互声景演示" : "试听 · 交互声景演示"}
          </small>
          <h3>{active.sound}</h3>
          <div
            className={`sound-wave ${isPlaying ? "is-playing" : ""}`}
            aria-hidden="true"
          >
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <span className="sound-time">{active.duration}</span>
      </section>
      <a
        className="source-card"
        href={active.source}
        target="_blank"
        rel="noreferrer"
      >
        <span>资料来源</span>
        <b>中国非遗数字博物馆条目</b>
        <i>↗</i>
      </a>
      <section className="heritage-notes">
        <div>
          <span>观看与记录</span>
          <h2>来源在前，体验在后</h2>
        </div>
        <p>
          这里的声景和 3D
          物件是帮助理解的交互示意，并不替代真实的传习、表演或工坊体验。到访和拍摄请遵守当地社区与传承人的提示。
        </p>
      </section>
    </Shell>
  );
}

const waxSteps: { phase: WaxPhase; label: string; cue: string }[] = [
  { phase: "warm", label: "温炉蘸蜡", cue: "让铜刀蓄热，轻蘸熔蜡" },
  { phase: "draw", label: "落蜡防染", cue: "先勾外廓，再填留白" },
  { phase: "dye", label: "入缸浸染", cue: "压入染缸，吸收天然靛蓝" },
  { phase: "oxidize", label: "挂竿氧化", cue: "见风变蓝，多次复染" },
];

function WaxGamePage() {
  const [phase, setPhase] = useState<WaxPhase>("intro");
  const [knifeTemp, setKnifeTemp] = useState<number>(0);
  const [waxLoad, setWaxLoad] = useState<number>(0);
  const [waxStrokes, setWaxStrokes] = useState<number>(0);
  const [coverageRatio, setCoverageRatio] = useState<number>(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("butterfly");
  const [dyeProgress, setDyeProgress] = useState<number>(0);
  const [oxidation, setOxidation] = useState<number>(0);
  const [dyePasses, setDyePasses] = useState<number>(0);
  const [isDyeingActive, setIsDyeingActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [drawingCanvas, setDrawingCanvas] = useState<HTMLCanvasElement | null>(null);

  // Auto-progress dye timer when in dye phase
  useEffect(() => {
    if (phase !== "dye" || !isDyeingActive || dyeProgress >= 100) return;
    const timer = window.setInterval(() => {
      setDyeProgress((prev) => {
        if (prev >= 95) {
          waxAudio.playBellChime(1.1);
          return 100;
        }
        return prev + 5;
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [phase, isDyeingActive, dyeProgress]);

  // Auto-progress oxidation when on rack
  useEffect(() => {
    if (phase !== "oxidize" || oxidation <= 0 || oxidation >= 100) return;
    const timer = window.setInterval(() => {
      setOxidation((prev) => {
        if (prev >= 95) {
          waxAudio.playBellChime(1.3);
          return 100;
        }
        return prev + 4;
      });
    }, 110);
    return () => window.clearInterval(timer);
  }, [phase, oxidation]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    waxAudio.setMuted(next);
  };

  const handleHeatKnife = () => {
    setKnifeTemp((prev) => Math.min(3, prev + 1));
    waxAudio.playHeatSizzle();
  };

  const handleDipWax = () => {
    setWaxLoad((prev) => Math.min(2, prev + 1));
    waxAudio.playWaxDip();
  };

  const handleScrapeWax = () => {
    waxAudio.playWaxScrape();
  };

  const startDyeing = () => {
    setPhase("dye");
    setIsDyeingActive(true);
    setDyeProgress(0);
    waxAudio.playDyeSubmerge();
  };

  const startOxidation = () => {
    setDyePasses((prev) => prev + 1);
    setPhase("oxidize");
    setIsDyeingActive(false);
    setOxidation(1); // start oxidation progress
    waxAudio.playClothRustle();
  };

  const repeatDyePass = () => {
    startDyeing();
  };

  const finishMasterpiece = () => {
    setPhase("finish");
    waxAudio.playBellChime(1.5);
  };

  const restart = () => {
    setPhase("intro");
    setKnifeTemp(0);
    setWaxLoad(0);
    setWaxStrokes(0);
    setCoverageRatio(0);
    setDyeProgress(0);
    setOxidation(0);
    setDyePasses(0);
    setIsDyeingActive(false);
    waxAudio.playBellChime();
  };

  const metrics: CraftMetrics = {
    knifeTemp,
    waxLoad,
    waxStrokes,
    coverageRatio,
    sealedStatus: waxStrokes >= 8 ? "sealed" : waxStrokes > 0 ? "drawing" : "empty",
    dyePasses,
    dyeDurationSec: dyeProgress,
    oxidationRatio: oxidation,
    score: Math.min(100, 36 + Math.min(30, waxStrokes * 4) + Math.min(24, dyePasses * 12) + Math.round(coverageRatio * 0.1)),
  };

  const activeStep =
    phase === "intro" ? -1 : waxSteps.findIndex((step) => step.phase === phase);

  return (
    <Shell active="heritage" title="蜡染 3D 沉浸工坊">
      <section className={`wax-game phase-${phase}`}>
        {/* Header HUD */}
        <header className="wax-game-head">
          <Link to="/heritage" className="wax-back" aria-label="返回苗族非遗">
            ←
          </Link>
          <div>
            <span>丹寨 · 苗族非遗工坊</span>
            <h1>3D 蜡染工作台</h1>
          </div>
          <button
            type="button"
            className="wax-sound-toggle"
            onClick={toggleMute}
            aria-label={isMuted ? "开启声音" : "静音"}
          >
            {isMuted ? "🔇" : "🔔"}
          </button>
          <b>
            {phase === "finish"
              ? `${metrics.score} 分`
              : `${Math.max(0, activeStep + 1)} / 4`}
          </b>
        </header>

        {/* Stepper Bar */}
        <section className="wax-stepper" aria-label="蜡染工艺步骤">
          {waxSteps.map((step, index) => (
            <div
              key={step.phase}
              className={index <= activeStep ? "is-done" : ""}
            >
              <i>{index + 1}</i>
              <span>{step.label}</span>
            </div>
          ))}
        </section>

        {/* Primary 3D Three.js Workbench Scene */}
        <WaxWorkbench3D
          phase={phase}
          metrics={metrics}
          onPickKnife={() => {
            setPhase("warm");
            waxAudio.playBellChime();
          }}
          onHeatKnife={handleHeatKnife}
          onDipWax={handleDipWax}
          onScrapeWax={handleScrapeWax}
          onStartDrawing={() => {
            setPhase("draw");
            waxAudio.playBellChime(1.2);
          }}
          onSubmergeInVat={startDyeing}
          onHangOnRack={startOxidation}
          onRepeatDye={repeatDyePass}
          onFinishMasterpiece={finishMasterpiece}
          onRestart={restart}
          drawingCanvas={drawingCanvas}
        >
          {phase === "draw" && (
            <div className="in-map-drawer-overlay">
              <WaxDrawingCanvas
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={(id) => {
                  setSelectedTemplateId(id);
                  waxAudio.playWaxScrape();
                }}
                onStrokeAdd={(strokes, coverage) => {
                  setWaxStrokes(strokes);
                  setCoverageRatio(coverage);
                }}
                onCanvasTextureUpdate={(canvas) => {
                  setDrawingCanvas(canvas);
                }}
              />
              <div className="draw-submit-area">
                {waxStrokes >= 6 ? (
                  <button
                    type="button"
                    className="wax-primary wax-next"
                    onClick={startDyeing}
                  >
                    🍯 封蜡完成 · 送入古法高深靛蓝缸 <b>→</b>
                  </button>
                ) : (
                  <small className="draw-hint">
                    提示：至少描画 6 笔以上形成有效蜡层，即可解锁入缸浸染。
                  </small>
                )}
              </div>
            </div>
          )}

          {phase === "finish" && (
            <div className="in-map-finish-overlay">
              <div className="finished-cloth-badge">
                <i>✦ 丹寨非遗 · 我的专属手作杰作 ✦</i>
              </div>
              <h2>蓝白相映 · 冰纹天成</h2>
              <p>
                由你亲手绘制落蜡、并经古法靛蓝浸染与空气氧化的专属蜡染作品，在 3D 展架上真实呈现！
              </p>
              <div className="wax-score">
                <div>
                  <b>{waxStrokes} 笔</b>
                  <span>手绘落蜡</span>
                </div>
                <div>
                  <b>{dyePasses} 轮</b>
                  <span>复染层数</span>
                </div>
                <div>
                  <b>{metrics.score} 分</b>
                  <span>非遗大师评分</span>
                </div>
              </div>
              <div className="finish-actions">
                <button type="button" onClick={restart}>
                  🔄 重新入席创作
                </button>
                <Link to="/heritage">✦ 回到苗族非遗档案</Link>
              </div>
            </div>
          )}
        </WaxWorkbench3D>

        {/* Introduction Guide Card for Step 1 */}
        {phase === "intro" && (
          <section className="wax-intro">
            <p>工坊导览 · 丹寨非遗</p>
            <h2>从一张 3D 实木工作台，开启苗家蜡染。</h2>
            <span>
              在三维场景中自由拖动视角或点击器具卡片，观察高出桌面的古法靛蓝缸、左侧晾布竹架、炭火铜蜡炉与平纹土布。
            </span>
            <div className="workbench-tool-gallery">
              <span className="gallery-title">已载入的三维器具模型：</span>
              <div className="tool-tag-list">
                <span>🔥 铜蜡炉</span>
                <span>🗡️ 铜蜡刀</span>
                <span>📜 平纹土布</span>
                <span>🏺 高深靛蓝缸</span>
                <span>🎋 晾布竹架</span>
              </div>
            </div>
          </section>
        )}
      </section>
    </Shell>
  );
}

const silverSteps: { phase: SilverPhase; label: string }[] = [
  { phase: "heat", label: "退火" },
  { phase: "forge", label: "锻形" },
  { phase: "engrave", label: "錾刻" },
  { phase: "polish", label: "抛光" },
];

function playSilverSound(kind: "heat" | "hammer" | "chisel" | "finish") {
  const AudioApi = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioApi) return;
  const context = new AudioApi(); const now = context.currentTime;
  const notes = kind === "hammer" ? [880, 620] : kind === "chisel" ? [1320, 1760] : kind === "finish" ? [523, 659, 784] : [180, 240];
  notes.forEach((frequency, index) => { const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.type = kind === "heat" ? "sawtooth" : "triangle"; oscillator.frequency.setValueAtTime(frequency, now + index * .07); gain.gain.setValueAtTime(.0001, now + index * .07); gain.gain.exponentialRampToValueAtTime(kind === "hammer" ? .16 : .09, now + index * .07 + .01); gain.gain.exponentialRampToValueAtTime(.0001, now + index * .07 + (kind === "heat" ? .23 : .42)); oscillator.connect(gain).connect(context.destination); oscillator.start(now + index * .07); oscillator.stop(now + index * .07 + .46); });
  window.setTimeout(() => context.close(), 900);
}

function SilverGamePage() {
  const [phase, setPhase] = useState<SilverPhase>("intro");
  const [strikes, setStrikes] = useState(0);
  const [engraving, setEngraving] = useState(0);
  const [motif, setMotif] = useState("蝶纹");
  const [muted, setMuted] = useState(false);
  const sound = (kind: "heat" | "hammer" | "chisel" | "finish") => { if (!muted) playSilverSound(kind); };
  const activeStep = phase === "intro" ? -1 : phase === "finish" ? 4 : silverSteps.findIndex((step) => step.phase === phase);
  const reset = () => { setPhase("intro"); setStrikes(0); setEngraving(0); };
  const description = phase === "intro" ? "从银料、火候到成品，这是一套学习顺序的交互模拟。" : phase === "heat" ? "在锻打前均匀退火，让银料恢复延展性；真实火候须由传承人判断。" : phase === "forge" ? "以短促、均匀的锤击逐步延展银坯，避免一次过猛导致材料变形。" : phase === "engrave" ? `选定${motif}后，用錾子在表面逐点留下纹样节奏。` : phase === "polish" ? "用软质工具整理表面，让纹样的高低层次在侧光下显现。" : "银坯经锻形、錾刻与抛光，形成一件学习用的银冠构件。";
  return <Shell active="heritage" title="银饰锻打体验">
    <section className="silver-game">
      <header className="silver-head"><Link to="/heritage" className="silver-back" aria-label="返回苗族非遗">←</Link><div><span>剑河 · 苗族银饰锻制技艺</span><h1>3D 银饰锻打工坊</h1></div><button type="button" className="silver-sound" onClick={() => setMuted(!muted)} aria-label={muted ? "开启声音" : "静音"}>{muted ? "🔇" : "🔔"}</button></header>
      <section className="silver-stepper" aria-label="银饰锻打流程">{silverSteps.map((step, index) => <div className={index <= activeStep ? "done" : ""} key={step.phase}><i>{index + 1}</i><span>{step.label}</span></div>)}</section>
      <SilverWorkbench3D phase={phase} strikes={strikes} engraving={engraving} />
      <section className="silver-panel">
        <span className="silver-kicker">{phase === "finish" ? "体验完成 · 工序回看" : `第 ${Math.max(1, activeStep + 1)} 步 · 可交互操作`}</span><h2>{phase === "intro" ? "先认识一张会变化的银坯" : phase === "heat" ? "退火：让银料准备好延展" : phase === "forge" ? "锻形：控制每一次落锤" : phase === "engrave" ? "錾刻：让纹样有节奏地出现" : phase === "polish" ? "抛光：整理层次与光泽" : "一件学习用银冠构件完成"}</h2><p>{description}</p>
        {phase === "forge" && <><div className="silver-meter" aria-label={`锻打完成 ${Math.round(strikes / 6 * 100)}%`}><i style={{ width: `${strikes / 6 * 100}%` }} /></div><p>锻打节奏：{strikes} / 6 次</p></>}
        {phase === "engrave" && <><div className="motifs">{["蝶纹", "涡纹", "花叶纹"].map((item) => <button type="button" className={motif === item ? "selected" : ""} onClick={() => setMotif(item)} key={item}>{item}</button>)}</div><div className="silver-meter"><i style={{ width: `${engraving / 4 * 100}%` }} /></div><p>錾刻落点：{engraving} / 4</p></>}
        <div className="silver-actions">{phase === "intro" && <button type="button" className="primary" onClick={() => { setPhase("heat"); sound("heat"); }}>点燃炉火 · 开始退火</button>}{phase === "heat" && <button type="button" className="primary" onClick={() => { setPhase("forge"); sound("hammer"); }}>银料退火完成 · 上砧锻形</button>}{phase === "forge" && (strikes < 6 ? <button type="button" className="primary" onClick={() => { setStrikes(strikes + 1); sound("hammer"); }}>落锤锻打 ({strikes}/6)</button> : <button type="button" className="primary" onClick={() => { setPhase("engrave"); sound("chisel"); }}>进入錾刻工序</button>)}{phase === "engrave" && (engraving < 4 ? <button type="button" className="primary" onClick={() => { setEngraving(engraving + 1); sound("chisel"); }}>落下錾子 ({engraving}/4)</button> : <button type="button" className="primary" onClick={() => setPhase("polish")}>纹样完成 · 开始抛光</button>)}{phase === "polish" && <button type="button" className="primary" onClick={() => { setPhase("finish"); sound("finish"); }}>完成抛光 · 展示银冠</button>}{phase === "finish" && <><button type="button" onClick={reset}>重新体验</button><Link to="/heritage" className="silver-back">回档案</Link></>}</div>
        {phase === "finish" && <div className="silver-score"><div><b>{strikes}</b><span>锻打节拍</span></div><div><b>{engraving}</b><span>錾刻落点</span></div><div><b>{motif}</b><span>选用纹样</span></div></div>}
      </section>
    </section>
  </Shell>;
}
function CulturePage() {
  return (
    <Shell active="culture" title="苗乡文化">
      <section className="page-intro red">
        <p>从一套衣裳，到一场节日</p>
        <h1>苗族文化，正在发生</h1>
        <span>旅行前先听懂苗乡的礼俗、节庆与山地生活。</span>
      </section>
      <section className="calendar-card">
        <small>苗乡节庆 · 春日相约</small>
        <h2>姊妹节</h2>
        <p>盛装、游方、歌声与祝福，汇成苗乡最动人的春日相逢。</p>
        <div className="calendar-art">
          苗乡相约 <b>春</b>
        </div>
      </section>
      <Heading eyebrow="文化漫游" title="从旅行开始了解" />
      <section className="culture-list">
        <article>
          <span>01</span>
          <div>
            <h3>苗族银饰</h3>
            <p>叮当作响的祝福与家族记忆</p>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <h3>苗家服饰</h3>
            <p>把山川、祖先与故事穿在身上</p>
          </div>
        </article>
      </section>
    </Shell>
  );
}
function MorePage() {
  return (
    <Shell active="more" title="旅行服务">
      <section className="profile">
        <div className="avatar">黔</div>
        <div>
          <p>欢迎来到贵州苗乡</p>
          <h1>你的苗寨旅行小助手</h1>
        </div>
      </section>
      <section className="profile-menu">
        {[
          ["♡", "我的旅行清单", "收藏想去的苗寨与体验"],
          ["◎", "行前指南", "交通、住宿与旅行礼仪"],
          ["?", "关于黔苗行", "一起尊重并守护苗乡文化"],
        ].map(([icon, name, note]) => (
          <article key={name}>
            <span>{icon}</span>
            <div>
              <h3>{name}</h3>
              <p>{note}</p>
            </div>
            <b>›</b>
          </article>
        ))}
      </section>
      <p className="footer-note">黔苗行 · 走近贵州，走进苗乡</p>
    </Shell>
  );
}

const rootRoute = createRootRoute({ component: Outlet });
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});
const heritageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/heritage",
  component: HeritagePage,
});
const waxGameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wax-game",
  component: WaxGamePage,
});
const silverGameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/silver-game",
  component: SilverGamePage,
});
const cultureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/culture",
  component: CulturePage,
});
const moreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/more",
  component: MorePage,
});
const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    heritageRoute,
    waxGameRoute,
    silverGameRoute,
    cultureRoute,
    moreRoute,
  ]),
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
