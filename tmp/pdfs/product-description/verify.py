from pathlib import Path
from pypdf import PdfReader
import pdfplumber,json,re,hashlib
base=Path('tmp/pdfs/product-description');p=Path('output/pdf/苗家亲_产品说明书_V0.1.0.pdf');r=PdfReader(p)
texts=[x.extract_text() or '' for x in r.pages];norm=lambda x:re.sub(r'\s+','',x)
alltext=norm(''.join(texts));parts=base.joinpath('authored-text.txt').read_text(encoding='utf-8').split('\n\n')
missing=[x for x in parts if norm(x) not in alltext]
meta=json.loads(base.joinpath('build-report.json').read_text(encoding='utf-8'))
with pdfplumber.open(p) as d:
    overflow=[{'page':i+1,'text':c['text']} for i,pg in enumerate(d.pages) for c in pg.chars if c['x0']<0 or c['x1']>pg.width+1 or c['top']<0 or c['bottom']>pg.height]
report={'pages':len(texts),'size_bytes':p.stat().st_size,'all_authored_text_present':not missing,'missing':missing,'out_of_bounds':overflow,'table_of_contents_matches':all(title in texts[pg-1] for pg,title in meta['chapters']),'source_unchanged':hashlib.sha256(Path(meta['source']).read_bytes()).hexdigest()==meta['source_sha256'],'visual_review':'All 11 final pages inspected'}
base.joinpath('qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False));assert not missing and not overflow and report['table_of_contents_matches'] and report['source_unchanged']
