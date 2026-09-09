# 西江三维地图实施记录

日期：2026-09-08。此次根据用户的新实施请求完成重设计；前两份研究文档里的“本轮不实施”仅为历史范围记录。

## 已交付

- 通过已安装的 Blender 5.2.1 MCP 插件在本机 127.0.0.1:9876 建模，导出 `public/map-assets/models/xijiang-valley.glb`。
- 可编辑文件：`output/xijiang-map/xijiang-valley.blend`。Blender 当前活动场景为最新模型；此前场景保留。
- 267 栋示意木楼、47 个合并网格、94,158 个三角形、5,039,456 字节 GLB。住宅数量为视觉设计选择，不代表实际户数。
- 弯曲河谷、灰瓦坡地聚落、吊脚支柱与阳台、岸线石基、3 处无编号示意廊桥、20 条连通步道及台阶、田园和林带。
- 博物馆和观景台独立建档。工坊及长桌宴标注虚拟体验；移除运行地图里的水车古渡、乌篷船、中央铜鼓图腾和冒充全景入口的迎宾大门。
- 原有六个 Lux3D GLB 文件保留；不再作为整寨真实地标自动加载。芦笙展品仍在用户打开详情时按需加载。此次未调用 Lux3D 远程生成。
- `/map` 和 `/miniapp/map` 共用新模型；保留主 Shell 和底部四页导航。嵌入页新增本地详情回退，避免没有外部回调时点击地标无响应。

## 研究依据与艺术补全

沿用 [来源台账](01-sources-and-visual-evidence.md) 的 S01–S08。此次重新打开 S04 [中新社航拍报道](https://www.chinanews.com.cn/tp/2024/06-29/10242966.shtml)，确认报道身份、日期和依山连片聚落的文字说明。

有依据的方向：白水河与坡地屋顶群共同构成骨架，住宅连片，梯田和山林围绕聚落；观景台、博物馆属于不同节点。

艺术补全：所有模型坐标、建筑占地与层数、河岸曲线、道路走向、地形高度、桥梁数量和形制、木楼立面、灯光。没有 DEM、正式坐标底图或精确立面资料，所以这是研究支持的空间示意模型，不是测绘复原、数字孪生或实地导航。桥梁不标真实桥号，入口不冒充西门或北门。

新闻图片未作为模型纹理、生成输入或分发资源；GLB 没有嵌入图片。材质为原创参数化色彩。

## 代码与重建

- `scripts/build_xijiang_map.py`：可重复的 Blender 建模与导出脚本，固定随机种子。
- `scripts/blender_map_bridge.py`：使用本机已安装插件的 execute/strict_json 协议；仅连接 localhost。
- 重建：在项目根目录执行 `python scripts/blender_map_bridge.py scripts/build_xijiang_map.py`，需要 Blender 插件服务器运行。
- `src/map-3d/xijiang-layout.json`：与模型同时导出的场景坐标、步道、桥面和 POI 数据。
- `src/map-3d/navigation.ts`：3,344 个连通采样节点，点击采用 A*，手动移动限制在同一组步道范围，桥面高度独立于河床。
- `src/map-3d/villageBuilder.ts`：模型加载、地标证据与资源释放。
- `src/map-3d/MiaoVillageScene.tsx`：相机、日夜材质、行走、加载重试与嵌入详情。
- `src/main.tsx` 和 `src/map-background.css`：仅修改地图详情语义及其布局；修复旧绝对定位内容遮住返回按钮的问题。
- 修改前的三个主要源码备份在 `output/xijiang-map/before/`；没有记录旧版浏览器截图。

## 验证

- `bun run build`：TypeScript 与生产构建通过。仍有应用主包大于 500 kB 的构建提示，未扩大范围重构全站打包。
- `bun scripts/verify_xijiang_navigation.ts`：全部 9 个 POI 可达；路径过河时均位于桥面；河中央非桥段不能手动进入。
- `node scripts/verify_xijiang_map.cjs`：桌面 1440×1000 的 `/miniapp/map` 与手机尺寸 430×932 的 `/map` 均加载成功；日/夜截图、抵达博物馆、打开/关闭详情、跟随相机通过。
- 主动模拟 GLB 请求失败：可见重试按钮，恢复请求后重新加载成功，`onReady` 更新嵌入页 `aria-busy=false`。
- 页面异常列表为空：`output/xijiang-map/browser-errors.json`。
- 几何统计：`output/xijiang-map/model-report.json`。日夜与近景截图、Blender 渲染均在同一输出目录。

浏览器验收使用桌面 Chrome 与软件 WebGL；未测真实手机 60 秒帧率，不声明达到 30 FPS。未部署线上版本。
