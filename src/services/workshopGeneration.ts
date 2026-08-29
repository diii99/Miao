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

/**
 * 浏览器端只负责上传素材、选择技能和显示最终成品；密钥与图像生成调用必须放在服务端。
 * 在 .env.local 中配置 VITE_WORKSHOP_GENERATION_ENDPOINT，例如：
 * VITE_WORKSHOP_GENERATION_ENDPOINT=https://your-api.example.com/workshop/generate
 * 服务端会收到 image、craft、style，以及苗绣/银饰专用的 generationSkill、prompt 字段。
 */
export async function generateWorkshopArtwork({ image, craft, style }: GenerationInput): Promise<string> {
  const endpoint = import.meta.env.VITE_WORKSHOP_GENERATION_ENDPOINT

  if (!endpoint) {
    throw new Error('尚未配置图像生成服务。请设置 VITE_WORKSHOP_GENERATION_ENDPOINT 后再生成。')
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
