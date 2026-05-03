# 部署指南

## 方案一：本地开发

```bash
# 复制环境变量模板
cp .env.example .env
# 编辑 .env 填入你的配置

# 安装依赖
npm install

# 启动后端 API（:3001）
npm run server

# 另开终端启动前端（:5173）
npm run dev
```

访问：
- 前台首页：`http://localhost:5173`
- 管理后台：`http://localhost:5173/editor.html`

## 方案二：Railway（推荐，零配置云部署）

1. Fork 本仓库
2. 在 [Railway](https://railway.app) 新建项目，连接 GitHub 仓库
3. 在 Railway 环境变量面板填入以下变量：
   - `ADMIN_TOKEN` — 你的管理员令牌
   - `SILICONFLOW_API_KEY` — SiliconFlow API Key（可选）
   - `SITE_URL` — 你的站点公开 URL
4. Start Command 设置为 `node server.js`
5. 前端静态文件通过 Vite 构建后由 Express 静态托管

## 方案三：Vercel + 独立后端

前端和后端分开部署：

1. **前端部署到 Vercel**
   ```bash
   npm run build
   ```
   将 `dist/` 目录部署到 Vercel

2. **后端部署到 Railway / Render**
   - 部署 `server.js` 到任意 Node.js 平台
   - 设置环境变量

3. **修改前端 API 地址**
   - 在前端代码中将 API 请求地址改为后端公网 URL

## 环境变量说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_TOKEN` | 是 | 管理员令牌，用于后台登录鉴权 |
| `SILICONFLOW_API_KEY` | 否 | AI 助手所需的 API Key，不填则 AI 助手显示禁用提示 |
| `SITE_URL` | 否 | 站点公开 URL，用于 RSS Feed 生成，默认 `http://localhost:3001` |

## 默认管理员令牌

未设置 `ADMIN_TOKEN` 环境变量时，系统使用默认令牌 `plate-admin`。

**强烈建议**部署后第一时间修改为自定义令牌。
