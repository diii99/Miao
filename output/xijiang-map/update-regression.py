from pathlib import Path
p=Path('D:/Miao/scripts/verify_xijiang_map.cjs')
s=p.read_text(encoding='utf-8').replace('🎥 追随视角','🎥 第一人称').replace('follow camera checked','first-person camera checked')
s=s.replace("'mobile-street.png'", "'mobile-street.png'")
p.write_text(s,encoding='utf-8')
