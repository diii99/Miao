import { ModelViewerElement } from '@google/model-viewer'
import type { ComponentProps } from 'react'

// Configure decoding before any reduced avatar is mounted.
ModelViewerElement.meshoptDecoderLocation = '/vendor/meshopt_decoder-1.1.js'

export default function ModelViewer(props: ComponentProps<'model-viewer'>) {
  return <model-viewer {...props} />
}
