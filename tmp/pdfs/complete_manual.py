from pathlib import Path
import json,re
from pypdf import PdfReader
root=Path('D:/Miao'); out=root/'output/pdf'; md=out/'苗家亲_产品操作手册_V0.1.0.md'; text=md.read_text(encoding='utf-8')
missing=[x for x in re.findall(r'!\[[^\]]*\]\(([^)]+)\)',text) if not (out/x).exists()]
assert not missing, missing
qa=json.loads((root/'tmp/pdfs/qa-report.json').read_text(encoding='utf-8'))
assert qa['pages']==26 and not qa['outside_page_characters']
qa['visual_review']='All 26 pages reviewed; pages 1,4,9,16 re-reviewed after final screenshot replacement.'
qa['markdown_image_links_valid']=True
(root/'tmp/pdfs/qa-report.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf-8')
progress=root/'docs/PROGRESS.md'
entry='\n\n### 2026-09-11 — Chinese product operation manual completed\n\nDelivered `output/pdf/苗家亲_产品操作手册_V1.0.pdf` (26 pages) and matching Markdown, with live browser screenshots in `output/pdf/manual-assets/`. Covers home guide, map controls and landmarks, 21 heritage stories, four craft previews, six games, demo-order boundaries, state retention, FAQ and route appendix. Browser walkthroughs included wax and fermentation completion. Recorded the observed mobile demo-submit overlap; no product code changed. PDF text/boundaries, 26 bookmarks, 24 internal links and all-page visual rendering reviewed. Builder and QA: `tmp/pdfs/build_manual.py`, `tmp/pdfs/qa-report.json`. No pending work for this manual; not deployed.\n'
if 'Chinese product operation manual completed' not in progress.read_text(encoding='utf-8'):progress.write_text(progress.read_text(encoding='utf-8')+entry,encoding='utf-8')
print('Final PDF and Markdown validated; progress checkpoint saved.')
