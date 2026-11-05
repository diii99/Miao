from pathlib import Path
p=Path('tmp/pdfs/product-description/build_product_description.py')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("spaceBefore=10,spaceAfter=7,keepWithNext=True","spaceBefore=6,spaceAfter=6,keepWithNext=True")
s=s.replace("('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)","('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)")
s=s.replace("],155))", "],140))")
s=s.replace("'/games/xiaoxiaole\\n/games/hongsuantang\\n/games/silver\\n/games/wax-dye\\n/games/miao-feast\\n/games/miao-language'", "'/games/xiaoxiaole  /games/hongsuantang\\n/games/silver  /games/wax-dye\\n/games/miao-feast  /games/miao-language'")
s=s.replace("['产品概述与功能结构','第 1 至 3 页、第 11 页'],\n['向导与地图','第 4 至 7 页'],\n['文化档案与故事清单','第 8 至 10 页'],\n['六项互动体验','第 15 至 20 页'],\n['手作预览、玩偶与定制','第 11 至 14 页'],\n['运行问题与页面路径','第 21 至 22 页'],", "['产品概述与功能结构 / 向导与地图','第 1 至 7 页、第 11 页'],\n['文化档案 / 手作、玩偶与定制','第 8 至 14 页'],\n['六项互动体验 / 运行问题与路径','第 15 至 22 页'],")
p.write_text(s,encoding='utf-8')
