# Phase 4 开发规范文档

## 项目背景

Plate. 是一个个人博客模板，设计语言为「克莱因蓝 × 玻璃拟态」。技术栈：

- **前端**：原生 HTML / CSS / JavaScript（多页应用），Vite 开发服务器
- **后端**：Node.js + Express 5，端口 3001
- **动画**：GSAP 3.12.2 + ScrollTrigger、Lenis 平滑滚动
- **字体**：Inter、Bodoni Moda（display）、OPPOSans（正文）、Fira Code（代码）
- **主色**：Klein Blue `#002FA7`，CSS 变量 `var(--primary-color)`

### 关键路径

```
assets/js/config.js     → POSTS_URL = 'http://localhost:3001/api/posts'
assets/js/main.js       → 全局：cursor、navbar、aurora、Lenis、GSAP reveal
assets/js/transition.js → 页面切换动画（.page-mask）
data/db.json            → 文章元数据 [{id, title, excerpt, date, tags, likes, comments}]
data/photos.json        → 照片数据 [{id, title, subtitle, category, shotTime, lat, lng, src, alt}]
data/site-config.json   → 站点配置 {site, home, aboutPage, nowPage, photography, seo}
public/posts/<id>.md    → 文章 Markdown 正文
```

### 现有 API 端点

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/posts` | 公开 |
| GET | `/api/posts/:id` | 公开 |
| POST/PUT/DELETE | `/api/posts/:id` | requireAdmin |
| POST | `/api/posts/:id/like` | 公开 |
| POST | `/api/posts/:id/comments` | 公开 |
| GET/PUT | `/api/config` | 公开/Admin |
| GET/POST/DELETE | `/api/photos` | 公开/Admin |
| POST | `/api/upload-image` | Admin |
| GET | `/rss.xml` | 公开 |
| POST | `/api/ai` | 公开 |

---

## Phase 4 功能模块

### P1 — 阅读热力图（Reading Heatmap）

**目标**：文章页右侧显示读者在哪些段落停留最久，用克莱因蓝深浅标注热度。

**实现方案**：

1. **数据收集**（`article.js`）
   - 用 `IntersectionObserver` 监听每个 `<p>` 元素的可见时长
   - 每个段落维护一个累计可见毫秒数
   - 页面卸载时（`beforeunload`）将数据存入 `localStorage`，key 为 `heatmap_<postId>`
   - 数据结构：`{ paragraphIndex: durationMs, ... }`

2. **可视化**（`article.js` + `article.css`）
   - 在 TOC 侧边栏下方渲染热力图：一列小色块，每块对应一个段落
   - 色块颜色：`rgba(0, 47, 167, opacity)`，opacity 由该段落时长占总时长的比例决定
   - hover 色块时，对应段落高亮（加 `background: rgba(0,47,167,0.05)` 过渡）

3. **HTML 结构**（`article.html`）
   - 在 `#toc-sidebar` 内追加 `<div id="heatmap-sidebar" class="heatmap-sidebar"></div>`

4. **涉及文件**：`article.html`、`article.css`、`article.js`

**注意**：热力图数据仅存本地，不上传服务器，保护隐私。

---

### P2 — 随机漫游（Random Wander）

**目标**：一键跳转随机文章，增加博客探索感。

**实现方案**：

1. **入口位置**
   - 首页 `#articles` 区块标题旁加一个「✦ 随机漫游」按钮
   - 404 页面也加一个（用户迷路时的彩蛋）

2. **逻辑**（`main.js` 或独立 `wander.js`）
   ```javascript
   async function wanderToRandom() {
       const posts = await fetch('/api/posts').then(r => r.json());
       const post = posts[Math.floor(Math.random() * posts.length)];
       window.location.href = `/article.html?id=${post.id}`;
   }
   ```

3. **样式**：幽灵按钮风格，hover 时克莱因蓝填充，加 `✦` 图标

4. **涉及文件**：`index.html`、`404.html`、`assets/css/style.css`、`assets/js/main.js`

---

### P3 — 文章关联图谱（Knowledge Graph）

**目标**：将文章按标签关联，用力导向图可视化，点击节点跳转文章。

**实现方案**：

1. **新页面**：`graph.html` + `assets/js/graph.js` + `assets/css/graph.css`

2. **依赖**：D3.js v7（CDN）
   ```html
   <script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
   ```

3. **数据构建**（`graph.js`）
   - 从 `/api/posts` 获取所有文章
   - 节点：每篇文章一个节点，大小 = `likes + comments.length`
   - 边：两篇文章共享至少一个标签则连边，边权 = 共享标签数
   - 标签节点：标签本身也作为节点（小圆点），连接所有含该标签的文章

4. **视觉规范**
   - 文章节点：白色圆 + 克莱因蓝描边，半径 `8 + likes * 0.5`（最大 24px）
   - 标签节点：克莱因蓝实心小圆，半径 5px
   - 边：`rgba(0, 47, 167, 0.15)`，宽度 = 共享标签数
   - hover 节点：高亮该节点及其直接邻居，其余节点降低 opacity
   - 点击文章节点：跳转 `/article.html?id=<id>`
   - 背景：与全站一致（`var(--bg-color)`），加 aurora blob

5. **导航入口**：`archive.html` 页面顶部加「图谱视图」切换按钮，`navbar` 暂不加

6. **涉及文件**：新建 `graph.html`、`assets/js/graph.js`、`assets/css/graph.css`

---

