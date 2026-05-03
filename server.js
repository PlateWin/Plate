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
app.use(express.json({ limit: '25mb' }));

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

if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
}

// Helper to read DB
const readDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        return { posts: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
};

// Helper to write DB
const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const readJson = (filePath, fallback) => {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
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
    const db = readDB();
    res.json(db.posts);
});

// GET single post with content
app.get('/api/posts/:id', (req, res) => {
    const db = readDB();
    const post = db.posts.find(p => p.id === req.params.id);
    
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }

    const mdPath = path.join(POSTS_DIR, `${post.id}.md`);
    if (fs.existsSync(mdPath)) {
        const content = fs.readFileSync(mdPath, 'utf-8');
        res.json({ ...post, content });
    } else {
        res.status(404).json({ error: 'Markdown file not found' });
    }
});

// POST a new article
app.post('/api/posts', requireAdmin, (req, res) => {
    const { id, title, excerpt, tags, content } = req.body;
    
    if (!id || !title || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = readDB();
    if (db.posts.some(p => p.id === id)) {
        return res.status(400).json({ error: 'Post ID already exists' });
    }

    // Write markdown file
    const mdPath = path.join(POSTS_DIR, `${id}.md`);
    fs.writeFileSync(mdPath, content);

    // Save metadata
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
});

// PUT (Edit) an article
app.put('/api/posts/:id', requireAdmin, (req, res) => {
    const { title, excerpt, tags, content } = req.body;
    const db = readDB();
    const postIndex = db.posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
        return res.status(404).json({ error: 'Post not found' });
    }

    // Update metadata
    if (title) db.posts[postIndex].title = title;
    if (excerpt) db.posts[postIndex].excerpt = excerpt;
    if (tags) db.posts[postIndex].tags = tags;
    
    writeDB(db);

    // Update markdown file
    if (content) {
        const mdPath = path.join(POSTS_DIR, `${req.params.id}.md`);
        fs.writeFileSync(mdPath, content);
    }

    res.json(db.posts[postIndex]);
});

// DELETE an article
app.delete('/api/posts/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const postIndex = db.posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
        return res.status(404).json({ error: 'Post not found' });
    }

    // Remove metadata
    db.posts.splice(postIndex, 1);
    writeDB(db);

    // Delete markdown file
    const mdPath = path.join(POSTS_DIR, `${req.params.id}.md`);
    if (fs.existsSync(mdPath)) {
        fs.unlinkSync(mdPath);
    }

    res.json({ success: true });
});

// POST a like
app.post('/api/posts/:id/like', (req, res) => {
    const db = readDB();
    const post = db.posts.find(p => p.id === req.params.id);
    
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }

    post.likes = (post.likes || 0) + 1;
    writeDB(db);
    res.json({ likes: post.likes });
});

// POST a comment
app.post('/api/posts/:id/comments', (req, res) => {
    const { author, text } = req.body;
    
    if (!author || !text) {
        return res.status(400).json({ error: 'Missing author or text' });
    }

    const db = readDB();
    const post = db.posts.find(p => p.id === req.params.id);
    
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }

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
});

app.get('/api/admin/session', requireAdmin, (req, res) => {
    res.json({ authenticated: true });
});

app.get('/api/config', (req, res) => {
    res.json(readJson(CONFIG_PATH, {}));
});

app.put('/api/config', requireAdmin, (req, res) => {
    writeJson(CONFIG_PATH, req.body || {});
    res.json(req.body || {});
});

app.get('/api/photos', (req, res) => {
    res.json(readJson(PHOTOS_PATH, { photos: [] }).photos || []);
});

app.post('/api/photos', requireAdmin, (req, res) => {
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
        return res.status(400).json({ error: 'Missing title or image source' });
    }

    photosDb.photos.push(photo);
    writeJson(PHOTOS_PATH, photosDb);
    res.status(201).json(photo);
});

app.delete('/api/photos/:id', requireAdmin, (req, res) => {
    const photosDb = readJson(PHOTOS_PATH, { photos: [] });
    photosDb.photos = photosDb.photos.filter((photo) => photo.id !== req.params.id);
    writeJson(PHOTOS_PATH, photosDb);
    res.json({ success: true });
});

