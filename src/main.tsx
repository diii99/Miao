import { StrictMode, type ChangeEvent, type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Link, Outlet, RouterProvider, createRootRoute, createRoute, createRouter, useNavigate } from '@tanstack/react-router'
import '@google/model-viewer'
import './styles.css'
import './final-overrides.css'
import './map-background.css'
import './workshop.css'
import { MiaoVillageScene } from './map-3d/MiaoVillageScene'
import { type LandmarkPOI } from './map-3d/villageBuilder'
import silverStencil from './assets/silver-stencil.png'
import batikStencil from './assets/batik-stencil.png'
import dressStencil from './assets/dress-stencil.png'
import introVideo from './assets/intro.mp4'
import batikReference from './assets/batik-reference.png'
import generatedBatikStencil from './assets/batik-flower-bird-generated.png'
import { generateWorkshopArtwork, type WorkshopCraft } from './services/workshopGeneration'

type TabKey = 'home' | 'map' | 'heritage' | 'workshop'
const tabs: { key: TabKey; label: string; to: '/' | '/map' | '/heritage' | '/workshop'; iconClass: string }[] = [
  { key: 'home', label: '首页', to: '/', iconClass: 'icon-home' },
  { key: 'map', label: '地图', to: '/map', iconClass: 'icon-map' },
  { key: 'heritage', label: '非遗', to: '/heritage', iconClass: 'icon-heritage' },
  { key: 'workshop', label: '体验坊', to: '/workshop', iconClass: 'icon-workshop' },
]

function Shell({ active, title, children }: { active: TabKey; title: string; children: ReactNode }) {
  return (
    <main className={`mini-program ${active === 'home' ? 'home-shell' : ''}`}>
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
            className={`tab-item ${active === tab.key ? 'active' : ''}`}
            activeOptions={{ exact: true }}
          >
            <span className={`tab-icon ${tab.iconClass}`} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  )
}

function IntroScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <main className="intro-screen" aria-label="黔苗行开屏">
      <video
        className="intro-video"
        src={introVideo}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={onComplete}
      />
      <div className="intro-video-shade" />
      <p>黔苗行</p>
      <button type="button" onClick={onComplete}>
        跳过 <span>›</span>
      </button>
    </main>
  )
}

const dailyDialogues = ['想听听姊妹节的故事', '苗绣纹样有什么寓意？', '推荐一条苗寨路线']
const openingGuides = [
  '刚才的开屏，不只是一个画面。蓝靛、白纹与生长的树，来自苗族对生命的想象。',
  '苗族传说里，蝴蝶妈妈孕育万物。她的蝶翼、花纹和种子，后来被绣进衣裳与蜡染。',
  '所以我们从这段传说开始：欢迎你沿着一只蝴蝶的翅膀，走进苗寨。',
]
const localGuideReply = (question: string) => {
  if (/姊妹节/.test(question)) return '姊妹节时，姑娘会用五彩糯米饭传递心意。'
  if (/苗绣|纹样/.test(question)) return '苗绣常把蝴蝶、鸟与花绣成家族的记忆。'
  if (/路线|苗寨|行程/.test(question)) return '先到西江看晨雾，再去朗德听芦笙与古歌。'
  if (/蜡染/.test(question)) return '蜡染以蜡防染，蓝白纹样里藏着自然万象。'
  return '从寨门慢慢走起，山风会带来新的故事。'
}
type ChatMessage = { role: 'user' | 'assistant'; content: string }

