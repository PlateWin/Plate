# Project Plate 数据库架构规格说明书 (v1.0)

本文档定义了 Project Plate 系统的核心数据库模型、字段定义及索引策略。系统使用 GORM (Go) 进行对象生命周期管理，并以 MySQL 作为存储引擎。

---

## 1. 用户与权限 (Users & Auth)

### 1.1 `users` 表
存储系统用户信息及在线状态。

| 字段名 | 类型 | 描述 | 索引 |
| :--- | :--- | :--- | :--- |
| `id` | `uint` | 主键 ID | `PRIMARY` |
| `username` | `string(100)` | 用户名 | `UNIQUE` |
| `is_online` | `bool` | 是否在线 | - |
| `created_at` | `datetime` | 创建时间 | - |
| `updated_at` | `datetime` | 最后更新时间 | - |

---

## 2. 实时通信 (Flow & Chat)

### 2.1 `channels` 表
存储聊天频道/频道信息。

| 字段名 | 类型 | 描述 | 索引 |
| :--- | :--- | :--- | :--- |
| `id` | `uint` | 频道 ID | `PRIMARY` |
| `name` | `string(100)` | 频道名称 | `UNIQUE` |
| `created_at` | `datetime` | 创建时间 | - |

### 2.2 `messages` 表
存储聊天历史消息。

| 字段名 | 类型 | 描述 | 索引 |
| :--- | :--- | :--- | :--- |
| `id` | `uint` | 消息 ID | `PRIMARY` |
| `type` | `string(20)` | 消息类型 (`chat`, `join`, `leave`, `system`) | - |
| `sender` | `string(100)` | 发送者用户名 | - |
| `channel` | `string(100)` | 所属频道名称 | - |
| `text` | `text` | 消息正文 | - |
| `time` | `string(50)` | 原始时间戳字符串 | - |
| `created_at` | `datetime` | 存库时间 | - |

---

## 3. 知识笔记 (Crystal)

### 3.1 `crystals` 表
存储核心知识文档（晶体）。

| 字段名 | 类型 | 描述 | 索引 |
| :--- | :--- | :--- | :--- |
| `id` | `uint` | 晶体 ID | `PRIMARY` |
| `slug` | `string(100)` | 唯一 URL 标识（短码） | `UNIQUE` |
| `title` | `string(255)` | 文档标题 | - |
| `content` | `longtext` | 文档正文（支持 HTML/Markdown） | - |
| `author_id` | `uint` | 作者用户 ID | - |
| `created_at` | `datetime` | 创建时间 | - |
| `updated_at` | `datetime` | 最后更新时间 | - |

### 3.2 `crystal_links` 表
记录文档间的双向链接关系（wiki-links）。

| 字段名 | 类型 | 描述 | 索引 |
| :--- | :--- | :--- | :--- |
| `id` | `uint` | 记录 ID | `PRIMARY` |
| `source_id` | `uint` | 源文档 ID | `INDEX` |
| `target_id` | `uint` | 被指向的文档 ID | `INDEX` |

---

## 4. 个性化记忆 (PMS)

### 4.1 `memories` 表
**[New in Phase 4]** 存储 AI 提取的原子化知识碎片和写作风格。

| 字段名 | 类型 | 描述 | 索引 |
| :--- | :--- | :--- | :--- |
| `id` | `uint` | 记忆 ID | `PRIMARY` |
| `category` | `string(20)` | 类别 (`fact`: 事实, `style`: 风格) | `INDEX` |
| `content` | `text` | 提取出的具体内容 | - |
| `entity` | `string(100)` | 关联的实体名称（如项目名、人名） | `INDEX` |
| `source_id` | `uint` | 产生的源 Crystal ID | `INDEX` |
| `importance` | `int` | 重要程度 (1-5) | - |
| `author_id` | `uint` | 所属用户 ID | - |
| `created_at` | `datetime` | 采集时间 | - |
| `updated_at` | `datetime` | 更新时间 | - |

---

## 5. 迁移与开发说明
- **迁移方式**：后端 `internal/db/db.go` 中通过 `InitDB()` 调用 GORM 的 `AutoMigrate` 实现全量同步。
- **关系约束**：为了保证 Phase 1-4 的迭代灵活性，目前在物理层面采用弱外键约束，由应用层逻辑保证数据的一致性。
- **扩展建议**：未来在 Phase 5 引入全量向量库后，`memories` 表中的 `content` 字段将被同步至向量数据库以支持语义检索。
