import { StrictMode, type ReactNode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Link, Outlet, RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import './styles.css'

type TabKey = 'home' | 'heritage' | 'culture' | 'more'
const tabs: { key: TabKey; label: string; to: '/' | '/heritage' | '/culture' | '/more'; icon: string }[] = [
  { key: 'home', label: '首页', to: '/', icon: '⌂' }, { key: 'heritage', label: '非遗', to: '/heritage', icon: '✦' },
  { key: 'culture', label: '文化', to: '/culture', icon: '◌' }, { key: 'more', label: '其他', to: '/more', icon: '···' },
]

function Shell({ active, title, children }: { active: TabKey; title: string; children: ReactNode }) {
  return <main className="mini-program"><header className="navigation-bar"><span className="page-title">{title}</span><span className="capsule" aria-label="小程序胶囊按钮"><i /><b /><em /></span></header><section className="page-content">{children}</section><nav className="tab-bar" aria-label="主导航">{tabs.map((tab) => <Link key={tab.key} to={tab.to} className={`tab-item ${active === tab.key ? 'active' : ''}`} activeOptions={{ exact: true }}><span className="tab-icon">{tab.icon}</span><span>{tab.label}</span></Link>)}</nav></main>
}

const outfits = [{ id: 'midnight', label: '靛蓝盛装' }, { id: 'scarlet', label: '朱红节装' }, { id: 'teal', label: '山野青衣' }]
const jewelry = [{ id: 'silver', label: '银饰' }, { id: 'gold', label: '鎏金' }, { id: 'plain', label: '素雅' }]
const headdresses = [{ id: 'crown', label: '银冠' }, { id: 'scarf', label: '头帕' }, { id: 'flower', label: '花饰' }]

function HomePage() {
  const [outfit, setOutfit] = useState('midnight')
  const [jewel, setJewel] = useState('silver')
  const [headwear, setHeadwear] = useState('crown')
  const optionRow = (title: string, selected: string, items: { id: string; label: string }[], choose: (id: string) => void) => <div className="dress-row"><span>{title}</span><div>{items.map((item) => <button type="button" key={item.id} className={selected === item.id ? 'chosen' : ''} onClick={() => choose(item.id)}>{item.label}</button>)}</div></div>
  return <Shell active="home" title="黔苗行"><section className="dress-hero"><div className="dress-copy"><p>贵州 · 黔东南</p><h1>穿上苗装<br />走进苗寨</h1><span>挑选你的苗乡旅行造型</span></div><div className="village"><i className="building building-one" /><i className="building building-two" /><i className="building building-three" /><b /></div><div className={`dress-avatar avatar outfit-${outfit} jewel-${jewel} head-${headwear}`} aria-label="正面站立的苗族服饰人物"><div className="avatar-hair" /><div className="avatar-head"><i className="avatar-eye eye-left" /><i className="avatar-eye eye-right" /><b /></div><div className="avatar-headdress"><i /><b /><em /></div><div className="avatar-necklace"><i /><b /><em /></div><div className="avatar-torso"><i className="sleeve sleeve-left" /><i className="sleeve sleeve-right" /><b className="embroidery">✦</b></div><div className="avatar-skirt"><i /><b /></div><div className="avatar-leg leg-left" /><div className="avatar-leg leg-right" /></div><div className="dress-seal">苗<br />装</div></section><section className="dress-panel"><div className="dress-panel-title"><div><p>苗乡试穿</p><h2>定制你的旅拍造型</h2></div><span>可即时预览</span></div>{optionRow('服饰', outfit, outfits, setOutfit)}{optionRow('首饰', jewel, jewelry, setJewel)}{optionRow('头饰', headwear, headdresses, setHeadwear)}</section><Heading eyebrow="旅行灵感" title="这一站，去苗寨" action="查看目的地 →" /><section className="story-card"><div className="story-image"><span>西<br />江</span><i>黔东南 · 雷山</i></div><div className="story-copy"><small>苗寨目的地</small><h3>西江千户苗寨，住进万家灯火</h3><p>沿着吊脚楼与山间步道慢慢行走，感受苗乡晨雾、歌声与长桌宴的热闹。</p><div className="author"><b>行</b><span>苗乡旅行指南 · 雷山</span></div></div></section></Shell>
}
function Heading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: string }) { return <section className="section-heading"><div><p>{eyebrow}</p><h2>{title}</h2></div>{action && <a>{action}</a>}</section> }

const heritageItems = [['苗绣蜡染', '把苗家纹样带回旅行记忆'], ['苗族歌舞', '在村寨聆听飞歌与芦笙'], ['传统村落', '西江、郎德、丹寨等地的故事'], ['苗家风味', '酸汤、糯米与长桌宴的热情']]
function HeritagePage() { return <Shell active="heritage" title="苗乡体验"><section className="page-intro earth"><p>旅行不止抵达，更要走近</p><h1>在贵州，读懂苗族文化</h1><span>用一场有温度的旅行，认识苗乡的手艺、歌声与日常。</span></section><div className="search">⌕ <span>搜索苗寨、文化体验或旅行路线</span></div><section className="category-list">{heritageItems.map(([name, detail], index) => <article key={name}><span className={`category-symbol symbol-${index}`}>✦</span><div><h2>{name}</h2><p>{detail}</p></div><b>›</b></article>)}</section></Shell> }
function CulturePage() { return <Shell active="culture" title="苗乡文化"><section className="page-intro red"><p>从一套衣裳，到一场节日</p><h1>苗族文化，正在发生</h1><span>旅行前先听懂苗乡的礼俗、节庆与山地生活。</span></section><section className="calendar-card"><small>苗乡节庆 · 春日相约</small><h2>姊妹节</h2><p>盛装、游方、歌声与祝福，汇成苗乡最动人的春日相逢。</p><div className="calendar-art">苗乡相约 <b>春</b></div></section><Heading eyebrow="文化漫游" title="从旅行开始了解" /><section className="culture-list"><article><span>01</span><div><h3>苗族银饰</h3><p>叮当作响的祝福与家族记忆</p></div></article><article><span>02</span><div><h3>苗家服饰</h3><p>把山川、祖先与故事穿在身上</p></div></article></section></Shell> }
function MorePage() { return <Shell active="more" title="旅行服务"><section className="profile"><div className="avatar">黔</div><div><p>欢迎来到贵州苗乡</p><h1>你的苗寨旅行小助手</h1></div></section><section className="profile-menu">{[['♡','我的旅行清单','收藏想去的苗寨与体验'],['◎','行前指南','交通、住宿与旅行礼仪'],['?','关于黔苗行','一起尊重并守护苗乡文化']].map(([icon, name, note]) => <article key={name}><span>{icon}</span><div><h3>{name}</h3><p>{note}</p></div><b>›</b></article>)}</section><p className="footer-note">黔苗行 · 走近贵州，走进苗乡</p></Shell> }

const rootRoute = createRootRoute({ component: Outlet })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const heritageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/heritage', component: HeritagePage })
const cultureRoute = createRoute({ getParentRoute: () => rootRoute, path: '/culture', component: CulturePage })
const moreRoute = createRoute({ getParentRoute: () => rootRoute, path: '/more', component: MorePage })
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, heritageRoute, cultureRoute, moreRoute]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
createRoot(document.getElementById('root')!).render(<StrictMode><RouterProvider router={router} /></StrictMode>)
