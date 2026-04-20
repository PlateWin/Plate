# Phase 5 UI 设计语言调研与方向

## 1. 文档目的

这份文档用于定义 FlowCrystal 第五阶段的 UI 打磨方向。

目标不是单纯“变得更像 Apple”，而是：

- 建立一套统一、克制、高级的设计语言
- 解决当前界面臃肿、层级混乱、局部不精致的问题
- 让 FlowCrystal 更像一个值得长期使用的“智能工作台”
- 在 Apple 官方设计原则的启发下，形成适配本项目的视觉系统

结论先行：

> FlowCrystal 第五阶段应当采用“Apple 式层级与秩序”作为底层方法，
> 但视觉表达必须保留我们自己的深色知识工作台气质，不能直接做成 macOS 仿品。

---

## 2. 当前界面问题诊断

结合现有界面截图、当前实现和已有 UI 文档，当前 UI 的核心问题不是“丑”，而是“信息组织和视觉语法不够高级”。

### 2.1 主要问题

1. 控件过多，且都在抢注意力  
侧栏模式切换、频道、用户状态、编辑器头部按钮、右侧记忆卡片都在用较强边框、较强描边、较明显胶囊感，导致界面发紧。

2. 面板层级不够清楚  
现在很多区域都长得像“一级卡片”，主舞台、侧栏、编辑器容器、输入框、右侧记忆面板之间缺少明确的主次关系。

3. 视觉语言不统一  
有些区域偏“工业冷黑控制台”，有些区域偏“霓虹玻璃”，有些又接近普通 SaaS。单独看还行，合在一起就显得不够高级。

4. Apple 风格最重要的“留白”和“宁静感”不足  
当前界面更像功能模块拼装，而不是一个被高度整理过的工作环境。

5. 微交互不够收敛  
状态胶囊、边框、按钮 hover、强调色使用频率偏高，导致整体显得“设计做了很多”，但不够“贵”。

### 2.2 截图中最明显的症状

- 左侧栏内容密度高，但节奏单一，像“竖着堆功能”
- 顶栏品牌区和右上系统按钮之间缺少更高级的节奏编排
- 聊天主区域太空，但输入区和消息卡片又太重
- Crystal 页面头部按钮数量偏多，且都是同等级别
- Memory Vault 的信息是完整的，但卡片重复感强，容易显得“厚重”

---

## 3. Apple 官方设计调研结论

本节只提取对 FlowCrystal 真正有帮助的内容。

### 3.1 官方资料来源

- Apple HIG 总览  
  https://developer.apple.com/design/human-interface-guidelines/
- Apple HIG Materials  
  https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/materials/
- Apple HIG Layout  
  https://developer.apple.com/design/human-interface-guidelines/layout
- Apple HIG Sidebars  
  https://developer.apple.com/design/human-interface-guidelines/sidebars
- Apple HIG Toolbars  
  https://developer.apple.com/design/human-interface-guidelines/toolbars
- Apple HIG Search Fields  
  https://developer.apple.com/design/human-interface-guidelines/search-fields

### 3.2 与 FlowCrystal 最相关的 Apple 原则

#### A. Hierarchy

Apple 强调：

- 控件和内容必须有明确层级
- 最重要的内容优先放在阅读路径起点
- 不要让所有元素都像主要元素

对 FlowCrystal 的意义：

- 聊天内容、编辑器正文、记忆内容是主内容
- 模式切换、筛选、状态、辅助面板都必须退后一级
- 当前界面最需要的不是更多装饰，而是更明确的主次

#### B. Harmony

Apple 强调：

- 元素之间要保持统一的几何关系
- 轮廓、圆角、间距、边界要形成整体感

对 FlowCrystal 的意义：

- 现在我们的圆角体系、边框强度、胶囊样式没有严格分级
- 第五阶段必须建立统一的几何系统和设计 tokens

#### C. Materials

Apple 对材质的重点不是“透明”，而是：

- 用材质区分层级
- 用材质暗示前后关系
- 不要为了颜色好看而乱用材料

对 FlowCrystal 的意义：

- 我们可以保留深色半透和轻微玻璃感
- 但不应该继续堆重 blur、重 glow、重边框
- 材质要承担结构职责，而不是单纯“炫”

#### D. Sidebars

Apple 对侧栏的重点是：

- 侧栏是导航层，不是功能堆放层
- 不宜太深层级
- 内容要支持扫描
- 不要在底部放关键操作

对 FlowCrystal 的意义：

