# 第三阶段开发说明

## 阶段定位

在第二阶段"可阅读、可发现、可持续更新"的基础上，第三阶段聚焦 **"可感、可信、可分享"**。

核心命题：让 Plate. 博客从功能完整的站点，升级为以**克莱因蓝视觉体系**为核心的艺术级作品，同时完成开源前的工程化准备，确保任何人 fork 后可以安全、顺畅地运行。

## 阶段目标

1. **视觉体系完善**：克莱因蓝从单一颜色升级为完整视觉语言，覆盖动画、排版、过渡等全链路。
2. **阅读体验深化**：TOC 目录、代码块复制、RSS Feed 等读者高频需求落地。
3. **安全与工程加固**：AI Key 代理、残留文件清理、环境变量规范，完成开源上线前的工程化收尾。

## 范围（In Scope）

### 模块 A：克莱因蓝视觉系统
- 页面过渡动画（全站路由切换）
- 文章页沉浸式排版
- 图片/摄影页蓝调悬浮滤镜
- Selection、Scrollbar 等细节颜色统一

### 模块 B：阅读体验深化
- 文章页 TOC 目录（跟随滚动高亮）
- 代码块一键复制
- 文章页独立阅读进度条
- RSS Feed 动态生成

### 模块 C：开源工程化准备
- AI Key 代理（迁移到 server.js）
- 清理开发残留文件
- `.env.example` + 三端部署文档
- LICENSE + CHANGELOG

## 非范围（Out of Scope）

- Command Palette（与艺术博客定位不符，暂缓）
- 评论系统改造（第四阶段规划）
- CI/CD 流水线（超出当前阶段范围）
- Dark/Light 主题切换（当前暗色是品牌定义，暂不引入切换）

---

## 任务拆解（WBS）

---

## 模块 A：克莱因蓝视觉系统

### A1 页面过渡动画

