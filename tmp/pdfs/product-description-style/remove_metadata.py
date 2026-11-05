from pathlib import Path
import hashlib,json
from pypdf import PdfReader
root=Path('D:/Miao');md=root/'output/pdf/苗家亲_产品说明书_V0.1.0.md';pdf=md.with_suffix('.pdf');builder=root/'tmp/pdfs/build_product_description_from_md.py'
r=PdfReader(pdf);before=[hashlib.sha256(p.get_contents().get_data()).hexdigest() for p in r.pages]
(root/'tmp/pdfs/product-description-style/before-metadata-removal.json').write_text(json.dumps(before),encoding='utf-8')
s=md.read_text(encoding='utf-8-sig');start=s.index('\n\n');body=s.index('## 产品概述');md.write_text(s[:start]+'\n\n'+s[body:],encoding='utf-8-sig')
s=builder.read_text(encoding='utf-8-sig');s=s.replace("intro=source.split('## ',1)[0].strip().split('\\n\\n')\nstory.append(Spacer(1,35));story.append(para(intro[1],'h'));story.extend(para(x,'small') for x in intro[2:])\n",'');builder.write_text(s,encoding='utf-8-sig')
