from pathlib import Path
from pypdf import PdfReader
from PIL import Image,ImageChops
import pdfplumber,hashlib,json,re
root=Path('D:/Miao');out=root/'output/pdf';tmp=root/'tmp/pdfs/reference-screens';r=PdfReader(out/'苗家亲_产品说明书_V0.1.0.pdf');layout=json.loads((root/'tmp/pdfs/product-description-style/layout-report.json').read_text(encoding='utf-8'))
source=re.sub(r'<!--.*?-->','',(out/'苗家亲_产品说明书_V0.1.0.md').read_text(encoding='utf-8-sig'),flags=re.S);norm=lambda t:re.sub(r'\s+','',t);full=norm(''.join(p.extract_text() for p in r.pages));missing=[]
for line in source.splitlines():
 line=line.strip()
 if not line:continue
 if line.startswith('|'):
  parts=[x.strip() for x in line.strip('|').split('|')]
  if all(re.fullmatch(r':?-+:?',x) for x in parts):continue
 elif line.startswith('!['):parts=[re.match(r'!\[([^]]+)\]',line).group(1)]
 else:parts=[re.sub(r'^#+ ','',line)]
 for x in parts:
  x=re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',x).replace('*','')
  if norm(x) not in full:missing.append(x)
with pdfplumber.open(out/'苗家亲_产品说明书_V0.1.0.pdf') as d:
 overflow=[i+1 for i,p in enumerate(d.pages) for c in p.chars if c['x0']<0 or c['x1']>p.width+1 or c['top']<0 or c['bottom']>p.height]
 # Compare the already inspected old pages, ignoring only updated footer page numbers.
 unchanged=[]
 for old,new in [(1,1),(3,3),(4,5),(5,6),(6,7),(7,8)]:
  a=Image.open(root/f'tmp/pdfs/product-description-vision/page-{old}.png').convert('RGB');b=Image.open(tmp/f'pdf-{new}.png').convert('RGB')
  unchanged.append(ImageChops.difference(a.crop((0,0,a.width,1300)),b.crop((0,0,b.width,1300))).getbbox() is None)
copy_ok=all(hashlib.sha256((root/'tmp/pdfs'/f'{n}.jpg').read_bytes()).digest()==hashlib.sha256((out/'description-assets'/f'{n}.jpg').read_bytes()).digest() for n in ['景德镇','云上中轴','云游敦煌'])
report={'pages':len(r.pages),'reference_images_on_page_4':len(r.pages[3].images),'missing_markdown_text':missing,'out_of_bounds':overflow,'original_screenshots_preserved':copy_ok,'other_page_bodies_unchanged':all(unchanged),'contents_match':all(x['title'] in r.pages[x['page']-1].extract_text() for x in layout['chapters']),'website_link_preserved':any(a.get_object().get('/A',{}).get('/URI')=='https://miaojiaqin.xyz' for a in r.pages[0].get('/Annots',[]))}
print(json.dumps(report,ensure_ascii=False));(tmp/'qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');assert len(r.pages[3].images)==3 and not missing and not overflow and all(unchanged) and copy_ok and report['website_link_preserved']
