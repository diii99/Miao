const old = (file, name, group) => ({ src: `/消消乐/image/${file}.png`, name, group });
const motif = (file, name) => ({ src: `./patterns/${file}.svg`, name, group: '纹样' });
export const patterns = [
  ...Array.from({ length: 6 }, (_, i) => old(`图案_${i + 1}`, `靛蓝纹样 ${i + 1}`, '纹样')),
  old('折耳根', '折耳根', '食材'), old('木姜籽', '木姜籽', '食材'),
  old('毛辣果', '毛辣果', '食材'), old('糯米粉', '糯米粉', '食材'),
  old('腊肉', '腊肉', '食材'), old('鱼酱', '鱼酱', '食材'),
  old('银饰_1', '银饰一式', '银饰'), old('银饰_2', '银饰二式', '银饰'), old('银饰_3', '银饰三式', '银饰'),
  motif('butterfly', '蝶舞'), motif('bird', '飞鸟'), motif('fish', '游鱼'),
  motif('flower', '团花'), motif('spiral', '旋涡'), motif('diamond', '菱花'),
];
export const themes = {
  all: { name: '苗乡好物', pool: patterns.map((_, i) => i) },
  indigo: { name: '靛蓝纹样', pool: patterns.flatMap((p, i) => p.group === '纹样' ? [i] : []) },
  daily: { name: '食材银饰', pool: patterns.flatMap((p, i) => p.group !== '纹样' ? [i] : []) },
};
