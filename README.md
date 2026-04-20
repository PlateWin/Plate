# FlowCrystal — AI-native Flow & Crystal Knowledge Platform

> **定位**：AI 原生驱动的“流式沟通”与“结晶知识”融合平台。
> **核心哲学**：沟通即生产，碎片即知识。

FlowCrystal 旨在打破即时通讯与知识管理之间的壁垒。通过“流 (Flow)”捕捉灵感，通过“晶体 (Crystal)”沉淀智慧，辅以极速 AI 响应与极致的“梦幻流 (Dream Flow)”视觉动效。

---

## 1. 核心特性 (Key Features)

### 🔮 晶体编辑器 (Crystal Editor)
*   **双向链接**：支持类似 Obsidian 的 `[[WikiLinks]]`，自动建立知识图谱关联。
*   **实时预览**：鼠标悬停在链接上即可快速预览目标晶体内容。
*   **斜杠指令**：输入 `/` 触发 AI 快捷操作，包括自动摘要、润色、扩展、要点提炼等。

### ✍️ VibeWriting (AI 幽灵续写)
*   **灵感延伸**：AI 根据当前写作语境，在光标处生成半透明的“幽灵建议”，点击 `Tab` 键即可一键采纳。
*   **生产力引擎**：为您的思路提供不间断的动力。

### ✨ Aura Engine (光晕视觉反馈)
*   **极致动效**：通过硬件加速的高性能 GPU 渲染，在 AI 思考或自动保存时呈现梦幻般的旋转光晕背景。
*   **情绪交互**：将工具打造成具备“呼吸感”的生命体。

### 💬 Flow (实时通讯网关)
*   **分布式架构**：基于 Go WebSocket Hub，支持高并发的消息同步。
*   **无缝沉淀**：未来支持一键将 Flow 频道内的碎片对话“结晶”为结构化的 Markdown 笔记。

---

## 2. 核心技术栈 (The Tech Stack)

| 领域 | 技术选型 | 选用理由 |
| :--- | :--- | :--- |
| **前端框架** | Electron + Vite + React | 极致的跨平台性能、原生系统集成与极速热更新。 |
| **样式与动效** | Tailwind CSS + Framer Motion | 打造毛玻璃、流体阻尼感与 GPU 加速动画。 |
| **编辑引擎** | Tiptap (Prosemirror) | 强大的块级编辑与 WikiLinks/AI 续写扩展性。 |
| **后端核心** | Go (Golang) + Gin | 天生支持高并发，适合构建毫秒级通讯中枢。 |
| **数据库** | MySQL (GORM) | 可靠的数据持久层，存储元数据与历史配置。 |
| **AI 接口** | SiliconFlow (Qwen/Llama) | 提供极速的文本续写与动作指令解析。 |

---

## 3. 快速上手 (Quick Start)

### 前置要求
- [Go](https://go.dev/) 1.20+
- [Node.js](https://nodejs.org/) 18+ & npm
- [MySQL](https://www.mysql.com/) 8.0+

### 第一步：配置环境
在 `backend/` 目录下创建 `.env` 文件，并填入您的 API 密钥：

```env
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_MODEL=Qwen/Qwen2.5-72B-Instruct-Turbo
SILICONFLOW_ENDPOINT=https://api.siliconflow.cn/v1/chat/completions
```

> [!TIP]
> 数据库配置目前位于 `backend/internal/db/db.go`，默认尝试连接本地 `root:wsxhr666`。部署时建议提取至 `.env`。

### 第二步：启动服务
打开两个终端窗口：

**启动后端：**
```bash
cd backend
go run cmd/plate-server/main.go
```

**启动桌面客户端：**
```bash
cd desktop-client
npm install
npm run dev
```

---

## 4. 项目结构 (Directory Structure)

```text
/plate
  ├── /desktop-client   # 桌面客户端 (Electron + Vite + React)
  │   ├── /src/main     # Electron 主进程 (系统集成)
  │   ├── /src/renderer # React 渲染进程 (DreamFlow UI 系统)
  │   └── /src/preload  # 预加载脚本
  ├── /backend          # 后端核心 (Go)
  │   ├── /cmd          # 启动入口 (plate-server)
  │   ├── /internal     # 业务逻辑 (Handlers, Hub, Models, DB)
  │   └── go.mod        # 依赖配置
  └── /docs             # 详细设计文档 (Phase 1-4, Memory System)
```

---

## 5. 后续路线图 (Roadmap)

- [x] **Phase 1 (MVP)**: 实时通讯底座与基础架构。
- [x] **Phase 2 (Crystal Logic)**: 结晶编辑器与 WikiLinks。
- [/] **Phase 3 (AI Fusion)**: 自动化结晶机制与 VibeWriting 优化。
- [ ] **Phase 4 (Security & RAG)**: 深度因果推断、安全防护与私有化部署。

> **当前状态**：核心开发进行中。已完成结晶编辑器与 AI 动作指令的深度整合。

---

# P l a t e
