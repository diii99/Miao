import { StrictMode, type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Link, Outlet, RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import './styles.css'
import './final-overrides.css'
import './map-background.css'
import silverStencil from './assets/silver-stencil.png'
import batikStencil from './assets/batik-stencil.png'
import dressStencil from './assets/dress-stencil.png'
import introVideo from './assets/intro.mp4'

type TabKey = 'home' | 'map' | 'workshop' | 'culture'
const tabs: { key: TabKey; label: string; to: '/' | '/map' | '/workshop' | '/culture'; iconClass: string }[] = [
  { key: 'home', label: '首页', to: '/', iconClass: 'icon-home' }, { key: 'map', label: '地图', to: '/map', iconClass: 'icon-map' },
  { key: 'workshop', label: '体验坊', to: '/workshop', iconClass: 'icon-workshop' }, { key: 'culture', label: '文化', to: '/culture', iconClass: 'icon-culture' },
]

function Shell({ active, title, children }: { active: TabKey; title: string; children: ReactNode }) {
  return <main className={`mini-program ${active === 'home' ? 'home-shell' : ''}`}><header className="navigation-bar"><span className="page-title">{title}</span><span className="capsule" aria-label="小程序胶囊按钮"><i /><b /><em /></span></header><section className="page-content">{children}</section><nav className="tab-bar" aria-label="主导航">{tabs.map((tab) => <Link key={tab.key} to={tab.to} className={`tab-item ${active === tab.key ? 'active' : ''}`} activeOptions={{ exact: true }}><span className={`tab-icon ${tab.iconClass}`} aria-hidden="true" /><span>{tab.label}</span></Link>)}</nav></main>
}

function IntroScreen({ onComplete }: { onComplete: () => void }) {
  return <main className="intro-screen" aria-label="黔苗行开屏"><video className="intro-video" src={introVideo} autoPlay muted playsInline preload="auto" onEnded={onComplete} /><div className="intro-video-shade" /><p>黔苗行</p><button type="button" onClick={onComplete}>跳过 <span>›</span></button></main>
}

const dailyDialogues = [
  '想听听姊妹节的故事', '苗绣纹样有什么寓意？', '推荐一条苗寨路线',
]
const openingGuides = [
  '刚才的开屏，不只是一个画面。蓝靛、白纹与生长的树，来自苗族对生命的想象。',
  '苗族传说里，蝴蝶妈妈孕育万物。她的蝶翼、花纹和种子，后来被绣进衣裳与蜡染。',
  '所以我们从这段传说开始：欢迎你沿着一只蝴蝶的翅膀，走进苗寨。',
]

function HomePage() {
  const [questions, setQuestions] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [reply, setReply] = useState('你好，我是纠笙。想从苗乡的哪段故事开始听？')
  const [chatOpen, setChatOpen] = useState(false)
  const [fading, setFading] = useState(false)
  const [autoDismiss, setAutoDismiss] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [guiding, setGuiding] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  useEffect(() => {
    if (!chatOpen || !autoDismiss) return undefined
    setFading(false)
    const fadeTimer = window.setTimeout(() => setFading(true), 4800)
    const closeTimer = window.setTimeout(() => setChatOpen(false), 5250)
    return () => { window.clearTimeout(fadeTimer); window.clearTimeout(closeTimer) }
  }, [autoDismiss, chatOpen, reply])
  const sendMessage = (content: string) => {
    const text = content.trim()
    if (!text) return
    setQuestions((current) => [...current, text])
    setReply('我先悄悄告诉你：苗乡的故事，常藏在一针一线和一声芦笙里。')
    setDraft('')
    setFading(false)
    setChatOpen(true)
    setAutoDismiss(true)
    setShowInvite(false)
  }
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); sendMessage(draft) }
  const openChat = () => { setFading(false); setAutoDismiss(false); setShowInvite(false); setChatOpen(true) }
  const nextGuide = () => { if (guideStep === openingGuides.length - 1) { setGuiding(false); setShowInvite(true) } else setGuideStep((current) => current + 1) }
  return <Shell active="home" title="黔苗行"><section className="dress-hero daily-hero"><div className="dress-copy"><p>贵州 · 黔东南</p><h1>走进苗寨<br />遇见纠笙</h1><span>让她带你认识苗乡日常</span></div><div className="dress-avatar photo-avatar outfit-silver home-avatar-entrance" aria-label="苗寨向导纠笙" /><div className="dress-seal">苗<br />乡</div>{guiding && <section className="opening-guide" aria-label="开屏故事引导"><p><span>蝴蝶妈妈的故事 · {guideStep + 1}/{openingGuides.length}</span>{openingGuides[guideStep]}</p><button type="button" onClick={nextGuide}>{guideStep === openingGuides.length - 1 ? '去问问纠笙' : '继续 ›'}</button></section>}{!guiding && showInvite && <section className="question-invite" aria-label="邀请向纠笙提问"><p>还有其他的问题<br />可以再问我。</p><button type="button" onClick={openChat}>问问纠笙 ›</button></section>}{chatOpen && <section className={`joson-chat pet-speech ${fading ? 'is-fading' : ''}`} aria-label="纠笙的缩略回答"><header><span>纠</span><div><b>纠笙</b><small>苗寨文化向导 · 在线</small></div><button type="button" className="pet-close" aria-label="收起对话" onClick={() => setChatOpen(false)}>×</button></header><p className="pet-answer" aria-live="polite">{reply}</p><div className="chat-suggestions">{dailyDialogues.slice(0, 2).map((item) => <button key={item} type="button" onClick={() => sendMessage(item)}>{item}</button>)}</div><form onSubmit={submit}><input value={draft} onFocus={() => setAutoDismiss(false)} onChange={(event) => setDraft(event.target.value)} placeholder="问问纠笙…" aria-label="输入想问纠笙的问题" /><button type="submit">发送</button></form></section>}{!chatOpen && !guiding && questions.length > 0 && <button type="button" className="question-trail" onClick={openChat} aria-label="查看已问问题并再次提问"><span>已问</span><b>{questions[questions.length - 1]}</b><i>{questions.length}</i></button>}{!chatOpen && !guiding && !showInvite && <button type="button" className={`joson-chat-trigger ${questions.length > 0 ? 'compact' : ''}`} onClick={openChat} aria-label="再次向纠笙提问"><span>问</span><b>问问纠笙</b></button>}</section></Shell>
}
const mapPlaces = [
  { name: '观景台', note: '云端日出', detail: '站在山脊俯瞰层层叠叠的木楼，等一场云海日出。', x: 22, y: 18 },
  { name: '风雨桥', note: '河水人家', detail: '桥上歇脚，看清水穿过寨子，也听老人讲桥的故事。', x: 65, y: 28 },
  { name: '纠笙家', note: '苗寨日常', detail: '去找纠笙，听她讲苗绣、银饰和家门口的日常。', x: 43, y: 46 },
  { name: '老街', note: '慢时光', detail: '石板路两旁藏着手作铺与旧时光，适合慢慢逛。', x: 18, y: 66 },
  { name: '鼓藏堂', note: '节日之地', detail: '在鼓声里认识苗年、姊妹节与寨子的共同记忆。', x: 62, y: 70 },
  { name: '芦笙场', note: '听见苗歌', detail: '傍晚的芦笙场，歌声与舞步会把山谷点亮。', x: 79, y: 72 },
]
function MapPage() {
  const [selected, setSelected] = useState(2)
  const [exploring, setExploring] = useState(false)
  const place = mapPlaces[selected]
  return <Shell active="map" title="西江探索"><section className="map-explore"><div className="map-heading"><p>西江千户苗寨 · 探索地图</p><h1>跟着山路，走进苗寨</h1><span>点亮一个地点，收集一段苗乡故事</span></div><div className="village-map" aria-label="可探索的苗寨地图"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M22 18 C38 22 55 21 65 28 S52 43 43 46 S25 57 18 66 S46 73 62 70 S72 75 79 72" /></svg>{mapPlaces.map((item, index) => <button type="button" key={item.name} className={`map-node ${selected === index ? 'selected' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} onClick={() => { setSelected(index); setExploring(false) }}><i /><span>{item.name}</span><small>{item.note}</small></button>)}</div><section className="map-place-card" aria-live="polite"><div><p>已点亮地点</p><h2>{place.name}</h2><span>{place.detail}</span></div><button type="button" onClick={() => setExploring(true)}>开始探索 →</button></section>{exploring && <section className="map-detail" aria-label={`${place.name}详情`}><button className="map-back" type="button" onClick={() => setExploring(false)}>‹ 返回地图</button><div className="map-detail-art"><span>西江千户苗寨</span></div><div className="map-detail-copy"><p>地点探索 · {place.note}</p><h2>{place.name}</h2><span>{place.detail}</span><div className="detail-tags"><i>听故事</i><i>看纹样</i><i>收集记忆</i></div><button type="button" onClick={() => setExploring(false)}>完成探索</button></div></section>}</section></Shell>
}

