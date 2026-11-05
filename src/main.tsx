import { StrictMode, Suspense, lazy, type ChangeEvent, type FormEvent, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Link, Outlet, RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { ModelViewer } from './components/ModelViewer'
import './styles.css'
import './final-overrides.css'
import './map-background.css'
import './workshop.css'
import { dollStyles, type DollStyleKey } from './workshop/dollStyles'
import './wax-workbench.css'
import './app-shell.css'
import './heritage-content.css'
import { heritageStories, type HeritageStory } from './data/heritage'
import { HeritageStoryDetail } from './heritage/HeritageStoryDetail'
import type { LandmarkPOI } from './map-3d/villageBuilder'
import silverStencil from './assets/silver-stencil.png'
import batikStencil from './assets/batik-stencil.png'
import dressStencil from './assets/dress-stencil.png'
import introVideo from './assets/intro.mp4'
import batikReference from './assets/batik-reference.png'
import generatedBatikStencil from './assets/batik-flower-bird-generated.png'
import { generateWorkshopArtwork, type WorkshopCraft } from './services/workshopGeneration'
import { WaxDrawingCanvas } from './wax-3d/WaxDrawingCanvas'
import { waxAudio } from './wax-3d/WaxAudio'
import type { CraftMetrics, WaxPhase } from './wax-3d/types'

const MiaoVillageScene = lazy(() => import('./map-3d/MiaoVillageScene').then(module => ({ default: module.MiaoVillageScene })))
const WaxWorkbench3D = lazy(() => import('./wax-3d/WaxWorkbench3D').then(module => ({ default: module.WaxWorkbench3D })))
const DollModelCard = lazy(() => import('./workshop/DollModelCard').then(module => ({ default: module.DollModelCard })))

type TabKey = 'home' | 'map' | 'heritage' | 'workshop'
const avatarModelUrl = (modelName: string) =>
  import.meta.env.DEV ? `/人物/3d/${modelName}?v=reduced-20260905` : `/models/${modelName}?v=reduced-20260905`

const tabs: { key: TabKey; label: string; to: '/' | '/map' | '/heritage' | '/workshop'; iconClass: string }[] = [
  { key: 'home', label: '首页', to: '/', iconClass: 'icon-home' },
  { key: 'map', label: '地图', to: '/map', iconClass: 'icon-map' },
  { key: 'heritage', label: '非遗', to: '/heritage', iconClass: 'icon-heritage' },
  { key: 'workshop', label: '体验坊', to: '/workshop', iconClass: 'icon-workshop' },
]

function Shell({ active, title, children, embedded = false, overlay }: { active: TabKey; title: string; children: ReactNode; embedded?: boolean; overlay?: ReactNode }) {
  return (
    <main className={`mini-program ${embedded ? 'miniapp-embedded-shell' : 'app-frame'} ${active}-shell`}>
      {!embedded && <header className="navigation-bar" inert={!!overlay}>
        <span className="page-title">{title}</span>
        <span className="capsule" aria-label="小程序胶囊按钮">
          <i />
          <b />
          <em />
        </span>
      </header>}
      <section className={embedded ? 'page-content miniapp-embedded-content' : 'page-content'} inert={!!overlay}>{children}</section>
      {overlay}
      {!embedded && <nav className="tab-bar" aria-label="主导航" inert={!!overlay}>
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
      </nav>}
    </main>
  )
}
function IntroScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <main className="intro-screen app-frame" aria-label="苗家亲开屏">
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
      <p>苗家亲</p>
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

function HomePage({ embedded = false }: { embedded?: boolean } = {}) {
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
  const chatHistoryRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const homeCopyRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const hero = heroRef.current
    const copy = homeCopyRef.current
    if (!hero || !copy) return undefined
    const updateChatTop = () => {
      hero.style.setProperty('--home-chat-top', `${copy.offsetTop + copy.offsetHeight + 12}px`)
    }
    updateChatTop()
    const observer = new ResizeObserver(updateChatTop)
    observer.observe(hero)
    observer.observe(copy)
    return () => observer.disconnect()
  }, [])

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
    setChatOpen(true)
  }

  const nextGuide = () => {
    if (guideStep === openingGuides.length - 1) {
      setGuiding(false)
      openChat()
    } else setGuideStep((current) => current + 1)
  }

  const showHistoryAboveSuggestions = conversation.length === 0 || lastInputWasSuggestion
  useEffect(() => {
    const history = chatHistoryRef.current
    if (history) history.scrollTop = history.scrollHeight
  }, [conversation, isReplying, lastInputWasSuggestion])

  const chatHistory = (
    <div ref={chatHistoryRef} className="chat-history" aria-live="polite">
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
    <Shell active="home" title="苗家亲" embedded={embedded}>
      <section ref={heroRef} className="dress-hero daily-hero">
        <div ref={homeCopyRef} className="dress-copy">
          <p>贵州 · 黔东南</p>
          <h1>走进苗寨<br />遇见纠笙</h1>
          <span>让她带你认识苗乡日常</span>
        </div>
        <ModelViewer
          className="home-avatar-model home-avatar-entrance"
          src={avatarModelUrl('MiaoGirl_1.glb')}
          alt="苗寨向导纠笙的三维形象"
          loading="eager"
          camera-controls
          auto-rotate
          auto-rotate-delay="1200"
          rotation-per-second="18deg"
          camera-orbit="0deg 78deg 105%"
          camera-target="auto auto auto"
          disable-pan
          disable-tap
          interpolation-decay="0"
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
                {guideStep === openingGuides.length - 1 ? '去问问纠笙' : '继续'}
              </button>
            </div>
          </section>
        )}
        {chatOpen && (
          <section className={`joson-chat pet-speech ${fading ? 'is-fading' : ''}`} aria-label="纠笙的缩略回答">
            <button type="button" className="pet-close" aria-label="收起对话" onClick={() => setChatOpen(false)}>
              ×
            </button>
            {showHistoryAboveSuggestions && chatHistory}
            {conversation.length === 0 && (
              <div className="chat-suggestions">
                {dailyDialogues.map((item) => (
                  <button key={item} type="button" disabled={isReplying} onClick={() => void sendMessage(item, true)}>
                    <span>{item}</span>
                    <i aria-hidden="true">➡️</i>
                  </button>
                ))}
              </div>
            )}
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
              <button type="submit" disabled={isReplying} aria-label="发送">↩</button>
            </form>
          </section>
        )}
        {!chatOpen && !guiding && (
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
  const gameEmbed = exploringPOI?.kind === 'silver'
    ? { title: '锻铁 · 千锤成银', src: '/games/silver/index.html' }
    : exploringPOI?.kind === 'batik'
      ? { title: '苗族蜡染工坊', src: '/games/wax-dye' }
      : exploringPOI?.kind === 'banquet'
        ? { title: '百米长桌宴', src: '/games/miao-feast/index.html' }
        : null

  return (
    <Shell active="map" title="苗寨漫游">
      <section className="map-explore map-3d-page">
        <Suspense fallback={<div className="full-3d-map-container" role="status">正在加载苗寨 3D 地图…</div>}>
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
        </Suspense>

        {exploringPOI && gameEmbed ? (
          <section className="map-game-modal" role="dialog" aria-modal="true" aria-label={`${exploringPOI.name}${gameEmbed.title}`}>
            <div className="map-game-card">
              <header>
                <span>{exploringPOI.name} · 体验坊</span>
                <b>{gameEmbed.title}</b>
                <button type="button" onClick={() => setExploringPOI(null)} aria-label="返回苗寨">×</button>
              </header>
              <iframe className="map-game-frame" title={gameEmbed.title} src={gameEmbed.src} />
            </div>
          </section>
        ) : exploringPOI && (
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
                <span className="art-badge">{exploringPOI.evidence}</span>
                <h2>{exploringPOI.title}</h2>
              </div>

              <div className="map-detail-copy">
                <p className="detail-subtitle">{exploringPOI.note}</p>
                <div className="detail-description">{exploringPOI.detail}</div>

                <div className="detail-lore-box">
                  <b>苗寨文化背景：</b>
                  <p>{exploringPOI.lore}</p>
                  {exploringPOI.sources.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer">研究来源 {i + 1} ↗ </a>)}
                </div>

                <div className="detail-tags">
                  <i>🏞️ 空间示意</i>
                  <i>🪡 苗乡非遗</i>
                  <i>✨ 市井烟火</i>
                </div>

                {exploringPOI.kind === 'embroidery' && (
                  <section className="map-heritage-exhibit embroidery-exhibit" aria-label="苗绣展览">
                    <span>非遗展览 · 苗绣</span>
                    <h3>一针一线，绣出迁徙与山河</h3>
                    <p>苗绣以平绣、破线绣、辫绣、盘绣等针法，将蝴蝶、鸟纹、山川与祖先故事留在衣饰上，因此常被称作“穿在身上的史书”。</p>
                    <div className="exhibit-tags"><i>蝴蝶妈妈</i><i>百鸟纹</i><i>迁徙记忆</i></div>
                  </section>
                )}

                {exploringPOI.kind === 'museum' && (
                  <section className="map-heritage-exhibit museum-exhibit" aria-label="苗族非遗全览">
                    <span>西江苗族博物馆 · 非遗全览</span>
                    <h3>从节日、匠作到歌舞与村寨</h3>
                    <div className="museum-story-grid">
                      {heritageStories.map((story) => (
                        <article key={story.name}>
                          <b>{story.name}</b>
                          <small>{story.note}</small>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                <div className="modal-actions">
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

function MiniappHomeSurface() {
  return <HomePage embedded />
}

function MiniappGameFrame({ title, src, tone = '' }: { title: string; src: string; tone?: string }) {
  return <main className={`miniapp-game-surface ${tone}`} aria-label={title}>
    <iframe title={title} src={src} />
  </main>
}

function MiniappMiaoLanguageGameSurface() {
  return <MiaoLanguageGamePage embedded />
}

function MiniappWaxDyeGameSurface() {
  return <WaxDyeGamePage embedded />
}
function MiniappMapSurface() {
  const [mapReady, setMapReady] = useState(false)
  const handleMapReady = () => {
    setMapReady(true)
    document.documentElement.classList.remove('miniapp-map-booting')
  }
  return <main className="miniapp-webview-surface miniapp-map-surface" aria-label="苗寨三维地图" aria-busy={!mapReady}>
    <Suspense fallback={<div role="status">正在加载苗寨 3D 地图…</div>}>
      <MiaoVillageScene onReady={handleMapReady} />
    </Suspense>
  </main>
}

function MiniappAvatarSurface() {
  return <main className="miniapp-webview-surface miniapp-avatar-surface" aria-label="纠笙三维形象">
    <ModelViewer
      src={avatarModelUrl('MiaoGirl_1.glb')}
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
    />
  </main>
}
const heritageGroups: HeritageStory['group'][] = ['民族节日', '匠作与服饰', '歌舞与村寨']
type HeritageFilter = HeritageStory['group'] | '全部'

function HeritagePage() {
  const [viewAllGroup, setViewAllGroup] = useState<HeritageFilter | null>(null)
  const [search, setSearch] = useState('')
  const [selectedStory, setSelectedStory] = useState<HeritageStory | null>(null)
  const storyDialogRef = useRef<HTMLElement>(null)
  const storyTriggerRef = useRef<HTMLElement | null>(null)
  const openStory = (story: HeritageStory) => {
    storyTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setSelectedStory(story)
  }
  const openCatalog = (group: HeritageFilter) => {
    setSearch('')
    setViewAllGroup(group)
  }
  useEffect(() => {
    if (!selectedStory) return
    const dialog = storyDialogRef.current
    if (!dialog) return
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]'))
    dialog.querySelector<HTMLElement>('.story-close')?.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setSelectedStory(null) }
      if (event.key !== 'Tab') return
      const elements = focusables(), first = elements[0], last = elements.at(-1)
      if (!first || !last) { event.preventDefault(); dialog.focus(); return }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    dialog.addEventListener('keydown', onKeyDown)
    return () => {
      dialog.removeEventListener('keydown', onKeyDown)
      storyTriggerRef.current?.focus({ preventScroll: true })
    }
  }, [selectedStory])

  useEffect(() => {
    document.querySelector('.heritage-shell > .page-content')?.scrollTo({ top: 0 })
  }, [viewAllGroup])

  const query = search.trim().toLocaleLowerCase()
  const visibleStories = heritageStories.filter((story) => {
    const matchesGroup = !viewAllGroup || viewAllGroup === '全部' || story.group === viewAllGroup
    const searchableText = [story.name, story.note, story.region, story.category, story.officialName, story.tag, ...story.body, ...story.sections.map((section) => section.text)].join(' ').toLocaleLowerCase()
    return matchesGroup && (!query || searchableText.includes(query))
  })
  const storyCard = (story: HeritageStory, compact = false) => (
    <button className={compact ? 'heritage-list-card' : 'explore-card heritage-story-card'} type="button" key={story.id} onClick={() => openStory(story)}>
      <span className="heritage-card-image" style={{ backgroundImage: `linear-gradient(180deg, transparent 28%, rgba(6, 31, 56, .72)), url(${story.image})`, backgroundPosition: story.imagePosition ?? 'center' }} />
      <span className="heritage-card-copy"><i>{story.group}</i><b>{story.name}</b><small>{story.note}</small></span>
      {!compact && <em>读故事 ›</em>}
    </button>
  )
  const searchControl = <div className="heritage-search" role="search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
    <input type="search" aria-label="搜索非遗故事" placeholder="搜索手艺、节日或地区" value={search} onChange={(event) => setSearch(event.target.value)} />
    {search && <button type="button" onClick={() => setSearch('')}>清除</button>}
  </div>
  const results = <section className="heritage-results" aria-label="非遗故事列表">
    <p className="catalog-lead" role="status">{query ? `找到 ${visibleStories.length} 个相关故事` : `共 ${visibleStories.length} 个故事，点开慢慢读。`}</p>
    {visibleStories.length ? <div className="catalog-group"><div className="heritage-list">{visibleStories.map((story) => storyCard(story, true))}</div></div> : <div className="heritage-empty">
      <h2>还没有找到这个故事</h2><p>试试“苗绣”“芦笙”或“台江”，也可以回到全部故事继续探索。</p><button type="button" onClick={() => openCatalog('全部')}>浏览全部故事</button>
    </div>}
  </section>

  return (
    <Shell active="heritage" title={viewAllGroup ? (viewAllGroup === '全部' ? '苗乡文化档案' : viewAllGroup) : '苗乡文化'} overlay={selectedStory && (
      <section className="heritage-story-modal" ref={storyDialogRef} role="dialog" tabIndex={-1} aria-modal="true" aria-label={selectedStory.name}>
        <div className="heritage-story-sheet">
          <button type="button" className="story-close" onClick={() => setSelectedStory(null)} aria-label="关闭">×</button>
          <div className="story-cover" style={{ backgroundImage: `linear-gradient(180deg, transparent 30%, rgba(5, 27, 51, .78)), url(${selectedStory.image})`, backgroundPosition: selectedStory.imagePosition ?? 'center' }}>
            <span>{selectedStory.group} · {selectedStory.category}</span><h2>{selectedStory.name}</h2>
          </div>
          <div className="story-body" tabIndex={0} role="region" aria-label="故事正文"><HeritageStoryDetail story={selectedStory} /></div>
        </div>
      </section>
    )}>
      {viewAllGroup ? (
        <section className="view-all-view heritage-catalog">
          <section className="page-intro earth">
            <button type="button" className="heritage-back" onClick={() => { setViewAllGroup(null); setSearch('') }} aria-label="返回非遗首页">&lt;</button>
            <h1>{viewAllGroup === '全部' ? '苗乡文化档案' : viewAllGroup}</h1>
            <span>带着好奇出发，读懂一方土地的记忆。</span>
          </section>
          {searchControl}
          <div className="heritage-category-filter" role="group" aria-label="按文化类别筛选">
            {(['全部', ...heritageGroups] as HeritageFilter[]).map((group) => <button type="button" key={group} aria-pressed={viewAllGroup === group} onClick={() => setViewAllGroup(group)}>{group}</button>)}
          </div>
          {results}
        </section>
      ) : (
        <section className="culture-explore">
          <div className="culture-intro">
            <p>苗乡非遗 · 节日、匠作与村寨</p>
            <h1>从一段故事，走进苗乡</h1>
            <span>听见节日的鼓点，也看见手艺与日常。</span>
          </div>
          {searchControl}
          {query ? results : <>
            <button type="button" className="heritage-hero-story" onClick={() => openStory(heritageStories[0])}>
              <img src={heritageStories[0].image} alt="姊妹节主题配图" />
              <div><span>今日推荐 · 民族节日</span><h2>一篮五彩饭，藏着春日的心意</h2><p>从姊妹节开始，认识苗乡的相会与传情。</p></div>
            </button>
            <button type="button" className="heritage-library-entry" onClick={() => openCatalog('全部')}>
              <b>{heritageStories.length}</b><span><strong>打开苗乡文化档案</strong><small>地域、来历、技艺细节与资料出处</small></span><i aria-hidden="true">›</i>
            </button>
            {heritageGroups.map((group) => <section className="explore-section" key={group}>
              <div className="explore-heading"><h2>{group}<small>{heritageStories.filter((story) => story.group === group).length}</small></h2><button type="button" onClick={() => openCatalog(group)}>查看全部</button></div>
              <div className="explore-rail">{heritageStories.filter((story) => story.group === group).map((story) => storyCard(story))}</div>
            </section>)}
            <p className="heritage-archive-note">以贵州苗族文化为主线，标明各地习俗差异；湘西赶秋作为苗族文化延伸阅读。名录项目与村寨生活背景分别说明，节庆日期请以当地当年安排为准。</p>
          </>}
        </section>
      )}
    </Shell>
  )
}
type CraftKind = WorkshopCraft
type CraftStyle = 'batik-indigo' | 'batik-ice' | 'embroidery-flower' | 'embroidery-pick' | 'silver-dragon' | 'silver-flower' | DollStyleKey
const craftTypes: { key: CraftKind; name: string; desc: string; image: string }[] = [
  { key: 'embroidery', name: '苗绣', desc: '让图案在线里生长', image: batikReference },
  { key: 'batik', name: '蜡染', desc: '把图案留在蓝靛布面', image: generatedBatikStencil },
  { key: 'silver', name: '银饰', desc: '把祝福錾刻成银光', image: silverStencil },
  { key: 'doll', name: '玩偶', desc: '生成并打印 3D 苗族人物实体模型', image: '/人物/images/miao_girl_1.jpg' },
]
const craftStyles: { key: CraftStyle; craft: CraftKind; name: string; desc: string; className: string }[] = [
  { key: 'embroidery-flower', craft: 'embroidery', name: '花鸟绣纹', desc: '彩线入绣 · 花鸟相生', className: 'style-embroidery' },
  { key: 'embroidery-pick', craft: 'embroidery', name: '几何挑花', desc: '对称纹样 · 细密针脚', className: 'style-embroidery-pick' },
  { key: 'batik-indigo', craft: 'batik', name: '蓝靛花鸟纹', desc: '蓝靛底色 · 花鸟舒展', className: 'style-batik' },
  { key: 'batik-ice', craft: 'batik', name: '冰纹留白', desc: '蜡刀留白 · 自然冰纹', className: 'style-batik-ice' },
  { key: 'silver-dragon', craft: 'silver', name: '双龙纹', desc: '银光錾刻 · 对称守护', className: 'style-silver' },
  { key: 'silver-flower', craft: 'silver', name: '花鸟錾刻', desc: '花鸟相生 · 祝福入饰', className: 'style-silver-flower' },
  ...dollStyles.map(item => ({ ...item, craft: 'doll' as const, className: 'style-doll' })),
]
const productOptions = [
  { name: '蜡染方巾', price: 68, size: '35×35cm' },
  { name: '纹样帆布袋', price: 158, size: '38×42cm' },
  { name: '苗绣装饰画', price: 198, size: '40×60cm' },
]
const dollProductOptions = [
  { name: '3D 苗族人物玩偶', price: 298, size: '15cm · 全彩树脂' },
  { name: '收藏版 3D 苗族人物玩偶', price: 468, size: '20cm · 全彩树脂' },
]
const gameExperiences = [
  { mark: '乐', name: '消消乐', note: '连起苗乡好物，消出一份山间欢喜', route: '/games/xiaoxiaole' },
  { mark: '酵', name: '红酸汤', note: '跟着时间，等一锅酸汤慢慢醒来', route: '/games/hongsuantang' },
  { mark: '锻', name: '炼铁', note: '看火候与锤声，锻出山里的硬朗', route: '/games/silver' },
  { mark: '染', name: '蜡染', note: '执蜡刀留白，把花纹染进蓝靛', route: '/games/wax-dye' },
  { mark: '宴', name: '长桌宴', note: '围坐一席，听苗乡待客的故事', route: '/games/miao-feast' },
  { mark: '语', name: '苗语', note: '听一听苗语，猜猜它的普通话意思', route: '/games/miao-language' },
]
function WorkshopPage() {
  const [sourceImg, setSourceImg] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [resultImg, setResultImg] = useState<string | null>(null)
  const [craft, setCraft] = useState<CraftKind | null>(null)
  const [style, setStyle] = useState<CraftStyle>('embroidery-flower')
  const [processing, setProcessing] = useState(false)
  const [resultReady, setResultReady] = useState(false)
  const [showOrder, setShowOrder] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(0)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const editorFileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
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
    setGenerationError('')
    if (editorFileRef.current) editorFileRef.current.value = ''
  }

  const stylesForCraft = craft ? craftStyles.filter((item) => item.craft === craft) : []
  const activeCraft = craftTypes.find((item) => item.key === craft)
  const availableProducts = craft === 'doll' ? dollProductOptions : productOptions
  const selectCraft = (nextCraft: CraftKind) => {
    setCraft(nextCraft)
    document.querySelector('.workshop-shell > .page-content')?.scrollTo({ top: 0 })
    setStyle(craftStyles.find((item) => item.craft === nextCraft)!.key)
    setSelectedProduct(0)
    setResultReady(false)
    setResultImg(null)
    setGenerationError('')
  }

  return <Shell active="workshop" title="苗乡体验坊">
    {!craft ? <section className="workshop-page workshop-landing">
      <div className="workshop-landing-copy">
        <p>苗乡游戏 · 手作体验</p>
        <h1>从一场体验，走进苗乡</h1>
        <span>在手中体验非遗过程，在云端定制手作。</span>
      </div>
      <section className="game-experiences" aria-label="苗乡游戏体验">
        <div className="experience-heading"><div><p>苗乡游戏</p><h2>玩一局，认识一种日常</h2></div><span>6 个体验</span></div>
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
    </section> : <section className="workshop-page workshop-editor">
      <div className="workshop-intro workshop-editor-intro">
        <button type="button" className="craft-back" onClick={resetWorkshop}>‹ 返回选择</button>
        <p>{`${activeCraft!.name}体验 · 匠人定制`}</p>
        <h1>做一件属于你的{activeCraft!.name}</h1>
        <span>{craft === 'doll' ? '先看看六款 3D 玩偶，拖动欣赏服饰细节，再选择喜欢的造型。' : '风格可选；上传一张图片后，将生成一张独立的苗乡手作效果图。'}</span>
      </div>

      {craft === 'doll' ? <section className="workshop-doll-gallery" aria-label="选择三维玩偶造型">
        <div className="doll-gallery-heading"><h3>选择你的玩偶</h3><span>6 款造型</span></div>
        <p className="doll-gallery-hint">左右拖动看细节，上下滑动继续浏览。</p>
        <Suspense fallback={<p role="status">正在加载三维玩偶…</p>}>
          <div className="doll-style-grid">
            {dollStyles.map(item => <DollModelCard
              key={item.key}
              src={avatarModelUrl(item.model)}
              name={item.name}
              desc={item.desc}
              selected={style === item.key}
              onSelect={() => { setStyle(item.key); setResultReady(false); setResultImg(null); setShowOrder(false); setGenerationError('') }}
            />)}
          </div>
        </Suspense>
      </section> : <section className="workshop-styles" aria-label="选择纹样风格">
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
      </section>}

      <section className="workshop-upload" aria-label="上传图片">
        <input className="file-input" ref={editorFileRef} type="file" accept="image/*" onChange={handleFile} />
        {!sourceImg ? (
          <div
            className="upload-area"
            role="button"
            tabIndex={0}
            onClick={() => editorFileRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') editorFileRef.current?.click()
            }}
          >
            <span className="upload-icon">+</span>
            <b>上传图片</b>
            <small>{craft === 'doll' ? '上传一张清晰正面人像，即可开始生成 3D 玩偶' : '随手拍一张花叶、枝果或草图，都可以开始'}</small>
            <span className="upload-actions">
              <button type="button" className="upload-camera" onClick={() => editorFileRef.current?.click()}>◎ 拍照上传</button>
              <button type="button" className="upload-gallery" onClick={() => editorFileRef.current?.click()}>从相册选择</button>
            </span>
          </div>
        ) : (
          <div className="upload-preview">
            <img src={sourceImg} alt="上传的图片" />
            <div className="upload-preview-actions">
              <button type="button" className="upload-retake" onClick={() => editorFileRef.current?.click()}>拍照重拍</button>
              <button type="button" className="upload-replace" onClick={() => editorFileRef.current?.click()}>更换图片</button>
            </div>
          </div>
        )}
      </section>

      {sourceImg && (
        <>
          <button type="button" className="generate-btn" onClick={generate} disabled={processing}>
            {processing ? `正在生成${activeCraft!.name}效果…` : craft === 'doll' ? '生成我的 3D 苗族人物玩偶' : `生成我的${activeCraft!.name}纹样`}
          </button>
          {generationError && <p className="generation-error" role="alert">{generationError}</p>}

          {resultReady && resultImg && (
            <section className="workshop-result" aria-label="生成结果">
              <h3>{craft === 'doll' ? '你的 3D 玩偶预览' : '你的纹样效果'}</h3>
              <div className="result-frame">
                {craft === 'doll' ? (
                  <ModelViewer
                    className="doll-model-preview"
                    src={avatarModelUrl(dollStyles.find(item => item.key === style)?.model ?? dollStyles[0].model)}
                    alt="可旋转查看的 3D 苗族人物玩偶模型"
                    camera-controls
                    auto-rotate
                    interaction-prompt="none"
                    shadow-intensity="0.9"
                    environment-image="neutral"
                  />
                ) : <img className="result-image" src={resultImg} alt={`生成的${activeCraft!.name}纹样效果`} />}
                <span className="result-badge">{craftStyles.find(s => s.key === style)?.name}</span>
              </div>
              <div className="result-actions">
                <button type="button" className="btn-secondary" onClick={resetWorkshop}>重新做一件</button>
                <button type="button" className="btn-primary" onClick={() => setShowOrder(true)}>{craft === 'doll' ? '下单打印实体玩偶' : '定制这件手作'}</button>
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
                <h3>{craft === 'doll' ? '打印 3D 玩偶' : '定制手作'}</h3>
                <p className="order-sub">{craft === 'doll' ? '选择尺寸后，我们会根据你的 3D 苗族人物模型制作实体玩偶。' : '选择产品后，苗乡匠人会依据你的纹样进行定制。'}</p>
                <div className="product-list">
                  {availableProducts.map((p, i) => (
                    <button key={p.name} className={`product-item ${selectedProduct === i ? 'chosen' : ''}`} onClick={() => setSelectedProduct(i)}>
                      <b>{p.name}</b>
                      <small>{p.size}</small>
                      <span className="product-price">¥{p.price}</span>
                    </button>
                  ))}
                </div>
                <div className="order-bottom">
                  <span className="order-total">合计 <b>¥{availableProducts[selectedProduct].price}</b></span>
                  <button type="button" className="btn-primary" onClick={placeOrder}>{craft === 'doll' ? '提交打印' : '提交定制'}</button>
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

function XiaoxiaoleGamePage() {
  return <main className="game-embed-page" aria-label="苗乡消消乐小游戏">
    <header className="game-embed-header"><Link to="/workshop">‹ 返回体验坊</Link><span>乐 · 苗乡消消乐</span></header>
    <iframe className="game-embed-frame" title="苗乡消消乐" src="/games/xiaoxiaole/index.html" />
  </main>
}

type MiaoQuestion = {
  term: string
  pronunciation: string
  answer: string
  options: string[]
  note: string
}

const miaoVocabularySource = {
  title: '《贵州民族语言学习简本·苗语（东部方言）》',
  url: 'https://www.yuncunzhai.com/book/274243.jhtml',
}

const miaoSourceEntries: Record<string, string> = {
  ad: '条目 001：一', 'oub jix': '条目 004：二（两）', bub: '条目 007：三', bleib: '条目 010：四',
  moux: '条目 040：你', wel: '条目 043：我', 'ab jad': '条目 049：爸爸', 'jid keub': '条目 103：谢谢',
  'Moux nbut jib leb?': '条目 042：你叫什么名字？', 'Wel nbut Guib Guangd.': '条目 045：我叫贵光。', 'Jid keub moux!': '条目 104：谢谢你！', 'Yol jid zead!': '条目 106：再见！',
}

const miaoQuestionSets: Record<'入门' | '进阶' | '挑战', MiaoQuestion[]> = {
  入门: [
    { term: 'ad', pronunciation: '啊', answer: '一', options: ['一', '三', '五', '十'], note: '数字是听辨苗语声调与节奏的好起点。' },
    { term: 'oub jix', pronunciation: '欧（及）', answer: '二（两）', options: ['二（两）', '四', '六', '八'], note: '“oub jix”在资料中对应数字“二（两）”。' },
    { term: 'bub', pronunciation: '部', answer: '三', options: ['三', '七', '九', '百'], note: '短词也有自己的音高与收尾。' },
    { term: 'bleib', pronunciation: '背', answer: '四', options: ['四', '八', '千', '万'], note: '试着先听整体，再判断词尾。' },
  ],
  进阶: [
    { term: 'moux', pronunciation: '眸', answer: '你', options: ['你', '我', '他', '我们'], note: '这是常用的人称称谓。' },
    { term: 'wel', pronunciation: '歪', answer: '我', options: ['我', '你们', '爸爸', '姐姐'], note: '在自我介绍中常会听见它。' },
    { term: 'ab jad', pronunciation: '阿杰', answer: '爸爸', options: ['爸爸', '妈妈', '哥哥', '爷爷'], note: '称谓是进寨交流时很实用的一组词。' },
    { term: 'jid keub', pronunciation: '机扣', answer: '谢谢', options: ['谢谢', '再见', '请坐', '没关系'], note: '一声感谢，也是一份苗寨待客的温暖。' },
  ],
  挑战: [
    { term: 'Moux nbut jib leb?', pronunciation: '眸补记赖？', answer: '你叫什么名字？', options: ['你叫什么名字？', '你住在哪里？', '你去哪里？', '你今年多大？'], note: '试着把它当作完整问句来听。' },
    { term: 'Wel nbut Guib Guangd.', pronunciation: '歪补贵光。', answer: '我叫贵光。', options: ['我叫贵光。', '我来自贵阳。', '我是老师。', '我很高兴。'], note: '“wel”是“我”，后面是自我介绍。' },
    { term: 'Jid keub moux!', pronunciation: '机扣眸！', answer: '谢谢你！', options: ['谢谢你！', '欢迎你！', '请等一下！', '再见！'], note: '把单词放进句子里，听感会有变化。' },
    { term: 'Yol jid zead!', pronunciation: '邀及栽！', answer: '再见！', options: ['再见！', '早上好！', '请进！', '没关系！'], note: '离开时，不妨用这一句为一局游戏收尾。' },
  ],
}
const shuffleOptions = (options: string[], answer: string) => {
  const shuffled = [...options]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  const correctIndex = shuffled.indexOf(answer)
  if (correctIndex === 0 && shuffled.length > 1) {
    const targetIndex = 1 + Math.floor(Math.random() * (shuffled.length - 1))
    ;[shuffled[0], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[0]]
  }
  return shuffled
}

function MiaoLanguageGamePage({ embedded = false }: { embedded?: boolean } = {}) {
  const [level, setLevel] = useState<'入门' | '进阶' | '挑战'>('入门')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const questions = miaoQuestionSets[level]
  const [round, setRound] = useState(0)
  const question = questions[questionIndex]
  const isLast = questionIndex === questions.length - 1
  const displayedOptions = useMemo(() => shuffleOptions(question.options, question.answer), [question, round])
  const isCorrect = selected === question.answer

  const chooseLevel = (nextLevel: '入门' | '进阶' | '挑战') => {
    setLevel(nextLevel)
    setQuestionIndex(0)
    setSelected(null)
    setScore(0)
    setRound((current) => current + 1)
  }

  const playAudio = () => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(question.pronunciation)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.68
    utterance.pitch = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const selectAnswer = (option: string) => {
    if (selected) return
    setSelected(option)
    if (option === question.answer) setScore((current) => current + 1)
  }

  const nextQuestion = () => {
    if (!selected) return
    if (isLast) {
      setQuestionIndex(0)
      setSelected(null)
      setScore(0)
      setRound((current) => current + 1)
      return
    }
    setQuestionIndex((current) => current + 1)
    setSelected(null)
  }

  return <main className="miao-language-game" aria-label="苗语听音猜义小游戏">
    {!embedded && <header className="miao-language-header"><Link to="/workshop">‹ 返回体验坊</Link><span>语 · 苗语</span><b>东部方言</b></header>}
    <section className="miao-language-content">
      <div className="miao-language-hero">
        <p>苗乡游戏 · 听音猜义</p>
        <h1>听一句苗语<br />猜它的普通话意思</h1>
        <span>选好难度，戴上耳机听一听，再选出最贴近的意思。</span>
      </div>

      <div className="miao-level-tabs" role="tablist" aria-label="选择难度">
        {(Object.keys(miaoQuestionSets) as Array<'入门' | '进阶' | '挑战'>).map((item) => (
          <button key={item} type="button" role="tab" aria-selected={level === item} className={level === item ? 'active' : ''} onClick={() => chooseLevel(item)}>
            {item}{item === '挑战' && <small>高难</small>}
          </button>
        ))}
      </div>

      <section className="miao-quiz-card" aria-live="polite">
        <div className="miao-quiz-meta"><span>{level} · 第 {questionIndex + 1}/{questions.length} 题</span><b>答对 {score} 题</b></div>
        <p className="miao-prompt">这句苗语是什么意思？</p>
        <button type="button" className="miao-audio-button" onClick={playAudio} aria-label={`播放“${question.term}”的练习音频`}>
          <i>▶</i><span>播放音频</span><small>再听一次</small>
        </button>
        <p className="miao-listening-tip">按原资料所列的汉字注音朗读，不是田野录音；请以文末原始条目为准。</p>
        <div className="miao-options" role="group" aria-label="选择普通话意思">
          {displayedOptions.map((option, index) => {
            const state = selected ? (option === question.answer ? 'correct' : option === selected ? 'wrong' : '') : ''
            return <button type="button" key={option} className={state} disabled={Boolean(selected)} onClick={() => selectAnswer(option)}>
              <i>{String.fromCharCode(65 + index)}</i><span>{option}</span>{state === 'correct' && <b>✓</b>}{state === 'wrong' && <b>×</b>}
            </button>
          })}
        </div>
        {selected && <div className={`miao-answer-reveal ${isCorrect ? 'good' : ''}`}>
          <b>{isCorrect ? '答对啦！' : '差一点！'}</b>
          <p><em>{question.term}</em> · {question.answer}</p>
          <small>{question.note}</small>
        </div>}
        <button type="button" className="miao-next-button" disabled={!selected} onClick={nextQuestion}>{isLast ? '再来一轮' : '下一题 →'}</button>
      </section>

      <aside className="miao-source-note">
        <b>词汇小档案</b>
        <p>本题对应 {miaoSourceEntries[question.term]}。资料提供苗文、汉语释义与汉字注音，但未附可核验的逐条录音；因此本页不把设备合成音标为真实苗语录音。</p>
        <a href={miaoVocabularySource.url} target="_blank" rel="noreferrer">查看本题的详细原始资料：{miaoVocabularySource.title} ↗</a>
      </aside>
    </section>
  </main>
}

const emptyWaxMetrics = (): CraftMetrics => ({
  knifeTemp: 0,
  waxLoad: 0,
  waxStrokes: 0,
  coverageRatio: 0,
  sealedStatus: 'empty',
  dyePasses: 0,
  dyeDurationSec: 0,
  oxidationRatio: 0,
  score: 0,
})

function WaxDyeGamePage({ embedded = false }: { embedded?: boolean } = {}) {
  const [phase, setPhase] = useState<WaxPhase>('intro')
  const [metrics, setMetrics] = useState<CraftMetrics>(emptyWaxMetrics)
  const [templateId, setTemplateId] = useState('butterfly')
  const [drawingCanvas, setDrawingCanvas] = useState<HTMLCanvasElement | null>(null)
  const [session, setSession] = useState(0)

  useEffect(() => {
    if (phase !== 'dye' || metrics.dyeDurationSec >= 100) return undefined
    const timer = window.setInterval(() => {
      setMetrics((current) => ({ ...current, dyeDurationSec: Math.min(100, current.dyeDurationSec + 5) }))
    }, 180)
    return () => window.clearInterval(timer)
  }, [phase, metrics.dyeDurationSec])

  useEffect(() => {
    if (phase !== 'oxidize' || metrics.oxidationRatio >= 100) return undefined
    const timer = window.setInterval(() => {
      setMetrics((current) => ({ ...current, oxidationRatio: Math.min(100, current.oxidationRatio + 5) }))
    }, 180)
    return () => window.clearInterval(timer)
  }, [phase, metrics.oxidationRatio])

  const restart = () => {
    setPhase('intro')
    setMetrics(emptyWaxMetrics())
    setDrawingCanvas(null)
    setTemplateId('butterfly')
    setSession((current) => current + 1)
  }
  const beginDye = () => {
    waxAudio.playDyeSubmerge()
    setMetrics((current) => ({ ...current, dyePasses: current.dyePasses + 1, dyeDurationSec: 0, oxidationRatio: 0 }))
    setPhase('dye')
  }

  return <main className="game-embed-page wax-game-page" aria-label="苗族蜡染互动体验">
    {!embedded && <header className="game-embed-header"><Link to="/workshop">‹ 返回体验坊</Link><span>染 · 苗族蜡染工坊</span></header>}
    <section className="wax-game-content">
      <div className="wax-game-intro">
        <p>丹寨蜡染 · 3D 手作体验</p>
        <h1>{phase === 'finish' ? '你的蓝靛纹样已完成' : '以蜡留白，把山野染进布里'}</h1>
        <span>依次温刀、蘸蜡、描绘、入染与氧化，完成一方独一无二的苗家蜡染。</span>
      </div>
      <Suspense fallback={<div className="wax-3d-scene-container" role="status">正在加载蜡染工坊…</div>}>
        <WaxWorkbench3D
          phase={phase}
          metrics={metrics}
          drawingCanvas={drawingCanvas}
          onPickKnife={() => { waxAudio.playWaxScrape(); setPhase('warm') }}
          onHeatKnife={() => { waxAudio.playHeatSizzle(); setMetrics((current) => ({ ...current, knifeTemp: Math.min(3, current.knifeTemp + 1) })) }}
          onDipWax={() => { waxAudio.playWaxDip(); setMetrics((current) => ({ ...current, waxLoad: 2 })) }}
          onScrapeWax={() => { waxAudio.playWaxScrape(); setMetrics((current) => ({ ...current, waxLoad: 1 })) }}
          onStartDrawing={() => setPhase('draw')}
          onHangOnRack={() => { waxAudio.playClothRustle(); setPhase('oxidize') }}
          onRepeatDye={beginDye}
          onFinishMasterpiece={() => setPhase('finish')}
          onRestart={restart}
        >
          {phase === 'draw' && <div className="wax-game-draw-overlay">
            <WaxDrawingCanvas
              key={session}
              selectedTemplateId={templateId}
              onSelectTemplate={setTemplateId}
              onCanvasTextureUpdate={setDrawingCanvas}
              onStrokeAdd={(waxStrokes, coverageRatio) => setMetrics((current) => ({
                ...current,
                waxStrokes,
                coverageRatio,
                sealedStatus: waxStrokes >= 6 ? 'sealed' : 'drawing',
              }))}
            />
            <button type="button" className="wax-game-next" disabled={metrics.waxStrokes < 6} onClick={beginDye}>
              {metrics.waxStrokes < 6 ? `再描绘 ${6 - metrics.waxStrokes} 笔，完成封蜡` : '封蜡完成 · 入靛蓝染缸 →'}
            </button>
          </div>}
          {phase === 'finish' && <div className="wax-game-finish-card">
            <span>✦ 蜡染成品</span>
            <h2>一浸一晒，蓝白相生</h2>
            <p>你完成了 {metrics.dyePasses} 次浸染、{metrics.waxStrokes} 笔落蜡的 {templateId === 'freehand' ? '自由创作' : '传统纹样'}。</p>
            <button type="button" onClick={restart}>再做一方蜡染</button>
          </div>}
        </WaxWorkbench3D>
      </Suspense>
    </section>
  </main>
}

const rootRoute = createRootRoute({ component: Outlet })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const mapRoute = createRoute({ getParentRoute: () => rootRoute, path: '/map', component: MapPage })
const miniappHomeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/miniapp/home', component: MiniappHomeSurface })
const miniappMapRoute = createRoute({ getParentRoute: () => rootRoute, path: '/miniapp/map', component: MiniappMapSurface })
const miniappHongsuantangGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/miniapp/games/hongsuantang', component: () => <MiniappGameFrame title="苗家红酸汤发酵小游戏" src="/games/hongsuantang/index.html" /> })
const miniappMiaoFeastGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/miniapp/games/miao-feast', component: () => <MiniappGameFrame title="百米长桌宴小游戏" src="/games/miao-feast/index.html" tone="game-embed-feast" /> })
const miniappSilverGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/miniapp/games/silver', component: () => <MiniappGameFrame title="千锤成银炼铁小游戏" src="/games/silver/index.html" tone="game-embed-silver" /> })
const miniappXiaoxiaoleGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/miniapp/games/xiaoxiaole', component: () => <MiniappGameFrame title="苗乡消消乐" src="/games/xiaoxiaole/index.html" /> })
const miniappMiaoLanguageGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/miniapp/games/miao-language', component: MiniappMiaoLanguageGameSurface })
const miniappWaxDyeGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/miniapp/games/batik', component: MiniappWaxDyeGameSurface })
const miniappAvatarRoute = createRoute({ getParentRoute: () => rootRoute, path: '/miniapp/avatar', component: MiniappAvatarSurface })
const heritageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/heritage', component: HeritagePage })
const workshopRoute = createRoute({ getParentRoute: () => rootRoute, path: '/workshop', component: WorkshopPage })
const cultureRoute = createRoute({ getParentRoute: () => rootRoute, path: '/culture', component: HeritagePage })
const hongsuantangGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/hongsuantang', component: HongsuantangGamePage })
const miaoFeastGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/miao-feast', component: MiaoFeastGamePage })
const silverGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/silver', component: SilverGamePage })
const xiaoxiaoleGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/xiaoxiaole', component: XiaoxiaoleGamePage })
const miaoLanguageGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/miao-language', component: MiaoLanguageGamePage })
const waxDyeGameRoute = createRoute({ getParentRoute: () => rootRoute, path: '/games/wax-dye', component: WaxDyeGamePage })
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, mapRoute, miniappHomeRoute, miniappMapRoute, miniappAvatarRoute, miniappHongsuantangGameRoute, miniappMiaoFeastGameRoute, miniappSilverGameRoute, miniappXiaoxiaoleGameRoute, miniappMiaoLanguageGameRoute, miniappWaxDyeGameRoute, heritageRoute, workshopRoute, cultureRoute, hongsuantangGameRoute, miaoFeastGameRoute, silverGameRoute, xiaoxiaoleGameRoute, miaoLanguageGameRoute, waxDyeGameRoute]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
function App() {
  const [showIntro, setShowIntro] = useState(() => !window.location.pathname.startsWith("/games/") && !window.location.pathname.startsWith("/miniapp/"))
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
