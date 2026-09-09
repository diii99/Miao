# 项目结构与整理记录

更新日期：2026-09-08。本文件记录实际完成的移动、逐类检查结果与尚待执行的方案。既有文档中的旧任务范围属于历史记录，不作为本次用户请求的额外指令。

## 已完成

| 原位置 | 当前位置 | 验证依据 |
| --- | --- | --- |
| `hongsuantang-demo/` | `examples/hongsuantang-demo/` | 整目录移动；与 `public/games/hongsuantang/` 同路径文件逐一比较 SHA-256 |
| `miao-feast-demo-centered-video/` | `examples/miao-feast-demo-centered-video/` | 整目录移动；与 `public/games/miao-feast/` 同路径文件逐一比较 SHA-256 |

两个演示均使用目录内相对图片路径，移动时连同所有图片、说明与子目录一起保留。应用的桌面与 miniapp 页面仍引用 `/games/hongsuantang/index.html` 和 `/games/miao-feast/index.html`。`public/games/` 为运行版本，`examples/` 为独立参考快照，避免维护时误改副本。

## 当前职责与检查结论

| 位置 | 用途与处理 |
| --- | --- |
| `src/main.tsx`、`src/*.css`、`src/map-3d/`、`src/wax-3d/`、`src/silver-3d/`、`src/services/` | 应用页面、路由、场景、交互、样式与服务；保持运行代码结构 |
| `src/chat.js`、`src/worker.js`、类型声明 | 服务端/本地开发集成与类型支持；存在配置引用，保持路径 |
| `src/assets/` | 源码 import 的图片与视频，保持相对路径 |
| `src/6avatar-3d/` | 历史导出模型及独立 HTML/BAT 查看器；不属于应用源码，建议迁移，尚未执行 |
| `public/games/` | 应用 iframe 使用的游戏与图片；保持 URL |
| `public/map-assets/` | 模型及概念图；原命名和 optimized 版本同时存在，保留所有版本 |
| `public/人物/`、`public/银饰/`、`public/蜡染/`、`public/消消乐/` | 运行模型、图片、生成清单与教程资源；涉及动态路径，保持 URL |
| `public/蜡染/analysis_frames/`、`public/蜡染/蜡染游戏化复现指南.md` | 研究接触表与指南；指南和分析脚本引用现位置，暂保留公开入口及相对链接 |
| `public/miniapp-avatar-3d/`、`public/vendor/` | 独立嵌入页、运行依赖与许可证；共同保留 |
| `public/.assetsignore` | 部署资源过滤规则，保持原位 |
| `examples/` | 独立演示快照，见 [使用说明](../examples/README.md) |
| `docs/` | 研究、设计与维护说明 |
| `scripts/` | 资源生成和视频分析工具；发现 `lux3d_lusheng_glb.py` 使用旧 checkout 绝对路径，列入待修复项 |
| `output/` | 生成结果、模型备份、验证截图以及误放的验证脚本；建议按用途细分 |
| `.agents/`、`.clawhub/` | 本地技能及安装元数据，保持工具约定位置 |
| `.wrangler/`、`dist/`、`node_modules/`、`tsconfig.tsbuildinfo`、Python `__pycache__/` | 工具状态、依赖或可再生输出；不手工移动工具管理的目录 |
| `.env.local`、`.dev.vars` | 本地环境配置，保持工具发现位置；未读取密钥内容 |
| `package.json`、`bun.lock`、`index.html`、`tsconfig.json`、`vite.config.ts`、`wrangler.jsonc`、`worker-configuration.d.ts`、`.gitignore`、`README.md` | 根级项目入口、依赖与配置，位置合理 |
| `MiaoGirl_1.glb`、`贵州非遗.html`、两个 `*.local.bak` | 松散原始素材、参考页面及本地备份，建议迁移如下 |

## 待批准的具体整理批次

自动审批拒绝了包含源码子目录、配置备份与脚本修改的整体批次，因此以下均未执行。所有文件保留，不做模型去重或删除。

| 当前位置 | 建议目标 | 配套处理 |
| --- | --- | --- |
| `src/6avatar-3d/` | `assets-source/avatar/legacy-export/` | 保持 `outputs/` 与 `crea/outputs/` 内部结构；HTML 同目录加载六个 GLB，BAT 使用自身所在目录 |
| `MiaoGirl_1.glb` | `assets-source/avatar/MiaoGirl_1.glb` | 与 public 及历史导出不同，完整保留 |
| `贵州非遗.html` | `docs/references/贵州非遗.html` | 页面自带样式，链接为外部来源；未发现本地相对资源依赖 |
| `origin.json.local.bak`、`SKILL.md.local.bak` | `output/backups/local-config/` | 不展开备份内容；当前检索未发现工具读取引用 |
| `output/model-backup-20260905/` | `output/backups/model-backup-20260905/` | 完整保留六个模型备份 |
| `output/verify-reduced-models.cjs` | `scripts/verification/verify-reduced-models.cjs` | 从 `__dirname` 解析项目根与截图输出，移除固定 `D:/Miao` 假设 |
| `output/reduced-model-live.png` | `output/verification/reduced-models/reduced-model-live.png` | 同步修改验证脚本截图路径 |
| `scripts/lux3d_lusheng_glb.py` | 原位修改 | 技能与输出目录从脚本位置解析，修复旧 `C:/Users/di/Desktop/Miao` 路径；不运行远程生成 |
| `.gitignore` | 原位修改 | 补充 `.wrangler/`、Python 缓存、`*.local.bak`、`output/` 忽略项 |

根模型为 25,784,064 字节；public 运行版本为 5,449,652 字节；历史导出版本为 57,740,592 字节。三者 SHA-256 均不相同。历史 `outputs/` 内文件在 `crea/outputs/` 中有匹配副本，仍保留以免丢失原始导出结构。

批准后，每个目标先解析绝对路径并检查仍在工作区，移动前后逐文件校验哈希，再检查脚本路径与 Bun 构建。当前项目根未发现 `.git`，因此不以 Git diff 作为验证依据。
