import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '100mb' }));

// File paths
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const POSTS_DIR = path.join(__dirname, 'public', 'posts');
const CONFIG_PATH = path.join(__dirname, 'data', 'site-config.json');
const PHOTOS_PATH = path.join(__dirname, 'data', 'photos.json');
const FRAGMENTS_PATH = path.join(__dirname, 'data', 'fragments.json');
const WALL_PATH = path.join(__dirname, 'data', 'wall.json');
const SECRETS_PATH = path.join(__dirname, 'data', 'secrets.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const DIST_DIR = path.join(__dirname, 'dist');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'plate-admin';
const DEFAULT_AI_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const DEFAULT_AI_MODEL = 'deepseek-ai/DeepSeek-V4-Flash';

fs.mkdirSync(POSTS_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });

// Ensure all data files exist on first run
const DATA_DEFAULTS = [
    [DB_PATH, { posts: [] }],
    [CONFIG_PATH, {}],
    [PHOTOS_PATH, { photos: [] }],
    [FRAGMENTS_PATH, { fragments: [] }],
    [WALL_PATH, { cards: [] }],
    [SECRETS_PATH, {}]
];
DATA_DEFAULTS.forEach(([filePath, fallback]) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    }
});

if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
}

// Helper to read DB
const readDB = () => {
    try {
        if (!fs.existsSync(DB_PATH)) return { posts: [] };
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch (e) {
        console.error('readDB error:', e);
        return { posts: [] };
    }
};

// Helper to write DB
const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const readJson = (filePath, fallback) => {
    try {
        if (!fs.existsSync(filePath)) return fallback;
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
        console.error(`readJson(${filePath}) error:`, e);
        return fallback;
    }
};

const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const getSiteUrl = () => (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

const requireAdmin = (req, res, next) => {
    if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// GET all posts metadata
app.get('/api/posts', (req, res) => {
    try {
        const db = readDB();
        res.json(db.posts);
    } catch (e) {
        console.error('GET /api/posts error:', e);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// GET single post with content
app.get('/api/posts/:id', (req, res) => {
    try {
        const db = readDB();
        const post = db.posts.find(p => p.id === req.params.id);
        if (!post) return res.status(404).json({ error: '文章不存在' });

        const mdPath = path.join(POSTS_DIR, `${post.id}.md`);
        if (fs.existsSync(mdPath)) {
            const content = fs.readFileSync(mdPath, 'utf-8');
            res.json({ ...post, content });
        } else {
            res.status(404).json({ error: '文章 Markdown 文件丢失' });
        }
    } catch (e) {
        console.error('GET /api/posts/:id error:', e);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// POST a new article
app.post('/api/posts', requireAdmin, (req, res) => {
    try {
        const { id, title, excerpt, tags, content } = req.body;
        if (!id || !title || !content) {
            return res.status(400).json({ error: '缺少必填字段：id、title、content' });
        }

        const db = readDB();
        if (db.posts.some(p => p.id === id)) {
            return res.status(400).json({ error: '文章 ID 已存在' });
        }

        const mdPath = path.join(POSTS_DIR, `${id}.md`);
        fs.writeFileSync(mdPath, content);

        const newPost = {
            id,
            title,
            excerpt: excerpt || content.substring(0, 100) + '...',
            date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(),
            tags: tags || [],
            likes: 0,
            comments: []
        };
        db.posts.push(newPost);
        writeDB(db);
        res.status(201).json(newPost);
    } catch (e) {
        console.error('POST /api/posts error:', e);
        res.status(500).json({ error: '保存文章失败' });
    }
});

// PUT (Edit) an article
app.put('/api/posts/:id', requireAdmin, (req, res) => {
    try {
        const { title, excerpt, tags, content } = req.body;
        const db = readDB();
        const postIndex = db.posts.findIndex(p => p.id === req.params.id);
        if (postIndex === -1) return res.status(404).json({ error: '文章不存在' });

        if (title) db.posts[postIndex].title = title;
        if (excerpt) db.posts[postIndex].excerpt = excerpt;
        if (tags) db.posts[postIndex].tags = tags;
        writeDB(db);

        if (content) {
            const mdPath = path.join(POSTS_DIR, `${req.params.id}.md`);
            fs.writeFileSync(mdPath, content);
        }
        res.json(db.posts[postIndex]);
    } catch (e) {
        console.error('PUT /api/posts/:id error:', e);
        res.status(500).json({ error: '更新文章失败' });
    }
});

// DELETE an article
app.delete('/api/posts/:id', requireAdmin, (req, res) => {
    try {
        const db = readDB();
        const postIndex = db.posts.findIndex(p => p.id === req.params.id);
        if (postIndex === -1) return res.status(404).json({ error: '文章不存在' });

        db.posts.splice(postIndex, 1);
        writeDB(db);

        const mdPath = path.join(POSTS_DIR, `${req.params.id}.md`);
        if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
        res.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/posts/:id error:', e);
        res.status(500).json({ error: '删除文章失败' });
    }
});

// POST a like
app.post('/api/posts/:id/like', (req, res) => {
    try {
        const db = readDB();
        const post = db.posts.find(p => p.id === req.params.id);
        if (!post) return res.status(404).json({ error: '文章不存在' });

        post.likes = (post.likes || 0) + 1;
        writeDB(db);
        res.json({ likes: post.likes });
    } catch (e) {
        console.error('POST /api/posts/:id/like error:', e);
        res.status(500).json({ error: '点赞失败' });
    }
});

// POST a comment
app.post('/api/posts/:id/comments', (req, res) => {
    try {
        const { author, text } = req.body;
        if (!author || !text) return res.status(400).json({ error: '缺少评论者或内容' });

        const db = readDB();
        const post = db.posts.find(p => p.id === req.params.id);
        if (!post) return res.status(404).json({ error: '文章不存在' });

        if (!post.comments) post.comments = [];
        const newComment = {
            id: Date.now().toString(),
            author,
            text,
            date: new Date().toISOString()
        };
        post.comments.push(newComment);
        writeDB(db);
        res.status(201).json(newComment);
    } catch (e) {
        console.error('POST /api/posts/:id/comments error:', e);
        res.status(500).json({ error: '评论失败' });
    }
});

app.get('/api/admin/session', requireAdmin, (req, res) => {
    res.json({ authenticated: true });
});

app.get('/api/config', (req, res) => {
    try {
        res.json(readJson(CONFIG_PATH, {}));
    } catch (e) {
        console.error('GET /api/config error:', e);
        res.status(500).json({ error: '读取站点配置失败' });
    }
});

app.put('/api/config', requireAdmin, (req, res) => {
    try {
        writeJson(CONFIG_PATH, req.body || {});
        res.json(req.body || {});
    } catch (e) {
        console.error('PUT /api/config error:', e);
        res.status(500).json({ error: '保存站点配置失败' });
    }
});

app.get('/api/photos', (req, res) => {
    try {
        res.json(readJson(PHOTOS_PATH, { photos: [] }).photos || []);
    } catch (e) {
        console.error('GET /api/photos error:', e);
        res.status(500).json({ error: '读取照片失败' });
    }
});

app.post('/api/photos', requireAdmin, (req, res) => {
    try {
        const photosDb = readJson(PHOTOS_PATH, { photos: [] });
        const photo = {
            id: req.body.id || Date.now().toString(),
            title: req.body.title,
            subtitle: req.body.subtitle || '',
            category: req.body.category || 'street',
            shotTime: req.body.shotTime || '',
            lat: req.body.lat || '',
            lng: req.body.lng || '',
            src: req.body.src,
            alt: req.body.alt || req.body.title || 'Photo'
        };
        if (!photo.title || !photo.src) {
            return res.status(400).json({ error: '缺少照片标题或图片地址' });
        }
        photosDb.photos.push(photo);
        writeJson(PHOTOS_PATH, photosDb);
        res.status(201).json(photo);
    } catch (e) {
        console.error('POST /api/photos error:', e);
        res.status(500).json({ error: '添加照片失败' });
    }
});

app.put('/api/photos/:id', requireAdmin, (req, res) => {
    try {
        const photosDb = readJson(PHOTOS_PATH, { photos: [] });
        const idx = photosDb.photos.findIndex(p => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: '照片不存在' });
        const allowed = ['title', 'subtitle', 'category', 'shotTime', 'lat', 'lng', 'src', 'alt'];
        allowed.forEach(key => {
            if (req.body[key] !== undefined) photosDb.photos[idx][key] = req.body[key];
        });
        writeJson(PHOTOS_PATH, photosDb);
        res.json(photosDb.photos[idx]);
    } catch (e) {
        console.error('PUT /api/photos/:id error:', e);
        res.status(500).json({ error: '更新照片失败' });
    }
});

app.delete('/api/photos/:id', requireAdmin, (req, res) => {
    try {
        const photosDb = readJson(PHOTOS_PATH, { photos: [] });
        photosDb.photos = photosDb.photos.filter((photo) => photo.id !== req.params.id);
        writeJson(PHOTOS_PATH, photosDb);
        res.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/photos/:id error:', e);
        res.status(500).json({ error: '删除照片失败' });
    }
});

// Fragments API
app.get('/api/fragments', (req, res) => {
    try {
        const data = readJson(FRAGMENTS_PATH, { fragments: [] });
        data.fragments.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(data.fragments);
    } catch (e) {
        console.error('GET /api/fragments error:', e);
        res.status(500).json({ error: '读取碎片失败' });
    }
});

app.post('/api/fragments', requireAdmin, (req, res) => {
    try {
        const { text, tags } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: '碎片内容不能为空' });
        }
        const data = readJson(FRAGMENTS_PATH, { fragments: [] });
        const fragment = {
            id: String(Date.now()),
            text: text.trim(),
            date: new Date().toISOString(),
            tags: Array.isArray(tags) ? tags.filter(Boolean) : []
        };
        data.fragments.unshift(fragment);
        writeJson(FRAGMENTS_PATH, data);
        res.status(201).json(fragment);
    } catch (e) {
        console.error('POST /api/fragments error:', e);
        res.status(500).json({ error: '添加碎片失败' });
    }
});

app.put('/api/fragments/:id', requireAdmin, (req, res) => {
    try {
        const data = readJson(FRAGMENTS_PATH, { fragments: [] });
        const idx = data.fragments.findIndex(f => f.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: '碎片不存在' });
        if (req.body.text !== undefined) data.fragments[idx].text = req.body.text.trim();
        if (req.body.tags !== undefined) data.fragments[idx].tags = Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : [];
        writeJson(FRAGMENTS_PATH, data);
        res.json(data.fragments[idx]);
    } catch (e) {
        console.error('PUT /api/fragments/:id error:', e);
        res.status(500).json({ error: '更新碎片失败' });
    }
});

app.delete('/api/fragments/:id', requireAdmin, (req, res) => {
    try {
        const data = readJson(FRAGMENTS_PATH, { fragments: [] });
        data.fragments = data.fragments.filter((f) => f.id !== req.params.id);
        writeJson(FRAGMENTS_PATH, data);
        res.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/fragments/:id error:', e);
        res.status(500).json({ error: '删除碎片失败' });
    }
});

// Wall API
app.get('/api/wall', (req, res) => {
    try {
        const data = readJson(WALL_PATH, { cards: [] });
        res.json(data.cards);
    } catch (e) {
        console.error('GET /api/wall error:', e);
        res.status(500).json({ error: '读取灵感墙失败' });
    }
});

app.post('/api/wall', (req, res) => {
    try {
        const { type, content, x, y, width, color } = req.body;
        if (!type || !content) {
            return res.status(400).json({ error: '缺少卡片类型或内容' });
        }
        const cleanContent = String(content).trim();
        if (!cleanContent || cleanContent.length > 280) {
            return res.status(400).json({ error: '留言内容需在 1-280 字之间' });
        }
        const data = readJson(WALL_PATH, { cards: [] });
        const card = {
            id: String(Date.now()),
            type: ['text', 'quote', 'code'].includes(type) ? type : 'text',
            content: cleanContent,
            x: x || 100,
            y: y || 100,
            width: width || 240,
            color: ['blue', 'yellow', 'green', 'white', 'dark'].includes(color) ? color : 'blue',
            createdAt: new Date().toISOString()
        };
        data.cards.push(card);
        writeJson(WALL_PATH, data);
        res.status(201).json(card);
    } catch (e) {
        console.error('POST /api/wall error:', e);
        res.status(500).json({ error: '创建卡片失败' });
    }
});

app.put('/api/wall/:id', requireAdmin, (req, res) => {
    try {
        const data = readJson(WALL_PATH, { cards: [] });
        const idx = data.cards.findIndex(c => c.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: '卡片不存在' });
        const allowed = ['content', 'x', 'y', 'width', 'color', 'type'];
        allowed.forEach(key => {
            if (req.body[key] !== undefined) data.cards[idx][key] = req.body[key];
        });
        writeJson(WALL_PATH, data);
        res.json(data.cards[idx]);
    } catch (e) {
        console.error('PUT /api/wall/:id error:', e);
        res.status(500).json({ error: '更新卡片失败' });
    }
});

app.delete('/api/wall/:id', requireAdmin, (req, res) => {
    try {
        const data = readJson(WALL_PATH, { cards: [] });
        data.cards = data.cards.filter(c => c.id !== req.params.id);
        writeJson(WALL_PATH, data);
        res.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/wall/:id error:', e);
        res.status(500).json({ error: '删除卡片失败' });
    }
});

// Secrets / API Key config
app.get('/api/secrets', requireAdmin, (req, res) => {
    try {
        const secrets = readJson(SECRETS_PATH, {});
        const key = process.env.SILICONFLOW_API_KEY || secrets.siliconflowApiKey || '';
        res.json({
            siliconflowApiKey: secrets.siliconflowApiKey || '',
            hasEnvApiKey: Boolean(process.env.SILICONFLOW_API_KEY),
            siliconflowApiKeyMasked: key ? '****' + key.slice(-4) : '',
            apiUrl: process.env.SILICONFLOW_API_URL || secrets.apiUrl || DEFAULT_AI_API_URL,
            model: process.env.SILICONFLOW_MODEL || secrets.model || DEFAULT_AI_MODEL
        });
    } catch (e) {
        console.error('GET /api/secrets error:', e);
        res.status(500).json({ error: '读取密钥配置失败' });
    }
});

app.put('/api/secrets', requireAdmin, (req, res) => {
    try {
        const { siliconflowApiKey, apiUrl, model } = req.body;
        const secrets = readJson(SECRETS_PATH, {});
        if (typeof siliconflowApiKey === 'string') secrets.siliconflowApiKey = siliconflowApiKey.trim();
        if (typeof apiUrl === 'string') secrets.apiUrl = apiUrl.trim();
        if (typeof model === 'string') secrets.model = model.trim();
        writeJson(SECRETS_PATH, secrets);
        res.json({ success: true });
    } catch (e) {
        console.error('PUT /api/secrets error:', e);
        res.status(500).json({ error: '保存密钥配置失败' });
    }
});

app.post('/api/upload-image', requireAdmin, (req, res) => {
    try {
        const { fileName, dataUrl } = req.body;
        const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || '');
        if (!fileName || !match) {
            return res.status(400).json({ error: '无效的图片数据' });
        }
        const ext = path.extname(fileName).toLowerCase() || '.png';
        const safeName = `${Date.now()}-${path.basename(fileName, ext).replace(/[^a-zA-Z0-9-_]/g, '-')}${ext}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, safeName), Buffer.from(match[2], 'base64'));
        res.status(201).json({ url: `/uploads/${safeName}` });
    } catch (e) {
        console.error('POST /api/upload-image error:', e);
        res.status(500).json({ error: '图片上传失败' });
    }
});

app.get('/robots.txt', (req, res) => {
    const siteUrl = getSiteUrl();
    res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /editor.html
Disallow: /404.html

Sitemap: ${siteUrl}/sitemap.xml
`);
});

app.get('/sitemap.xml', (req, res) => {
    const siteUrl = getSiteUrl();
    const db = readDB();
    const staticPages = [
        { path: '/', changefreq: 'weekly', priority: '1.0' },
        { path: '/about.html', changefreq: 'monthly', priority: '0.7' },
        { path: '/now.html', changefreq: 'weekly', priority: '0.7' },
        { path: '/archive.html', changefreq: 'weekly', priority: '0.8' },
        { path: '/tags.html', changefreq: 'weekly', priority: '0.8' },
        { path: '/photography.html', changefreq: 'monthly', priority: '0.6' },
        { path: '/fragments.html', changefreq: 'weekly', priority: '0.6' },
        { path: '/graph.html', changefreq: 'weekly', priority: '0.5' },
        { path: '/wall.html', changefreq: 'weekly', priority: '0.5' }
    ];
    const urls = [
        ...staticPages,
        ...db.posts.map((post) => ({
            path: `/article.html?id=${encodeURIComponent(post.id)}`,
            changefreq: 'monthly',
            priority: '0.8'
        }))
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => `  <url><loc>${siteUrl}${item.path}</loc><changefreq>${item.changefreq}</changefreq><priority>${item.priority}</priority></url>`).join('\n')}
</urlset>`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
});

// RSS Feed
app.get('/rss.xml', (req, res) => {
    const db = readDB();
    const siteUrl = getSiteUrl();
    const items = db.posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/article.html?id=${post.id}</link>
      <guid>${siteUrl}/article.html?id=${post.id}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || ''}]]></description>
    </item>`).join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Plate. Blog</title>
    <link>${siteUrl}</link>
    <description>Algorithm &amp; Aesthetics</description>
    <language>zh-CN</language>${items}
  </channel>
</rss>`;
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(xml);
});

// AI proxy — keeps API key server-side
app.post('/api/ai', async (req, res) => {
    const secrets = readJson(SECRETS_PATH, {});
    const apiKey = process.env.SILICONFLOW_API_KEY || secrets.siliconflowApiKey;
    if (!apiKey) {
        return res.status(503).json({ error: 'AI service not configured' });
    }
    const apiUrl = process.env.SILICONFLOW_API_URL || secrets.apiUrl || DEFAULT_AI_API_URL;
    const body = { ...req.body };
    body.model = process.env.SILICONFLOW_MODEL || secrets.model || body.model || DEFAULT_AI_MODEL;
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('AI proxy error:', err);
        res.status(502).json({ error: 'AI upstream unreachable' });
    }
});

app.use((err, req, res, next) => {
    if (err?.type === 'entity.too.large') {
        return res.status(413).json({
            error: `请求体过大，请压缩图片或提高 JSON_BODY_LIMIT（当前：${process.env.JSON_BODY_LIMIT || '100mb'}）`
        });
    }
    next(err);
});

app.listen(PORT, () => {
    console.log(`🚀 Plate. CMS Backend running on http://localhost:${PORT}`);
});
