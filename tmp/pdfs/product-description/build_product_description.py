from pathlib import Path
import json, html, hashlib
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Image, Spacer, PageBreak, KeepTogether, Flowable
from PIL import Image as PILImage

ROOT=Path('D:/Miao'); TMP=ROOT/'tmp/pdfs/product-description'; OUT=ROOT/'output/pdf'
SOURCE=OUT/'苗家亲_产品操作手册_V0.1.0.pdf'
PDF=OUT/'苗家亲_产品说明书_V0.1.0.pdf'
TMP.mkdir(parents=True,exist_ok=True)
reader=PdfReader(SOURCE)
assets={}
for label,pg in [('home',4),('map',5),('story',9),('editor',12),('result',13),('wax',15),('feast',18)]:
    ims=list(reader.pages[pg-1].images)
    im=max(ims,key=lambda x:x.image.width*x.image.height).image.convert('RGB')
    path=TMP/(label+'.png');im.save(path);assets[label]=path
pdfmetrics.registerFont(TTFont('Yahei','C:/Windows/Fonts/msyh.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('YaheiBold','C:/Windows/Fonts/msyhbd.ttc',subfontIndex=0))
pdfmetrics.registerFontFamily('Yahei',normal='Yahei',bold='YaheiBold',italic='Yahei',boldItalic='YaheiBold')
W,H=A4; M=44; CW=W-2*M
NAVY=colors.HexColor('#173b59'); TEAL=colors.HexColor('#2e777c'); INK=colors.HexColor('#253d4c'); GRAY=colors.HexColor('#687d87'); PALE=colors.HexColor('#edf4f6')
styles={
'body':ParagraphStyle('body',fontName='Yahei',fontSize=10.5,leading=18,wordWrap='CJK',textColor=INK,spaceAfter=9),
'small':ParagraphStyle('small',fontName='Yahei',fontSize=9.1,leading=15,wordWrap='CJK',textColor=INK,spaceAfter=5),
'caption':ParagraphStyle('caption',fontName='Yahei',fontSize=8,leading=12,wordWrap='CJK',textColor=GRAY,spaceBefore=5,spaceAfter=9),
'h2':ParagraphStyle('h2',fontName='YaheiBold',fontSize=12,leading=19,wordWrap='CJK',textColor=NAVY,spaceBefore=6,spaceAfter=6,keepWithNext=True),
'h1':ParagraphStyle('h1',fontName='YaheiBold',fontSize=23,leading=32,wordWrap='CJK',textColor=NAVY,spaceAfter=14),
'eyebrow':ParagraphStyle('eyebrow',fontName='Yahei',fontSize=9,leading=14,textColor=TEAL,spaceAfter=5),
'lead':ParagraphStyle('lead',fontName='Yahei',fontSize=12,leading=21,wordWrap='CJK',textColor=NAVY,spaceAfter=14),
'cellhead':ParagraphStyle('cellhead',fontName='YaheiBold',fontSize=9.5,leading=16,wordWrap='CJK',textColor=NAVY,spaceAfter=0),
}
content=[]
def P(t,s='body'):
    content.append(t)
    return Paragraph(html.escape(t).replace('\n','<br/>'),styles[s])
def h(t):return P(t,'h2')
def table(rows,widths=None):
    if widths is None:widths=[CW/len(rows[0])]*len(rows[0])
    cells=[[P(v,'cellhead' if i==0 else 'small') for v in row] for i,row in enumerate(rows)]
    t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dcebee')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f6f9fa')]),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,-1),.4,colors.HexColor('#d3e1e6'))]));t.spaceAfter=12
    return t
def pic(label,width):
    im=PILImage.open(assets[label]);return Image(str(assets[label]),width=width,height=width*im.height/im.width)
def side(label,caption,items,width=165):
    left=[pic(label,width),P(caption,'caption')]
    t=Table([[left,items]],colWidths=[width+20,CW-width-20],hAlign='LEFT')
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(0,0),20),('RIGHTPADDING',(1,0),(1,0),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]));t.spaceAfter=10
    return t
story=[];sections=[]
def page(no,title,intro):
    story.append(PageBreak());sections.append((len(sections)+2,title))
    story.extend([P(f'产品说明  /  {no}','eyebrow'),P(title,'h1'),P(intro,'lead')])

