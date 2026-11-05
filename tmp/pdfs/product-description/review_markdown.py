from pathlib import Path
import hashlib,re,ast,json
root=Path('D:/Miao');out=root/'output/pdf'
manual=out/'苗家亲_产品操作手册_V0.1.0.md';desc=out/'苗家亲_产品说明书_V0.1.0.md'
text=desc.read_text(encoding='utf-8-sig')
links=re.findall(r'\]\(([^)]+)\)',text)
scripts=[root/'tmp/pdfs'/name for name in ['build_manual.py','build_manual_from_md.py','complete_manual.py','qa_revised_manual.py']]
for script in scripts:ast.parse(script.read_text(encoding='utf-8-sig'))
report={
'new_pdf_absent':not (out/'苗家亲_产品说明书_V0.1.0.pdf').exists(),
'old_manual_name_absent':not (out/'苗家亲_产品操作手册_V1.0.md').exists(),
'manual_renamed_without_content_change':hashlib.sha256(manual.read_bytes()).hexdigest()=='a175a4858cc1a00dc10c9129f92307a3b22268cfe286ad8bf53a3d3878bbe32b',
'description_exists':desc.exists(),
'markdown_characters':len(text),
'headings':re.findall(r'^#{1,3} .+',text,re.M),
'all_links_resolve':all((desc.parent/link).exists() for link in links),
'links':links,
'no_micro_steps':not re.search(r'步骤\s*\d|按住|点击|[0-9]+px|W/A/S/D|/games/|440×956',text),
'commercial_proposals_labelled':'以下为拟议合作方向' in text and '并非当前已取得的运营结果' in text,
'local_source_references_recorded':'tmp/pdfs/build_manual_from_md.py' in text,
'script_references_updated':all('苗家亲_产品操作手册_V0.1.0.md' in s.read_text(encoding='utf-8') and '苗家亲_产品操作手册_V1.0.md' not in s.read_text(encoding='utf-8') for s in scripts),
'original_manual_pdf_unchanged':hashlib.sha256((out/'苗家亲_产品操作手册_V0.1.0.pdf').read_bytes()).hexdigest()=='9ac9231ae99450b9d2da211a9df77d4439335b87e85c8bb090ca7ce1aaaa77ee'
}
assert all(v for v in report.values())
(root/'tmp/pdfs/product-description/markdown-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
