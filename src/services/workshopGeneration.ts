export type WorkshopCraft = 'batik' | 'embroidery' | 'silver'

type GenerationInput = {
  image: File
  craft: WorkshopCraft
  style: string
}

type GenerationResponse = {
  imageUrl?: string
  imageBase64?: string
  error?: string
}

type GenerationSkill = 'miao-embroidery-imagegen' | 'miao-silver-imagegen'

type GenerationProfile = {
  skill: GenerationSkill
  prompt: string
}

const embroideryStyleGuidance: Record<string, string> = {
  'embroidery-flower': '以盘线轮廓和细密平绣为主，保留花瓣般的分区节奏。',
  'embroidery-pick': '以清楚的十字绣感和几何挑花分区为主，控制为一主一辅两种针法。',
}

const silverStyleGuidance: Record<string, string> = {
  'silver-dragon': '以较粗银片轮廓和两级錾刻浮雕组织对称的大形。',
  'silver-flower': '以花瓣般的银片层次、盘丝边缘和少量颗粒细节组织构图。',
}

/**
 * 苗绣与银饰技能包的运行时转译。输入图始终是构图参考，提示词只控制工艺语言；
 * 服务端可根据 generationSkill 选择对应的图像生成工作流。
 */
export function getWorkshopGenerationProfile(craft: WorkshopCraft, style: string): GenerationProfile | null {
  if (craft === 'embroidery') {
    return {
      skill: 'miao-embroidery-imagegen',
      prompt: `Use case: style-transfer. 输入图是唯一的构图参考：保留主体轮廓、方向、疏密、比例和关键位置，只转译视觉语言。将主体转为受黔东南苗族刺绣视觉语言启发的当代绣片；深靛蓝或近黑布底，以朱红、洋红、橙黄、翠绿、青蓝和米白丝线建立主辅色层级。轮廓必须由可见的丝线、盘线或锁边形成，内部按结构分区填针，保留真实丝线方向、轻微线径变化和手工叠压。${embroideryStyleGuidance[style] || '以平绣和锁边两种工艺表现结构。'} 不加入输入图中没有的人物、动物或象征性母题；不要印花、蜡染、油画、塑料3D、霓虹、文字或水印。`,
    }
  }

  if (craft === 'silver') {
    return {
      skill: 'miao-silver-imagegen',
      prompt: `Use case: style-transfer. 输入图是唯一的构图参考：保留主体轮廓、方向、层次、疏密和关键位置，只转译银工语言。将主体转为受黔东南苗族银饰视觉语言启发的当代银片浮雕纹样；使用柔和冷银高光、锤击细纹、凹部轻氧化、边缘磨损与可信厚度。用明确银片外轮廓或较粗银丝建立大形，以錾刻、锤揲浮雕、盘丝、颗粒或镂空中的一至两种工艺组织前后层级。${silverStyleGuidance[style] || '以錾刻和锤揲浮雕表现主轮廓。'} 不加入输入图中没有的具象母题；不要金色、彩色宝石、钻石、镜面铬、电镀塑料感、科幻机械、文字或水印。`,
    }
  }

  return null
}

function loadUploadedImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法读取上传的图片。'))
    }
    image.src = url
  })
}

/**
 * 黑客松演示回退：在浏览器内将上传图转为风格化预览，不上传文件也不调用外部服务。
 * 它不是 AI 生成结果；当配置真实接口后，generateWorkshopArtwork 会自动优先使用接口。
 */
