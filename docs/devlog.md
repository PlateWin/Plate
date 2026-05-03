# 开发日志

按日期记录每次迭代的功能与改动。

---

## 2026-05-03

### Phase 5 / A1 — 统一前后端请求策略

- 统一前端 API 入口到 `assets/js/config.js`
- 本地 Vite 开发使用 `http://localhost:3001/api`
- 生产同域部署默认使用 `/api`
- 支持通过 `window.__PLATE_API_ROOT__` 覆盖 API 地址以适配前后端分离部署
- AI 助手改为复用统一的 `AI_URL`
- Express 在存在 `dist/` 时托管构建后的静态资源，支持同域 `/api` 部署结构
- 部署文档补充 API 路径策略

### Phase 5 / A2 — 环境变量与密钥收口

- 后端启用 `dotenv.config()`，支持从 `.env` 加载运行配置
- `.env.example` 补齐 `PORT`、`SILICONFLOW_API_URL`、`SILICONFLOW_MODEL`
- `PORT` 改为读取 `process.env.PORT`，默认回退 `3001`
- AI 配置优先级统一为：环境变量 > `data/secrets.json` > 默认值
- `/api/secrets` 返回环境变量 Key 是否存在与脱敏状态，后台配置继续写入 `data/secrets.json`
- 部署文档补充密钥来源、优先级与 `data/secrets.json` 忽略策略

### Phase 5 / A3 — 部署文档闭环

- 重写 `docs/deployment.md` 为可按步骤执行的部署指南
- 明确推荐发布结构为 Express 同域部署，前端静态页面与 `/api` 共用同一域名
- 补充本地开发、生产构建、生产启动、Railway 部署和前后端分离部署流程
- 补充 API 路径策略、环境变量说明、密钥优先级、发布前验证清单和常见问题
- 明确 `dist/` 构建产物由 `server.js` 托管，后台、RSS、上传和 AI 代理依赖后端服务

### Phase 5 / B1 — 页面级 SEO 收口

- 补齐 Photography、Fragments、Graph、Wall、Archive、Tags 等公开页面的 `description` 与 Open Graph 基础信息
- 修复 About 页面 SEO 乱码、Now 与 404 页面 meta 标签多余符号
- 为 404 页面补充基础分享卡片信息
- 文章详情页加载文章后动态更新 `title`、`description`、`og:title`、`og:description` 和 `og:type`
- 清理 `data/site-config.json` 中首页、About、Now 的模板 SEO 占位文案，避免动态配置覆盖静态 SEO

### Phase 5 / B2 — 索引控制与站点地图

- 后台 `editor.html` 保持 `noindex`，404 页面调整为 `noindex, follow`
- `robots.txt` 增加后台页与 404 页排除规则，并保留 sitemap 引用
- `server.js` 新增动态 `/robots.txt` 与 `/sitemap.xml`，基于 `SITE_URL` 输出绝对地址
- 动态 sitemap 覆盖首页、About、Now、Archive、Tags、Photography、Fragments、Graph、Wall 和全部文章详情页
- RSS 改为复用统一的 `getSiteUrl()`，与 sitemap/robots 的站点 URL 策略保持一致
- 静态 `sitemap.xml` 更新为包含公开页面与文章的绝对 URL 兜底版本

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
