from pathlib import Path
import shutil,hashlib,json
root=Path('D:/Miao');out=root/'output/pdf';dest=out/'description-assets';dest.mkdir(exist_ok=True)
for name in ['景德镇','云上中轴','云游敦煌']:shutil.copyfile(root/'tmp/pdfs'/f'{name}.jpg',dest/f'{name}.jpg')
p=out/'苗家亲_产品说明书_V0.1.0.md';s=p.read_text(encoding='utf-8-sig')
block='''## 数字文旅参考案例

数字景德镇、云上中轴与云游敦煌展示了文化地标的不同数字表达，为苗家亲的场景导览、角色陪伴和文化内容呈现提供参考。

![数字景德镇](description-assets/景德镇.jpg)

![云上中轴](description-assets/云上中轴.jpg)

![云游敦煌](description-assets/云游敦煌.jpg)

### 数字景德镇

地图串联窑址、作坊等文化地点，结合 AI 伴游入口，呈现城市文化探索场景。

### 云上中轴

截图标题为“AI 数字中轴”，以中轴线全景和人物向导呈现空间导览。

### 云游敦煌

以壁画构成视觉主体，将探索、游览、保护与新文创组织为文化体验入口。

以上为参考案例界面，苗家亲将围绕苗族村寨、节俗和技艺建立自身内容与品牌表达。

'''
assert '## 数字文旅参考案例' not in s
s=s.replace('## 数字导览与文化内容',block+'## 数字导览与文化内容');p.write_text(s,encoding='utf-8-sig')
b=root/'tmp/pdfs/build_product_description_from_md.py';s=b.read_text(encoding='utf-8-sig')
anchor=' while i<len(bs):\n'
addition=''' if title=='数字文旅参考案例':
  gallery=[b for b in bs if b[0]=='image']
  assert len(gallery)==3
  story.extend(render(b) for b in bs[:next(i for i,b in enumerate(bs) if b[0]=='image')])
  iw=(CW-24)/3;cells=[]
  for b in gallery:
   path=(OUT/b[2]).resolve();im=PILImage.open(path)
   cells.append([Image(str(path),width=iw,height=iw*im.height/im.width),para(b[1],'cap')])
   figures.append({'caption':b[1],'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
  gallery_table=Table([[cells[0],cells[1],cells[2]]],colWidths=[iw+12,iw+12,iw],hAlign='LEFT')
  gallery_table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(1,0),12),('RIGHTPADDING',(2,0),(2,0),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]))
  gallery_table.spaceAfter=10;story.append(gallery_table)
  after=max(i for i,b in enumerate(bs) if b[0]=='image')+1
  story.extend(render(b) for b in bs[after:])
  continue
'''
assert anchor in s;s=s.replace(anchor,addition+anchor,1);b.write_text(s,encoding='utf-8-sig')
