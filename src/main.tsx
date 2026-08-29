import { StrictMode, type ChangeEvent, type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Link, Outlet, RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import './styles.css'
import './final-overrides.css'
import './map-background.css'
import './workshop.css'
import silverStencil from './assets/silver-stencil.png'
import batikStencil from './assets/batik-stencil.png'
import dressStencil from './assets/dress-stencil.png'
import introVideo from './assets/intro.mp4'
import batikReference from './assets/batik-reference.png'
import generatedBatikStencil from './assets/batik-flower-bird-generated.png'
import { generateWorkshopArtwork, type WorkshopCraft } from './services/workshopGeneration'

type TabKey = 'home' | 'map' | 'heritage' | 'workshop'
const tabs: { key: TabKey; label: string; to: '/' | '/map' | '/heritage' | '/workshop'; iconClass: string }[] = [
  { key: 'home', label: '首页', to: '/', iconClass: 'icon-home' }, { key: 'map', label: '地图', to: '/map', iconClass: 'icon-map' },
  { key: 'heritage', label: '非遗', to: '/heritage', iconClass: 'icon-heritage' }, { key: 'workshop', label: '体验坊', to: '/workshop', iconClass: 'icon-workshop' },
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
function Heading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: string }) { return <section className="section-heading"><div><p>{eyebrow}</p><h2>{title}</h2></div>{action && <a>{action}</a>}</section> }

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
function HeritagePage() { return <Shell active="heritage" title="苗乡非遗"><section className="page-intro earth"><p>从一件手作，走近苗乡</p><h1>非遗，在日常里生长</h1><span>触摸银饰、蜡染与衣裳，读懂纹样里的来处。</span></section><div className="search">⌕ <span>搜索银饰、蜡染、服饰与体验</span></div><section className="heritage-grid" aria-label="苗乡非遗分类">{heritageItems.map((item) => <button className={`heritage-tile ${item.className}`} type="button" key={item.name}><span className="heritage-stencil"><img src={item.image} alt={`${item.name}纹样`} /></span><span className="heritage-tile-copy"><b>{item.name}</b><small>{item.detail}</small></span><em>探索 ›</em></button>)}</section><section className="culture-explore"><div className="culture-intro"><p>非遗之外 · 苗乡生活</p><h1>节日与艺术</h1><span>盛装、歌场与纹样，是苗乡人的日常欢喜。</span></div><section className="explore-section"><div className="explore-heading"><h2>从「节日」开始探索</h2><button type="button">查看全部</button></div><div className="explore-rail">{festivals.map((item) => <button className={`explore-card ${item.className}`} type="button" key={item.name}><span className="art-placeholder">图片位</span><b>{item.name}</b><small>{item.note}</small></button>)}</div></section><section className="explore-section"><div className="explore-heading"><h2>从「艺术形式」开始探索</h2><button type="button">查看全部</button></div><div className="explore-rail">{artForms.map((item) => <button className={`explore-card ${item.className}`} type="button" key={item.name}><span className="art-placeholder">图片位</span><b>{item.name}</b><small>{item.note}</small></button>)}</div></section></section></Shell> }

