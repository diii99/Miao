import { useEffect, useRef, useState } from 'react'
import type { ModelViewerElement } from '@google/model-viewer'
import ModelViewer from '../components/ModelViewerElement'

type Props = {
  src: string
  name: string
  desc: string
  selected: boolean
  onSelect: () => void
}

export function DollModelCard({ src, name, desc, selected, onSelect }: Props) {
  const viewer = useRef<ModelViewerElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const model = viewer.current
    if (!model) return
    const loaded = () => setStatus('ready')
    const failed = () => setStatus('error')
    setStatus(model.loaded ? 'ready' : 'loading')
    model.addEventListener('load', loaded)
    model.addEventListener('error', failed)
    return () => {
      model.removeEventListener('load', loaded)
      model.removeEventListener('error', failed)
    }
  }, [src, attempt])

  return <article className={`doll-style-card${selected ? ' is-selected' : ''}`}>
    <div className="doll-style-stage" key={attempt}>
      <ModelViewer
        ref={viewer}
        className="doll-style-model"
        src={attempt ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src}
        alt={`${name}，可拖动旋转的三维玩偶`}
        loading="eager"
        camera-controls
        touch-action="pan-y"
        disable-pan
        camera-orbit="0deg 85deg 115%"
        field-of-view="28deg"
        interaction-prompt="none"
        shadow-intensity="0.5"
        environment-image="neutral"
      />
      {status === 'loading' && <span className="doll-model-status" role="status">模型加载中…</span>}
      {status === 'error' && <div className="doll-model-error" role="status">
        <span>模型暂时未加载</span>
        <button type="button" onClick={() => setAttempt(value => value + 1)}>重新加载{name}</button>
      </div>}
    </div>
    <button type="button" className="doll-style-select" aria-pressed={selected} onClick={onSelect}>
      <b>{name}</b><small>{desc}</small><span>{selected ? '已选择' : '选择这款'}</span>
    </button>
  </article>
}