**目标**：所有页面跳转（`index.html` → `article.html`、`about.html` 等）增加全屏过渡动画，使用克莱因蓝 (#002FA7) 作为过渡底色。

**技术方案**：
- 新建 `assets/js/transition.js`
- 在 `<body>` 注入一个 `.page-mask` 覆盖层（position: fixed, z-index: 9999）
- 离开页面时：mask 从底部向上展开（`scaleY: 0 → 1`，GSAP ease: `power3.inOut`）
- 进入新页面时：mask 从顶部向上收起（`scaleY: 1 → 0`）
- 在所有 `<a>` 标签的 click 事件中劫持跳转，先播动画再 `window.location.href`

**需要修改的文件**：
- `index.html`、`article.html`、`about.html`、`now.html`、`photography.html`、`archive.html`、`tags.html`
- 各页面 `<body>` 注入 `.page-mask` div
- 各页面引入 `transition.js`（`<script type="module">`）

**CSS（新增至 `style.css`）**：
```css
.page-mask {
  position: fixed;
  inset: 0;
  background: #002FA7;
  transform-origin: bottom;
  transform: scaleY(0);
  z-index: 9999;
  pointer-events: none;
}
```

**验收标准**：
- [ ] 点击任意站内链接均有克莱因蓝过渡动画
- [ ] 动画时长 ≤ 600ms，不影响正常操作
- [ ] 浏览器回退按钮不触发动画（监听 `popstate` 跳过）

---

### A2 文章页沉浸式排版

**目标**：提升 `article.html` 的阅读质感，使长文阅读体验接近顶级出版物水准。

**具体改动（全部在 `article.css`）**：

1. **首字下沉 (Drop Cap)**
```css
.markdown-body > p:first-of-type::first-letter {
  font-family: 'Bodoni Moda', serif;
  font-size: 4.5rem;
  font-style: italic;
  float: left;
  line-height: 0.8;
  margin: 0.08em 0.12em 0 0;
  color: #002FA7;
}
```

2. **正文行间距与字间距优化**
```css
.markdown-body p {
  line-height: 1.9;
  letter-spacing: 0.01em;
  font-size: clamp(1rem, 1.5vw, 1.125rem);
}
```

3. **引用块 (blockquote) 克莱因蓝左边框**
```css
.markdown-body blockquote {
  border-left: 3px solid #002FA7;
  padding-left: 1.5rem;
  color: var(--text-secondary);
  font-style: italic;
}
```

4. **标题左侧锚点蓝色指示线**
```css
.markdown-body h2::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 1em;
  background: #002FA7;
  margin-right: 0.6em;
  vertical-align: middle;
  border-radius: 2px;
}
```

**验收标准**：
- [ ] 首字下沉仅作用于文章正文第一段，不影响其他 p 标签
- [ ] 引用块、标题视觉风格与克莱因蓝体系一致
- [ ] 移动端 (`<768px`) 首字下沉 disabled（`float: none; font-size: 1em`）

---

### A3 摄影页图片蓝调悬浮滤镜

**目标**：摄影页 (`photography.html`) 的图片在 hover 时叠加克莱因蓝半透明滤镜层，强化品牌感。

**技术方案（CSS-only，修改 `photography.css`）**：
```css
.photo-item {
  position: relative;
  overflow: hidden;
}

.photo-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 47, 167, 0.35);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.photo-item:hover::after {
  opacity: 1;
}
```

**验收标准**：
- [ ] 悬浮时蓝调滤镜顺滑出现，离开时顺滑消失
- [ ] 不影响灯箱点击（`::after` 不拦截 pointer events 或由 JS 处理）
- [ ] 移动端 touch 设备上不触发（通过 `@media (hover: hover)` 限定）

---

### A4 全站 Selection / Scrollbar 细节统一

**目标**：补全克莱因蓝体系的末端细节。

**修改 `style.css`（追加）**：
```css
/* Text Selection */
::selection {
  background: rgba(0, 47, 167, 0.3);
  color: #ffffff;
}

/* Custom Scrollbar (WebKit) */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 47, 167, 0.5);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 47, 167, 0.8);
}
```

**验收标准**：
- [ ] 全站文字选中呈克莱因蓝底色白字
- [ ] 滚动条在 Chrome/Safari 下呈克莱因蓝细线风格
- [ ] Firefox 下提供 `scrollbar-color` 兜底

---

## 模块 B：阅读体验深化

### B1 文章页 TOC 目录

**目标**：在 `article.html` 文章内容右侧增加浮动目录，跟随滚动高亮当前阅读位置。

**实现文件**：
- 修改 `article.html`：增加 `<aside id="toc" class="toc-sidebar"></aside>`
- 修改 `article.js`：增加 `buildTOC()` 函数
- 修改 `article.css`：增加 TOC 样式

**`buildTOC()` 逻辑**：
1. 在 Markdown 渲染完成后，查询 `.markdown-body h2, h3`
2. 为每个标题生成唯一 `id`（slug 化，例如 `## RAG 安全` → `id="rag-安全"`）
3. 在 `#toc` 中生成对应的 `<a href="#...">` 列表
4. 使用 `IntersectionObserver` 监听标题进入视口，高亮对应 TOC 项（添加 `.active` class，克莱因蓝色 + 左边框）
5. TOC 在 `<1200px` 宽度时自动隐藏（`display: none`）

**CSS 布局**：
```css
.article-layout {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 4rem;
  max-width: 1100px;
  margin: 0 auto;
}

.toc-sidebar {
  position: sticky;
  top: 6rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
}

.toc-sidebar a.active {
  color: #002FA7;
  border-left: 2px solid #002FA7;
  padding-left: 0.5rem;
}

@media (max-width: 1200px) {
  .toc-sidebar { display: none; }
  .article-layout { grid-template-columns: 1fr; }
}
```

**验收标准**：
- [ ] TOC 自动从文章 h2/h3 提取，无需手动维护
- [ ] 滚动过程中 active 状态实时切换，无抖动
- [ ] 点击 TOC 项平滑滚动到对应标题（配合 Lenis）
- [ ] 1200px 以下屏幕 TOC 自动隐藏，不影响移动端布局

---

### B2 代码块一键复制

**目标**：所有代码块右上角出现 Copy 按钮，点击后复制内容并显示反馈。

**实现位置**：`article.js` 的 `renderArticle()` 函数完成后调用 `addCopyButtons()`

**`addCopyButtons()` 逻辑**：
```javascript
function addCopyButtons() {
  document.querySelectorAll('.markdown-body pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = `<svg><!-- clipboard icon --></svg>`;
    btn.title = 'Copy code';
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText || '';
      await navigator.clipboard.writeText(code);
      btn.classList.add('copied');
      btn.innerHTML = `✓ Copied`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `<svg><!-- clipboard icon --></svg>`;
      }, 2000);
    });
    pre.style.position = 'relative';
    pre.appendChild(btn);
  });
}
```

**CSS（追加至 `article.css`）**：
```css
.copy-btn {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  padding: 0.25rem 0.6rem;
  background: rgba(0, 47, 167, 0.15);
  border: 1px solid rgba(0, 47, 167, 0.3);
  border-radius: 4px;
  color: #aaa;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.copy-btn:hover { background: rgba(0, 47, 167, 0.3); color: #fff; }
.copy-btn.copied { background: rgba(0, 47, 167, 0.6); color: #fff; }
```

**验收标准**：
- [ ] 每个代码块右上角有 Copy 按钮
- [ ] 点击后 2 秒内显示 "✓ Copied" 状态，之后恢复
- [ ] 无 HTTPS 时（本地 http）降级使用 `document.execCommand('copy')`

---

### B3 文章页独立阅读进度条

**目标**：`article.html` 顶部有一条专属的克莱因蓝阅读进度条，仅追踪文章正文的阅读进度（非全页进度）。

**注意**：与全局 `.scroll-progress-bar` 区分，这条进度条追踪 `#markdown-content` 的阅读百分比。

**实现（`article.js` 追加）**：
```javascript
function initArticleProgress() {
  const bar = document.getElementById('article-progress-bar');
  const article = document.getElementById('markdown-content');
  if (!bar || !article) return;

  window.addEventListener('scroll', () => {
    const rect = article.getBoundingClientRect();
    const articleHeight = article.offsetHeight;
    const scrolled = -rect.top;
    const progress = Math.min(Math.max(scrolled / (articleHeight - window.innerHeight), 0), 1);
    bar.style.width = `${progress * 100}%`;
  });
}
```

**`article.html` 增加**：
```html
<div class="article-progress-container">
  <div id="article-progress-bar" class="article-progress-bar"></div>
</div>
```

**验收标准**：
- [ ] 进度条仅反映文章内容区域的阅读进度
- [ ] 到达文章底部时进度条为 100%
- [ ] 颜色为克莱因蓝，与全局进度条同色系但可区分（细度不同）

---

### B4 RSS Feed 动态生成

**目标**：`GET /rss.xml` 返回标准 RSS 2.0 格式，包含所有文章。

**实现位置**：`server.js` 追加路由

**路由逻辑**：
```javascript
app.get('/rss.xml', (req, res) => {
  const db = readDB();
  const siteUrl = process.env.SITE_URL || 'http://localhost:3001';
  
  const items = db.posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/article.html?id=${post.id}</link>
      <guid>${siteUrl}/article.html?id=${post.id}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || ''}]]></description>
    </item>
  `).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Plate. Blog</title>
    <link>${siteUrl}</link>
    <description>Algorithm &amp; Aesthetics</description>
    <language>zh-CN</language>
    ${items}
  </channel>
