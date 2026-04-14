# Plate 平台 - 第二阶段 (Phase 2) Crystal 知识系统设计文档

**文档版本**: v1.0.0
**核心代号**: Crystal (结晶)
**设计目标**: 构建一个具备双向链接 (`[[Link]]`)、块级引用、以及从聊天记录一键沉淀知识能力的个人/协作知识库。

---

## 1. 产品哲学：从“流动”到“结晶” (Flow to Crystal)
在第一阶段，我们解决了 **Flow (流动)**：即信息的实时传输。
在第二阶段，我们要解决 **Crystal (结晶)**：将聊天中产生的高价值观点、代码片段、决策方案，一键提取并结构化成可以长久沉淀、反复引用的“结晶体”。

## 2. 核心功能模块 (Core Modules)

### 2.1 X-Core 极简 Markdown 编辑器
*   **块级架构 (Block-based)**：每一段话、每一个代码块都是一个独立的“块”，支持拖拽重排（类似 Notion）。
*   **WYSIWYG (所见即所得)**：基于 Milkdown 或 Tiptap 深度定制，保持 X-Core 工业风，无冗余工具栏，通过 `/` 指令呼出组件。
*   **代码原生**：针对程序员出身的许先生，代码块支持 100+ 语言高亮，并支持在文档内直接运行（Sandboxed Execution 预留）。

### 2.2 双向链接协议 (`[[WikiLinks]]`)
*   **无缝关联**：在编辑器中输入 `[[` 自动弹出搜索列表，引用现有文档。
*   **双向追溯 (Backlinks)**：在每一个 Crystal 文档底部，自动展示“谁引用了此文档”，形成网状知识结构（类似 Obsidian）。
*   **实时预览**：鼠标悬停在链接上时，弹出浮窗预览目标文档内容，无需跳转。

### 2.3 聊天与知识的“虫洞” (The Wormhole)
*   **一键结晶**：在 Phase 1 的聊天面板中，右键点击任何消息，选择 "Crystalize"，该消息自动变成一个新的 Crystal 页面。
*   **侧边栏联动**：左侧侧边栏分为两档：`CHANNELS` (沟通) 和 `CRYSTALS` (知识)。

## 3. 技术架构演进 (Technical Architecture)

### 3.1 数据库扩展 (MySQL Schema)
我们需要在现有的 `plate` 数据库中新增以下表结构：

```sql
-- 知识文档主表
CREATE TABLE crystals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(100) UNIQUE NOT NULL, -- 唯一访问标识
    title VARCHAR(255) NOT NULL,
    content LONGTEXT, -- 存储 JSON 或 Markdown 格式的块数据
    author_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 双向链接索引表 (用于快速查询 Backlinks)
CREATE TABLE crystal_links (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_id BIGINT NOT NULL, -- 发起引用的文档
    target_id BIGINT NOT NULL, -- 被引用的文档
    INDEX (target_id),
    INDEX (source_id)
);
```

### 3.2 路由与展现
*   **URL 体系**：`app://plate/crystal/{slug}`。
*   **预加载策略**：利用 Electron 的多窗口/进程能力，在后台预热编辑器实例实现秒开体验。

## 4. UI/UX 视觉规范 (X-Core V2)
*   **布局**：三栏式布局。
    *   左栏：导航（频道+目录）。
    *   中栏：沉浸式编辑器（去边框化设计）。
    *   右栏（可选）：Context 面板，显示当前文档的 Backlinks 和关系图谱。
*   **微动画**：当输入 `[[` 时，列表的弹出动画应具备阻尼感，符合 Dream Flow 标准。

---

## 5. 第二阶段开发路线图 (Phase 2 Roadmap)

### 第一步：编辑器元组件开发
*   集成 Markdown 渲染引擎。
*   实现 X-Core 风格的编辑器标题与正文样式。

### 第二步：双向链接逻辑设计
*   实现正则解析器，自动识别文本中的 `[[名称]]`。
*   开发后端 Link Indexer，实时更新链接表。

### 第三步：知识图谱 (Graph View) - 预留
*   使用 Force-directed Graph 算法，可视化展示个人知识点之间的关联。

---
> “我们不只是在写文档，我们是在给大脑安装一个外挂存储器。”
