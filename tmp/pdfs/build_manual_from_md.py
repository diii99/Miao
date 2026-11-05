from pathlib import Path
import re, html, hashlib, json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Table, TableStyle, Image, Spacer, PageBreak, KeepTogether
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage
ROOT=Path('D:/Miao');OUT=ROOT/'output/pdf';AS=OUT/'manual-assets'
MD=OUT/'苗家亲_产品操作手册_V0.1.0.md';PDF=OUT/'苗家亲_产品操作手册_V0.1.0.pdf'
pdfmetrics.registerFont(TTFont('Yahei','C:/Windows/Fonts/msyh.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('YaheiBold','C:/Windows/Fonts/msyhbd.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('Symbols','C:/Windows/Fonts/seguisym.ttf'))
pdfmetrics.registerFontFamily('Yahei',normal='Yahei',bold='YaheiBold',italic='Yahei',boldItalic='YaheiBold')
W,H=A4;M=42;CW=W-2*M
NAVY=colors.HexColor('#173b59');TEAL=colors.HexColor('#2e777c');INK=colors.HexColor('#253d4c');GRAY=colors.HexColor('#647984');LIGHT=colors.HexColor('#edf4f6');GOLD=colors.HexColor('#b89152')
S={
'p':ParagraphStyle('body',fontName='Yahei',fontSize=10,leading=17,textColor=INK,wordWrap='CJK',spaceAfter=8),
'h':ParagraphStyle('subheading',fontName='YaheiBold',fontSize=11.5,leading=18,textColor=NAVY,wordWrap='CJK',spaceBefore=7,spaceAfter=6,keepWithNext=True),
'chapter':ParagraphStyle('chapter',fontName='YaheiBold',fontSize=22,leading=31,textColor=NAVY,wordWrap='CJK',spaceAfter=15,keepWithNext=True),
'cap':ParagraphStyle('caption',fontName='Yahei',fontSize=8,leading=12,textColor=GRAY,wordWrap='CJK',spaceBefore=7,spaceAfter=8),
'note':ParagraphStyle('note',fontName='Yahei',fontSize=9,leading=15,textColor=TEAL,wordWrap='CJK',backColor=LIGHT,borderPadding=9,spaceBefore=9,spaceAfter=16),
'small':ParagraphStyle('small',fontName='Yahei',fontSize=9,leading=15,textColor=INK,wordWrap='CJK',spaceAfter=6),
}
def para(txt,kind='p'):
 t=html.escape(txt).replace('&lt;br&gt;','<br/>').replace('&lt;br/&gt;','<br/>').replace('\n','<br/>')
 t=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',t)
 t=t.replace('✓','<font name="Symbols">✓</font>')
 return Paragraph(t,S[kind])
def pic(path,width):
 im=PILImage.open(path);return Image(str(path),width=width,height=width*im.height/im.width)
def parse(text):
 lines=text.splitlines();out=[];i=0
 while i<len(lines):
  line=lines[i].strip()
  if not line:i+=1;continue
  if line.startswith('### '):out.append(('h',line[4:]));i+=1;continue
  match=re.fullmatch(r'!\[(.*?)\]\((.*?)\)',line)
  if match:out.append(('image',match.group(1),match.group(2)));i+=1;continue
  if line.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    row=[v.strip() for v in lines[i].strip().strip('|').split('|')]
    if not all(re.fullmatch(r':?-+:?',v) for v in row):rows.append(row)
    i+=1
   out.append(('table',rows));continue
  kind='note' if line.startswith('> ') else 'p';parts=[line[2:] if kind=='note' else line];i+=1
  while i<len(lines) and lines[i].strip() and not re.match(r'^(### |!\[|\||> )',lines[i].strip()):parts.append(lines[i].strip());i+=1
  out.append((kind,'\n'.join(parts)))
 return out

def render(b,width):
 if b[0] in ['p','h','note']:return para(b[1],b[0])
 if b[0]=='table':
  rows=b[1];n=len(rows[0]);weights=([.23,.77] if n==2 else ([.21,.38,.41] if n==3 else [1/n]*n))
  t=Table([[para(v,'small') for v in row] for row in rows],colWidths=[width*v for v in weights],repeatRows=1,hAlign='LEFT')
  t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dcebee')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,-1),.4,colors.HexColor('#cfdee3')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f6f9fa')])]))
  t.spaceAfter=14;return t
 raise ValueError(b)

def estimate(flow,width):
 return flow.wrap(width,10000)[1]+flow.getSpaceBefore()+flow.getSpaceAfter()

class Manual(BaseDocTemplate):
 def __init__(self,*args,**kwargs):
  super().__init__(*args,**kwargs);self.entries=[]
 def beforeDocument(self):self.entries=[]
 def afterFlowable(self,f):
  if isinstance(f,Paragraph) and f.style.name=='chapter':
   title=f.getPlainText();key='chapter'+str(len(self.entries));self.canv.bookmarkPage(key);self.canv.addOutlineEntry(title,key,0,False);self.entries.append({'title':title,'page':self.page});
   if title!='目录':self.notify('TOCEntry',(0,title,self.page,key))

def cover(c,doc):
 c.saveState();c.setFillColor(NAVY);c.rect(0,0,W,H,fill=1,stroke=0)
 # Keep one top rule as the cover's single accent, then place the live demo address directly below it.
 c.setFillColor(GOLD);c.rect(M,H-104,64,5,fill=1,stroke=0)
 c.setFillColor(colors.white);c.setFont('YaheiBold',30);c.drawString(M,H-145,'苗家亲')
 c.setFillColor(colors.white);c.setFont('YaheiBold',30);c.drawString(M,H-180,'产品操作手册')
 c.setFillColor(colors.HexColor('#b8d8df'));c.setFont('Yahei',11);c.drawString(M,H-210,'产品体验地址:miaojiaqin.xyz')
 link_x=M+pdfmetrics.stringWidth('产品体验地址:','Yahei',11)
 c.linkURL('https://miaojiaqin.xyz',(link_x,H-213,link_x+pdfmetrics.stringWidth('miaojiaqin.xyz','Yahei',11),H-201),relative=0,thickness=0)
 c.setFont('Yahei',11);c.drawString(M,H-225,'(该产品目前以网页演示，最终形式为微信小程序)')
 c.setFont('Yahei',17);c.setFillColor(colors.HexColor('#d9e9ec'));
 for j,t in enumerate(['走进苗寨','阅读非遗','体验手作']):c.drawString(M+30,H-350-j*50,t)
 im=PILImage.open(AS/'01-home.png');iw=245;ih=iw*im.height/im.width
 c.drawImage(str(AS/'01-home.png'),W-M-iw,147,width=iw,height=ih)
 c.drawImage(str(AS/'微信.jpg'),M,110,width=110,height=110)
 c.setFont('Yahei',9);c.setFillColor(colors.HexColor('#b8d8df'));c.drawString(M,89,'手册 0.1.0  |  产品 0.1.0')
 c.bookmarkPage('cover');c.addOutlineEntry('封面','cover',0,False);c.restoreState()
def regular(c,doc):
 c.saveState();c.setFillColor(TEAL);c.rect(M,H-41,25,3,fill=1,stroke=0);c.setFont('Yahei',8.5);c.drawString(M+35,H-42,'使用指南');c.setFillColor(GRAY);c.drawRightString(W-M,H-42,'苗家亲 · 产品操作手册')
 c.setStrokeColor(colors.HexColor('#d8e4e8'));c.line(M,45,W-M,45);c.setFont('Yahei',8);c.drawString(M,29,'手册 0.1.0 · 产品 0.1.0');c.drawRightString(W-M,29,f'{doc.page:02d}');c.restoreState()

source=MD.read_text(encoding='utf-8-sig');sourcehash=hashlib.sha256(MD.read_bytes()).hexdigest()
# The Markdown is the source of truth; no legacy prose is imported or written back.
source=source.replace('黔苗行 · Miao','苗家亲').replace('黔苗行 · MIAO','苗家亲').replace('苗家亲 · Miao','苗家亲').replace('&#x20;',' ')
# Fixed page references cannot survive reflow.
source=source.replace('先按第 24 页排查','先按“常见问题”排查')
sections=re.split(r'^## ',source,flags=re.M)[1:]
doc=Manual(str(PDF),pagesize=A4,leftMargin=M,rightMargin=M,topMargin=70,bottomMargin=62,title='苗家亲 产品操作手册',author='苗家亲',subject='产品操作手册')
frame=Frame(M,62,CW,H-132,id='main',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
doc.addPageTemplates([PageTemplate(id='cover',frames=[frame],onPage=cover,autoNextPageTemplate='body'),PageTemplate(id='body',frames=[frame],onPage=regular)])
story=[Spacer(1,1),PageBreak(),Paragraph('目录',S['chapter'])]
toc=TableOfContents();toc.levelStyles=[ParagraphStyle('toc',fontName='Yahei',fontSize=10,leading=17,textColor=INK,spaceBefore=1)];story.append(toc)
figures=[]
for section in sections:
 title,_,body=section.partition('\n')
 if title.strip()=='目录':continue
 story.extend([PageBreak(),Paragraph(title.strip(),S['chapter'])]);bs=parse(body)
 if title.strip()=='炼铁工坊':
  labels={'开始一轮体验':'步骤 1 / 开始一轮体验','1 / 铸炼':'步骤 2 / 铸炼','2 / 捶打':'步骤 3 / 捶打','3 / 錾刻':'步骤 4 / 錾刻','4 / 焊接':'步骤 5 / 焊接'}
  bs=[('h',labels.get(b[1],b[1])) if b[0]=='h' else b for b in bs]
 i=0
 while i<len(bs):
  b=bs[i]
  if b[0]=='h' and title.strip()=='炼铁工坊':
   labels={'开始一轮体验':'步骤 1 / 开始一轮体验','1 / 铸炼':'步骤 2 / 铸炼','2 / 捶打':'步骤 3 / 捶打','3 / 錾刻':'步骤 4 / 錾刻','4 / 焊接':'步骤 5 / 焊接'}
   b=('h',labels.get(b[1],b[1]))
  if b[0]!='image':story.append(render(b,CW));i+=1;continue
  path=(OUT/b[2]).resolve();figures.append({'caption':b[1],'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
  iw=185;left=[pic(path,iw),para(b[1],'cap')];maxh=estimate(left[0],iw)+estimate(left[1],iw)
  right=[];rw=CW-iw-20;j=i+1;rh=0
  while j<len(bs) and bs[j][0] not in ['image','table']:
   f=render(bs[j],rw);fh=estimate(f,rw)
   if rh+fh>maxh+12:break
   right.append(f);rh+=fh;j+=1
  # Avoid leaving a subheading at the bottom of the figure column.
  if right and bs[j-1][0]=='h':right.pop();j-=1
  t=Table([[left,right]],colWidths=[iw+20,rw],hAlign='LEFT')
  t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(0,0),20),('RIGHTPADDING',(1,0),(1,0),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]));t.spaceAfter=13;story.append(t);i=j
 if title.strip()=='查看结果与演示定制':
  story.extend([PageBreak(),Paragraph('体验坊 / 玩偶',S['chapter']),para('六款三维人物模型缩小展示。'),Spacer(1,10)])
  cells=[]
  for k in range(1,7):cells.append([pic(AS/f'doll-model-{k:02d}.png',153),para(f'形象 {k:02d}','cap')])
  t=Table([cells[:3],cells[3:]],colWidths=[CW/3]*3,hAlign='LEFT')
  t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),13)]));story.append(t)
  story.extend([Spacer(1,12),para('项目现有六款三维形象，以静态视图展示造型与服饰细节。','cap')])
doc.multiBuild(story)
assert hashlib.sha256(MD.read_bytes()).hexdigest()==sourcehash,'Markdown must remain unchanged'
(ROOT/'tmp/pdfs/revised-layout-report.json').write_text(json.dumps({'markdown_sha256':sourcehash,'pages':doc.page,'chapters':doc.entries,'figures':figures,'avatar_count':6},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pdf':str(PDF),'pages':doc.page,'chapters':doc.entries},ensure_ascii=False))