</rss>`;

  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(xml);
});
```

**`sitemap.xml` 同步更新**：追加 `/rss.xml` 入口到现有 `sitemap.xml`。

**验收标准**：
- [ ] `GET /rss.xml` 返回有效 XML，MIME 为 `application/rss+xml`
- [ ] 每篇文章生成一个 `<item>`，标题/链接/摘要正确
- [ ] 使用 RSS 阅读器（如 Reeder）可成功订阅

---

## 模块 C：开源工程化准备

### C1 AI Key 安全代理

**目标**：将 `ai-assistant.js` 中裸露的 API Key 迁移到后端代理，前端不再持有任何密钥。

**方案**：

1. **`server.js` 新增 `/api/ai` 路由**：
```javascript
app.post('/api/ai', async (req, res) => {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI service not configured' });

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();
  res.status(response.status).json(data);
});
```

2. **`ai-assistant.js` 修改**：
   - 删除 `CONFIG.apiKey` 和 `CONFIG.url` 中的硬编码值
   - 将 `fetch(CONFIG.url, ...)` 改为 `fetch('/api/ai', { method: 'POST', body: ... })`
   - 去掉 `Authorization` header（由后端代理持有）

3. **根目录新建 `.env`（不提交 git）**：
```
ADMIN_TOKEN=your-admin-token
SILICONFLOW_API_KEY=your-api-key
SITE_URL=https://your-domain.com
```