# Cover is drawn in the page callback.
story.extend([Spacer(1,1)])
page('01','产品概述','苗家亲是一款以贵州苗族文化与旅行体验为主题的数字产品，通过三维向导、村寨漫游、文化阅读和互动手作，帮助使用者认识苗乡文化。')
story.append(table([
['项目','说明'],
['产品名称与版本','苗家亲  V0.1.0'],
['产品形态','当前为网页演示；目标形态为微信小程序。'],
['体验入口','miaojiaqin.xyz（原操作手册列示地址）'],
['适用对象','文化体验者、首次访问者、讲解人员与产品演示人员。'],
['访问方式','通过浏览器访问；手册覆盖功能无需注册或登录。'],
['核心内容规模','四个主入口、21 篇文化故事、六项互动体验、四类手作体验。'],
],[112,CW-112]))
story.extend([h('产品价值'),P('以“看场景、读故事、做体验”连接文化认知与参与过程。使用者可以从具体地标或感兴趣的技艺出发，观察服饰与建筑细节，阅读文化背景与资料来源，再通过小游戏或手作预览形成更直观的认识。'),h('阅读导航')])
story.append(table([
['章节','页码','章节','页码'],
['产品概述','02','文化生活互动','07'],
['功能体系','03','手作与作品预览','08'],
['数字向导与苗寨漫游','04','定制展示与延展','09'],
['苗乡文化档案','05','运行条件与版本边界','10'],
['技艺互动体验','06','访问路径与资料依据','11'],
],[188,46,188,CW-422]))

page('02','功能体系','产品以底部四个主入口组织体验，将向导交流、空间漫游、内容阅读和互动创作放在同一套浏览体系中。')
story.append(table([
['主入口','主要内容','使用者获得的体验'],
['首页','开屏视频、开场故事、三维向导纠笙、推荐问题与文字提问。','从角色与故事认识产品，围绕节日、纹样或旅行主题发起交流。'],
['地图','西江河谷三维场景、地标定位、沿路步行、光影、声音和装扮。','观察村寨空间，通过地标进入展览或互动体验。'],
['非遗','推荐故事、三类文化档案、关键词搜索、详情目录与资料来源。','了解文化背景、技艺细节和地域差异，继续查阅原始资料。'],
['体验坊','六项互动体验，以及苗绣、蜡染、银饰、玩偶四类手作。','体验文化主题玩法，制作效果预览并查看定制选项。'],
],[64,220,CW-284]))
story.extend([h('典型体验路径'),P('首页认识纠笙 → 非遗搜索“苗绣”并阅读 → 地图定位文化地标 → 体验坊完成一次互动或手作预览。此路径是体验建议，各模块可按兴趣独立进入。'),h('模块之间的连接'),P('地图中的蜡染体验、银饰体验与长桌宴体验可在弹层内进入对应互动内容。非遗故事阅读结束后，使用者可手动切换到地图或体验坊继续探索；当前没有自动串联的学习课程。'),h('统一浏览方式'),P('主页面内容区可上下滚动，底部四个入口保持可见。独立游戏页通过“返回体验坊”退出。故事详情与部分地图内容使用弹层展示，关闭后回到主页面或当前场景。'),h('内容与界面的区分'),P('顶部小程序胶囊为视觉展示。普通浏览页面与 /miniapp/ 嵌入页面具有不同的界面外壳，嵌入页面用于宿主容器接入。')])