### P4 — 思维碎片（Fragments）

**目标**：介于推文和文章之间的轻内容形式，无标题，纯文字流，按时间倒序展示。

**实现方案**：

1. **新页面**：`fragments.html` + `assets/js/fragments.js` + `assets/css/fragments.css`

2. **数据存储**：新增 `data/fragments.json`
   ```json
   {
     "fragments": [
       {
         "id": "1746230400000",
         "text": "...",
         "date": "2026-05-03T00:00:00.000Z",
         "tags": ["算法", "随想"]
       }
     ]
   }
   ```

3. **后端 API**（`server.js` 新增）
   ```
   GET  /api/fragments          → 返回所有碎片，按 date 倒序
   POST /api/fragments          → 新建碎片（requireAdmin）
   DELETE /api/fragments/:id    → 删除（requireAdmin）
   ```

4. **前端展示**（`fragments.js`）
   - 瀑布流布局，每条碎片是一张卡片
   - 支持 Markdown 渲染（用已有的 marked.js）
   - 卡片左侧有克莱因蓝时间轴线
   - 支持按 tag 筛选

5. **视觉规范**
   - 卡片：`var(--glass-bg)` 背景，玻璃拟态风格
   - 时间显示：相对时间（「3 天前」）+ hover 显示绝对时间
   - 字体：OPPOSans，`font-size: 1rem`，`line-height: 1.8`

6. **后台发布**：在 `editor.html` 新增「碎片」Tab，简单 textarea + 发布按钮

7. **导航入口**：navbar 加「Fragments」链接

8. **涉及文件**：新建 `fragments.html`、`assets/js/fragments.js`、`assets/css/fragments.css`；修改 `server.js`、`editor.html`、`editor.js`、所有 HTML 的 navbar

---

### P5 — 灵感墙（Inspiration Wall）

**目标**：无限画布，可贴便利贴式短想法、图片引用、代码片段，数据持久化到后端。

**实现方案**：

1. **新页面**：`wall.html` + `assets/js/wall.js` + `assets/css/wall.css`

2. **数据存储**：新增 `data/wall.json`
   ```json
   {
     "cards": [
       {
         "id": "1746230400000",
         "type": "text|image|quote|code",
         "content": "...",
         "x": 120,
         "y": 340,
         "width": 240,
         "color": "blue|yellow|white|dark",
         "createdAt": "2026-05-03T00:00:00.000Z"
       }
     ]
   }
   ```

3. **后端 API**（`server.js` 新增）
   ```
   GET  /api/wall               → 返回所有卡片
   POST /api/wall               → 新建卡片（requireAdmin）
   PUT  /api/wall/:id           → 更新位置/内容（requireAdmin）
   DELETE /api/wall/:id         → 删除（requireAdmin）
   ```

4. **前端交互**（`wall.js`）
   - 画布用 CSS `transform: translate` 实现平移，鼠标拖拽移动视口
   - 卡片可拖拽重新定位（mousedown + mousemove + mouseup）
   - 双击空白处新建卡片（需登录态，检查 `/api/admin/session`）
   - 卡片类型：
     - `text`：纯文字，支持简单 Markdown
     - `quote`：引用样式，克莱因蓝左边框
     - `code`：代码片段，Fira Code，深色背景
     - `image`：图片 URL 展示

5. **视觉规范**
   - 背景：细点阵网格（CSS `radial-gradient` 实现，不用 canvas）
   - 卡片颜色方案：
     - `blue`：`rgba(0,47,167,0.08)` 背景，克莱因蓝描边
     - `yellow`：`rgba(255,189,46,0.15)` 背景
     - `white`：`var(--glass-bg)` 背景
     - `dark`：`#0f172a` 背景，白色文字
   - 卡片阴影：`var(--shadow-glass)`
   - 缩放：支持 `Ctrl + 滚轮` 缩放画布（`transform: scale`）

6. **访客模式**：未登录时只读，可浏览不可编辑

7. **导航入口**：navbar 或 now 页面加入口

8. **涉及文件**：新建 `wall.html`、`assets/js/wall.js`、`assets/css/wall.css`；修改 `server.js`、所有 HTML 的 navbar

---

## 开发顺序建议

| 优先级 | 模块 | 理由 |
|--------|------|------|
| 1 | P2 随机漫游 | 最简单，1小时内完成，立竿见影 |
| 2 | P4 思维碎片 | 独立页面，有完整数据流，适合单独开发 |
| 3 | P1 阅读热力图 | 在已有 article.js 基础上扩展 |
| 4 | P3 关联图谱 | 需要 D3.js，独立性强 |
| 5 | P5 灵感墙 | 最复杂，拖拽交互工作量最大 |

---

## 设计约束（所有模块必须遵守）

1. **颜色**：主色 `#002FA7`（Klein Blue），不引入新的品牌色
2. **玻璃拟态**：卡片统一用 `var(--glass-bg)`、`var(--glass-border)`、`var(--shadow-glass)`
3. **动画**：入场动画用 GSAP，`opacity: 0 → 1`，`y: 20 → 0`，`duration: 0.8`
4. **字体**：UI 用 `var(--font-sans)`，正文用 OPPOSans，代码用 Fira Code
5. **页面过渡**：所有新 HTML 页面必须引入 `transition.js` 并包含 `.page-mask`
6. **响应式**：所有新页面必须在 768px 以下正常显示
7. **无外部状态**：不引入 React/Vue 等框架，保持原生 JS
