import type { HeritageStory } from '../data/heritage'

export function HeritageStoryDetail({ story }: { story: HeritageStory }) {
  const jumpTo = (section: string) => {
    document.getElementById(`story-${section}`)?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }

  return <>
    <p className="story-tag">{story.tag}</p>
    <dl className="story-facts">
      <div><dt>流传地区</dt><dd>{story.region}</dd></div>
      <div><dt>文化类别</dt><dd>{story.category}</dd></div>
      {story.officialName && <div><dt>名录名称</dt><dd>{story.officialName}</dd></div>}
      {story.recognition && <div><dt>收录说明</dt><dd>{story.recognition}</dd></div>}
      {story.projectNumber && <div><dt>项目编号</dt><dd>{story.projectNumber}{story.listedYear ? ` · ${story.listedYear} 年` : ''}</dd></div>}
    </dl>
    <nav className="story-reading-nav" aria-label="正文目录">
      <button type="button" onClick={() => jumpTo('background')}>文化故事</button>
      <button type="button" onClick={() => jumpTo('observe')}>看懂门道</button>
      <button type="button" onClick={() => jumpTo('sources')}>查阅来源 ↗</button>
    </nav>
    <section id="story-background" className="story-section">
      <h3>从生活里读懂它</h3>
      {story.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </section>
    {story.sections.map((section, index) => <section className="story-section" key={section.title}>
      <h3><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</h3>
      <p>{section.text}</p>
    </section>)}
    <section id="story-observe" className="story-observe story-section">
      <h3>下次遇见，留意这些细节</h3>
      <ol>{story.observe.map((observation) => <li key={observation}>{observation}</li>)}</ol>
    </section>
    <section className="story-etiquette story-section">
      <h3>走进苗乡的小约定</h3>
      <ul>{story.etiquette.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
    <footer id="story-sources" className="story-source">
      <h3>资料与延伸阅读</h3>
      <p>按地区记录习俗与名录信息 · 资料核对于 2026 年 9 月</p>
      <ol>{story.sources.map((source) => <li key={source.url}>
        <a href={source.url} target="_blank" rel="noreferrer">{source.title}<span aria-hidden="true"> ↗</span></a>
      </li>)}</ol>
      <p className="story-image-note">{story.imageNote ?? '封面为主题配图，不代表所有地区的仪式或服饰样式。具体技艺与习俗可结合所列资料和当地传承人的讲述了解。'}</p>
    </footer>
  </>
}