- 当前 Sidebar 需要更强的“导航骨架感”
- 频道、Crystals、Memory 入口要更像同一系统
- 不要让侧栏自己成为一个强视觉主角

#### E. Toolbars

Apple 对工具栏的重点是：

- 承担定位、导航、频繁操作
- 避免拥挤
- 操作必须经过筛选

对 FlowCrystal 的意义：

- 编辑器头部按钮需要重新分级
- “返回 / 标题 / 状态 / 次级操作 / 危险操作”应分层组织
- 不是所有按钮都要做成显眼胶囊

#### F. Search

Apple 对搜索的重点是：

- 搜索位置要稳定
- placeholder 要说明搜什么
- 如有范围切换，应明确 scope

对 FlowCrystal 的意义：

- 侧栏搜索和 Memory Vault 搜索都应该更像“明确的过滤器”
- 不应该只是一个长得像输入框的装饰块

---

## 4. 为什么不能直接照搬 Apple 风格

FlowCrystal 和典型 Apple app 有本质差异。

### 4.1 产品属性不同

Apple 自家应用很多是：

- 内容消费型
- 轻任务型
- 系统原生一致性优先

FlowCrystal 是：

- 长时间停留型
- 创作和知识组织型
- AI 协作型
- 需要更强“工作台感”

### 4.2 视觉语境不同

Apple 常见语境：

- 明亮
- 中性
- 系统原生

FlowCrystal 当前更适合：

- 深色
- 安静
- 沉浸
- 带轻微未来感

因此第五阶段的方向应是：

> 借鉴 Apple 的秩序、节奏、层级、材质逻辑，
> 但保留 FlowCrystal 的深色知识工作台和 AI 辅助气质。

---

## 5. 适配 FlowCrystal 的第五阶段设计语言

### 5.1 总体定位

FlowCrystal Phase 5 的设计语言建议定义为：

> Quiet Intelligence Workspace

关键词：

- Quiet
- Precise
- Layered
- Ambient
- Focused
- Trustworthy

中文表达：

> 安静、精确、有层次、克制、可信的智能工作台

### 5.2 风格目标

不是：

- 科幻感过强
- 赛博朋克
- 花哨玻璃拟态
- 普通后台管理系统

而是：

- 高级桌面应用
- 有 Apple 式秩序
- 有 Linear 式精确
- 有 Notion/Obsidian 式长期使用舒适感
- 有属于 FlowCrystal 的 AI 和记忆气质

---

## 6. Phase 5 视觉原则

### 6.1 内容优先于控件

聊天内容、编辑器正文、记忆内容是第一主角。

控件必须服务内容，不应把注意力从内容上拽走。

### 6.2 层级少而清楚

建议整个产品只保留四层视觉层级：

1. 环境背景层
2. 容器层
3. 内容层
4. 控件与状态层

不要继续增加“第五种、第六种卡片语法”。

### 6.3 重点来自对比，不来自堆装饰

高级感来自：

- 留白
- 位置
- 尺寸
- 明暗关系
- 节奏

不来自：

- 更粗边框
- 更多发光
- 更多胶囊
- 更多 blur

### 6.4 强调色应当“少而准”

当前蓝青色系是对的，但使用频率过高。

建议：

- 青蓝仅用于主选中、关键链接、AI 激活态
- 紫色只保留给 Crystal 相关语义
- 绿色只用于系统健康或同步成功
- 危险操作统一为低饱和暗红，不抢主界面气质

### 6.5 Apple 感来自秩序，不来自仿 macOS

不要做：

- 明显仿原生交通灯按钮视觉
- 过度 Liquid Glass
- 过于圆润的 iOS 式组件堆叠

要做：

- 更收敛的工具栏
- 更清楚的侧栏
- 更自然的材质层级
- 更统一的间距和圆角系统

---

## 7. 组件级重构建议

### 7.1 TitleBar

问题：

- 当前品牌区不错，但信息层次还偏“横向排块”
- 在线状态胶囊略显悬浮，与整体结构衔接不够高级

方向：

- 标题栏变得更薄、更精确
- 品牌和状态整合成一条更安静的系统信息带
- 减少独立胶囊数量
- 窗口按钮弱化，避免抢品牌区

应有气质：

- 像桌面应用的上边框，不像网页头部

### 7.2 Sidebar

问题：

- 当前侧栏承担了太多“有存在感的组件”
- Workspace Modes、Channels、Synchronized、用户卡片都很像重点

方向：

