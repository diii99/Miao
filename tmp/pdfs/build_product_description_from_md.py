from pathlib import Path
import re,html,hashlib,json
from reportlab.platypus import BaseDocTemplate,PageTemplate,Frame,Paragraph,Table,TableStyle,Image,Spacer,PageBreak,KeepTogether
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import ParagraphStyle
from PIL import Image as PILImage
ROOT=Path('D:/Miao');OUT=ROOT/'output/pdf';TMP=ROOT/'tmp/pdfs/product-description-style';TMP.mkdir(parents=True,exist_ok=True)
# Load the reference manual's exact typography, colors, dimensions, and page furniture.
# Only its definitions are loaded; the manual export and its files are never executed or changed.
style_source=(ROOT/'tmp/pdfs/build_manual_from_md.py').read_text(encoding='utf-8-sig').split("source=MD.read_text",1)[0]
style_source=style_source.replace('产品操作手册','产品说明书').replace('使用指南','产品介绍').replace('手册 0.1.0','说明书 0.1.0')
style={};exec(compile(style_source,'manual_style_definitions','exec'),style)
for key in ['W','H','M','CW','S','INK','NAVY','TEAL','GRAY','cover','regular','estimate']:globals()[key]=style[key]
MD=OUT/'苗家亲_产品说明书_V0.1.0.md';PDF=OUT/'苗家亲_产品说明书_V0.1.0.pdf'
raw=MD.read_text(encoding='utf-8-sig');sourcehash=hashlib.sha256(MD.read_bytes()).hexdigest();source=re.sub(r'<!--.*?-->','',raw,flags=re.S)
def para(t,k='p'):
 t=html.escape(t);t=re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',t);t=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',t)
 return Paragraph(t.replace('\n','<br/>'),S[k])
parse=style['parse']
def render(b,width=CW):
 if b[0] in ['p','h','note']:return para(b[1],b[0])
 if b[0]=='table':return style['render'](b,width)
 raise ValueError(b)
class Description(BaseDocTemplate):
 def beforeDocument(self):self.entries=[]
 def afterFlowable(self,f):
  if isinstance(f,Paragraph) and f.style.name=='chapter':
   title=f.getPlainText();key='chapter'+str(len(self.entries));self.canv.bookmarkPage(key);self.canv.addOutlineEntry(title,key,0,False);self.entries.append({'title':title,'page':self.page})
   if title!='目录':self.notify('TOCEntry',(0,title,self.page,key))
frame=Frame(M,62,CW,H-132,id='main',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
doc=Description(str(PDF),pagesize=(W,H),leftMargin=M,rightMargin=M,topMargin=70,bottomMargin=62,title='苗家亲 产品说明书 V0.1.0',author='苗家亲',subject='产品定位、核心体验与客户合作')
doc.addPageTemplates([PageTemplate(id='cover',frames=[frame],onPage=cover,autoNextPageTemplate='body'),PageTemplate(id='body',frames=[frame],onPage=regular)])
story=[Spacer(1,1),PageBreak(),para('目录','chapter')]
toc=TableOfContents();toc.levelStyles=[ParagraphStyle('toc',fontName='Yahei',fontSize=10,leading=17,textColor=INK,spaceBefore=1)];story.append(toc)
figures=[]
for section in re.split(r'^## ',source,flags=re.M)[1:]:
 title,_,body=section.partition('\n');title=title.strip();story.extend([PageBreak(),para(title,'chapter')]);bs=parse(body);i=0
 if title=='数字文旅参考案例':
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
 while i<len(bs):
  b=bs[i]
  if b[0]!='image':story.append(render(b));i+=1;continue
  path=(OUT/b[2]).resolve();figures.append({'caption':b[1],'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
  iw=155 if title=='互动体验与文创手作' else 185
  im=PILImage.open(path);left=[Image(str(path),width=iw,height=iw*im.height/im.width),para(b[1],'cap')];rw=CW-iw-20
  maxh=sum(estimate(f,iw) for f in left);right=[];j=i+1;rh=0
  while j<len(bs) and bs[j][0] not in ['image','table']:
   f=render(bs[j],rw);fh=estimate(f,rw)
   if rh+fh>maxh+12:break
   right.append(f);rh+=fh;j+=1
  if right and bs[j-1][0]=='h':right.pop();j-=1
  t=Table([[left,right]],colWidths=[iw+20,rw],hAlign='LEFT');t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(0,0),20),('RIGHTPADDING',(1,0),(1,0),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]));t.spaceAfter=13;story.append(t);i=j

doc.multiBuild(story)
assert hashlib.sha256(MD.read_bytes()).hexdigest()==sourcehash
report={'markdown':str(MD),'markdown_sha256':sourcehash,'pdf':str(PDF),'pages':doc.page,'chapters':doc.entries,'figures':figures,'style_source':'tmp/pdfs/build_manual_from_md.py','styles':{k:{'font':v.fontName,'size':v.fontSize,'leading':v.leading} for k,v in S.items()}}
(TMP/'layout-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'pages':doc.page,'chapters':doc.entries,'markdown_characters':len(raw)},ensure_ascii=False))