type CraftKind = WorkshopCraft
type CraftStyle = 'batik-indigo' | 'batik-ice' | 'embroidery-flower' | 'embroidery-pick' | 'silver-dragon' | 'silver-flower'
const craftTypes: { key: CraftKind; name: string; desc: string; image: string }[] = [
  { key: 'embroidery', name: '苗绣', desc: '让图案在针线里生长', image: batikReference },
  { key: 'batik', name: '蜡染', desc: '把图案留在蓝靛布面', image: generatedBatikStencil },
  { key: 'silver', name: '银饰', desc: '把祝福錾刻成银光', image: silverStencil },
]
const craftStyles: { key: CraftStyle; craft: CraftKind; name: string; desc: string; className: string }[] = [
  { key: 'embroidery-flower', craft: 'embroidery', name: '花鸟绣纹', desc: '彩线入绣 · 花鸟相生', className: 'style-embroidery' },
  { key: 'embroidery-pick', craft: 'embroidery', name: '几何挑花', desc: '对称纹样 · 细密针脚', className: 'style-embroidery-pick' },
  { key: 'batik-indigo', craft: 'batik', name: '蓝靛花鸟纹', desc: '蓝靛底色 · 花鸟舒展', className: 'style-batik' },
  { key: 'batik-ice', craft: 'batik', name: '冰纹留白', desc: '蜡刀留白 · 自然冰纹', className: 'style-batik-ice' },
  { key: 'silver-dragon', craft: 'silver', name: '双龙纹', desc: '银光錾刻 · 对称守护', className: 'style-silver' },
  { key: 'silver-flower', craft: 'silver', name: '花鸟錾刻', desc: '花鸟相生 · 祝福入饰', className: 'style-silver-flower' },
]
const productOptions = [
  { name: '蜡染方巾', price: 68, size: '35×35cm' },
  { name: '纹样帆布袋', price: 158, size: '38×42cm' },
  { name: '苗绣装饰画', price: 198, size: '40×60cm' },
]
const gameExperiences = [
  { mark: '酵', name: '红酸汤', note: '跟着时间，等一锅酸汤慢慢醒来', route: '/games/hongsuantang' },
  { mark: '锻', name: '炼铁', note: '看火候与锤声，锻出山里的硬朗', route: '/games/silver' },
  { mark: '染', name: '蜡染', note: '执蜡刀留白，把花纹染进蓝靛', route: '' },
  { mark: '宴', name: '长桌宴', note: '围坐一席，听苗乡待客的故事', route: '/games/miao-feast' },
]
function WorkshopPage() {
  const [sourceImg, setSourceImg] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [resultImg, setResultImg] = useState<string | null>(null)
  const [craft, setCraft] = useState<CraftKind | null>(null)
  const [style, setStyle] = useState<CraftStyle>('embroidery-flower')
  const [autoMatched, setAutoMatched] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [resultReady, setResultReady] = useState(false)
  const [showOrder, setShowOrder] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(0)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const landingFileRef = useRef<HTMLInputElement>(null)
  const editorFileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: ChangeEvent<HTMLInputElement>, direct = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSourceImg(reader.result as string)
      setSourceFile(file)
      setResultImg(null)
      setResultReady(false)
      setShowOrder(false)
      setOrderPlaced(false)
      setGenerationError('')
      if (direct) {
        setCraft('batik')
        setStyle('batik-indigo')
        setAutoMatched(true)
      } else {
        setAutoMatched(false)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const generate = async () => {
    if (!sourceFile || !craft) return
    setProcessing(true)
    setResultReady(false)
    setResultImg(null)
    setShowOrder(false)
    setGenerationError('')
    try {
      const imageUrl = await generateWorkshopArtwork({ image: sourceFile, craft, style })
      setResultImg(imageUrl)
      setResultReady(true)
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : '生成失败，请稍后重试。')
    } finally {
      setProcessing(false)
    }
  }

  const placeOrder = () => {
    setOrderPlaced(true)
    setTimeout(() => { setShowOrder(false); setOrderPlaced(false) }, 2500)
  }

  const resetWorkshop = () => {
    setCraft(null)
    setSourceImg(null)
    setSourceFile(null)
    setResultImg(null)
    setResultReady(false)
    setProcessing(false)
    setShowOrder(false)
    setOrderPlaced(false)
    setAutoMatched(false)
    setGenerationError('')
    if (landingFileRef.current) landingFileRef.current.value = ''
    if (editorFileRef.current) editorFileRef.current.value = ''
  }

  const stylesForCraft = craft ? craftStyles.filter((item) => item.craft === craft) : []
  const activeCraft = craftTypes.find((item) => item.key === craft)
  const selectCraft = (nextCraft: CraftKind) => {
    setCraft(nextCraft)
    setStyle(craftStyles.find((item) => item.craft === nextCraft)!.key)
    setResultReady(false)
    setResultImg(null)
    setGenerationError('')
    setAutoMatched(false)
  }

  return <Shell active="workshop" title="苗乡体验坊">
    {!craft ? <section className="workshop-page workshop-landing">
      <div className="workshop-landing-copy">
        <p>苗乡游戏 · 手作体验</p>
        <h1>从一场体验，走进苗乡</h1>
        <span>先在游戏里听故事，再把喜欢的纹样做成一件手作。</span>
      </div>
      <section className="game-experiences" aria-label="苗乡游戏体验">
        <div className="experience-heading"><div><p>苗乡游戏</p><h2>玩一局，认识一种日常</h2></div><span>4 个体验</span></div>
        <div className="game-grid">
          {gameExperiences.map((game) => game.route ? (
            <Link className={`game-card game-${game.mark}`} to={game.route as any} key={game.mark}>
              <i>{game.mark}</i><div><b>{game.name}</b><small>{game.note}</small></div><em>进入游戏 ›</em>
            </Link>
          ) : (
            <article className={`game-card game-${game.mark} is-coming`} key={game.mark}>
              <i>{game.mark}</i><div><b>{game.name}</b><small>{game.note}</small></div><em>即将开启</em>
            </article>
          ))}
        </div>
      </section>
      <section className="craft-preview" aria-label="选择想体验的手艺">
        <div className="experience-heading"><div><p>手作体验</p><h2>把喜欢的纹样，做成一件作品</h2></div><span>可定制</span></div>
        <div className="craft-list">
          {craftTypes.map((item) => (
            <div className="craft-card-wrap" key={item.key}>
              <button type="button" className={`craft-preview-card ${item.key}`} onClick={() => selectCraft(item.key)}>
                <img src={item.image} alt="" aria-hidden="true" />
                <span><b>{item.name}</b><small>{item.desc}</small><i>开始体验 ›</i></span>
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="direct-generate" aria-label="直接上传图片生成">
        <input className="file-input" ref={landingFileRef} type="file" accept="image/*" onChange={(event) => handleFile(event, true)} />
        <div><b>不确定选哪一种？</b><span>上传一张图片，让纠笙为你匹配苗乡纹样。</span></div>
        <button type="button" onClick={() => landingFileRef.current?.click()}>上传图片直接生成</button>
      </section>
    </section> : <section className="workshop-page workshop-editor">
      <div className="workshop-intro workshop-editor-intro">
        <button type="button" className="craft-back" onClick={resetWorkshop}>‹ 返回选择</button>
        <p>{autoMatched ? '已自动匹配 · 苗乡纹样生成' : `${activeCraft!.name}体验 · 匠人定制`}</p>
        <h1>做一件属于你的{activeCraft!.name}</h1>
        <span>风格可选；上传一张图片后，将生成一张独立的苗乡手作效果图。</span>
      </div>

      <section className="workshop-styles" aria-label="选择纹样风格">
        <h3>选择 {activeCraft!.name} 风格</h3>
        <div className="style-options">
          {stylesForCraft.map((item) => (
            <button key={item.key} type="button" className={`style-option ${item.className} ${style === item.key ? 'chosen' : ''}`} onClick={() => { setStyle(item.key); setResultReady(false); setResultImg(null); setGenerationError('') }}>
              <span className="style-swatch"><img src={activeCraft!.image} alt="" aria-hidden="true" /></span>
              <b>{item.name}</b>
              <small>{item.desc}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="workshop-upload" aria-label="上传图片">
        <input className="file-input" ref={editorFileRef} type="file" accept="image/*" onChange={handleFile} />
        {!sourceImg ? (
          <button type="button" className="upload-area" onClick={() => editorFileRef.current?.click()}>
            <span className="upload-icon">+</span>
            <b>上传图片</b>
            <small>支持 JPG / PNG · 人像、宠物或风景都可以</small>
          </button>
        ) : (
          <div className="upload-preview">
            <img src={sourceImg} alt="上传的图片" />
            <button type="button" className="upload-replace" onClick={() => editorFileRef.current?.click()}>更换图片</button>
          </div>
        )}
      </section>

      {sourceImg && (
        <>
          <button type="button" className="generate-btn" onClick={generate} disabled={processing}>
            {processing ? `正在生成${activeCraft!.name}效果…` : `生成我的${activeCraft!.name}纹样`}
          </button>
          {generationError && <p className="generation-error" role="alert">{generationError}</p>}

          {resultReady && resultImg && (
            <section className="workshop-result" aria-label="生成结果">
              <h3>你的纹样效果</h3>
              <div className="result-frame">
                <img className="result-image" src={resultImg} alt={`生成的${activeCraft!.name}纹样效果`} />
                <span className="result-badge">{craftStyles.find(s => s.key === style)?.name}</span>
              </div>
              <div className="result-actions">
                <button type="button" className="btn-secondary" onClick={resetWorkshop}>重新做一件</button>
                <button type="button" className="btn-primary" onClick={() => setShowOrder(true)}>定制这件手作</button>
              </div>
            </section>
          )}
        </>
      )}

      {showOrder && (
        <section className="order-modal" aria-label="下单定制">
          <div className="order-card">
            {orderPlaced ? (
              <div className="order-success">
                <span className="success-icon">✓</span>
                <h3>下单成功</h3>
                <p>苗乡匠人将按照你生成的纹样手工制作，预计7-15天发货。</p>
              </div>
            ) : (
              <>
                <button className="order-close" onClick={() => setShowOrder(false)}>×</button>
                <h3>定制手作</h3>
                <p className="order-sub">选择产品后，苗乡匠人会依据你的纹样进行定制。</p>
                <div className="product-list">
                  {productOptions.map((p, i) => (
                    <button key={p.name} className={`product-item ${selectedProduct === i ? 'chosen' : ''}`} onClick={() => setSelectedProduct(i)}>
                      <b>{p.name}</b>
                      <small>{p.size}</small>
                      <span className="product-price">¥{p.price}</span>
                    </button>
                  ))}
                </div>
                <div className="order-bottom">
                  <span className="order-total">合计 <b>¥{productOptions[selectedProduct].price}</b></span>
                  <button type="button" className="btn-primary" onClick={placeOrder}>提交定制</button>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </section>}
  </Shell>
}

function HongsuantangGamePage() {
  return <main className="game-embed-page" aria-label="苗家红酸汤小游戏">
    <header className="game-embed-header"><Link to="/workshop">‹ 返回体验坊</Link><span>酵 · 苗家红酸汤</span></header>
    <iframe className="game-embed-frame" title="苗家红酸汤发酵小游戏" src="/games/hongsuantang/index.html" />
  </main>
}

function MiaoFeastGamePage() {
  return <main className="game-embed-page game-embed-feast" aria-label="百米长桌宴小游戏">
    <header className="game-embed-header"><Link to="/workshop">‹ 返回体验坊</Link><span>宴 · 百米长桌宴</span></header>
    <iframe className="game-embed-frame" title="百米长桌宴小游戏" src="/games/miao-feast/index.html" />
  </main>
}

function SilverGamePage() {
  return <main className="game-embed-page game-embed-silver" aria-label="千锤成银小游戏">
    <header className="game-embed-header"><Link to="/workshop">‹ 返回体验坊</Link><span>锻 · 千锤成银</span></header>
    <iframe className="game-embed-frame" title="千锤成银炼铁小游戏" src="/games/silver/index.html" />
  </main>
}

const rootRoute = createRootRoute({ component: Outlet })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const mapRoute = createRoute({ getParentRoute: () => rootRoute, path: '/map', component: MapPage })
const heritageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/heritage', component: HeritagePage })
const workshopRoute = createRoute({ getParentRoute: () => rootRoute, path: '/workshop', component: WorkshopPage })
const hongsuantangGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/hongsuantang', component: HongsuantangGamePage })
const miaoFeastGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/miao-feast', component: MiaoFeastGamePage })
const silverGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/silver', component: SilverGamePage })
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, mapRoute, heritageRoute, workshopRoute, hongsuantangGameRoute, miaoFeastGameRoute, silverGameRoute]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
function App() {
  const [showIntro, setShowIntro] = useState(() => !window.location.pathname.startsWith("/games/"))
  const finishIntro = async () => {
    await router.navigate({ to: '/' })
    setShowIntro(false)
  }
  return showIntro ? <IntroScreen onComplete={() => { void finishIntro() }} /> : <RouterProvider router={router} />
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
