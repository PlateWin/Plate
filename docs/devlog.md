# 开发日志

按日期记录每次迭代的功能与改动。

---

## 2026-05-03

### Phase 4 全部完成 + AI 助手改造 + API 配置面板

- **随机漫游 (P2)**：404 页面新增 `wanderToRandom()` 函数，随机跳转文章
- **碎片 (P4)**：Fragments 页面 — 时间线布局、Marked.js 渲染、标签筛选、相对时间显示、GSAP 动画
- **阅读热力图 (P1)**：文章页侧栏新增 IntersectionObserver 热力图，localStorage 持久化阅读进度
- **知识图谱 (P3)**：D3.js v7 力导向图，文章与标签节点，悬停高亮、拖拽、点击跳转
- **灵感墙 (P5)**：无限画布灵感墙，Ctrl+滚轮缩放、拖拽定位、4 种卡片颜色、管理员认证 CRUD
- **AI 助手内容优化**：更新欢迎语、快捷提问、错误提示为中文
- **AI 助手 UI 重设计**：Klein 蓝渐变头部、AI 消息左侧蓝条装饰、输入框 focus 蓝光、快捷按钮 hover 填充、状态指示灯呼吸动画
- **API 配置面板**：管理后台新增「API 配置」页，可配置请求地址、模型名称、API Key，支持 OpenAI 兼容服务
- **AI 代理修复**：`fetch` 从相对路径改为 `http://localhost:3001/api/ai`

## 2026-05-03 (上午)

### Phase 3 — 开源就绪与文章排版

- 文章页完整布局重构：TOC 侧栏、评论系统、点赞功能
- 开源相关文件：LICENSE、CHANGELOG、docs/deployment.md
- RSS Feed 自动生成

## 2026-05-02

### A1 — 页面过渡与导航优化

- Klein 蓝全屏遮罩 + 过渡动画（GSAP scaleY）
- Logo 圆点样式修复
- 隐藏正常页面跳转时的 transition logo
- Navbar 间距优化，首页新增编辑入口

### A2 — 文章沉浸式排版

- 首字母大写（Drop Cap）
- 滚动渐显动画（GSAP ScrollTrigger）

### A3 — 摄影画廊交互

- Klein 蓝悬停滤镜效果（blue-hover overlay）

### A4 — 全局样式统一

- 全局文本选中色统一为 Klein 蓝
- 自定义滚动条样式（Klein 蓝配色）

---

## 2026-05-02 (初始)

### 项目重置

- 重置到 Phase 3 前的稳定状态，作为新的开发基线
