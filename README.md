# Project Plate 架构与设计文档 (v1.0)

> **定位**：AI 原生驱动的“流式沟通”与“结晶知识”融合平台。
> **核心哲学**：沟通即生产，碎片即知识。

本文档是 Project Plate 的基础架构指南，具有易扩展性，后续新增的模块、API 规范和数据字典等均可在本文档基础上进行迭代。

---

## 1. 核心技术栈 (The Tech Stack)

为了实现极佳的性能、毫秒级的实时通信与极致的梦幻流（Dream Flow）动效，我们将采用以下前端、后端及中间件技术：

| 领域 | 技术选型 | 选用理由 |
| :--- | :--- | :--- |
| **前端框架** | Next.js 15 (App Router) + React | 极致的性能响应、SSR 支持，完美适配复杂应用流。 |
| **样式与动效** | Tailwind CSS + Framer Motion | 高效管理状态与样式，实现毛玻璃与液体过渡动效。 |
| **后端核心** | Go (Golang) + Gin/Echo | 天生支持高并发，极高的内存利用率，适合构建通信中枢。 |
| **实时通信** | WebSocket + gRPC | 满足毫秒级的状态同步与内部微服务高速通信的需求。 |
| **关系型数据** | PostgreSQL | 可靠的数据持久层，存储用户信息、笔记元数据及历史配置。 |
| **向量数据库** | Milvus / Pinecone | 提供极其快速的高维语义搜索，服务于 AI 长程记忆和结晶功能。 |
| **安全与防御** | Rust-based 加密模块 | 实现端到端加密、保障网络通信请求安全及防范 RAG 攻击。 |

---

## 2. 系统整体架构图 (System Architecture)

Plate 的架构设计分为四大部分：**表现层 (Presentation Layer)**、**AI 系统与业务逻辑层 (Business Logic & AI Layer)**、**实时网关层 (Real-time Gateway)** 与 **数据持久层 (Persistence Layer)**。

```mermaid
graph TD
    %% 客户端层
    subgraph Client [客户端 (Next.js + Tailwind + Framer Motion)]
        UI[Dream Flow UI]
        Flow[实时通信板块 Flow]
        Crystal[知识笔记板块 Crystal]
        UI --> Flow
        UI --> Crystal
    end

    %% 网关与负载
    subgraph Gateway [API 与实时网关]
        WS[WebSocket Gateway]
        REST[RESTful API Gateway]
    end

    Client -- WS / WSS --> WS
    Client -- HTTP/HTTPS --> REST

    %% 业务微服务层 (Go + Python/Rust)
    subgraph Services [后端核心服务层]
        ChatService[聊天通信服务 Go]
        NoteService[笔记文档服务 Go]
        AIService[AI 处理网关 Python/Go]
        AuthSec[安全鉴权服务 Rust/Go]
    end

    WS --> ChatService
    REST --> NoteService
    REST --> AuthSec
    ChatService <-->|gRPC| NoteService
    ChatService <-->|gRPC| AIService
    NoteService <-->|gRPC| AIService

    %% 数据存储层
    subgraph Databases [数据持久化与记忆层]
        PG[(PostgreSQL)]
        VectorDB[(向量数据库 Milvus)]
        Redis[(Redis 缓存/消息队列)]
    end

    ChatService --> Redis
    ChatService --> PG
    NoteService --> PG
    AIService --> VectorDB
    AIService --> PG
    
    %% 连接关系说明
    classDef client fill:#d1e8ff,stroke:#005bb5,stroke-width:2px;
    classDef gate fill:#ffe4cc,stroke:#cc5200,stroke-width:2px;
    classDef service fill:#e0f7fa,stroke:#006064,stroke-width:2px;
    classDef db fill:#f1f8e9,stroke:#33691e,stroke-width:2px;
    
    class Client client;
    class Gateway gate;
    class Services service;
    class Databases db;
```

---

## 3. 核心功能模块划分 (Core Modules)

