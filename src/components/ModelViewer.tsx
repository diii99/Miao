import { lazy, Suspense, type ComponentProps } from 'react'

const Viewer = lazy(() => import('./ModelViewerElement'))

export function ModelViewer(props: ComponentProps<'model-viewer'>) {
  return (
    <Suspense fallback={<div className={props.className} style={props.style} role="status" aria-label="正在加载三维模型" />}>
      <Viewer {...props} />
    </Suspense>
  )
}
