# 部署指南

本文档用于从一台新机器完整跑通 Plate.，并说明推荐上线结构。

## 推荐发布结构

推荐使用 **Express 同域部署**：

```text
https://your-domain.com/          → 前端静态页面
https://your-domain.com/api/...   → Express API
https://your-domain.com/rss.xml   → RSS
```

这种结构最简单，前端生产环境默认请求同域 `/api`，不需要额外修改前端代码。

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 准备环境变量

```bash
cp .env.example .env
```

然后编辑 `.env`，至少设置：

```text
ADMIN_TOKEN=your-admin-token-here
SITE_URL=http://localhost:3001
```

AI 助手需要可用 Key 时再填写：

```text
SILICONFLOW_API_KEY=
SILICONFLOW_API_URL=https://api.siliconflow.cn/v1/chat/completions
SILICONFLOW_MODEL=deepseek-ai/DeepSeek-V4-Flash
```

### 3. 启动后端 API

```bash
npm run server
```

默认地址：

```text
http://localhost:3001
```

### 4. 启动前端开发服务

另开一个终端：

```bash
npm run dev
```

访问：

```text
http://localhost:5173
http://localhost:5173/editor.html
```

本地开发时，前端会请求：

```text
http://localhost:3001/api
```

## 生产部署：Express 同域部署（推荐）

### 1. 安装依赖

```bash
npm install
```

### 2. 构建前端

```bash
npm run build
```

构建产物会生成到：

```text
dist/
```

### 3. 配置环境变量

生产环境至少配置：

```text
ADMIN_TOKEN=your-strong-admin-token
SITE_URL=https://your-domain.com
PORT=3001
```

可选 AI 配置：

```text
SILICONFLOW_API_KEY=your-api-key
SILICONFLOW_API_URL=https://api.siliconflow.cn/v1/chat/completions
SILICONFLOW_MODEL=deepseek-ai/DeepSeek-V4-Flash
```

### 4. 启动服务

```bash
npm run server
```

当 `dist/` 存在时，`server.js` 会托管构建后的前端静态文件，并继续提供 `/api`、`/rss.xml` 等后端能力。

### 5. 反向代理建议

如果部署到自己的服务器，建议使用 Nginx / Caddy 将公网域名代理到 Node 服务端口。

示例访问结构：

```text
https://your-domain.com/            → 首页
https://your-domain.com/editor.html → 后台
https://your-domain.com/api/posts   → API
https://your-domain.com/rss.xml     → RSS
```

## Railway 部署建议

1. Fork 或上传本项目到 Git 仓库
2. 在 Railway 新建 Node.js 项目并连接仓库
3. 设置环境变量：
   - `ADMIN_TOKEN`
   - `SITE_URL`
   - `SILICONFLOW_API_KEY`，可选
   - `SILICONFLOW_API_URL`，可选
   - `SILICONFLOW_MODEL`，可选
4. Build Command：
   ```bash
   npm install && npm run build
   ```
5. Start Command：
   ```bash
   npm run server
   ```
6. 将 Railway 生成的公网地址填入 `SITE_URL`
7. 如绑定自定义域名，将 `SITE_URL` 改为最终域名

## 前后端分离部署

如果前端部署到 Vercel / Netlify，后端部署到 Railway / Render，则需要显式指定 API 地址。

在入口 HTML 的业务脚本之前注入：

```html
<script>
  window.__PLATE_API_ROOT__ = 'https://your-api.example.com/api';
</script>
```

然后前端会请求：

```text
https://your-api.example.com/api
```

注意：

- 后端仍需运行 `server.js`
- 后端必须允许前端域名访问
- `SITE_URL` 应填写前端公开域名
- 上传图片、RSS、AI 代理、后台接口都依赖后端服务

## API 路径策略

前端 API 入口统一由 `assets/js/config.js` 解析：

| 场景 | API Root |
|------|----------|
| Vite 本地开发（`:5173`） | `http://localhost:3001/api` |
| Express 同域生产部署 | `/api` |
| 前后端分离部署 | `window.__PLATE_API_ROOT__` |

所有文章、配置、摄影、碎片、Wall、AI 请求都应通过 `config.js` 导出的 API 地址派生，不在业务脚本中硬编码生产 API 地址。

## 环境变量说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_TOKEN` | 是 | 管理员令牌，用于后台登录鉴权 |
| `PORT` | 否 | 后端监听端口，默认 `3001` |
| `SITE_URL` | 否 | 站点公开 URL，用于 RSS Feed 生成，默认 `http://localhost:3001` |
| `SILICONFLOW_API_KEY` | 否 | AI 助手所需的 API Key，不填则 AI 助手显示禁用提示 |
| `SILICONFLOW_API_URL` | 否 | OpenAI 兼容聊天接口地址，默认 SiliconFlow Chat Completions |
| `SILICONFLOW_MODEL` | 否 | AI 助手使用的模型名，默认 `deepseek-ai/DeepSeek-V4-Flash` |

## 密钥与 AI 配置优先级

AI 助手配置来源：

1. 环境变量
2. 后台 API 配置面板，写入 `data/secrets.json`
3. 默认值

优先级：

```text
环境变量 > data/secrets.json > 默认值
```

其中 `SILICONFLOW_API_KEY` 没有默认值。未配置时，`/api/ai` 会返回 `503`，前端 AI 助手会显示“API Key 还没配置”的可恢复提示。

`data/secrets.json` 已在 `.gitignore` 中忽略，不应提交到版本库。

## 发布前验证清单

部署完成后逐项检查：

- 首页可以打开
- `/editor.html` 可以打开
- 管理员令牌可以登录
- `/api/posts` 返回文章列表
- `/api/config` 返回站点配置
- `/api/photos` 返回摄影数据
- `/rss.xml` 可以访问
- 新建或编辑文章后前台刷新正常
- 上传图片后图片可访问
- 未配置 AI Key 时 AI 助手有明确提示
- 配置 AI Key 后 AI 助手可正常响应

## 常见问题

### 前台页面能打开，但文章加载失败

检查后端是否正在运行，以及前端实际请求的 API Root 是否正确。

### 生产环境仍然请求 localhost

检查是否通过 Vite 开发服务访问了生产页面。正式部署应访问构建后的 `dist/` 或同域 Express 服务。

### RSS 链接是 localhost

设置：

```text
SITE_URL=https://your-domain.com
```

然后重启后端。

### 后台无法登录

确认启动服务时设置的 `ADMIN_TOKEN` 与后台输入一致。

### AI 助手提示未配置

配置 `SILICONFLOW_API_KEY`，或者登录后台在 API 配置面板写入 Key。

## 默认管理员令牌

未设置 `ADMIN_TOKEN` 环境变量时，系统使用默认令牌：

```text
plate-admin
```

正式部署时必须修改为自定义强令牌。
