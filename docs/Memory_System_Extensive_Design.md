# Project Crystal: 个性化记忆系统 (PMS) 超详细设计与技术白皮书

## 1. 引言

### 1.1 项目背景
在当代 AI 协作与知识管理（Knowledge Management）领域，传统的 AI 助手往往面临“冷启动”和“语境缺失”的问题。用户在每次开启新的写作任务时，都需要反复向 AI 解释背景资料、项目细节以及特定的语言风格。为了解决这一痛点，Project Crystal 引入了**个性化记忆系统 (Personalized Memory System, PMS)**。该系统不仅是数据的存储库，更是用户思维的实时镜像。针对大规模知识库、长文档编写、以及特定业务场景下的写作需求，PMS 提供了自动化的知识沉淀与召回机制。

### 1.2 系统目标
PMS 的核心目标是构建一个“可生长的、数字化的第二大脑”。它能够自动从用户的笔耕不辍中汲取养分，将碎片化的信息提炼为结构化的知识，并在恰当的时机（如续写、总结或对话时）主动召回。
- **智能化**：无需手动打标签，AI 自动根据内容重要性进行分级。
- **个性化**：深刻理解用户的独特用词、逻辑结构和专业背景。
- **高性能**：毫秒级的召回速度，不影响实时的打字与补全体验。
- **可扩展**：从现有的 MySQL 架构平滑过渡到基于图数据库的复杂关系网。

---

## 2. 深度参考与竞品分析

为了构建世界一流的记忆系统，我们深入调研了市面上主流的记忆管理工具及其实现逻辑。

### 2.1 Memos (原子化捕捉与隐私控制)
*参考对象：Use-Memos (GitHub 开源项目)*
- **核心理念**：Memos 强调“轻量级卡片式捕捉”，其灵感来源于 Flomo。
- **系统借鉴**：PMS 采用了 Memos 的原子化存储方案。我们认为，记忆的有效性在于其粒度（Granularity）。长文档难以在实时补全中发挥价值，因此系统会将文档拆解为“知识原子”（Memorandum Atoms）。
- **隐私性**：Memos 的私有部署特性是我们的核心考量。PMS 的数据存储完全位于本地 MySQL 实例中，确保了企业级和个人隐私的绝对安全。

### 2.2 Mem.ai (主动式语境注入与 AI 检索)
*参考对象：Mem.ai (AI-Native 笔记先行者)*
- **核心理念**：Mem 的独到之处在于其“自组织”能力，即不需要文件夹。
- **系统借鉴**：PMS 实现了**主动召回 (Proactive Recall)** 机制。与传统搜索不同，主动召回是“搜寻用户”而非“用户搜寻”。我们复刻了其上下文相关性排名逻辑，确保注入到 Prompt 中的记忆是最相关的 Top-N。

### 2.3 Obsidian & Roam (图谱与双链)
*参考对象：Logseq, Obsidian, Roam Research*
- **核心理念**：双向链接（Bi-directional Links）揭示了知识间的非线性关系。
- **系统借鉴**：PMS 为每一条记忆保留了 `SourceID` 溯源链。我们不仅借鉴了其双向链接的思想，更在数据模型中预留了 `Entity` (实体) 字段，这为未来构建类似于 Obsidian 的“全局关系图谱”打下了坚实基础。

---

## 3. 系统总体架构设计

系统采用分层解耦的五层架构，确保了高并发场景下的稳定性。

### 3.1 监听层 (Event Listener / Hook)
- **职责**：监听 Crystal 文档的变更事件（Save/Update）。
- **机制**：前端触发 `PUT /api/v1/crystals/:slug` 时，后端在事务提交后立即发布异步事件。使用 Go Channels 缓冲任务，防止因 AI 请求耗时导致接口超时。

### 3.2 提取引擎 (Ingestion & Extraction Engine)
- **职责**：利用大模型 (SiliconFlow) 的 NLP 能力提炼“知识精髓”。
- **过程**：系统将新旧文本进行 Diff 对比，仅提取增量部分的知识，降低 API 成本并提高准确性。