// Fragments API
app.get('/api/fragments', (req, res) => {
    const data = readJson(FRAGMENTS_PATH, { fragments: [] });
    data.fragments.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(data.fragments);
});

app.post('/api/fragments', requireAdmin, (req, res) => {
    const { text, tags } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'text is required' });
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
});

app.delete('/api/fragments/:id', requireAdmin, (req, res) => {
    const data = readJson(FRAGMENTS_PATH, { fragments: [] });
    data.fragments = data.fragments.filter((f) => f.id !== req.params.id);
    writeJson(FRAGMENTS_PATH, data);
    res.json({ success: true });
});

// Wall API
app.get('/api/wall', (req, res) => {
    const data = readJson(WALL_PATH, { cards: [] });
    res.json(data.cards);
});

app.post('/api/wall', requireAdmin, (req, res) => {
    const { type, content, x, y, width, color } = req.body;
    if (!type || !content) {
        return res.status(400).json({ error: 'type and content are required' });
    }
    const data = readJson(WALL_PATH, { cards: [] });
    const card = {
        id: String(Date.now()),
        type,
        content: content.trim(),
        x: x || 100,
        y: y || 100,
        width: width || 240,
        color: color || 'blue',
        createdAt: new Date().toISOString()
    };
    data.cards.push(card);
    writeJson(WALL_PATH, data);
    res.status(201).json(card);
});

app.put('/api/wall/:id', requireAdmin, (req, res) => {
    const data = readJson(WALL_PATH, { cards: [] });
    const idx = data.cards.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Card not found' });
    const allowed = ['content', 'x', 'y', 'width', 'color', 'type'];
    allowed.forEach(key => {
        if (req.body[key] !== undefined) data.cards[idx][key] = req.body[key];
    });
    writeJson(WALL_PATH, data);
    res.json(data.cards[idx]);
});

app.delete('/api/wall/:id', requireAdmin, (req, res) => {
    const data = readJson(WALL_PATH, { cards: [] });
    data.cards = data.cards.filter(c => c.id !== req.params.id);
    writeJson(WALL_PATH, data);
    res.json({ success: true });
});

// Secrets / API Key config
app.get('/api/secrets', requireAdmin, (req, res) => {
    const secrets = readJson(SECRETS_PATH, {});
    const key = process.env.SILICONFLOW_API_KEY || secrets.siliconflowApiKey || '';
    res.json({
        siliconflowApiKey: secrets.siliconflowApiKey || '',
        hasEnvApiKey: Boolean(process.env.SILICONFLOW_API_KEY),
        siliconflowApiKeyMasked: key ? '****' + key.slice(-4) : '',
        apiUrl: process.env.SILICONFLOW_API_URL || secrets.apiUrl || DEFAULT_AI_API_URL,
        model: process.env.SILICONFLOW_MODEL || secrets.model || DEFAULT_AI_MODEL
    });
});

app.put('/api/secrets', requireAdmin, (req, res) => {
    const { siliconflowApiKey, apiUrl, model } = req.body;
    const secrets = readJson(SECRETS_PATH, {});
    if (typeof siliconflowApiKey === 'string') {
        secrets.siliconflowApiKey = siliconflowApiKey.trim();
    }
    if (typeof apiUrl === 'string') {
        secrets.apiUrl = apiUrl.trim();
    }
    if (typeof model === 'string') {
        secrets.model = model.trim();
    }
    writeJson(SECRETS_PATH, secrets);
    res.json({ success: true });
});

app.post('/api/upload-image', requireAdmin, (req, res) => {
    const { fileName, dataUrl } = req.body;
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || '');
    if (!fileName || !match) {
        return res.status(400).json({ error: 'Invalid image payload' });
    }

    const ext = path.extname(fileName).toLowerCase() || '.png';
    const safeName = `${Date.now()}-${path.basename(fileName, ext).replace(/[^a-zA-Z0-9-_]/g, '-')}${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, safeName), Buffer.from(match[2], 'base64'));
    res.status(201).json({ url: `/uploads/${safeName}` });
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

app.listen(PORT, () => {
    console.log(`🚀 Plate. CMS Backend running on http://localhost:${PORT}`);
});