async function generateLocalWorkshopPreview(imageFile: File, craft: WorkshopCraft): Promise<string> {
  const image = await loadUploadedImage(imageFile)
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const scale = Math.min(1, 1024 / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器不支持本地图片预览。')

  if (craft === 'silver') {
    context.fillStyle = '#15191f'
    context.fillRect(0, 0, width, height)
    context.filter = 'grayscale(1) contrast(1.3) brightness(1.08)'
    context.globalAlpha = 0.78
    context.drawImage(image, 0, 0, width, height)
    context.filter = 'none'
    context.globalAlpha = 1

    const silver = context.createLinearGradient(0, 0, width, height)
    silver.addColorStop(0, 'rgba(244, 248, 255, 0.58)')
    silver.addColorStop(0.42, 'rgba(108, 123, 145, 0.18)')
    silver.addColorStop(0.72, 'rgba(234, 240, 248, 0.52)')
    silver.addColorStop(1, 'rgba(68, 77, 91, 0.26)')
    context.globalCompositeOperation = 'screen'
    context.fillStyle = silver
    context.fillRect(0, 0, width, height)
    context.globalCompositeOperation = 'source-over'
    context.strokeStyle = 'rgba(232, 240, 248, 0.44)'
    context.lineWidth = Math.max(1, width / 360)
    for (let radius = Math.min(width, height) * 0.1; radius < Math.max(width, height) * 0.72; radius += Math.max(16, width / 13)) {
      context.beginPath()
      context.ellipse(width * 0.5, height * 0.5, radius, radius * 0.68, -0.32, 0.16, Math.PI * 1.78)
      context.stroke()
    }
  } else {
    context.fillStyle = craft === 'embroidery' ? '#0b1834' : '#123c63'
    context.fillRect(0, 0, width, height)
    context.filter = craft === 'embroidery' ? 'contrast(1.2) saturate(1.48)' : 'contrast(1.16) saturate(1.12) hue-rotate(165deg)'
    context.globalAlpha = 0.73
    context.drawImage(image, 0, 0, width, height)
    context.filter = 'none'
    context.globalAlpha = 1

    const threadColors = craft === 'embroidery'
      ? ['rgba(239, 77, 104, 0.6)', 'rgba(245, 190, 66, 0.58)', 'rgba(85, 207, 170, 0.48)', 'rgba(225, 236, 247, 0.42)']
      : ['rgba(224, 241, 255, 0.45)', 'rgba(104, 166, 220, 0.4)', 'rgba(246, 250, 255, 0.34)']
    const spacing = Math.max(7, Math.round(Math.min(width, height) / 68))
    context.lineWidth = Math.max(1, spacing * 0.18)
    for (let y = -height; y < height * 2; y += spacing) {
      context.strokeStyle = threadColors[Math.abs(Math.round(y / spacing)) % threadColors.length]
      context.setLineDash([spacing * 0.48, spacing * 0.56])
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(width, y - width * 0.38)
      context.stroke()
    }
    context.setLineDash([])
  }

  return canvas.toDataURL('image/png')
}

/**
 * 浏览器端只负责上传素材、选择技能和显示最终成品；密钥与图像生成调用必须放在服务端。
 * 在 .env.local 中配置 VITE_WORKSHOP_GENERATION_ENDPOINT，例如：
 * VITE_WORKSHOP_GENERATION_ENDPOINT=https://your-api.example.com/workshop/generate
 * 服务端会收到 image、craft、style，以及苗绣/银饰专用的 generationSkill、prompt 字段。
 */
export async function generateWorkshopArtwork({ image, craft, style }: GenerationInput): Promise<string> {
  const endpoint = import.meta.env.VITE_WORKSHOP_GENERATION_ENDPOINT

  if (!endpoint) {
    return generateLocalWorkshopPreview(image, craft)
  }

  const payload = new FormData()
  payload.append('image', image)
  payload.append('craft', craft)
  payload.append('style', style)

  const profile = getWorkshopGenerationProfile(craft, style)
  if (profile) {
    payload.append('generationSkill', profile.skill)
    payload.append('prompt', profile.prompt)
  }

  const response = await fetch(endpoint, { method: 'POST', body: payload })
  const result = await response.json().catch(() => ({} as GenerationResponse)) as GenerationResponse

  if (!response.ok) throw new Error(result.error || '图像生成服务暂时不可用，请稍后重试。')
  const imageUrl = result.imageUrl || result.imageBase64
  if (!imageUrl) throw new Error('图像生成服务没有返回结果图。')
  return imageUrl
}