### 3.3 语义分析与分类层 (Classifier Layer)
- **维度一：事实维度 (Knowledge Entities)**：提取项目名、人名、时间节点。
- **维度二：风格维度 (Style Fingerprint)**：提取用词偏好、破折号使用频率、专业术语分布。

### 3.4 存储与分级层 (Storage Layer)
- **职责**：持久化知识，并根据“遗忘曲线”和“热度”进行评分。
- **数据库**：MySQL 8.0。未来计划引入向量数据库（Vector DB）进行 Embedding 检索。

### 3.5 决策与召回层 (Decision & Recall Layer)
- **职责**：在用户触发 `Tab` 补全或 `/Summary` 命令时，计算当前语境的“相关性得分”。
- **算法**：BM25 (关键词) + Cosine Similarity (语义) 的混合检索。

---

## 4. 详细数据模型设计 (Database Schema)

### 4.1 数据字典：`memories` 表

| 字段名 | 类型 | 长度 | 默认值 | 约束 | 描述 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `unsigned big int` | 20 | - | Primary Key | 全局唯一 ID |
| `author_id` | `unsigned int` | 10 | 0 | Index | 归属用户 ID |
| `category` | `varchar` | 20 | 'fact' | NOT NULL | `fact` (事实), `style` (风格), `rule` (规则) |
| `entity_type` | `varchar` | 50 | - | Index | 实体类型：`PROJECT`, `PERSON`, `TERM` |
| `content` | `text` | - | - | NOT NULL | 记忆条目的具体描述文本 |
| `raw_snippet` | `text` | - | - | - | 提取该记忆的原始文本片段 (用于调试) |
| `source_id` | `unsigned big int` | 20 | - | Foreign Key | 关联的 Crystal ID |
| `importance` | `tiny int` | 3 | 3 | Index | 权重 (1-5)，5 为最高 |
| `access_count` | `int` | 11 | 0 | - | 被召回并采用的频次 (热度逻辑) |
| `expiry_date` | `datetime` | - | NULL | - | 临时记忆的有效期 (针对截止日期) |
| `created_at` | `datetime` | - | CURRENT_TIMESTAMP | - | 采集时间 |
| `updated_at` | `datetime` | - | CURRENT_TIMESTAMP | - | 更新时间 |

### 4.2 索引设计详述
1.  **Composite Index (entity_type, category)**：用于快速筛选特定类别的知识。
2.  **Author Source Index (author_id, source_id)**：用于处理当原文档被删除时，级联清理相关记忆。
3.  **Importance Heat Index (importance, access_count)**：用于 Top-K 召回排序。

---

## 5. 提取引擎 (Extraction) 的 Prompt 设计专题

这是 PMS 的灵魂所在。一个好的 Prompt 决定了记忆的“含金量”。

### 5.1 事实提取 (Knowledge Protocol)
**系统提示词 (System Prompt):**
> “你是 Project Crystal 的‘知识管理员’。你的任务是分析这段文字，提取出：
> 1. 项目计划与里程碑。
> 2. 人员分工与职责。
> 3. 技术规范与架构决策。
> 4. 专有名词的定义。
> 仅返回 JSON 数组。每个对象需包含 `entity` 和 `fact` 字段。”

### 5.2 风格指纹提取 (Style Fingerprinting)
**系统提示词 (System Prompt):**
> “请像语言学导师一样，审视这段文字。识别出用户的独家风格。
> 例如：是否喜欢用疑问句引导？是否避讳使用被动语态？是否喜欢在结尾处加上总结性金句？
> 请用 3 条规则概括，每条不超过 30 字。”

---

## 6. 召回与注入 (Recall & Injection) 的实现算法

### 6.1 召回算法流程 (Sequence)
1.  **捕捉 Context**：获取光标前 200 个字符。
2.  **词法分析**：提取当前句子中的名词短语。
3.  **数据库匹配**：
    -   `SELECT * FROM memories WHERE entity LIKE '%keyword%' AND importance >= 3 ORDER BY access_count DESC LIMIT 5`
4.  **风格覆盖**：
    -   `SELECT content FROM memories WHERE category = 'style' ORDER BY importance DESC LIMIT 2`