page('03','数字向导与苗寨漫游','纠笙承担首页交流与地图人物展示；三维场景通过地标、移动和内容入口，将空间观察与文化体验联系起来。')
story.append(side('map','图 1  苗寨漫游界面\n原操作手册第 5 页',[
h('首页向导纠笙'),P('首页以“蝴蝶妈妈的故事”引导开场，支持查看三维人物、选择推荐问题或输入文字提问。问题覆盖节日故事、纹样寓意和苗寨路线等主题。','small'),P('在线请求失败时使用本地预置回复。对话支持收起和再次打开，回答较长时可在对话区域内滚动阅读。','small'),h('三维场景与视角'),P('场景名称为“西江 · 河谷千户”，提供俯视漫游、宏观全景、拍照打卡三种视角，以及晨曦、晴日、晚霞、千户夜景四种光影和声音开关。','small'),h('定位与到达'),P('选中地标后镜头转向目标；“沿路步行前往”驱动角色沿场景道路移动，抵达后出现对应体验入口。使用者可通过摇杆、道路点击或键盘控制移动。','small'),P('“拍照打卡”用于近景构图与欣赏；手册未将照片保存或分享列为该功能。','small'),],165))
story.extend([h('地标承载的文化内容'),P('芦笙广场提供芦笙三维细节展示；苗绣展览呈现展览简介；西江苗族博物馆提供非遗全览条目；观景台切换观景视角；蜡染、银饰和长桌宴地标连接对应互动体验。'),h('六套向导预设装扮'),P('盛装银冠·霁蓝、百褶盛服·黛青、姊妹欢聚·绯红、蓝靛古风·藏青、锦绣花袄·翠绿、银花飞歌·紫罗。装扮切换影响本次地图展示。','small'),P('地图包含空间示意，适合文化浏览与体验，不作为实地导航或实时景区服务的依据。','small')])

page('04','苗乡文化档案','以节日、匠作服饰、歌舞村寨三个主题组织 21 篇故事，支持从关键词检索到文化阅读，再到资料查阅。')
story.append(table([
['分类','数量','收录故事'],
['民族节日','10 篇','姊妹节、鼓藏节、苗年、四月八、吃新节、跳花节、芦笙节、赶秋节、招龙节、龙船节。'],
['匠作与服饰','6 篇','银饰锻制、苗族蜡染、苗族服饰、苗绣、苗族剪纸、芦笙制作。'],
['歌舞与村寨','5 篇','芦笙舞、苗族飞歌、苗族古歌、西江千户苗寨、吊脚楼。'],
],[89,52,CW-141]))
story.append(side('story','图 2  文化故事详情\n原操作手册第 9 页',[
h('检索与分类浏览'),P('推荐卡片提供直接入口；三组主题卡片支持横向浏览和分类列表。关键词可匹配正文，在档案页选择分类后，搜索仅在该分类内生效。','small'),h('分层阅读'),P('故事展示地域、文化类别与收录说明。“文化故事”介绍生活背景，“看懂门道”引导观察细节，“查阅来源”定位到文末资料区。','small'),h('来源可追溯'),P('“资料与延伸阅读”列出具体来源标题，点击后打开外部资料页面。文化故事档案包含技艺、节俗和村寨内容；不能仅因收录在“非遗”入口，就将所有条目等同于同一级别的官方非遗项目。','small'),h('建议阅读路线'),P('初识苗乡：姊妹节 → 苗族服饰 → 西江千户苗寨。\n理解手作：苗族剪纸 → 苗绣 → 苗族蜡染 → 银饰锻制。\n认识歌舞：芦笙制作 → 芦笙舞 → 苗族飞歌 → 苗族古歌。','small'),],148))

page('05','技艺互动体验','蜡染与银饰主题把工序转化为可操作的数字体验，通过过程状态和结果反馈帮助使用者认识技艺环节。')
story.append(side('wax','图 3  蜡染三维工坊\n原操作手册第 15 页',[
h('蜡染三维工坊'),P('以铜蜡刀、蜡炉、绘蜡台、靛蓝缸和晾布竹架构成三维工坊，可切换观察区域。体验串联温蜡、蘸蜡、绘制、入染、氧化和成品鉴赏。','small'),h('绘制与过程反馈'),P('支持纹样临摹和自由绘制，可选择笔宽、调整底稿显示、撤销或清空。成品留白根据实际绘制笔迹形成。','small'),P('温度、蜡量与工序进度影响下一环节是否可进入；绘制至少六笔后才可封蜡入染，浸染和氧化均需达到完成状态。','small'),h('体验结果'),P('完成后展示本次蜡染成品，让使用者观察落蜡笔迹与染色结果之间的关系。地图“蜡染体验”和体验坊“蜡染”均可进入。','small'),],140))
story.extend([h('银饰锻制主题体验'),P('体验坊卡片名称为“炼铁”，打开后的实际主题是“锻 · 千锤成银”，地图“银饰体验”也可进入。其内容围绕银饰工序展开。')])
story.append(table([
['工序','数字交互','工序','数字交互'],
['铸炼','控制升温与降温','捶打','判断指针时机完成八锤'],
['錾刻','沿刀路拖动描线','焊接','逐个加热银饰接点'],
['编结','拖动银件完成拼装','洗涤','擦拭至光泽槽填满'],
],[54,195,54,CW-303]))
story.append(P('各环节先介绍玩法，再给出结果反馈；完成后可查看总结果并重玩。辅助跳过按 75 分计入，该数值是游戏规则，不代表真实工艺水平。','small'))

