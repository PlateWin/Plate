# Plate. Blog Template

一个可直接 fork 的个人博客模板：原生 HTML / CSS / JavaScript 多页前端，配套 Node.js + Express 轻量后台，支持文章发布、模板内容配置、摄影页和管理控制台。

## Features

- Markdown 文章发布与编辑
- 首页 / About / Now / 摄影说明内容配置化
- 私有管理页 `/editor.html`
- 摄影作品上传与管理
- 标签、归档、文章详情页
- Vite 前端开发体验 + Express API

## Quick Start

```bash
# 安装依赖
npm install

# 启动后端 API（3001）
npm run server

# 另开终端启动前端（5173）
npm run dev
```

打开：
- 前台首页：`http://localhost:5173`
- 管理后台：`http://localhost:5173/editor.html`

## Default Admin Token

默认管理员令牌：`plate-admin`

建议 fork 后第一时间修改：

```bash
ADMIN_TOKEN=your-own-token npm run server
```

## What You Can Customize

### 1. 后台直接改内容
访问 `/editor.html` 后可以修改：

- 站点名 / tagline / 页脚 / 联系方式
- 首页 Hero
- 首页 About 区块
- 首页项目卡片
- About 页面
- Now 页面
- SEO 文案
- 摄影说明
- 文章与照片内容

### 2. 数据文件

```text
data/
├─ db.json           # 文章元数据
├─ photos.json       # 摄影数据
└─ site-config.json  # 站点模板配置

public/
├─ posts/            # Markdown 正文
└─ uploads/          # 上传图片
```

如果你想直接批量调整默认模板内容，可以编辑：
- `data/site-config.json`
- `data/db.json`
- `data/photos.json`

## Project Structure

```text
.
├─ assets/
│  ├─ css/           # 样式文件
│  ├─ js/            # 前端脚本
│  └─ images/        # 静态图片
├─ data/             # JSON 数据源
├─ public/
│  ├─ posts/         # Markdown 文章
│  └─ uploads/       # 上传资源
├─ docs/             # 开发过程文档
├─ *.html            # 多页站点入口
├─ server.js         # Express API
└─ package.json
```

## Available Pages

| Path | Description |
|------|-------------|
| `/` | 首页 |
| `/article.html?id=<slug>` | 文章详情 |
| `/archive.html` | 文章归档 |
| `/tags.html` | 标签页 |
| `/about.html` | About |
| `/now.html` | Now |
| `/photography.html` | 摄影页 |
| `/editor.html` | 管理后台 |

## Build

```bash
npm run build
npm run preview
```

> 生产环境下前端构建完成后，仍需要单独运行 `npm run server` 提供 API。

## Tech Stack

- Frontend: HTML / CSS / JavaScript + Vite
- Backend: Node.js + Express 5
- Markdown: marked.js
- Code Highlight: highlight.js
- Animation: GSAP + Lenis

## Open Source Usage Advice

如果你准备把它作为自己的站点使用，建议按这个顺序开始：

1. 修改管理员令牌
2. 进入 `/editor.html` 替换默认文案
3. 删除或替换示例文章与示例照片
4. 调整 `data/site-config.json` 的默认 SEO 信息
5. 再部署到自己的服务器或平台

## Docs

`docs/` 目录保存的是开发过程文档，不是模板使用入口。模板使用请优先看本 README。