**验收标准**：
- [ ] 前端代码中不含任何 API Key 字符串
- [ ] `.env` 已加入 `.gitignore`
- [ ] AI 助手功能在有 Key 的情况下正常工作
- [ ] 无 Key 时 AI 助手返回友好错误提示而非崩溃

---

### C2 残留文件清理

**目标**：清除开发过程中遗留的临时文件，确保仓库整洁。

**待处理文件列表**：

| 文件 | 操作 | 说明 |
|------|------|------|
| `assets/js/phase2.js` | 删除 | 开发残留 |
| `assets/css/phase2.css` | 删除 | 开发残留 |
| `assets/css/style_enhancement.css` | 合并或删除 | 检查内容是否已并入 `style.css`，若有效则合并，否则删除 |
| `assets/css/style_optimized.css` | 合并或删除 | 同上 |

**操作前置检查**：
- 全局搜索各文件名，确认是否有 HTML 页面引用这些文件
- 若有引用，先从 HTML 中移除 `<link>` / `<script>` 标签，再删除文件

**验收标准**：
- [ ] 上述文件全部清理
- [ ] 所有 HTML 页面无对已删除文件的引用
- [ ] `npm run build` 或 `npm run dev` 无报错

---

### C3 `.env.example` 与部署文档

**目标**：让 fork 用户能 0 摸索地部署站点。

**新建 `.env.example`（根目录）**：
```
# 管理员令牌，用于后台登录鉴权
ADMIN_TOKEN=your-admin-token-here

# SiliconFlow API Key（用于 AI 助手功能，可不填则 AI 助手禁用）
SILICONFLOW_API_KEY=

# 站点公开 URL（用于 RSS Feed 生成）
SITE_URL=https://your-domain.com
```

**新建 `docs/deployment.md`**，包含三种部署方案：

#### 方案一：本地运行（开发）
```bash
cp .env.example .env
# 编辑 .env 填入你的配置
npm install
npm run server  # 后端 :3001
npm run dev     # 前端 :5173
```

#### 方案二：Railway（推荐，零配置云部署）
1. Fork 本仓库
2. 在 Railway 新建项目，连接 GitHub 仓库
3. 在 Railway 环境变量面板填入 `.env.example` 中的变量
4. Start Command 设置为 `node server.js`
5. 前端静态文件通过 `npm run build` 后 serve `dist/` 目录

#### 方案三：Vercel + 独立后端
- 前端部署到 Vercel（`npm run build`，`dist/` 目录）
- 后端部署到 Railway / Render 等任意 Node.js 平台
- 前端 `config.js` 中 `API_ROOT` 改为后端公网地址

**验收标准**：
- [ ] `.env.example` 存在且字段完整
- [ ] `deployment.md` 三种方案步骤可执行
- [ ] `README.md` 顶部增加部署方案快速索引

---

### C4 LICENSE + CHANGELOG

**目标**：完成开源法律合规与版本历史记录。

**新建 `LICENSE`（根目录）**：
```
MIT License

Copyright (c) 2026 Plate.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...（标准 MIT 全文）
```

