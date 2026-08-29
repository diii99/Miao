import { StrictMode, type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Link, Outlet, RouterProvider, createRootRoute, createRoute, createRouter, useNavigate } from '@tanstack/react-router'
import '@google/model-viewer'
import './styles.css'
import './final-overrides.css'
import './map-background.css'
import { MiaoVillageScene } from './map-3d/MiaoVillageScene'
import { type LandmarkPOI } from './map-3d/villageBuilder'
import silverStencil from './assets/silver-stencil.png'
import batikStencil from './assets/batik-stencil.png'
import dressStencil from './assets/dress-stencil.png'
import introVideo from './assets/intro.mp4'

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

const rootRoute = createRootRoute({ component: Outlet })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const mapRoute = createRoute({ getParentRoute: () => rootRoute, path: '/map', component: MapPage })
const heritageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/heritage', component: HeritagePage })
const workshopRoute = createRoute({ getParentRoute: () => rootRoute, path: '/workshop', component: WorkshopPage })
const cultureRoute = createRoute({ getParentRoute: () => rootRoute, path: '/culture', component: HeritagePage })
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, mapRoute, heritageRoute, workshopRoute, cultureRoute]) })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const [showIntro, setShowIntro] = useState(true)
  return showIntro ? <IntroScreen onComplete={() => setShowIntro(false)} /> : <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
