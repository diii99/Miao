from pathlib import Path
p=Path('D:/Miao/scripts/verify_xijiang_visuals.cjs')
s=p.read_text(encoding='utf-8').replace("['terraces','田园观光区']", "['terraces','田园观光区'],['lookout','观景台']")
p.write_text(s,encoding='utf-8')