function HomePage() {
  const [questions, setQuestions] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [reply, setReply] = useState('你好，我是纠笙。想从苗乡的哪段故事开始听？')
  const [conversation, setConversation] = useState<ChatMessage[]>([])
  const [lastInputWasSuggestion, setLastInputWasSuggestion] = useState(true)
  const [isReplying, setIsReplying] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [fading, setFading] = useState(false)
  const [autoDismiss, setAutoDismiss] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [guiding, setGuiding] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const chatHistoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chatOpen || !autoDismiss) return undefined
    setFading(false)
    const fadeTimer = window.setTimeout(() => setFading(true), 4800)
    const closeTimer = window.setTimeout(() => setChatOpen(false), 5250)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(closeTimer)
    }
  }, [autoDismiss, chatOpen, reply])

  const sendMessage = async (content: string, fromSuggestion = false) => {
    const text = content.trim()
    if (!text || isReplying) return
    const nextConversation = [...conversation, { role: 'user' as const, content: text }]
    setQuestions((current) => [...current, text])
    setLastInputWasSuggestion(fromSuggestion)
    setConversation(nextConversation)
    setDraft('')
    setFading(false)
    setChatOpen(true)
    setAutoDismiss(false)
    setShowInvite(false)
    setIsReplying(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextConversation.slice(-8) }),
      })
      if (!response.ok) throw new Error('chat request failed')
      const payload = (await response.json()) as { reply?: string }
      const answer = payload.reply?.trim()
      if (!answer) throw new Error('empty chat reply')
      setReply(answer)
      setConversation([...nextConversation, { role: 'assistant', content: answer }])
    } catch {
      const answer = localGuideReply(text)
      setReply(answer)
      setConversation([...nextConversation, { role: 'assistant', content: answer }])
    } finally {
      setAutoDismiss(true)
      setIsReplying(false)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(draft)
  }

  const openChat = () => {
    setFading(false)
    setAutoDismiss(false)
    setShowInvite(false)
    setChatOpen(true)
  }

  const nextGuide = () => {
    if (guideStep === openingGuides.length - 1) {
      setGuiding(false)
      setShowInvite(true)
    } else setGuideStep((current) => current + 1)
  }

  const showHistoryAboveSuggestions = conversation.length === 0 || lastInputWasSuggestion
  useEffect(() => {
    const history = chatHistoryRef.current
    if (history) history.scrollTop = history.scrollHeight
  }, [conversation, isReplying, lastInputWasSuggestion])

  const chatHistory = (
    <div ref={chatHistoryRef} className="chat-history" aria-live="polite">
      <button type="button" className="pet-close" aria-label="收起对话" onClick={() => setChatOpen(false)}>
        ×
      </button>
      {conversation.length === 0 ? (
        <p className="pet-answer">{reply}</p>
      ) : (
        conversation.map((message, index) => (
          <p key={`${message.role}-${index}`} className={`pet-message ${message.role}`}>
            {message.content}
          </p>
        ))
      )}
      {isReplying && <p className="pet-message assistant">纠笙正在想一想…</p>}
    </div>
  )

  return (
    <Shell active="home" title="黔苗行">
      <section className="dress-hero daily-hero">
        <div className="dress-copy">
          <p>贵州 · 黔东南</p>
          <h1>走进苗寨<br />遇见纠笙</h1>
          <span>让她带你认识苗乡日常</span>
        </div>
                <model-viewer
          className="home-avatar-model home-avatar-entrance"
          src="/人物/3d/MiaoGirl_1.glb"
          alt="苗寨向导纠笙的三维形象"
          loading="eager"
          camera-controls
          auto-rotate
          auto-rotate-delay="1200"
          rotation-per-second="18deg"
          camera-orbit="0deg 78deg 5m"
          camera-target="0m 0.5m 0m"
          field-of-view="28deg"
          shadow-intensity="0.8"
          shadow-softness="0.9"
          environment-image="neutral"
          interaction-prompt="none"
          aria-label="苗寨向导纠笙的三维形象，可拖动查看"
        />
        <div className="dress-seal">苗<br />乡</div>
        {guiding && (
          <section className="opening-guide" aria-label="开屏故事引导">
            <p>
              <span>蝴蝶妈妈的故事</span>
              {openingGuides[guideStep]}
            </p>
            <div className="guide-actions">
              <button type="button" onClick={nextGuide}>
                {guideStep === openingGuides.length - 1 ? '去问问纠笙' : '继续'}{' '}
                <i aria-hidden="true">↑</i>
              </button>
            </div>
          </section>
        )}
        {!guiding && showInvite && (
          <section className="question-invite" aria-label="邀请向纠笙提问">
            <p>还有其他的问题<br />可以再问我。</p>
            <button type="button" onClick={openChat}>问问纠笙 ›</button>
          </section>
        )}
        {chatOpen && (
          <section className={`joson-chat pet-speech ${fading ? 'is-fading' : ''}`} aria-label="纠笙的缩略回答">
            {showHistoryAboveSuggestions && chatHistory}
            <div className="chat-suggestions">
              {dailyDialogues.map((item) => (
                <button key={item} type="button" disabled={isReplying} onClick={() => void sendMessage(item, true)}>
                  <span>{item}</span>
                  <i aria-hidden="true">›</i>
                </button>
              ))}
            </div>
            {!showHistoryAboveSuggestions && chatHistory}
            <form onSubmit={submit}>
              <input
                value={draft}
                disabled={isReplying}
                onFocus={() => setAutoDismiss(false)}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="问问纠笙"
                aria-label="输入想问纠笙的问题"
              />
              <button type="submit" disabled={isReplying} aria-label="发送">↑</button>
            </form>
          </section>
        )}
        {!chatOpen && !guiding && questions.length > 0 && (
          <button type="button" className="question-trail" onClick={openChat} aria-label="查看已问问题并再次提问">
            <span>已问</span>
            <b>{questions[questions.length - 1]}</b>
            <i>{questions.length}</i>
          </button>
        )}
        {!chatOpen && !guiding && !showInvite && (
          <button
            type="button"
            className={`joson-chat-trigger ${questions.length > 0 ? 'compact' : ''}`}
            onClick={openChat}
            aria-label="再次向纠笙提问"
          >
            <span>问</span>
            <b>问问纠笙</b>
          </button>
        )}
      </section>
    </Shell>
  )
}

