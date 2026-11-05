from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
from pypdf import PdfReader
import json,pdfplumber
p=Path('output/pdf/苗家亲_产品操作手册_V1.0.pdf');r=PdfReader(p)
report={'pages':len(r.pages),'size_bytes':p.stat().st_size,'outline_entries':len(r.outline),'links':sum(len(pg.get('/Annots',[])) for pg in r.pages),'page_text_lengths':[len(pg.extract_text() or '') for pg in r.pages]}
with pdfplumber.open(p) as pdf:
 report['outside_page_characters']=[{'page':i+1,'text':ch['text'],'x0':ch['x0'],'top':ch['top']} for i,pg in enumerate(pdf.pages) for ch in pg.chars if ch['x0']<-1 or ch['x1']>pg.width+1 or ch['top']<-1 or ch['bottom']>pg.height+1]
report['image_count']=sum(len(pg.images) for pg in r.pages)
Path('tmp/pdfs/qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
files=sorted(Path('tmp/pdfs/render').glob('page-*.png'))
for start in range(0,len(files),4):
 sheet=Image.new('RGB',(1200,1736),'#dce4e8');d=ImageDraw.Draw(sheet)
 for j,f in enumerate(files[start:start+4]):
  img=ImageOps.contain(Image.open(f),(590,834));x=(j%2)*600+(600-img.width)//2;y=(j//2)*868+26
  sheet.paste(img,(x,y));d.text((x+6,y-20),f'PAGE {start+j+1}',fill='#173b59')
 sheet.save(f'tmp/pdfs/contact-{start//4+1}.jpg',quality=85)
print(json.dumps(report,ensure_ascii=False))