page('06','文化生活互动','另外四项体验覆盖饮食、宴席、休闲游戏和语言练习。六项体验分别采用不同的交互规则，不共用一套通关方式。')
story.append(side('feast','图 4  长桌宴数字展览\n原操作手册第 18 页',[
h('红酸汤体验坊'),P('围绕选料、捣碎、调味、搅拌、装坛、封坛、发酵和开坛组织分步动画。主料为毛辣果和红辣椒，木姜子与甜酒为可选配料。','small'),P('发酵通过主动拖动时间轴展示颜色、气泡与阶段说明；完成后查看本次结果与图鉴。属于制作过程的数字演示。','small'),h('长桌宴游览'),P('以十二席串联寨门到篝火的浏览过程。使用者滑动游席、点击器皿或图像查看展签，阅读“这一席”和“苗家讲究”。','small'),P('这是可交互数字展览，没有通关分数。内容包含迎宾米酒、酸汤鱼、五彩糯米饭、手打糍粑和篝火歌堂等风物。','small'),h('苗语传承'),P('界面标注“东部方言”，入门、进阶、挑战分别围绕数字、称谓与感谢、简短句子展开，每组四题。支持播放、四选一作答、答案解释与词汇来源查询。','small'),P('声音由汉字注音合成朗读，属于辅助体验，不应视为母语者标准发音录音。','small'),],150))
story.extend([h('苗家消消乐'),P('通过交换相邻好物形成横向或纵向三个及以上同类消除，并在限定步数内完成收集目标。界面分别显示剩余步数、收集目标和得分。')])
story.append(table([
['难度','棋盘','可用步数','收集目标'],
['轻松游玩','6×6','24','18 份'],
['适中挑战','7×7','20','24 份'],
['高手试炼','8×8','18','32 份'],
],[160,100,100,CW-360]))
story.append(P('消消乐以收集数量判断目标完成情况，连消影响得分。切换难度会重新开局；苗语切换难度同样会重置本组进度。','small'))

page('07','手作与作品预览','体验坊下半部提供四类手作体验。使用者选择风格、上传图片并查看作品预览，再根据兴趣进入定制选项。')
story.append(table([
['手作类型','可选风格','当前结果形态'],
['苗绣','花鸟绣纹、几何挑花','二维效果图'],
['蜡染','蓝靛花鸟纹、冰纹留白','二维效果图'],
['银饰','双龙纹、花鸟錾刻','二维效果图'],
['玩偶','银冠盛装、百褶舞装','按风格选择的预设三维人物'],
],[65,208,CW-273]))
story.append(side('result','图 5  手作效果预览\n原操作手册第 13 页',[
h('输入与制作过程'),P('先选择风格，再从设备文件、相册或拍照入口选取图片。成功后显示输入预览，可继续生成当前工艺的效果。','small'),P('切换风格、更换图片或重新制作会清除已有结果，需要重新生成；“重新做一件”会回到工艺选择并清空输入。','small'),h('三维玩偶的展示方式'),P('玩偶使用可拖动旋转的预设人物，按银冠或百褶风格展示。项目另有六款三维形象供造型展示；这与“上传任意照片生成全新三维模型”是不同能力。','small'),h('预览与成品的关系'),P('二维效果图和预设三维人物用于表现样式及体验定制流程。预览不构成实物材质、色彩、生产精度或交付效果的承诺。','small'),h('与技艺小游戏的关系'),P('蜡染小游戏强调绘蜡和染色过程，蜡染手作强调上传图片后的风格预览；银饰小游戏与银饰手作也分别承担工序体验和作品预览的作用。','small'),],150))

