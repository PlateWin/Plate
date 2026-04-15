# Plate: 统一记忆系统 (Universal Memory System, UMS) 最终技术规格书

## 1. 引言 (Introduction)

本规格书旨在整合并升华此前关于项目“记忆系统”的所有设计构想，构建一套专为**工作通讯 (Flow)** 与 **知识笔记 (Crystal)** 深度融合而设计的 AI 记忆座。

### 1.1 系统愿景
Plate 记忆系统不仅仅是一个存储库，它是一个**“语境桥梁”**。它通过打破即时通讯 (IM) 的碎片化与知识管理 (KM) 的静态化，实现信息的双向流动与自动结晶。

---

## 2. 核心架构设计 (System Architecture)

基于“通讯 + 笔记”的二元性，我们将记忆分为三个层次：

### 2.1 闪速记忆层 (Flash Memory - 瞬时语境)
- **来源**：最新的 Flow 聊天记录（最近 50 条）、当前正在编辑的 Crystal 草稿。
- **作用**：支持毫秒级的 Ghost Text 补全与即时问题的精准回复。
- **存储**：内存缓存 (Go-cache) + Redis。

### 2.2 结晶记忆层 (Crystallized Memory - 长期知识)
- **来源**：已保存的 Crystal 文档、通过 AI 总结的“Flow 频道对话摘要”。
- **作用**：沉淀事实、项目里程碑、技术决策。
- **存储**：MySQL (当前) -> Vector Database (Phase 3.5)。

### 2.3 指纹记忆层 (Fingerprint Memory - 行为风格)
- **维度**：写作习惯、语气（正式/随意）、常用术语词库。
- **作用**：让 AI 的输出风格与用户高度一致，实现“数字分身”感。

---

## 3. 针对“工作通讯+笔记”的专项设计

为了满足工作场景，系统必须具备以下核心机制：

### 3.1 跨板块召回 (Cross-Plate Recall)
- **场景 A**：在 Flow 中咨询项目进度时，系统主动召回相关 Crystal 笔记中的事实。
- **场景 B**：在 Crystal 中撰写周报时，系统主动召回本周在 Flow 中讨论的核心要点。

### 3.2 溯源原子化 (Atomic Attribution)
- 每一条记忆原子都必须携带 `TraceLink`。
- **如果源自 Flow**：记录 `ChannelID` 与 `Timestamp`（点击可跳转回聊天上下文）。
- **如果源自 Crystal**：记录 `CrystalID` 与 `LineRange`。

### 3.3 意图感知提取 (Intent-Aware Extraction)
当 Flow 聊天中出现以下特征时，系统自动标记为“准记忆”：
- 包含时间点/死线的承诺 (Promise)。
- 对某个术语或流程的解释 (Definition)。
- 团队最终达成的共识 (Consensus)。

---

## 4. 数据模型 (Unified Data Schema)

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | `uuid` | 唯一标识符 |
| `origin` | `enum` | 来源：`FLOW` 或 `CRYSTAL` |
| `category` | `enum` | 类别：`FACT` (事实), `TASK` (任务), `STYLE` (风格) |
| `payload` | `text` | 记忆的具体结构化内容 |
| `trace_link` | `string` | 溯源跳转链接 (deeplink) |
| `vector_id` | `string` | 对应向量库中的 ID (Phase 3.5 启用) |
| `relevance` | `float` | 基于用户采纳率动态调整的影响力权重 |

---

## 5. 后续开发需求单 (Development Roadmap)

### 🚀 Phase 3.5: 语义召回与向量化 (Q3 2026)
1.  **集成本地向量引擎**：引入适配 Electron 环境的端侧向量搜索（如 SQLite-vss 或 Transformers.js embedding）。
2.  **双流注入逻辑**：实现后端 AI Handler 在构建 Prompt 时，同时扫描候选 Fact 和候选用词风格。

### 🔗 Phase 4.0: 知识图谱与推理引擎 (Q4 2026)
1.  **实体提取增强**：能够识别“张三”不仅仅是一个人名，更是“Lumina 项目”的负责人。
2.  **二阶关联推理**：当用户提问 A 时，AI 能通过 B 关联到 C 并进行回答。
3.  **图谱可视化**：在 UI 侧展示“我的记忆网络”。

### 🛡️ Phase 5.0: 隐私防护与审计 (2027)
1.  **Pii 自动脱敏**：发送至云端 AI 前自动掩码个人敏感信息。
2.  **记忆审计面板**：用户可一键清理、导出或修改自己的记忆原子。

---

## 6. 技术实现建议摘要

1.  **异步化**：所有的记忆提取必须在独立的 Goroutine 中完成，严格禁止阻塞保存或发送消息的主流程。
2.  **批处理**：针对 Flow 的高频短消息，采用“滑动窗口”策略，累积到一定语义长度后再进行一次提取。
3.  **Aura 反馈**：前端应实时反映记忆状态，让用户感受到“系统正在学习”。

---
*文档状态：正式规格书 (Consolidated Final)*
*版本：v2.0*
*Plate AI 架构组*
