import sistersFestivalImage from '../assets/heritage/sisters-festival.jpg'
import batikArtisanImage from '../assets/heritage/batik-artisan.jpg'
import xijiangStiltHousesImage from '../assets/heritage/xijiang-stilt-houses.jpg'
import guzangFestivalImage from '../assets/heritage/guzang-festival.jpg'
import miaoNewYearImage from '../assets/heritage/miao-new-year.jpg'
import aprilEightImage from '../assets/heritage/april-eight.jpg'
import newRiceFestivalImage from '../assets/heritage/new-rice-festival.jpg'
import flowerJumpingImage from '../assets/heritage/flower-jumping.jpg'
import lushengFestivalImage from '../assets/heritage/lusheng-festival.jpg'
import ganqiuFestivalImage from '../assets/heritage/ganqiu-festival.jpg'
import dragonRitualImage from '../assets/heritage/dragon-ritual.jpg'
import miaoDragonBoatImage from '../assets/heritage/miao-dragon-boat.jpg'
import silverSmithImage from '../assets/heritage/silver-smith.jpg'
import miaoDressImage from '../assets/heritage/miao-dress.jpg'
import lushengDanceImage from '../assets/heritage/lusheng-dance.jpg'
import flyingSongImage from '../assets/heritage/flying-song.jpg'
import xijiangDawnImage from '../assets/heritage/xijiang-dawn.jpg'

export type HeritageStory = {
  id: string
  name: string
  group: '民族节日' | '匠作与服饰' | '歌舞与村寨'
  note: string
  image: string
  imagePosition?: string
  imageNote?: string
  tag: string
  body: string[]
  region: string
  category: string
  officialName?: string
  recognition?: string
  listedYear?: number
  projectNumber?: string
  sections: { title: string; text: string }[]
  observe: string[]
  etiquette: string[]
  sources: { title: string; url: string }[]
}

export const heritageResearchDate = '2026-09-09'