page('08','定制展示与延展','当前版本展示从作品预览到商品规格选择、金额查看和提交反馈的定制流程，可用于解释文创产品的体验方式。')
story.extend([h('定制流程'),P('完成预览 → 打开“定制这件手作”或“下单打印实体玩偶” → 选择产品卡片 → 查看尺寸与合计金额 → 提交 → 显示短暂的成功演示状态。'),h('手册中的演示商品')])
story.append(table([
['商品','页面显示规格','演示金额'],
['蜡染方巾','35×35 cm','¥68'],
['纹样帆布袋','38×42 cm','¥158'],
['苗绣装饰画','40×60 cm','¥198'],
['3D 苗族人物玩偶','15 cm · 全彩树脂','¥298'],
['3D 苗族人物玩偶收藏版','20 cm · 全彩树脂','¥468'],
],[200,205,CW-405]))
story.extend([h('当前商业化边界'),P('上述价格和规格为操作手册记录的页面演示数据。“下单成功”是交互反馈，不据此确认真实订单、支付完成、生产安排或物流履约，也不作为正式报价。'),h('可用于产品演示的场景'),P('文化讲解时，可先介绍纹样或工艺背景，再让体验者选择风格并查看预览；文创沟通时，可用商品卡片说明图案与载体的组合关系，以及规格、金额和提交步骤。'),h('手册提出的后续方向'),P('后续可按景区需求增加文化内容、按商家需求调整样式，尝试更多三维展示；地图可结合实际景区地图完善建模，并探索班次或演出场次信息。以上属于延展方向，不列入 V0.1.0 已有能力。'),h('正式业务接入的前提'),P('如需将演示转为真实交易，应另行明确订单、支付、生产、配送与售后流程，以及图片上传后的处理和保留规则。这些内容需要独立的业务与技术确认。','small')])

page('09','运行条件与版本边界','当前版本以浏览器演示为主，三维资源、在线问答和语音播放对网络、浏览器能力及设备状态有不同依赖。')
story.append(table([
['项目','使用条件与说明'],
['设备与输入','手机竖屏适合浏览内容；电脑支持鼠标与键盘，地图可使用 W/A/S/D、方向键等进行移动。'],
['浏览器与三维','可使用 Chrome、Edge、Firefox 等浏览器；三维显示需要 WebGL 支持，出现黑屏或卡顿时检查硬件加速。'],
['网络与资源','首次加载需保持网络连接。模型加载期间部分按钮不可用；出现加载错误可重新加载。'],
['在线交流','纠笙的在线服务不可用时会使用本地预置回复，回复较短或相似不代表在线服务正常。'],
['声音能力','场景音效需主动开启；苗语播放依赖设备音量和浏览器语音合成能力。'],
['账号与数据','手册覆盖功能无需注册或登录；不据此推定具备账号同步、跨设备保存或作品云端存储。'],
],[105,CW-105]))
story.extend([h('体验时需注意的状态'),P('普通页面冷启动会先播放开屏，结束后进入首页，再从底部导航切换目标模块。故事详情打开时，底部导航暂不可操作；先关闭详情再切换。游戏进度与作品预览可能因重置、切换难度或更换素材而清空。'),h('已记录的显示问题'),P('原手册在 440×956 窗口记录了定制提交被底部导航遮挡的情况。电脑可尝试用 Tab 聚焦提交按钮后按 Enter；手机无法完成时可退出该演示。该现象不代表支付失败。'),h('功能适用范围'),P('地图用于文化体验并含空间示意；工坊与红酸汤是过程模拟；苗语声音为注音合成；手作定制为演示流程。这些功能分别服务于浏览、理解和体验，不能替代实地导航、线下技艺教学、标准语音材料或真实交易凭证。'),P('发布形态、实际景区数据、实时服务、正式交易及素材数据管理等如有新增，应随版本更新另行说明。','small')])

