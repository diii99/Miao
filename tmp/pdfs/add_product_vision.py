from pathlib import Path
from pypdf import PdfReader
import json,hashlib
root=Path('D:/Miao');p=root/'output/pdf/苗家亲_产品说明书_V0.1.0.md';pdf=p.with_suffix('.pdf')
tmp=root/'tmp/pdfs/product-description-vision';tmp.mkdir(parents=True,exist_ok=True)
(tmp/'before.json').write_text(json.dumps({'page_streams':[hashlib.sha256(pg.get_contents().get_data()).hexdigest() for pg in PdfReader(pdf).pages],'manual_sha256':hashlib.sha256((root/'output/pdf/苗家亲_产品操作手册_V0.1.0.pdf').read_bytes()).hexdigest()}),encoding='utf-8')
s=p.read_text(encoding='utf-8-sig');needle='当前产品以网页演示';i=s.index(needle)
sentence='项目以景德镇、故宫、敦煌等文化地标的数字化表达为参照，致力于打造具有苗族文化辨识度的数字文旅品牌。'
assert sentence not in s
p.write_text(s[:i]+sentence+'\n\n'+s[i:],encoding='utf-8-sig')
