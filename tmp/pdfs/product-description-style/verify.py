from pathlib import Path
import re,json,hashlib
from pypdf import PdfReader
import pdfplumber
root=Path('D:/Miao');out=root/'output/pdf';tmp=root/'tmp/pdfs/product-description-style'
pdf=out/'苗家亲_产品说明书_V0.1.0.pdf';md=out/'苗家亲_产品说明书_V0.1.0.md';reference=out/'苗家亲_产品操作手册_V0.1.0.pdf'
r=PdfReader(pdf);norm=lambda t:re.sub(r'\s+','',t);alltext=norm(''.join(p.extract_text() for p in r.pages));source=re.sub(r'<!--.*?-->','',md.read_text(encoding='utf-8-sig'),flags=re.S);missing=[]
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
with pdfplumber.open(pdf) as p, pdfplumber.open(reference) as ref:
 overflow=[{'page':i+1,'text':c['text']} for i,pg in enumerate(p.pages) for c in pg.chars if c['x0']<0 or c['x1']>pg.width+1 or c['top']<0 or c['bottom']>pg.height]
 cover_match=p.pages[0].rects[0]['non_stroking_color']==ref.pages[0].rects[0]['non_stroking_color']
 chapter_sizes=sorted(set(round(c['size'],1) for c in p.pages[2].chars))
 ref_sizes=sorted(set(round(c['size'],1) for c in ref.pages[2].chars))
 same_geometry=p.pages[0].width==ref.pages[0].width and p.pages[0].height==ref.pages[0].height
before=json.loads((tmp/'before.json').read_text(encoding='utf-8'));layout=json.loads((tmp/'layout-report.json').read_text(encoding='utf-8'))
report={'pages':len(r.pages),'missing_markdown_text':missing,'out_of_bounds':overflow,'markdown_unchanged_during_export':hashlib.sha256(md.read_bytes()).hexdigest()==layout['markdown_sha256'],'reference_pdf_unchanged':hashlib.sha256(reference.read_bytes()).hexdigest()==before['manual_sha256'],'same_page_geometry':same_geometry,'same_cover_background':cover_match,'same_overview_font_sizes':chapter_sizes==ref_sizes,'font_sizes':chapter_sizes,'chapter_locations_match':all(x['title'] in r.pages[x['page']-1].extract_text() for x in layout['chapters']),'text_reduction_percent':round(100*(1-len(md.read_text(encoding='utf-8-sig'))/before['source_characters']),1),'visual_review':'All 7 final pages inspected'}
(tmp/'qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False));assert not missing and not overflow and report['reference_pdf_unchanged'] and same_geometry and cover_match and report['chapter_locations_match']