function WorkshopPage() {
  return (
    <Shell active="workshop" title="体验坊">
      <section className="workshop-empty" aria-label="体验坊" />
    </Shell>
  )
}

const heritageItems = [
  { name: '苗族银饰', detail: '银光里藏着祝福与家族记忆', image: silverStencil, className: 'silver' },
  { name: '苗绣蜡染', detail: '把花鸟纹样留在布面与衣角', image: batikStencil, className: 'batik' },
  { name: '苗族服饰', detail: '把山川、祖先与故事穿在身上', image: dressStencil, className: 'dress' },
]
const festivals = [
  { name: '姊妹节', note: '盛装相逢 · 春日游方', className: 'festival-sisters' },
  { name: '苗年', note: '家寨团圆 · 迎新祈福', className: 'festival-newyear' },
  { name: '四月八', note: '歌场相会 · 芦笙声起', className: 'festival-april' },
]
const artForms = [
  { name: '苗族飞歌', note: '高腔穿过山谷', className: 'art-song' },
  { name: '苗绣纹样', note: '一针一线的记忆', className: 'art-embroidery' },
  { name: '蜡染技艺', note: '蓝白之间的山河', className: 'art-batik' },
]
function CulturePage() {
  const [viewAll, setViewAll] = useState(false)

  return (
    <Shell active="culture" title={viewAll ? '苗乡非遗' : '苗乡文化'}>
      {viewAll ? (
        <section className="view-all-view">
          <button type="button" className="view-all-back" onClick={() => setViewAll(false)} aria-label="返回文化探索">
            ‹ 返回文化探索
          </button>
          <section className="page-intro earth">
            <p>从一件手作，走近苗乡</p>
            <h1>非遗，在日常里生长</h1>
            <span>触摸银饰、蜡染与衣裳，读懂纹样里的来处。</span>
          </section>
          <div className="search">⌕ <span>搜索银饰、蜡染、服饰与体验</span></div>
          <section className="heritage-grid" aria-label="苗乡非遗分类">
            {heritageItems.map((item) => (
              <button className={`heritage-tile ${item.className}`} type="button" key={item.name}>
                <span className="heritage-stencil"><img src={item.image} alt={`${item.name}纹样`} /></span>
                <span className="heritage-tile-copy"><b>{item.name}</b><small>{item.detail}</small></span>
                <em>探索 ›</em>
              </button>
            ))}
          </section>
        </section>
      ) : (
        <section className="culture-explore">
          <div className="culture-intro">
            <p>探索苗乡 · 节日与艺术</p>
            <h1>从「节日」开始探索</h1>
            <span>留出想象的位置，慢慢走近苗族文化。</span>
          </div>
          <div className="culture-search">⌕ <span>搜索节日、歌舞、纹样与故事</span></div>
          <section className="explore-section">
            <div className="explore-heading">
              <h2>从「节日」开始探索</h2>
              <button type="button" onClick={() => setViewAll(true)}>查看全部</button>
            </div>
            <div className="explore-rail">
              {festivals.map((item) => (
                <button className={`explore-card ${item.className}`} type="button" key={item.name}>
                  <span className="art-placeholder">图片位</span>
                  <b>{item.name}</b>
                  <small>{item.note}</small>
                </button>
              ))}
            </div>
          </section>
          <section className="explore-section">
            <div className="explore-heading">
              <h2>从「艺术形式」开始探索</h2>
              <button type="button" onClick={() => setViewAll(true)}>查看全部</button>
            </div>
            <div className="explore-rail">
              {artForms.map((item) => (
                <button className={`explore-card ${item.className}`} type="button" key={item.name}>
                  <span className="art-placeholder">图片位</span>
                  <b>{item.name}</b>
                  <small>{item.note}</small>
                </button>
              ))}
            </div>
          </section>
        </section>
      )}
    </Shell>
  )
}

const rootRoute = createRootRoute({ component: Outlet })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const mapRoute = createRoute({ getParentRoute: () => rootRoute, path: '/map', component: MapPage })
const workshopRoute = createRoute({ getParentRoute: () => rootRoute, path: '/workshop', component: WorkshopPage })
const heritageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/heritage', component: WorkshopPage })
const cultureRoute = createRoute({ getParentRoute: () => rootRoute, path: '/culture', component: CulturePage })
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, mapRoute, workshopRoute, heritageRoute, cultureRoute]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
function App() {
  const [showIntro, setShowIntro] = useState(true)
  return showIntro ? <IntroScreen onComplete={() => setShowIntro(false)} /> : <RouterProvider router={router} />
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
