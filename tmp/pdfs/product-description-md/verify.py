from pathlib import Path
from pypdf import PdfReader
import pdfplumber,json,re,hashlib
root=Path('D:/Miao');out=root/'output/pdf';tmp=root/'tmp/pdfs/product-description-md';pdf=out/'苗家亲_产品说明书_V0.1.0.pdf';md=out/'苗家亲_产品说明书_V0.1.0.md'
r=PdfReader(pdf);norm=lambda t:re.sub(r'\s+','',t)
alltext=norm(''.join(p.extract_text() or '' for p in r.pages));source=re.sub(r'<!--.*?-->','',md.read_text(encoding='utf-8-sig'),flags=re.S);missing=[]
for line in source.splitlines():
 line=line.strip()
 if not line:continue
 if line.startswith('|'):
  parts=[x.strip() for x in line.strip('|').split('|')]
  if all(re.fullmatch(r':?-+:?',x) for x in parts):continue
 elif line.startswith('!['):parts=[re.match(r'!\[([^]]+)\]',line).group(1)]
 else:parts=[re.sub(r'^#+ ','',line)]
 for part in parts:
  part=re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',part).replace('*','')
  if norm(part) not in alltext:missing.append(part)
with pdfplumber.open(pdf) as d:
 bounds=[{'page':i+1,'text':c['text']} for i,p in enumerate(d.pages) for c in p.chars if c['x0']<0 or c['x1']>p.width+1 or c['top']<0 or c['bottom']>p.height]
layout=json.loads((tmp/'layout-report.json').read_text(encoding='utf-8'))
report={'pages':len(r.pages),'missing_markdown_text':missing,'out_of_bounds':bounds,'markdown_unchanged':hashlib.sha256(md.read_bytes()).hexdigest()==layout['markdown_sha256'],'chapter_locations_match':all(x['title'] in r.pages[x['page']-1].extract_text() for x in layout['chapters']),'pdf_size_bytes':pdf.stat().st_size}
(tmp/'qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False));assert not missing and not bounds and report['markdown_unchanged'] and report['chapter_locations_match']
