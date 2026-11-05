from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
from pypdf import PdfReader
import pdfplumber,json,re,hashlib
p=Path('output/pdf/苗家亲_产品操作手册_V1.0.pdf');r=PdfReader(p);texts=[pg.extract_text() or '' for pg in r.pages]
report={'pages':len(r.pages),'bytes':p.stat().st_size,'old_brand_present':any('黔苗行' in t or '苗家亲 · Miao' in t for t in texts),'avatar_images_on_page_14':len(r.pages[13].images),'page_text_lengths':[len(t) for t in texts]}
with pdfplumber.open(p) as pdf:
 report['out_of_bounds']=[{'page':i+1,'char':ch['text']} for i,pg in enumerate(pdf.pages) for ch in pg.chars if ch['x0']<0 or ch['x1']>pg.width+1 or ch['top']<0 or ch['bottom']>pg.height]
# Verify exact source image pixels survive embedding on their intended PDF pages.
for key,pgno,asset in [('home',1,'01-home.png'),('story',9,'06-story.png')]:
 original=Image.open(Path('output/pdf/manual-assets')/asset).convert('RGB')
 report[key+'_image_matches']=any(im.image.convert('RGB').size==original.size and im.image.convert('RGB').tobytes()==original.tobytes() for im in r.pages[pgno-1].images)
source=Path('output/pdf/苗家亲_产品操作手册_V0.1.0.md').read_text(encoding='utf-8-sig').replace('苗家亲 · Miao','苗家亲').replace('先按第 24 页排查','先按“常见问题”排查')
norm=lambda t:re.sub(r'\s+','',t)
alltext=norm(''.join(texts));missing=[]
for line in source.splitlines():
 if not line.strip() or line.startswith('#') or line.startswith('手册版本：'):continue
 if line.startswith('|'):
  cells=[v.strip() for v in line.strip('|').split('|')]
  if all(re.fullmatch(r':?-+:?',v) for v in cells):continue
  parts=[x for cell in cells for x in cell.split('<br>')]
 elif line.startswith('!['):parts=[re.match(r'!\[(.*?)\]',line).group(1)]
 else:parts=[line.removeprefix('> ')]
 for part in parts:
  if norm(part) not in alltext:missing.append(part)
report['missing_markdown_lines']=missing
Path('tmp/pdfs/revised-qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
files=sorted(Path('tmp/pdfs/revised-render').glob('page-*.jpg'))
for start in range(0,len(files),4):
 sheet=Image.new('RGB',(1100,1580),'#dce4e8');d=ImageDraw.Draw(sheet)
 for j,f in enumerate(files[start:start+4]):
  im=ImageOps.contain(Image.open(f),(542,760));x=(j%2)*550+(550-im.width)//2;y=(j//2)*790+23;sheet.paste(im,(x,y));d.text((x+5,y-18),f'PAGE {start+j+1}',fill='#173b59')
 sheet.save(f'tmp/pdfs/revised-contact-{start//4+1}.jpg',quality=75)
print(json.dumps(report,ensure_ascii=False))
