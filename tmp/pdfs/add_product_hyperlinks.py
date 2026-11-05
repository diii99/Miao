from pathlib import Path
import json,hashlib
import pdfplumber
from pypdf import PdfReader,PdfWriter
from pypdf.annotations import Link
root=Path('D:/Miao');tmp=root/'tmp/pdfs/hyperlinks';tmp.mkdir(parents=True,exist_ok=True)
url='https://miaojiaqin.xyz';report=[]
for name in ['苗家亲_产品操作手册_V0.1.0.pdf','苗家亲_产品说明书_V0.1.0.pdf']:
 path=root/'output/pdf'/name;r=PdfReader(path)
 before=[hashlib.sha256(p.get_contents().get_data()).hexdigest() for p in r.pages]
 boxes=[]
 with pdfplumber.open(path) as pdf:
  for i,p in enumerate(pdf.pages):
   for m in p.search('miaojiaqin.xyz',regex=False):boxes.append((i,[m['x0'],p.height-m['bottom'],m['x1'],p.height-m['top']]))
 assert boxes
 w=PdfWriter();w.clone_document_from_reader(r)
 for i,rect in boxes:w.add_annotation(page_number=i,annotation=Link(rect=rect,url=url,border=[0,0,0]))
 staged=tmp/name
 with staged.open('wb') as f:w.write(f)
 check=PdfReader(staged)
 assert len(check.pages)==len(r.pages)
 assert before==[hashlib.sha256(p.get_contents().get_data()).hexdigest() for p in check.pages]
 for i,rect in boxes:
  matching=[a.get_object() for a in check.pages[i].get('/Annots',[]) if a.get_object().get('/Subtype')=='/Link' and a.get_object().get('/A',{}).get('/URI')==url]
  assert any(all(abs(float(v)-expected)<.01 for v,expected in zip(a['/Rect'],rect)) for a in matching)
 path.write_bytes(staged.read_bytes())
 report.append({'file':name,'pages':len(check.pages),'links_added':len(boxes),'target':url,'page_content_unchanged':True})
# Preserve hyperlinks in future exports of both documents; the description loads this shared cover.
builder=root/'tmp/pdfs/build_manual_from_md.py';s=builder.read_text(encoding='utf-8-sig')
anchor=" c.setFillColor(colors.HexColor('#b8d8df'));c.setFont('Yahei',11);c.drawString(M,H-210,'产品体验地址:miaojiaqin.xyz')\n"
addition=" link_x=M+pdfmetrics.stringWidth('产品体验地址:','Yahei',11)\n c.linkURL('https://miaojiaqin.xyz',(link_x,H-213,link_x+pdfmetrics.stringWidth('miaojiaqin.xyz','Yahei',11),H-201),relative=0,thickness=0)\n"
assert anchor in s
if "c.linkURL('https://miaojiaqin.xyz'" not in s:builder.write_text(s.replace(anchor,anchor+addition),encoding='utf-8')
(tmp/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