page('10','访问路径与资料依据','普通页面供浏览器体验；嵌入页面供宿主容器使用。路径名称和入口文案保留现有手册中的对应关系。')
story.append(table([
['普通页面','站内路径'],
['首页 / 地图','/  /map'],
['非遗 / 兼容入口','/heritage  /culture'],
['体验坊','/workshop'],
['六项互动体验','/games/xiaoxiaole  /games/hongsuantang\n/games/silver  /games/wax-dye\n/games/miao-feast  /games/miao-language'],
],[130,CW-130]))
story.extend([h('嵌入页面'),P('人物及场景：/miniapp/home、/miniapp/map、/miniapp/avatar。\n游戏：在 /miniapp/games/ 后分别使用 hongsuantang、miao-feast、silver、xiaoxiaole、miao-language。\n蜡染嵌入页为 /miniapp/games/batik，与普通页的 wax-dye 不同。','small'),P('嵌入页面可能不包含普通页面的顶栏、底部四个入口或返回按钮，需结合宿主容器的导航使用。','small'),h('资料对应表')])
story.append(table([
['本说明书内容','原操作手册页码'],
['产品概述与功能结构 / 向导与地图','第 1 至 7 页、第 11 页'],
['文化档案 / 手作、玩偶与定制','第 8 至 14 页'],
['六项互动体验 / 运行问题与路径','第 15 至 22 页'],
],[CW-142,142]))
story.append(P('编制依据：《苗家亲 产品操作手册》V0.1.0，共 22 页。\n来源文件：苗家亲_产品操作手册_V0.1.0.pdf。\n说明书版本：V0.1.0；编制日期：2026 年 9 月 13 日。图 1 至图 5 及封面界面取自原操作手册。','caption'))

class ProductDoc(SimpleDocTemplate):
    def afterFlowable(self,f):
        if isinstance(f,Paragraph) and f.style.name=='h1':
            key='p'+str(self.page);self.canv.bookmarkPage(key);self.canv.addOutlineEntry(f.getPlainText(),key,0,False)

def paint(c,doc):
    c.saveState()
    if doc.page==1:
        c.setFillColor(colors.black);c.setFont('YaheiBold',32);c.drawString(M,H-108,'苗家亲 产品说明书')
        c.setFont('Yahei',13);c.setFillColor(NAVY);c.drawString(M,H-142,'贵州苗族文化与旅行体验数字产品')
        c.setFont('Yahei',10);c.setFillColor(GRAY);c.drawString(M,H-174,'产品版本 V0.1.0     文档版本 V0.1.0')
        c.drawString(M,H-193,'2026 年 9 月 13 日')
        c.setFont('Yahei',12);c.setFillColor(INK)
        c.drawString(M,H-245,'认识纠笙，走进苗寨，阅读文化故事，参与互动手作。')
        labels=[('home','向导交流'),('map','苗寨漫游'),('story','文化阅读')]
        iw=149;gap=(CW-iw*3)/2
        for i,(label,cap) in enumerate(labels):
            im=PILImage.open(assets[label]);ih=iw*im.height/im.width;x=M+i*(iw+gap);y=H-284-ih
            c.drawImage(str(assets[label]),x,y,width=iw,height=ih)
            c.setFillColor(TEAL);c.setFont('Yahei',9);c.drawCentredString(x+iw/2,y-20,cap)
        c.setFillColor(INK);c.setFont('Yahei',10);c.drawString(M,111,'当前形态  网页演示     目标形态  微信小程序')
        c.setFillColor(GRAY);c.setFont('Yahei',9);c.drawString(M,88,'体验地址  miaojiaqin.xyz')
        c.drawString(M,47,'苗家亲  |  产品功能与应用说明')
        c.bookmarkPage('cover');c.addOutlineEntry('封面','cover',0,False)
    else:
        c.setFillColor(GRAY);c.setFont('Yahei',8);c.drawString(M,H-35,'苗家亲  /  产品说明书');c.drawRightString(W-M,H-35,'V0.1.0')
        c.setStrokeColor(colors.HexColor('#d7e3e7'));c.setLineWidth(.45);c.line(M,45,W-M,45)
        c.setFont('Yahei',8);c.drawString(M,29,'贵州苗族文化与旅行体验');c.drawRightString(W-M,29,f'{doc.page:02d}')
    c.restoreState()

doc=ProductDoc(str(PDF),pagesize=A4,leftMargin=M,rightMargin=M,topMargin=65,bottomMargin=61,title='苗家亲 产品说明书 V0.1.0',author='苗家亲',subject='产品定位、功能体系、应用场景与版本边界')
doc.build(story,onFirstPage=paint,onLaterPages=paint)
(TMP/'authored-text.txt').write_text('\n\n'.join(content),encoding='utf-8')
meta={'source':str(SOURCE),'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'output':str(PDF),'pages':len(PdfReader(PDF).pages),'chapters':sections}
(TMP/'build-report.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(meta,ensure_ascii=False))