- 重新建立导航节奏：模式 > 当前集合 > 列表 > 账户
- 模式切换从“厚胶囊组”改为更轻、更精确的 segmented navigation
- 减少每个列表项的边框和容器感
- 让选中态依赖色带、底色和文字强弱，而不是粗边框

应有气质：

- 像一个非常安静的导航骨架

### 7.3 Chat 主区

问题：

- 顶部栏、消息卡、底部输入区视觉重量不平衡
- 页面中段空旷但缺少节奏

方向：

- 顶部 channel bar 更薄
- 消息卡去掉过重边界，改为更平的内容浮层
- 输入区更像固定的底部工具条，而不是一块单独大盒子
- 空状态应更有方向感，而不是纯留黑

应有气质：

- 像“消息流 + 底部指令栏”的专业工作区

### 7.4 Crystal Editor

问题：

- 头部按钮多，且同级
- 正文容器和右栏都偏重
- 记忆面板信息完整，但不够精炼

方向：

- 头部改为三段结构：返回与定位 / 文档信息 / 操作
- 把保存状态做成系统状态，不再和按钮抢权重
- 主正文区域更轻、更安静、更像写作舞台
- 右侧记忆面板减少嵌套卡片，强化信息摘要和来源关系

应有气质：

- 像写作和思考的主舞台，辅助智能围绕它服务

### 7.5 Memory Vault

问题：

- 现在信息很全，但卡片重复度高，阅读疲劳
- 左右两列都较重，导致页面厚

方向：

- 把统计卡、筛选条、列表、右侧说明做出更清楚的层级
- 列表卡片减少边框堆叠，强调文本和元信息组织
- importance 调整控件更简洁
- 删除按钮危险感保留，但不应突出成整页视觉噪音

应有气质：

- 像个人知识和记忆档案馆，而不是管理后台

---

## 8. 建议建立的统一设计 tokens

第五阶段必须把视觉风格从“写在组件里”升级成“写进系统里”。

建议新增或重构以下 tokens：

### 8.1 Radius

- `--radius-window`
- `--radius-panel`
- `--radius-card`
- `--radius-control`
- `--radius-pill`

### 8.2 Spacing

- `--space-2`
- `--space-3`
- `--space-4`
- `--space-6`
- `--space-8`
- `--space-10`

### 8.3 Surfaces

- `--surface-window`
- `--surface-sidebar`
- `--surface-panel`
- `--surface-subpanel`
- `--surface-control`
- `--surface-selected`

### 8.4 Borders

- `--border-subtle`
- `--border-default`
- `--border-strong`
- `--border-accent`
- `--border-danger`

### 8.5 Text

- `--text-primary`
- `--text-secondary`
- `--text-tertiary`
- `--text-muted`
- `--text-accent`

### 8.6 Status

- `--status-online`
- `--status-sync`
- `--status-memory`
- `--status-danger`

---

## 9. 第五阶段落地路线

### Phase 5A: 视觉减重

先做减法。

- 减少重复边框
- 减少无意义胶囊
- 减少高亮元素数量
- 减少不同区域抢主视觉

### Phase 5B: 统一布局和组件语言

- 重构 TitleBar / Sidebar / Header / Input Bar
- 建立统一的按钮、标签、搜索、状态规范
- 统一圆角、阴影、边界和间距

### Phase 5C: 建立 Apple 式秩序感

- 更明确的层级
- 更稳定的搜索与工具栏位置
- 更轻的控制区、更强的内容区
- 更清楚的导航骨架

### Phase 5D: 建立 FlowCrystal 自身气质

- Memory / AI / Crystal 的视觉语义分层
- 更统一的命名与状态表达
- 把“安静智能”做成产品识别度

---

## 10. 设计决策原则

第五阶段后，任何 UI 变更都应先问：

1. 这个改动有没有减少噪音？
2. 这个改动有没有强化主次？
3. 这个改动有没有让界面更适合长时间停留？
4. 这个改动是在增强系统感，还是只是在增加装饰？
5. 这个改动是否更接近“安静的智能工作台”？

如果答案大多是否定的，就不应该做。

---

## 11. 最终方向

FlowCrystal 第五阶段的正确方向不是：

> 做一个看起来像 Apple 的 app

而是：

> 用 Apple 的设计秩序，重做一个真正属于 FlowCrystal 的统一界面系统

一句话总结：

> Phase 5 = 用 Apple 式层级、材质和工具栏逻辑，
> 打磨出一套深色、克制、安静、高级的 FlowCrystal 智能工作台设计语言。