**新建 `CHANGELOG.md`（根目录）**：
```markdown
# Changelog

## [Unreleased]

## [0.3.0] - Phase 3
### Added
- Klein Blue page transition animations
- Article TOC sidebar with scroll-aware highlight
- Code block copy button
- RSS Feed endpoint (`/rss.xml`)
- AI Key backend proxy
- Deployment documentation

### Changed
- Photography page hover blue filter
- Article typography: drop cap, blockquote, heading markers

### Removed
- Development artifact files (phase2.*, style_enhancement.css)

## [0.2.0] - Phase 2
### Added
- Tags, Archive pages
- Article reading time estimate
- About, Now, 404 pages
- SEO meta, robots.txt, sitemap.xml

## [0.1.0] - Phase 1
### Added
- Homepage, Article, Editor, Photography pages
- Local Express API (CRUD, likes, comments)
- AI assistant widget
```

**验收标准**：
- [ ] `LICENSE` 文件存在，年份/作者正确
- [ ] `CHANGELOG.md` 存在，版本历史结构清晰

---

## 推荐文件变更清单

| 文件 | 操作 |
|------|------|
| `assets/js/transition.js` | 新建 |
| `assets/js/article.js` | 修改（TOC、Copy、进度条）|
| `assets/js/ai-assistant.js` | 修改（去掉 Key，改调 /api/ai）|
| `assets/css/style.css` | 修改（Selection、Scrollbar、page-mask）|
| `assets/css/article.css` | 修改（Drop cap、TOC、Copy button、进度条）|
| `assets/css/photography.css` | 修改（蓝调 hover 滤镜）|
| `server.js` | 修改（/api/ai 路由、/rss.xml 路由）|
| `assets/js/phase2.js` | **删除** |
| `assets/css/phase2.css` | **删除** |
| `assets/css/style_enhancement.css` | **合并后删除** |
| `assets/css/style_optimized.css` | **合并后删除** |
| `.env.example` | 新建 |
| `.gitignore` | 修改（确保 .env 已忽略）|
| `LICENSE` | 新建 |
| `CHANGELOG.md` | 新建 |
| `docs/deployment.md` | 新建 |
| 所有 `*.html` | 修改（注入 page-mask div，引入 transition.js）|

---

## 里程碑计划（建议 2 周）

### Week 1：视觉与体验
- Day 1–2：A1 页面过渡动画
- Day 3：A2 文章沉浸式排版 + A4 Selection/Scrollbar
- Day 4：A3 摄影页蓝调滤镜
- Day 5–6：B1 TOC 目录
- Day 7：B2 代码块 Copy 按钮

### Week 2：工程化收尾
- Day 1：B3 文章阅读进度条
- Day 2：B4 RSS Feed
- Day 3–4：C1 AI Key 代理
- Day 5：C2 残留文件清理
- Day 6：C3 环境变量 + 部署文档
- Day 7：C4 LICENSE + CHANGELOG + 全站验收

---

## 发布前检查清单

- [ ] 页面过渡动画在所有入口页面正常触发
- [ ] 文章页 TOC 在 1200px 以上正常显示，以下隐藏
- [ ] 代码块 Copy 按钮可用，反馈动画正常
- [ ] `/rss.xml` 可访问且 RSS 阅读器可解析
- [ ] 前端代码中无硬编码 API Key
- [ ] `.env` 已在 `.gitignore` 中
- [ ] `phase2.*`、`style_enhancement.css`、`style_optimized.css` 已清理
- [ ] `LICENSE` 存在
- [ ] `CHANGELOG.md` 存在
- [ ] `deployment.md` 三种方案均可跑通
- [ ] 移动端无明显布局破坏

---

## 阶段完成标准（Definition of Done）

- In Scope 中 A/B/C 三个模块的核心任务全部完成；
- 无硬编码敏感信息残留在前端代码中；
- 开源仓库结构整洁（无残留开发文件）；
- 新 fork 用户可通过 `deployment.md` 在 30 分钟内完成部署；
- 文档与功能状态保持同步。
