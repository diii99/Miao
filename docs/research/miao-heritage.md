# 苗乡非遗内容研究与界面验证

资料核对日期：2026-09-09。

## 范围与资料原则

以贵州苗族节庆、工艺、歌舞与村寨文化为主线。保留湘西赶秋的跨区域对照，明确流传地区。使用中国非物质文化遗产网和贵州省非遗保护中心的项目资料；每篇故事提供可以打开的具体资料链接。

名录名称、编号、公布年份对应具体申报地区和批次；同名传统在不同地方的新增项目、扩展项目不混写。西江作为文化发生地介绍，招龙作为鼓藏节相关仪程介绍。传说以社区叙事表述，不当作可证实的历史事实。观察要点与参访礼仪为编辑整理的阅读建议。

## 本次纠正

- 台江独木龙舟节采用当地农历五月二十四至二十七的记录，不再笼统写五月初五。来源：[苗族独木龙舟节](https://www.ihchina.cn/project_details/15096/)。
- 鼓藏节说明地区差异和十二年间隔、首尾计为十三年的方式，不把一个村寨的周期推广到所有苗族地区。来源：[贵州省非遗保护中心](https://www.gzfwz.org.cn/xmccrml/gjml/sj/dypsy/201804/t20180416_21606388.html)。
- 飞歌区分雷山和剑河的发声描述、入选批次。[雷山记录](https://www.ihchina.cn/project_details/12661.html)，[剑河记录](https://www.ihchina.cn/project_details/12662.html)。
- 苗绣台江记录对应2011年第三批扩展，不与雷山、剑河、花溪2006年记录混同。[台江苗绣](https://www.ihchina.cn/project_details/13991.html)。
- 吊脚楼对应的非遗是营造技艺，西江村寨不直接等于同名国家级项目。[苗寨吊脚楼营造技艺](https://www.ihchina.cn/project_details/14316/)。

## 图片边界

本次保留现有主题配图。旧图片未附可确认的逐图作者、授权或来源台账，因此不为其补造版权归属，也不将图片默认为某个具体仪式的纪实证据。新增故事复用相关主题图时在正文末尾说明。逐图授权确认仍需独立补齐；本次没有下载新的新闻摄影。

## 实现

- 数据：`src/data/heritage.ts`，每条包含地区、类别、可确认的名录字段、概述、专题段落、观察要点、参访礼仪及来源。
- 页面：`src/main.tsx`，保留原有四个主页面和路线，增加全文/地区检索、分类筛选、空结果恢复。
- 阅读：`src/heritage/HeritageStoryDetail.tsx`，正文分节、跳转目录、可打开的资料链接。
- 样式：`src/app-shell.css` 负责动态视口、导航和安全区；`src/heritage-content.css` 负责内容密度和短屏阅读。

## 验证记录

- `scripts/verify_phone_layout.cjs`：18种配置覆盖280至480px竖屏、320px高横屏、模拟刘海安全区及桌面预览。检查四个主页面、开屏/主页一致性、四栏导航、内容滚动、首页人物与对话输入、地图控件边界。报告：`output/phone-layout/report.json`。
- `scripts/verify_heritage_content.cjs`：检索、筛选、每篇故事的元数据/来源/水平溢出/末尾可达性、焦点返回、Tab循环与短屏阅读。报告：`output/heritage-content/report.json`。
- 浏览器验证为桌面Chrome的移动视口模拟，不代表已在每台实体iPhone/Android设备上测试。

## 本次验收结果

- 原17个故事全部补充内容，增加苗族古歌、苗绣、苗族剪纸、芦笙制作，共21条。
- 18种屏幕配置共580项布局检查通过。
- 全部21篇故事共138项交互检查通过，无浏览器运行时错误。
- `bun run build` 通过。

## 逐项资料台账

下表为2026-09-09在线核对的具体条目。项目资料由中国艺术研究院/中国非物质文化遗产保护中心（中国非遗网）或贵州省非遗保护中心提供；西江空间资料为雷山县政府公布的保护规划。网页发布时间不等于项目公布年份。未在本次核对中确认省级公布年和项目编号的记录保留空值，避免使用文章发布日期推算。

| 阅读条目 | 本次对应的地方名录或范围 | 核对资料 |
| --- | --- | --- |
| 姊妹节 | 台江，民俗，2006第一批，Ⅹ-22 | [国家级项目页](https://www.ihchina.cn/art/detail/id/14964.html) |
| 鼓藏节 | 雷山，民俗，2006第一批，Ⅹ-19；榕江为2014第四批扩展 | [雷山](https://www.ihchina.cn/project_details/14960/)、[榕江](https://www.ihchina.cn/project_details/14961/) |
| 苗年 | 丹寨，民俗，2008第二批，Ⅹ-83 | [国家级项目页](https://www.ihchina.cn/project_details/15118) |
| 四月八 | 贵州花溪地方活动；对照湖南吉首/绥宁，不转用湖南认定 | [花溪记录](https://www.gzfwz.org.cn/xwdt/sjysdt/201804/t20180416_21604676.html)、[吉首](https://www.ihchina.cn/project_details/15099/)、[绥宁](https://www.ihchina.cn/project_details/15098/) |
| 吃新节 | 丹寨、台江；贵州省级第五批相关项目资料，不填未经确认的公布年/编号 | [省级项目页](https://www.gzfwz.org.cn/xmccrml/gjml/sj/dwpsy/202206/t20220628_75322567.html) |
| 跳花节 | 安顺，民俗，2008第二批，Ⅹ-76 | [国家级项目页](https://www.ihchina.cn/project_details/15097.html) |
| 芦笙节 | 凯里舟溪甘囊香；贵州省级第二批相关项目资料，不填未经确认的公布年/编号 | [省级项目页](https://www.gzfwz.org.cn/xmccrml/gjml/sj/depsy/201804/t20180416_21606414.html) |
| 赶秋节 | 花垣国家级扩展项目，民俗，2014，Ⅹ-68；资料同时提及松桃流传 | [国家级项目页](https://www.ihchina.cn/art/detail/id/15065.html) |
| 招龙节 | 雷山鼓藏节相关仪程，不另列独立国家级认定 | [省级鼓藏节详述](https://www.gzfwz.org.cn/xmccrml/gjml/sj/dypsy/201804/t20180416_21606388.html) |
| 龙船节 | 台江苗族独木龙舟节，民俗，2008第二批，Ⅹ-75 | [国家级项目页](https://www.ihchina.cn/project_details/15096/) |
| 银饰锻制 | 雷山，传统技艺，2006第一批，Ⅷ-40 | [项目页](https://www.ihchina.cn/project_details/14331/)、[杨光宾技艺记录](https://www.ihchina.cn/ccr_detail/3014) |
| 苗族蜡染 | 丹寨，传统技艺，2006第一批，Ⅷ-25 | [国家级项目页](https://www.ihchina.cn/project_details/14300.html) |
| 苗族服饰 | 台江，民俗，2008第二批扩展，Ⅹ-65 | [国家级项目页](https://www.ihchina.cn/project_details/15052.html) |
| 芦笙舞 | 雷山2008第二批扩展；丹寨锦鸡舞2006第一批；传统舞蹈，Ⅲ-23 | [雷山](https://www.ihchina.cn/project_details/12959.html)、[丹寨锦鸡舞](https://www.ihchina.cn/project_details/12954.html) |
| 苗族飞歌 | 雷山2008第二批；剑河2011第三批扩展；传统音乐，Ⅱ-109 | [雷山](https://www.ihchina.cn/project_details/12661/)、[剑河](https://www.ihchina.cn/project_details/12662.html) |
| 西江千户苗寨 | 文化空间背景；不等同独立国家级非遗项目 | [雷山县政府保护规划](https://www.leishan.gov.cn/xwzx/tzgg/202303/P020230331538854737689.pdf) |
| 吊脚楼 | 苗寨吊脚楼营造技艺，雷山，传统技艺，2006第一批，Ⅷ-31 | [国家级项目页](https://www.ihchina.cn/project_details/14316/) |
| 苗族古歌 | 台江、黄平，民间文学，2006第一批，Ⅰ-1 | [台江](https://www.ihchina.cn/project_details/12178/)、[黄平](https://www.ihchina.cn/project_details/12177/) |
| 苗绣 | 雷山苗绣2006第一批；台江苗绣2011第三批扩展；传统美术，Ⅶ-22 | [雷山](https://www.ihchina.cn/Article/Index/detail?id=13989)、[台江](https://www.ihchina.cn/project_details/13991.html) |
| 苗族剪纸 | 剑河，传统美术，2008第二批扩展，Ⅶ-16 | [国家级项目页](https://www.ihchina.cn/project_details/20143.html) |
| 芦笙制作 | 雷山，传统技艺，2006第一批，Ⅷ-33；凯里是另一项目Ⅷ-124下的记录 | [雷山](https://www.ihchina.cn/project_details/14318/)、[凯里比较资料](https://www.ihchina.cn/art/detail/id/14538.html) |

内容为重新组织的中文概述，未复制整段古歌歌词、祭词或长篇原文。观察要点、学习方式和礼仪为编辑建议，不冒称逐条来自名录原文。未重复旧资料中关于当前人口、在世传承人数量、濒危程度等可能过时的统计；节期为传统习俗记录，不是当年活动排期。新增四条使用关联主题图并在详情明确配图性质，未给现有素材补造作者、拍摄地点或年代。

### 2026-09-10 最终复核

- 当前21条数据与界面重新运行138项非遗交互检查，全部通过，浏览器运行时错误0。
- 320×480短屏、280×653折叠窄屏、440×956大屏各重新运行35项加载后检查，全部通过；包含地图控件之间不遮挡、芦笙模型弹窗边界和四个主页面。568×320横屏加载后检查同为35项通过。
- 地图快捷地点、摇杆与详情卡分行摆放，短屏详情卡可内部滚动。完整18种配置的580项布局结果及各次加载后报告均保存在 `output/phone-layout/`。
- 最后一次代码修改之后，`bun run build` 通过；产物在 `dist/`。Vite仍提示既有3D主包体积较大，此项不影响本次构建成功。