### 6.2 动态注入 (Prompt Engineering Loop)
系统逻辑会将以上召回内容拼接成引导词。例如：
```markdown
[System Instruction Update]
你现在处于“记忆模式”。
已知事实：[事实 A, 事实 B]
用户风格准则：[准则 C]
请基于以上背景，补全用户接下来的输入。
```

---

## 7. 前端组件与交互细节设计

### 7.1 编辑器 UI 增强
- **Aura 动画状态机**：
    - `IDLE`: 灰色，无动作。
    - `EXTRACTING`: 呼吸灯效果，浅紫色。
    - `SUCCESS`: 短暂变绿，表示新知识已入库。
    - `FAILURE`: 短暂变红，提示资源受限或 API 错误。

### 7.2 记忆面板 (Memory Sidebar)
- **展示逻辑**：按时间倒序排列提取出的“原子卡片”。
- **操作互动**：用户可以点击卡片上的“撤销”按钮，如果觉得 AI 提取得不对。
- **记忆增强**：用户可以手动输入一条“永久记忆”（如：我的生日是 X 月 X 日），永不遗忘。

---

## 8. 性能优化与伸缩逻辑

对于 500 行及以上的系统，性能考量至关重要。

### 8.1 缓存策略 (Redis/LocalCache)
- **Hot Memories**: 将热度前 100 的全局记忆常驻在本地缓存（Go-cache）中。
- **Session Cache**: 在用户编辑当前 Crystal 时，其对应的记忆直接进内存缓存。

### 8.2 批量异步处理 (Batching)
- **合并请求**：当用户短时间内疯狂保存时，系统会聚合近 30 秒的变更，进行一次性 AI 提取，节省 API 消耗。

---

## 9. 扩展：面向图数据库 (Towards Graph DB) 的路线图

目前的存储是扁平的，未来我们将引入 **Entity-Relation** 的全图。

### 9.1 关联逻辑
- 如果记忆 A 提到“Lumina 项目”，记忆 B 提到“React 19”。
- 系统会自动建立关联 `(Lumina)-[USES]->(React 19)`。

### 9.2 关联推理 (Reasoning)
当用户查询“Lumina 项目的技术栈”时，即便当前总结里没写 React 19，系统也能通过图路径发现这一关联并告诉用户。

---

## 10. 安全与隐私架构 (Security & Compliance)

### 10.1 数据脱敏 (Data Sanitization)
在内容发送给 SiliconFlow 前，使用正则表达式匹配并模糊处理：
- 手机号 -> `138****5678`
- 身份证 -> `320**********X`
- 密码 -> `[PROTECTED]`

---

## 11. 测试与验证用例 (QA)

| 场景 ID | 测试场景 | 预期结果 |
| :--- | :--- | :--- |
| TM-01 | 保存包含新日期的文档 | `memories` 表产生一条 `fact` 记录，包含该日期。 |
| TM-02 | 用户修改写作风格从正式变为欢脱 | 提取引擎生成新的 `style` 规则，且重要性分级覆盖旧规则。 |
| TM-03 | 数据库连接断开 | 前端保存正常，提取任务存入 Retry Queue，并在恢复后重新执行。 |

---

## 12. 详细 API 接口列表 (RESTful API)

### 12.1 获取当前相关记忆
- **GET** `/api/v1/memory/relevant`
- **Params**: `context_text`, `limit`

### 12.2 管理个人记忆库
- **GET** `/api/v1/memory/list`
- **POST** `/api/v1/memory/create` (手动添加知识)
- **DELETE** `/api/v1/memory/:id`

---

## 13. 系统初始化与部署建议

### 13.1 环境要求
- **Backend**: Go 1.21+
- **DB**: MySQL 8.0 (推荐开启全文索引)
- **AI**: SiliconFlow API Key (支持 Qwen/Llama 模型)

---

## 14. 结语

Project Crystal 的 PMS 系统旨在打破 AI 的“遗忘魔咒”。通过原子化存储、双维度提取和主动召回，我们打造了一个不仅能写、更能记、甚至能思考的智能辅助环境。未来，随着图数据库的加入，晶体 (Crystal) 之间的连结将更加紧密。

---
*版本：v1.3.0 (白皮书深度增强版)*
*日期：2026-04-14*
*编写：Crystal 工程部*
