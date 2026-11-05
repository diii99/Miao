from pathlib import Path
p=Path('tmp/pdfs/build_manual.py');s=p.read_text(encoding='utf-8');s=s.replace("Paragraph(html.escape(str(t)),styles['small'])", "Paragraph(html.escape(str(t)).replace('\\n','<br/>'),styles['small'])")
s=s.replace("' | '.join(row)","' | '.join(cell.replace('\\n','<br>') for cell in row)")
p.write_text(s,encoding='utf-8')
