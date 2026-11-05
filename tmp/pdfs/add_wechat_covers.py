from pathlib import Path
from io import BytesIO
import shutil,hashlib,json
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
root=Path('D:/Miao');out=root/'output/pdf';tmp=root/'tmp/pdfs/wechat-covers';tmp.mkdir(exist_ok=True)
asset=out/'manual-assets/微信.jpg';shutil.copyfile(root/'tmp/pdfs/微信.jpg',asset)
report=[]
for name in ['苗家亲_产品操作手册_V0.1.0.pdf','苗家亲_产品说明书_V0.1.0.pdf']:
 p=out/name;r=PdfReader(p)
 before=[hashlib.sha256(pg.get_contents().get_data()).hexdigest() for pg in r.pages]
 original_texts=[pg.extract_text() for pg in r.pages]
 w=PdfWriter();w.clone_document_from_reader(r)
 buf=BytesIO();c=canvas.Canvas(buf,pagesize=(float(r.pages[0].mediabox.width),float(r.pages[0].mediabox.height)))
 c.drawImage(str(asset),42,110,width=110,height=110);c.save();buf.seek(0)
 w.pages[0].merge_page(PdfReader(buf).pages[0]);staged=tmp/name
 with staged.open('wb') as f:w.write(f)
 check=PdfReader(staged)
 assert before[1:]==[hashlib.sha256(pg.get_contents().get_data()).hexdigest() for pg in check.pages[1:]]
 assert original_texts==[pg.extract_text() for pg in check.pages]
 assert len(check.pages[0].images)==len(r.pages[0].images)+1
 assert any(a.get_object().get('/A',{}).get('/URI')=='https://miaojiaqin.xyz' for a in check.pages[0].get('/Annots',[]))
 p.write_bytes(staged.read_bytes())
 report.append({'file':name,'pages':len(check.pages),'image_rect':[42,110,152,220],'image_added':True,'text_unchanged':True,'body_pages_unchanged':True,'website_link_preserved':True})
builder=root/'tmp/pdfs/build_manual_from_md.py';s=builder.read_text(encoding='utf-8-sig')
anchor=" c.setFont('Yahei',9);c.setFillColor(colors.HexColor('#b8d8df'));c.drawString(M,89,'手册 0.1.0  |  产品 0.1.0')"
addition=" c.drawImage(str(AS/'微信.jpg'),M,110,width=110,height=110)\n"
assert anchor in s
if addition not in s:builder.write_text(s.replace(anchor,addition+anchor),encoding='utf-8')
(tmp/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
