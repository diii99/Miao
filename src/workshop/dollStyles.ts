export const dollStyles = [
  { key: 'doll-silver-crown', name: '银冠盛装', desc: '银冠层叠 · 靛蓝盛服', model: 'MiaoGirl_1.glb' },
  { key: 'doll-pleated-dress', name: '百褶舞装', desc: '彩绣百褶 · 银饰垂肩', model: 'MiaoGirl_2.glb' },
  { key: 'doll-indigo-headwrap', name: '靛蓝头帕', desc: '靛蓝包帕 · 绣边裙装', model: 'MiaoGirl_3.glb' },
  { key: 'doll-horn-crown', name: '银角盛装', desc: '高角冠饰 · 彩绣盛服', model: 'MiaoGirl_4.glb' },
  { key: 'doll-high-bun', name: '高髻绣衣', desc: '盘髻高束 · 浅色围裙', model: 'MiaoGirl_5.glb' },
  { key: 'doll-embroidered-cape', name: '彩绣披肩', desc: '彩绣披肩 · 流苏发饰', model: 'MiaoGirl_6.glb' },
] as const

export type DollStyleKey = typeof dollStyles[number]['key']