// Recognition metadata always refers to the named local record, not every regional variant.
export const heritageStories: HeritageStory[] = [
  {
    id: 'sisters-festival', name: '姊妹节', group: '民族节日', note: '五彩姊妹饭 · 春日游方', image: sistersFestivalImage,
    tag: '一份姊妹饭，连起春日的相逢', region: '贵州台江 · 老屯、施洞', category: '民俗',
    officialName: '苗族姊妹节', recognition: '国家级 · 第一批', listedYear: 2006, projectNumber: 'Ⅹ-22',
    body: ['台江老屯、施洞一带的苗族姊妹节，传统节期为农历三月十五至十七。青年妇女是节日的重要参与者，吃姊妹饭、盛装踩鼓、游方对歌与走亲访友共同组成春日聚会，节日也让村寨间的亲缘与友谊得到延续。'],
    sections: [
      { title: '饭里的心意', text: '姊妹饭既是待客食物，也用于表达情意。青年男女通过相约劳作、游方对歌逐渐相识，姑娘在饭中放入信物传意。理解这些习俗，需要联系具体村寨的讲述，不能把一张“信物对照表”当成所有人的共同规则。' },
      { title: '盛装背后的手艺', text: '鼓场上绣衣、银饰与舞步一起出现。一套盛装凝聚家庭长期积累的刺绣和银工技艺；从衣袖的针路到银片的连接，都能看见节庆如何为手艺提供使用和传承的场合。' },
    ],
    observe: ['看姊妹饭如何准备、赠送和分享。', '比较绣衣的纹样、针法与银饰组合。', '听对歌双方如何轮流接唱、回应。'],
    etiquette: ['拍人物特写、录制对歌前先征得同意。', '参加踩鼓或收取食物时，跟随主人的安排。'],
    sources: [{ title: '中国非遗网 · 苗族姊妹节（台江）', url: 'https://www.ihchina.cn/art/detail/id/14964.html' }],
  },
  {
    id: 'guzang-festival', name: '鼓藏节', group: '民族节日', note: '鼓社共祀 · 家族记忆', image: guzangFestivalImage,
    tag: '木鼓连接祖先与今日的村寨', region: '贵州雷山；榕江有不同仪程', category: '民俗',
    officialName: '苗族鼓藏节', recognition: '国家级 · 雷山第一批', listedYear: 2006, projectNumber: 'Ⅹ-19',
    body: ['鼓藏节是以鼓社为单位举行的苗族祭祖活动，木鼓具有祖先的象征意义。雷山的传说把枫树、蝴蝶妈妈与人类始祖相连；这些是社区传承的信仰叙事，也为理解古歌、鼓舞和盛装提供了背景。'],
    sections: [
      { title: '不是一年一度的庆典', text: '雷山名录记录约十二年的周期，省级资料说明首尾两头数也称十三年；完整仪程可跨数年。榕江都柳江流域记录为十三年一度。地区差异与计年方式都要考虑，不能套用同一周期。' },
      { title: '谁来组织一场鼓藏', text: '“鼓藏头”协调鼓社成员，礼仪、接待和分工由社区共同完成。雷山有招龙、醒鼓、迎鼓等环节；榕江有接鼓、凿鼓、换鼓、送鼓等程序。祭祖同时维系亲属往来与共同生活的秩序。' },
    ],
    observe: ['先了解所在村寨的鼓社与节期。', '辨认木鼓在各段仪程中的作用。', '看亲友迎送、共同备宴等协作。'],
    etiquette: ['仪式是否开放、能否拍摄，以鼓社和主持人的意见为准。', '不触碰祭物、木鼓或擅自进入仪式中心。'],
    sources: [
      { title: '中国非遗网 · 苗族鼓藏节（雷山）', url: 'https://www.ihchina.cn/project_details/14960/' },
      { title: '中国非遗网 · 苗族鼓藏节（榕江，2014扩展）', url: 'https://www.ihchina.cn/project_details/14961/' },
      { title: '贵州省非遗保护中心 · 鼓藏节及计年方式', url: 'https://www.gzfwz.org.cn/xmccrml/gjml/sj/dypsy/201804/t20180416_21606388.html' },
    ],
  },
  {
    id: 'miao-new-year', name: '苗年', group: '民族节日', note: '秋收团圆 · 串寨迎新', image: miaoNewYearImage,
    tag: '随农事节律，走进苗家的新年', region: '贵州丹寨及清水江、都柳江流域', category: '民俗',
    officialName: '苗年', recognition: '国家级 · 丹寨第二批', listedYear: 2008, projectNumber: 'Ⅹ-83',
    body: ['苗年是苗族重要的岁时节庆，通常在秋收完成、一年的农活告一段落后举行。节日包含祭祖、团年、庆收获与走村串寨；不同支系和村寨依当地历法安排日期，并没有全体苗族统一的一天。'],
    sections: [
      { title: '从一家团年到村寨相聚', text: '备年食、打糯米粑、吃团年饭之后，亲友互相拜访。芦笙舞、苗歌与串寨活动把一家人的年延伸到整个社区；在一些地区，邻寨会协调节期，方便彼此轮流做客。' },
      { title: '在年节里学习传统', text: '孩子跟着长辈准备食物、认亲访友，年轻人练歌、练笙、整理盛装。苗年的传承也在厨房、家祭和待客的细节中。丹寨不同支系的礼俗各有特点，旅行前应核实具体村寨安排。' },
    ],
    observe: ['认识糯米粑、年饭等食物的制作。', '听主人讲述本寨如何选择过年日子。', '看芦笙队与走亲队伍的组织方式。'],
    etiquette: ['拜访民居先打招呼，家祭时遵从主人安排。', '饮酒和共舞均可按个人意愿参与，礼貌表达即可。'],
    sources: [{ title: '中国非遗网 · 苗年（丹寨）', url: 'https://www.ihchina.cn/project_details/15118' }],
  },
  {
    id: 'april-eight', name: '四月八', group: '民族节日', note: '春日歌场 · 地方记忆', image: aprilEightImage,
    tag: '同一个节名，多种地方传统', region: '贵州花溪、黄平等地；湘西作对照', category: '民俗', recognition: '苗族地方节俗 · 按地区辨读',
    body: ['农历四月初八是许多苗族社区聚会的日子。人们以歌舞、盛装与相互拜访延续地方记忆，但各地起源传说和活动组合并不相同。“亚努节”、姑娘节等称呼都有具体地域背景，不宜视为贵州每个村寨的统一名称。'],
    sections: [
      { title: '贵州的节日现场', text: '花溪高坡的公开活动记录包含榜郎古歌、刺绣展演和地方体育习俗。观看时可以把重点放在本地歌声与服饰，听社区讲述自己的“四月八”，而不是仅按大型节庆表演的节目单理解传统。' },
      { title: '名录也要分清地域', text: '国家级名录中的“苗族四月八”记录为湖南吉首2011年扩展项目；“苗族四月八姑娘节”为湖南绥宁2008年项目。它们可帮助比较地方差异，但不能直接作为贵州同名节俗的入选证明。' },
    ],
    observe: ['留意当地如何称呼节日、讲述来历。', '听苗歌是独唱、对唱还是集体演唱。', '比较本地盛装与其他地区的差别。'],
    etiquette: ['先询问歌场和传统活动的参与规则。', '不要求表演者重复私人或仪式性内容供拍照。'],
    sources: [
      { title: '贵州省非遗保护中心 · 花溪四月八活动', url: 'https://www.gzfwz.org.cn/xwdt/sjysdt/201804/t20180416_21604676.html' },
      { title: '中国非遗网 · 苗族四月八（吉首）', url: 'https://www.ihchina.cn/project_details/15099/' },
      { title: '中国非遗网 · 苗族四月八姑娘节（绥宁）', url: 'https://www.ihchina.cn/project_details/15098/' },
    ],
  },
  {
    id: 'new-rice-festival', name: '吃新节', group: '民族节日', note: '敬祖尝新 · 祈愿丰收', image: newRiceFestivalImage,
    tag: '从一碗米饭读懂稻作生活', region: '贵州丹寨、台江', category: '民俗', officialName: '苗族吃新节', recognition: '贵州省级 · 第五批相关项目',
    body: ['苗族吃新节把稻作、敬祖和村寨交往联系起来。节前准备米饭与酒，节日先敬祖，再与亲友分享食物，以歌舞表达对丰年的期盼。丹寨、台江各村寨择日不同，不能把吃新节简单固定在同一农历日期。'],
    sections: [
      { title: '先敬后尝的顺序', text: '丹寨的地方记录中，主人将酒、饭、鱼等摆上祭桌，念祭词，以少量糯米饭和酒敬祖，然后共食。食物由此同时承载劳动所得、祖先记忆和待客情谊。' },
      { title: '各寨有各寨的时间', text: '丹寨排脚寨传统选择农历七月的特定卯日，排倒、排莫等寨另有九月寅日习俗。台江的踩鼓、芦笙、游方与竞技活动也有地方差别；这些记录说明地方节律，实际出行仍需确认当年安排。' },
    ],
    observe: ['观察新米、鱼和酒如何准备与分享。', '请主人解释当地择日与农事的关系。', '留意芦笙、踩鼓和游方各在何时进行。'],
    etiquette: ['未受邀不进入家祭区域或先取祭桌食物。', '尊重主人饮食习惯，参加宴席避免浪费。'],
    sources: [{ title: '贵州省非遗保护中心 · 苗族吃新节（丹寨、台江）', url: 'https://www.gzfwz.org.cn/xmccrml/gjml/sj/dwpsy/202206/t20220628_75322567.html' }],
  },
  {
    id: 'flower-jumping', name: '跳花节', group: '民族节日', note: '正月花坡 · 芦笙相会', image: flowerJumpingImage,
    tag: '围着花树，迎接春天', region: '贵州安顺 · 以瓦窑村为例', category: '民俗', officialName: '苗族跳花节',
    recognition: '国家级 · 第二批', listedYear: 2008, projectNumber: 'Ⅹ-76',
    body: ['安顺苗族跳花节以花坡为聚会空间，寄托风调雨顺与生活兴旺的愿望。瓦窑村传统在农历正月初七至初九举行。人们从周边村寨赶来，吹芦笙、相互结识，也把家中的绣品和盛装带到花场。'],
    sections: [
      { title: '花树是节日的中心', text: '当地记录描述，节前由寨老主持，用常绿枝叶组成花树，送上山坡；节期结束后还有接花树的习俗。花树连接社区祈愿和家户生活，其意义不能仅理解成装饰或竞技器材。' },
      { title: '读懂地方版本', text: '安顺的芦笙、背扇和花树仪式具有自身特点。其他地方也有跳花、踩花山、跳月等名称相近的活动，但节期和程序并非完全相同。这里的名录信息仅对应安顺这一申报地区。' },
    ],
    observe: ['辨认花树的位置及其仪式作用。', '看背扇、银饰与绣花如何用于节日装束。', '跟随芦笙节拍观察行进与舞步。'],
    etiquette: ['不擅自攀爬、触碰或移动花树。', '观看时给吹笙者和队伍留出通道。'],
    sources: [{ title: '中国非遗网 · 苗族跳花节（安顺）', url: 'https://www.ihchina.cn/project_details/15097.html' }],
  },
  {
    id: 'lusheng-festival', name: '芦笙节', group: '民族节日', note: '舟溪笙堂 · 宾主共舞', image: lushengFestivalImage,
    tag: '以甘囊香为例，听村寨相聚', region: '贵州凯里 · 舟溪', category: '民俗', officialName: '甘囊香苗族芦笙节', recognition: '贵州省级 · 第二批相关项目',
    body: ['“芦笙节”是多地节会的通称，这里介绍凯里舟溪的甘囊香苗族芦笙节。传统节期从农历正月十五延续至二十一，以芦笙堂为中心，吹笙、起舞、对歌和待客共同组成村寨间的年度交往。'],
    sections: [
      { title: '从起堂到宾主共舞', text: '当地传统记载有祭碑、起堂和宾主共舞等环节。起堂意味着节会开始，随后不同村寨的芦笙队和盛装人群汇聚。了解这些顺序，才能看见热闹场面背后的组织与礼仪。' },
      { title: '一场节会，许多手艺', text: '芦笙制作、吹奏、舞步、绣衣和银饰都在节会上被使用。对歌也是交往方式之一，歌词表达生活感受和愿望。芦笙节因此既是庆祝，也是许多技艺共同延续的文化场所。' },
    ],
    observe: ['留意芦笙队进入笙堂的次序。', '比较不同队伍的乐器尺寸与音色。', '观察舞步如何配合音乐换句。'],
    etiquette: ['是否入圈共舞先询问带队者。', '不穿越正在行进的队伍，不触碰他人的芦笙。'],
    sources: [{ title: '贵州省非遗保护中心 · 甘囊香苗族芦笙节', url: 'https://www.gzfwz.org.cn/xmccrml/gjml/sj/depsy/201804/t20180416_21606414.html' }],
  },
  {
    id: 'ganqiu-festival', name: '赶秋节', group: '民族节日', note: '立秋赶场 · 湘西与黔东北', image: ganqiuFestivalImage,
    tag: '读懂节气里的苗族聚会', region: '湖南花垣为代表；贵州松桃亦有流传', category: '民俗',
    officialName: '农历二十四节气（苗族赶秋）', recognition: '国家级 · 花垣第四批扩展', listedYear: 2014, projectNumber: 'Ⅹ-68',
    body: ['苗族赶秋在立秋时节举行，兼有庆祝丰收在望、祭祖和青年交往的意义。代表性名录记录来自湖南花垣，贵州松桃等相邻苗族地区也有流传。从黔东北到湘西，赶秋也展现了相邻苗族社区之间的文化联系。'],
    sections: [
      { title: '秋场上的声音与动作', text: '苗鼓、山歌、传统舞蹈与“八人秋”等游艺构成秋场。迎宾、祭祖和娱乐各有位置，参与者在集体活动中分享生活消息、亲友感情和对收成的期待。' },
      { title: '传说与名录的边界', text: '当地流传“秋公、秋婆”等故事，解释赶秋与爱情、平安生活的联系，宜作为民间传说理解。所列国家级编号属于花垣的节气扩展项目，不能据此推定所有同名活动具有相同认定。' },
    ],
    observe: ['分辨苗鼓、歌场和秋千的活动区域。', '听当地人讲秋公、秋婆的不同故事。', '比较立秋节会与贵州秋收节俗。'],
    etiquette: ['游艺按现场规则参与，不擅自使用大型秋千。', '拍摄祭祖和人物前征求同意。'],
    sources: [{ title: '中国非遗网 · 农历二十四节气（苗族赶秋）', url: 'https://www.ihchina.cn/art/detail/id/15065.html' }],
  },
  {
    id: 'dragon-ritual', name: '招龙节', group: '民族节日', note: '鼓藏仪程 · 山林祈愿', image: dragonRitualImage,
    tag: '在地方仪式中理解人与山林', region: '贵州雷山 · 鼓藏节相关习俗', category: '民俗', recognition: '鼓藏节相关仪程 · 非独立国家级项目',
    body: ['“招龙”在雷山部分苗寨的鼓藏节中是重要仪程，寄托村寨平安、人畜兴旺与庄稼丰收的愿望。它与祖先、神树和山林的地方信仰联系紧密。本条介绍这一环节，不将“招龙节”另算为独立国家级非遗项目。'],
    sections: [
      { title: '从神树到村寨', text: '雷山的地方记录中，鼓社成员在枫香神树附近聚集，由鼓藏头和祭师主持祈告、讲述家族记忆，再沿山路返回村寨。芦笙、纸旗等物件进入仪程，必须放在当地礼俗背景中理解。' },
      { title: '祈愿也是共同参与', text: '相关记录还写到族人在山中植树、回到迎龙场踩鼓跳笙。山林、田土与人的生活并不分开；了解招龙，可以从社区怎样协作、怎样照看共同环境入手。各寨实践与节期仍需当地确认。' },
    ],
    observe: ['听主持人或讲解者解释仪式顺序。', '留意神树、迎龙场与村寨的空间关系。', '观察共同准备、植树与迎送等活动。'],
    etiquette: ['进入山林祭祀空间前询问当地人。', '不移动纸旗、供物，不模仿祭词或打断仪程。'],
    sources: [{ title: '贵州省非遗保护中心 · 鼓藏节及招龙仪程', url: 'https://www.gzfwz.org.cn/xmccrml/gjml/sj/dypsy/201804/t20180416_21606388.html' }],
  },
  {
    id: 'dragon-boat', name: '龙船节', group: '民族节日', note: '独木龙舟 · 清水江相会', image: miaoDragonBoatImage,
    tag: '鼓点把整条龙舟连在一起', region: '贵州台江、施秉 · 清水江与巴拉河沿岸', category: '民俗',
    officialName: '苗族独木龙舟节', recognition: '国家级 · 第二批', listedYear: 2008, projectNumber: 'Ⅹ-75',
    body: ['台江苗族独木龙舟节传统在农历五月二十四至二十七举行。清水江、巴拉河沿岸村寨相聚，迎舟、竞渡和待客一起构成节日。名录记载的施洞塘坝河段，是代表性的节会场所。'],
    sections: [
      { title: '为什么叫独木龙舟', text: '传统船体由三根大杉木分别凿空，再组成一条长舟。造船、备舟需要木工经验和集体协作，船既是竞渡工具，也承载当地关于水、丰年和平安的礼俗观念。' },
      { title: '鼓、锣与桡手', text: '船上的鼓点与锣声组织桨手动作，鼓主等角色负责节会协调。岸边亲友迎接队伍、准备食物，水上竞渡与岸上的往来共同构成节日，不能只把它理解成体育比赛。' },
    ],
    observe: ['在岸上观察三根独木组成的船体。', '听鼓锣节奏如何配合划桨。', '留意迎舟、待客与赛舟的先后关系。'],
    etiquette: ['在指定岸段观看，留出靠岸和搬舟通道。', '未经允许不上船、不触碰龙头及礼仪用品。'],
    sources: [{ title: '中国非遗网 · 苗族独木龙舟节（台江）', url: 'https://www.ihchina.cn/project_details/15096/' }],
  },
  {
    id: 'silverwork', name: '银饰锻制', group: '匠作与服饰', note: '锤錾拉丝 · 小件成冠', image: silverSmithImage,
    tag: '银光背后，是设计与手的配合', region: '贵州雷山 · 控拜、麻料、乌高等村寨', category: '传统技艺',
    officialName: '苗族银饰锻制技艺', recognition: '国家级 · 雷山第一批', listedYear: 2006, projectNumber: 'Ⅷ-40',
    body: ['苗族银饰从头饰、颈饰到胸饰、手饰，相互配合形成盛装。雷山西江一带的银匠以家庭作坊传承手艺，将银料加工成片、丝和小饰件，再组合成层次丰富的作品。纹样与穿戴方式随地区和使用场合而异。'],
    sections: [
      { title: '从银料到一朵银花', text: '熔炼、铸型、锻制、拉丝、錾刻、焊接、编结和洗涤共同构成工艺链。工匠要掌握厚薄、纹理和接合的位置；复杂冠帽由许多小件组成，单看成品的大小并不能判断手工难度。' },
      { title: '饰物也是地方表达', text: '花鸟、蝶与龙等题材进入银饰，既装点身体，也与地方审美、祝福和礼俗有关。学习时可从一个银片的线条、一个接头的处理看起，再听制作者解释作品用于什么人、什么场合。' },
    ],
    observe: ['比较锤出的银片与拉出的银丝。', '观察錾纹的深浅和小部件的连接。', '请匠师说明手工作品的工序与用料。'],
    etiquette: ['靠近炉火、工具和作品前先询问。', '试戴由主人协助，避免拉扯细链和活动饰件。'],
    sources: [
      { title: '中国非遗网 · 苗族银饰锻制技艺（雷山）', url: 'https://www.ihchina.cn/project_details/14331/' },
      { title: '中国非遗网 · 代表性传承人杨光宾', url: 'https://www.ihchina.cn/ccr_detail/3014' },
    ],
  },
  {
    id: 'batik', name: '苗族蜡染', group: '匠作与服饰', note: '铜刀点蜡 · 蓝靛留白', image: batikArtisanImage,
    tag: '先留住白，再染出蓝', region: '贵州丹寨 · 本条聚焦丹寨苗族蜡染', category: '传统技艺',
    officialName: '苗族蜡染技艺', recognition: '国家级 · 第一批', listedYear: 2006, projectNumber: 'Ⅷ-25',
    body: ['蜡染以蜡阻挡染料进入织物，让图案在染后留白。丹寨苗族将它用于衣裙、背带和家用织物；点蜡并不是孤立的一道工序，还与植物染料、纺织、裁制和家庭传习相连。各地苗族蜡染风格应分别认识。'],
    sections: [
      { title: '一块布的变蓝过程', text: '布料整理后，以铜刀蘸熔蜡画出纹样，再反复浸入染缸、取出氧化。最后加热脱蜡、漂洗，蓝白图案显现。蜡线是否连贯、染色是否均匀，都依靠实际操作中的经验。' },
      { title: '纹样从生活中生长', text: '几何纹、花鸟和蝶等题材各有地方表达。丹寨部分作品还会在完成后补涂红、黄等颜色。学习时应向制作者了解具体纹样的称呼；相似的图案并不一定在所有支系中具有相同解释。' },
    ],
    observe: ['看铜刀如何储蜡与改变线条宽度。', '比较蜡覆盖处与未覆盖处的染色。', '观察浸染、氧化、脱蜡前后的变化。'],
    etiquette: ['热蜡与染缸由老师指导操作。', '记录或再用传统纹样时，注明来源并尊重创作者意愿。'],
    sources: [{ title: '中国非遗网 · 苗族蜡染技艺（丹寨）', url: 'https://www.ihchina.cn/project_details/14300.html' }],
  },
  {
    id: 'miao-dress', name: '苗族服饰', group: '匠作与服饰', note: '针线与银饰 · 地方身份', image: miaoDressImage,
    tag: '从一件衣裳，认识一个地方', region: '贵州台江 · 并读贵州不同服饰类型', category: '民俗',
    officialName: '苗族服饰', recognition: '国家级 · 台江第二批扩展', listedYear: 2008, projectNumber: 'Ⅹ-65',
    body: ['苗族服饰因支系、居住环境和交往范围形成多种地方样式。台江的衣饰以丰富款式和刺绣见长，常把针绣、织锦与银饰组合使用。它们既适应穿着，也通过纹样、色彩和搭配传递地方认同与礼俗信息。'],
    sections: [
      { title: '看整体，也看细部', text: '认识服饰可先看头饰、衣襟、裙装和围腰的组合，再看袖口、背部等部位的工艺。台江可见破线绣、辫绣、盘绣等针法，构图常运用对称、夸张与组合，让同一题材呈现不同层次。' },
      { title: '没有唯一的标准苗装', text: '台江、雷山、剑河与丹寨的服饰不能相互替代，日常服与节庆盛装也有区别。“穿在身上的史书”是一种形象说法，具体纹样如何解释，应结合穿戴者、制作者和当地记录。' },
    ],
    observe: ['先记下服饰来自哪个县、哪个村寨。', '区分织出来、绣出来和染出来的纹样。', '看盛装如何组合银饰与织物。'],
    etiquette: ['试穿前询问穿戴方法和适用场合。', '人物摄影先获同意，勿把私人衣饰当作公共道具。'],
    sources: [{ title: '中国非遗网 · 苗族服饰（台江）', url: 'https://www.ihchina.cn/project_details/15052.html' }],
  },
  {
    id: 'lusheng-dance', name: '芦笙舞', group: '歌舞与村寨', note: '笙声引步 · 地方舞型', image: lushengDanceImage, imagePosition: 'center 68%',
    tag: '音乐与脚步，一起组成舞蹈', region: '贵州雷山；丹寨锦鸡舞作对照', category: '传统舞蹈',
    officialName: '苗族芦笙舞', recognition: '国家级 · 雷山第二批扩展', listedYear: 2008, projectNumber: 'Ⅲ-23',
    body: ['苗族芦笙舞与节庆、祭祖和村寨聚会相连，许多舞者自吹自舞。雷山、丹寨、关岭、榕江等地各有形式，音乐、步法和场合要合起来理解。本条名录对应雷山项目，其他舞型的入选年份另有记录。'],
    sections: [
      { title: '先听节拍，再看步法', text: '芦笙舞可见走、移、跨、转等动作，乐句带动舞步与队形转换。演奏者要让呼吸、手指和脚步协调，观看时先跟住重复的节奏，更容易理解看似轻松的动作背后的训练。' },
      { title: '锦鸡舞是另一个地方例子', text: '丹寨锦鸡舞以腰膝的自然摇动和下肢步法为特点，可围圈起舞，2006年已作为具体舞型入选。它与雷山2008年的扩展记录共用项目编号，却不代表同一套舞步。' },
    ],
    observe: ['听乐句重复处如何对应转身和换步。', '看吹笙者的呼吸与步法配合。', '询问舞型名称和它通常出现的场合。'],
    etiquette: ['跟舞须由带队者示意，从简单步法学起。', '祭仪舞、竞技动作不自行模仿或打断。'],
    sources: [
      { title: '中国非遗网 · 苗族芦笙舞（雷山）', url: 'https://www.ihchina.cn/project_details/12959.html' },
      { title: '中国非遗网 · 苗族芦笙舞（锦鸡舞）', url: 'https://www.ihchina.cn/project_details/12954.html' },
    ],
  },
  {
    id: 'flying-song', name: '苗族飞歌', group: '歌舞与村寨', note: '高腔入云 · 山野应答', image: flyingSongImage,
    tag: '把生活唱给山那边的人', region: '贵州雷山；剑河革东另有风格', category: '传统音乐',
    officialName: '苗族民歌（苗族飞歌）', recognition: '国家级 · 雷山第二批', listedYear: 2008, projectNumber: 'Ⅱ-109',
    body: ['飞歌是苗族民歌中曲调高亢、情感鲜明的一类，可独唱、对唱或合唱。歌词既有传承的内容，也能根据劳作、婚嫁、待客和节庆即兴编唱。听飞歌不仅是听高音，也是在听当地人怎样用语言和旋律交流。'],
    sections: [
      { title: '声音怎样飞过山谷', text: '演唱中的长音、起伏与自由伸展让声音富有穿透感。听一段完整乐句，可以注意起句、拖腔和收尾怎样承接词义，而不是只追求最高或最长的音。' },
      { title: '雷山与革东要分别听', text: '剑河革东飞歌的名录明确记录苗语真嗓演唱、起尾句拖音等特点，2011年作为扩展项目入选。各地声腔并不完全相同，不能把一种真假声转换方式概括成所有苗族飞歌的共同规则。' },
    ],
    observe: ['听一句歌词在哪里停顿、拖长。', '比较独唱与对唱的回应方式。', '向歌者了解歌词、方言和使用场合。'],
    etiquette: ['录音、传播或改编前征求演唱者同意。', '完整听完一个段落，再提问或鼓掌。'],
    sources: [
      { title: '中国非遗网 · 苗族民歌（雷山飞歌）', url: 'https://www.ihchina.cn/project_details/12661/' },
      { title: '中国非遗网 · 苗族民歌（剑河飞歌）', url: 'https://www.ihchina.cn/project_details/12662.html' },
    ],
  },
  {
    id: 'xijiang-village', name: '西江千户苗寨', group: '歌舞与村寨', note: '白水河畔 · 生活中的传承', image: xijiangStiltHousesImage,
    tag: '非遗发生在有人生活的地方', region: '贵州雷山 · 西江镇', category: '文化空间', recognition: '苗族文化空间 · 村寨背景条目',
    body: ['西江位于雷公山麓、白水河畔，木构民居顺着山势展开。这里既有游客可进入的公共空间，也有居民持续生活的家园。村寨本身与某一项非遗技艺并不是同一个概念；本条帮助认识歌舞、手艺和礼俗所在的生活环境。'],
    sections: [
      { title: '不只看屋顶，也看空间', text: '西江历史文化名镇保护规划关注整体山水格局，以及铜鼓坪、游方场、风雨桥、古树和古井等环境要素。这些空间连接通行、相会与村寨活动，理解它们比只寻找一个观景角度更接近日常。' },
      { title: '从展示回到制作者', text: '博物馆、刺绣坊和家庭展陈能提供不同的认识入口。看一件衣饰或木构时，可继续询问它由谁制作、如何使用和维护，把“参观一个景点”转化为了解一项生活技艺的过程。' },
    ],
    observe: ['看桥、石阶和公共场地如何连接两岸。', '寻找有来源说明的展陈与手艺介绍。', '观察居民使用空间与游客观看空间的区别。'],
    etiquette: ['民居、院落和私人物品未经邀请不进入、不触碰。', '拍摄人物先打招呼，保持村巷通行。'],
    sources: [{ title: '雷山县政府 · 西江历史文化名镇保护规划', url: 'https://www.leishan.gov.cn/xwzx/tzgg/202303/P020230331538854737689.pdf' }],
  },
  {
    id: 'stilt-house', name: '吊脚楼', group: '歌舞与村寨', note: '因坡立柱 · 榫卯成家', image: xijiangDawnImage,
    tag: '顺着山地，建出生活空间', region: '贵州雷山 · 西江', category: '传统技艺',
    officialName: '苗寨吊脚楼营造技艺', recognition: '国家级 · 第一批', listedYear: 2006, projectNumber: 'Ⅷ-31',
    body: ['西江苗寨吊脚楼以穿斗式木构架为主，前檐柱随坡“吊脚”，通过榫卯连接框架。匠师依据地形和家户需要安排房屋，借助斧、凿、锯、刨和墨斗完成营造。被列入非遗的是营造知识与技艺，不只是房屋外观。'],
    sections: [
      { title: '长短木柱回应山势', text: '房屋不必把坡地完全削平，而用不同高度的支撑形成可用空间。常见楼体分层安排，既减少对地形的改动，也适应当地湿润环境。看一栋楼时，先观察地面、柱脚与楼板之间的关系。' },
      { title: '房子需要持续照料', text: '选材、放线、制作榫卯和立架是一套相互衔接的经验。木构建成后还需要维护、防火和对坡地环境的照看；技艺的延续包含建造，也包含居民与匠师长期修缮家园的知识。' },
    ],
    observe: ['观察坡地上前后柱脚的高度。', '从允许参观的位置辨认穿斗与榫卯。', '听匠师讲放线、选材和修缮的判断。'],
    etiquette: ['不攀爬木柱、栏杆或进入维修区域。', '尊重防火要求，不在木构附近使用明火。'],
    sources: [{ title: '中国非遗网 · 苗寨吊脚楼营造技艺', url: 'https://www.ihchina.cn/project_details/14316/' }],
  },
  {
    id: 'ancient-songs', name: '苗族古歌', group: '歌舞与村寨', note: '口传创世 · 山川与迁徙', image: flyingSongImage,
    imageNote: '苗族歌唱文化配图，不对应特定古歌演唱实录。',
    tag: '以歌讲述世界从哪里开始', region: '贵州台江、黄平 · 清水江流域', category: '民间文学',
    officialName: '苗族古歌', recognition: '国家级 · 第一批', listedYear: 2006, projectNumber: 'Ⅰ-1',
    body: ['苗族古歌是流传于黔东南清水江流域的诗体神话与口头叙事，讲述宇宙、万物、人类起源，以及洪水、迁徙和日常生产生活。台江、黄平均有国家级名录记录。它属于民间文学，演唱与叙事共同保存着社区记忆。'],
    sections: [
      { title: '故事在哪里被唱起', text: '古歌常在鼓社祭、婚丧、亲友聚会和节日中演述，歌师的记忆、语言和现场表达同样重要。听到创世或迁徙段落时，要把它理解为社区传承的神话和记忆，不直接当成可考证的历史年表。' },
      { title: '听懂比听完更重要', text: '初次接触可选择一个主题，跟随歌师讲解辨认角色、意象和叙事顺序。不同地方、不同歌师保有各自版本，文字整理和短视频只能呈现其中一部分，完整语境仍依赖当地的口传实践。' },
    ],
    observe: ['先询问这一段古歌的名称和场合。', '记录角色、地点与反复出现的意象。', '将演唱、苗语释义与中文讲解对照听。'],
    etiquette: ['征得歌师同意后再录音、发布或引用。', '尊重仪式内容的公开边界，不要求随时演唱。'],
    sources: [
      { title: '中国非遗网 · 苗族古歌（台江）', url: 'https://www.ihchina.cn/project_details/12178/' },
      { title: '中国非遗网 · 苗族古歌（黄平）', url: 'https://www.ihchina.cn/project_details/12177/' },
    ],
  },
  {
    id: 'embroidery', name: '苗绣', group: '匠作与服饰', note: '针路成纹 · 衣上叙事', image: miaoDressImage,
    imageNote: '苗族服饰配图，用于观察刺绣与整体衣饰的关系。',
    tag: '从一针一线，辨认地方风格', region: '贵州雷山；台江等地另有风格', category: '传统美术',
    officialName: '苗绣（雷山苗绣）', recognition: '国家级 · 第一批', listedYear: 2006, projectNumber: 'Ⅶ-22',
    body: ['苗绣是苗族民间传承的刺绣艺术，装点衣袖、衣背、裙装与生活用品。雷山、花溪、剑河等地有不同针法与风格。以雷山苗绣为起点，可以观察线材、针路和构图如何共同塑造纹样，再逐步认识不同地区的做法。'],
    sections: [
      { title: '针法改变纹样的表情', text: '绣线的粗细、方向与排列决定表面的光泽和起伏。雷山苗绣善用变形、夸张和复合构图；台江的破线绣、锁绣、叠绣等又提供不同效果。看纹样时，可同时比较边缘、填充和层次。' },
      { title: '图案需要放回衣饰中', text: '花鸟鱼虫与神话形象会因衣饰部位而改变大小、方向和组合。绣样也与地方身份和礼俗相连。入门体验可以学习一个基本针路，完整的传统作品仍依靠长期练习与传授。' },
    ],
    observe: ['比较同一方向与交错方向的绣线。', '看纹样边缘、填充和立体部分如何处理。', '请绣者解释针法名称与图案来源。'],
    etiquette: ['拿看织物前洗净双手并征求同意。', '练习图案与传统作品注明作者、地区和用途。'],
    sources: [
      { title: '中国非遗网 · 苗绣（雷山苗绣）', url: 'https://www.ihchina.cn/Article/Index/detail?id=13989' },
      { title: '中国非遗网 · 苗绣（台江，2011扩展）', url: 'https://www.ihchina.cn/project_details/13991.html' },
    ],
  },
  {
    id: 'paper-cutting', name: '苗族剪纸', group: '匠作与服饰', note: '纸上剪花 · 绣样蓝本', image: miaoDressImage,
    imageNote: '关联服饰配图；剪纸常作为刺绣底样，并非图示纸本藏品。',
    tag: '先在纸上，长出衣裳的纹样', region: '贵州剑河 · 革东、岑松、新民、新合', category: '传统美术',
    officialName: '剪纸（苗族剪纸）', recognition: '国家级 · 第二批扩展', listedYear: 2008, projectNumber: 'Ⅶ-16',
    body: ['剑河苗族剪纸又称花纸、剪花或绣花纸，是刺绣的重要底样。纸上的动物、花朵与人物经过针线再加工，进入服饰和生活用品，因此剪纸与苗绣相互依存。其价值既在纸面构图，也在从纸到布的转化过程。'],
    sections: [
      { title: '同一县也有不同风格', text: '革东型剪纸常见饱满构图与神话形象；新民、新合型相对灵动，多见花卉、鸟蝶。比较时可看主纹与留白的关系，而不只用“繁”或“简”评价技艺。' },
      { title: '一张花纸的第二次生命', text: '底样为刺绣提供轮廓和布局，绣者再以线色、针法和层次丰富画面。共头、共身等组合形象有地方文化背景，需要听制作者解释。作品既可承接旧样，也能表达当代创作者的想法。' },
    ],
    observe: ['辨认主体纹样、连接处和镂空位置。', '比较花纸与据此制作的绣片。', '听剪纸者说明图案名称与地方含义。'],
    etiquette: ['脆弱纸样未经允许不拿取、折叠或描摹。', '复制、传播图样前询问创作者，并注明来源。'],
    sources: [{ title: '中国非遗网 · 剪纸（苗族剪纸，剑河）', url: 'https://www.ihchina.cn/project_details/20143.html' }],
  },
  {
    id: 'lusheng-making', name: '芦笙制作', group: '匠作与服饰', note: '竹管铜簧 · 调出笙声', image: lushengFestivalImage,
    imageNote: '芦笙文化配图，不对应某位制笙匠师或制作实录。',
    tag: '一件乐器，也是一套听觉经验', region: '贵州雷山 · 排卡等村寨', category: '传统技艺',
    officialName: '苗族芦笙制作技艺', recognition: '国家级 · 第一批', listedYear: 2006, projectNumber: 'Ⅷ-33',
    body: ['雷山排卡等村寨传承苗族芦笙制作技艺。工匠使用竹、木、铜等材料与手工工具，既要会加工，也要能辨音、理解演奏需要。芦笙尺寸和音色多样，一支能随人起舞的乐器，背后有材料、结构和调音的配合。'],
    sections: [
      { title: '竹管为什么能够发声', text: '芦笙将管、斗与簧片组合成乐器，气流推动簧片振动，手指与管体配合控制发音。认识制作可以先辨认这些部件，再看匠师如何处理接合和密封；细小差别也会影响演奏感受。' },
      { title: '调音靠耳朵，也靠经验', text: '制作师傅要反复试吹、比较和修整，手艺与长期的听觉判断相连。雷山的名录编号为Ⅷ-33；凯里另有“民族乐器制作技艺”项下的芦笙记录，名称相近，仍应分别了解其工艺与传承。' },
    ],
    observe: ['辨认竹管、笙斗与簧片的位置。', '听工匠试吹前后音色如何变化。', '比较不同尺寸芦笙的使用场景。'],
    etiquette: ['试吹前询问是否有专用体验乐器。', '不自行拨动簧片、拔管或使用制作工具。'],
    sources: [
      { title: '中国非遗网 · 苗族芦笙制作技艺（雷山）', url: 'https://www.ihchina.cn/project_details/14318/' },
      { title: '中国非遗网 · 民族乐器制作技艺（凯里，比较阅读）', url: 'https://www.ihchina.cn/art/detail/id/14538.html' },
    ],
  },
]