### 3.1 实时通信板块 (The Flow Plate)
*   **富媒体对话**：包含消息解析器，支持 Markdown 渲染、多语言代码高亮与动态预览。
*   **会话管理**：支持单聊、组群频道以及 Thread 主题帖扩展，削减信息噪音。
*   **意图解析 (AI Command)**：输入 `/todo`、`/memo` 截获用户意图，后台调用 `AIService` 将短消息转化为结构化数据。
*   **感知状态**：基于防打扰和深度工作模型的用户状态推断及极简状态展示。

### 3.2 知识笔记板块 (The Crystal Plate)
*   **双向链接编辑器**：提供类似 Obsidian 的 `[[Link]]` 与图谱索引能力。
*   **白板画板 (Canvas)**：拖拽节点进行连接呈现，使用自由布局辅助团队脑暴。
*   **云端与离线优先**：采用本地 First 架构（例如搭配 IndexedDB / CRDTs 冲突解决），实现极速渲染并做后期增量同步。

### 3.3 AI 结晶机制 (The Crystallization)
*   **自动归纳**：使用大模型提取并总结长程上下文，一键将杂乱 Flow 抽取为规范的 Markdown。
*   **上下文回溯**：笔记包含对原始聊天消息锚点的追踪引用机制（Anchor UUIDs），在笔记内点击即可滑动/跳转回原沟通语境。
*   **向量记忆体系**：通过 Milvus 储存笔记与长对话 Embeddings，实现被动式的“智能相似推荐”。

---

## 4. UI与交互规范建议 (Dream Flow Aesthetic)

文档化我们的视觉基调和设计系统基础要素，后续 UI 库将围绕此建立：

*   **视觉隐喻**：界限不再分明，窗口如同相互渗透的**板块**。
*   **色彩体系**：使用极光紫、晨曦蓝等**低饱和、高明度的渐变**（“愈疗系”）。避免一切高对比、冰冷的工具感极客色。
*   **材质**：大面积引入 `backdrop-filter: blur` 作为毛玻璃效果层级区分。
*   **动画过度**：结合 Framer Motion 打造具备“液体阻尼感”的拉伸、划入、吸附特效。

---

## 5. 项目工程目录推荐结构 (Directory Structure)

*(此为初稿，随着我们引入依赖并生成脚手架将进一步明确)*

```text
/plate
  ├── /frontend         # 前端 Next.js 15 工程
  │   ├── /app          # App Router 核心路由
  │   ├── /components   # 共用组件及 DreamFlow UI 系统
  │   ├── /lib          # 状态管理、工具函数
  │   ├── /hooks        # 自定义 Hook (WebSocket, AI交互等)
  │   └── /styles       # Tailwind CSS 及全局变量配置
  ├── /backend          # 后端 Go 工作区
  │   ├── /cmd          # 服务入口
  │   ├── /internal     # 私有业务逻辑 (chat, notes, auth)
  │   ├── /pkg          # 公共类库 (db, crypto, grpc-clients)
  │   └── /proto        # protobuf 契约定义
  ├── /ai-service       # AI & RAG 相关微服务 (Python/Go)
  └── /docs             # 文档合集 (架构、API契约等)
```

---

## 6. 后续演进空间 (Extensibility)

本文档将作为 Plate 项目“生长”的基础，后续扩展建议从以下几处更新文档：
1.  **数据库表结构与字典 (Schema Docs)**：更新 PG 和 Vector DB 的元数据字段文档。
2.  **API 文档契约 (API Docs)**：后续整理并自动生成 Swagger / OpenAPI 规范文档链接。
3.  **开发与运维流 (DevOps)**：沉淀 Docker, CI/CD 等工程化环境配置手册。
4.  **因果推断 & 安全防御 (Phase 4)**：深入补充 Rust 加密通信与 RAG 防护机制技术细节。

> **当前状态**：技术架构草案已拟定。下一步准备开展**前端 MVP 基础脚手架**的搭建。