function MapPage() {
  const [selectedIdx, setSelectedIdx] = useState(1)
  const [exploringPOI, setExploringPOI] = useState<LandmarkPOI | null>(null)
  const [, setWalking] = useState(false)
  const navigate = useNavigate()

  return (
    <Shell active="map" title="苗寨漫游">
      <section className="map-explore map-3d-page">
        <MiaoVillageScene
          selected={selectedIdx}
          onSelect={(index) => {
            setSelectedIdx(index)
          }}
          onWalkingChange={setWalking}
          onOpenExplore={(poi) => {
            setExploringPOI(poi)
          }}
        />

        {/* POI Detailed Exploration Modal */}
        {exploringPOI && (
          <section className="map-detail-modal" aria-label={`${exploringPOI.name}详情`}>
            <div className="map-detail-card">
              <button
                className="map-back-btn"
                type="button"
                onClick={() => setExploringPOI(null)}
                aria-label="返回苗寨"
              >
                ‹ 返回苗寨漫游
              </button>

              <div className={`map-detail-art ${exploringPOI.kind}`}>
                <span className="art-badge">西江千户苗寨 · 非遗实景</span>
                <h2>{exploringPOI.title}</h2>
              </div>

              <div className="map-detail-copy">
                <p className="detail-subtitle">{exploringPOI.note}</p>
                <div className="detail-description">{exploringPOI.detail}</div>

                <div className="detail-lore-box">
                  <b>苗寨文化背景：</b>
                  <p>{exploringPOI.lore}</p>
                </div>

                <div className="detail-tags">
                  <i>🏞️ 真实古建</i>
                  <i>🪡 苗乡非遗</i>
                  <i>✨ 市井烟火</i>
                </div>

                <div className="modal-actions">
                  {(exploringPOI.kind === 'batik' || exploringPOI.kind === 'silver') && (
                    <button
                      type="button"
                      className="goto-craft-btn"
                      onClick={() => {
                        setExploringPOI(null)
                        void navigate({ to: '/workshop' })
                      }}
                    >
                      前往体验坊手作 ›
                    </button>
                  )}
                  <button
                    type="button"
                    className="done-explore-btn"
                    onClick={() => setExploringPOI(null)}
                  >
                    漫游其他地标
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </section>
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
function HeritagePage() {
  const [viewAll, setViewAll] = useState(false)

  return (
    <Shell active="heritage" title={viewAll ? '苗乡非遗' : '苗乡文化'}>
      {viewAll ? (
        <section className="view-all-view">
          <button type="button" className="view-all-back" onClick={() => setViewAll(false)} aria-label="返回非遗探索">
            ‹ 返回非遗探索
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
const cultureRoute = createRoute({ getParentRoute: () => rootRoute, path: '/culture', component: HeritagePage })
const hongsuantangGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/hongsuantang', component: HongsuantangGamePage })
const miaoFeastGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/miao-feast', component: MiaoFeastGamePage })
const silverGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/silver', component: SilverGamePage })
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, mapRoute, heritageRoute, workshopRoute, cultureRoute, hongsuantangGameRoute, miaoFeastGameRoute, silverGameRoute]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
function App() {
  const [showIntro, setShowIntro] = useState(() => !window.location.pathname.startsWith("/games/"))
  const finishIntro = async () => {
    await router.navigate({ to: '/' })
    setShowIntro(false)
  }
  return showIntro ? <IntroScreen onComplete={() => { void finishIntro() }} /> : <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
