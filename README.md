# 黔苗行 · Miao

贵州苗族文化与旅行体验项目，使用 Bun、React、TanStack Router、Vite 和 Three.js。

## 文档

- [文档目录](docs/README.md)
- [西江千户苗寨地图还原研究与方案](docs/research/xijiang-map/README.md)
- [项目目录职责与整理规范](docs/project-structure.md)

## 本地开发

```powershell
bun install
bun run dev
```

构建命令为 `bun run build`。具体脚本以 [package.json](package.json) 为准。

## 主要目录

| 目录 | 用途 |
| --- | --- |
| `src/` | 页面、三维场景、交互和样式 |
| `public/` | 按 URL 加载的模型、游戏和其他静态资源 |
| `examples/` | 独立演示快照；应用实际加载 `public/games/` |
| `scripts/` | 资源生成与处理工具 |
| `docs/` | 研究、设计和维护说明 |
| `output/` | 已有生成结果、备份及验证产物 |

地图入口为 `/map` 与 `/miniapp/map`。2026-09-08 已完成两轮研究支持的地图重设计，包含芦笙广场和主要地标；见 docs/research/xijiang-map/05-revision2-delivery.md。

## Progress / Resume

Start with [docs/PROGRESS.md](docs/PROGRESS.md) for the latest checkpoint, verified results, pending work, and commands for continuing after an interruption.
