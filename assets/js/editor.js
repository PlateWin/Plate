import { API_ROOT, POSTS_URL, CONFIG_URL, FRAGMENTS_URL } from './config.js';
import { clearSiteConfigCache, fetchSiteConfig, normalizeSiteConfig } from './site-content.js';

const ADMIN_SESSION_URL = `${API_ROOT}/admin/session`;

let currentPosts = [];
let activePostId = null;
let adminToken = '';

const loginPanel = document.getElementById('login-panel');
const consoleApp = document.getElementById('console-app');
const tokenInput = document.getElementById('admin-token');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const postList = document.getElementById('post-list');
const btnNewPost = document.getElementById('btn-new-post');
const btnSave = document.getElementById('btn-save');
const btnDelete = document.getElementById('btn-delete');
const inputId = document.getElementById('post-id');
const inputTitle = document.getElementById('post-title');
const inputTags = document.getElementById('post-tags');
const inputExcerpt = document.getElementById('post-excerpt');
const inputContent = document.getElementById('post-content');
const previewPane = document.getElementById('live-preview');
const toast = document.getElementById('toast');

const cfgSiteName = document.getElementById('cfg-site-name');
const cfgSiteTagline = document.getElementById('cfg-site-tagline');
const cfgFooterText = document.getElementById('cfg-footer-text');
const cfgContactEmail = document.getElementById('cfg-contact-email');
const cfgHeroTitle = document.getElementById('cfg-hero-title');
const cfgHeroSubtitle = document.getElementById('cfg-hero-subtitle');
const cfgPhotoNote = document.getElementById('cfg-photo-note');
const cfgHomeAboutTitle = document.getElementById('cfg-home-about-title');
const cfgHomeAboutParagraph1 = document.getElementById('cfg-home-about-paragraph-1');
const cfgHomeAboutParagraph2 = document.getElementById('cfg-home-about-paragraph-2');
const cfgStats = Array.from({ length: 3 }, (_, index) => ({
  value: document.getElementById(`cfg-home-stat-${index + 1}-value`),
  label: document.getElementById(`cfg-home-stat-${index + 1}-label`)
}));
const cfgProjects = Array.from({ length: 4 }, (_, index) => ({
  title: document.getElementById(`cfg-project-${index + 1}-title`),
  subtitle: document.getElementById(`cfg-project-${index + 1}-subtitle`),
  bullet1: document.getElementById(`cfg-project-${index + 1}-bullet-1`),
  bullet2: document.getElementById(`cfg-project-${index + 1}-bullet-2`),
  bullet3: document.getElementById(`cfg-project-${index + 1}-bullet-3`),
  badges: document.getElementById(`cfg-project-${index + 1}-badges`),
  linkText: document.getElementById(`cfg-project-${index + 1}-link-text`),
  linkUrl: document.getElementById(`cfg-project-${index + 1}-link-url`)
}));
const cfgAboutHeroLabel = document.getElementById('cfg-about-hero-label');
const cfgAboutHeroLine1 = document.getElementById('cfg-about-hero-line-1');
const cfgAboutHeroLine2 = document.getElementById('cfg-about-hero-line-2');
const cfgAboutHeroSubtitle = document.getElementById('cfg-about-hero-subtitle');
const cfgAboutCards = Array.from({ length: 3 }, (_, index) => ({
  meta: document.getElementById(`cfg-about-card-${index + 1}-meta`),
  title: document.getElementById(`cfg-about-card-${index + 1}-title`),
  body: document.getElementById(`cfg-about-card-${index + 1}-body`)
}));
const cfgNowHeroLabel = document.getElementById('cfg-now-hero-label');
const cfgNowHeroLine1 = document.getElementById('cfg-now-hero-line-1');
const cfgNowHeroLine2 = document.getElementById('cfg-now-hero-line-2');
const cfgNowHeroSubtitle = document.getElementById('cfg-now-hero-subtitle');
const cfgNowItems = Array.from({ length: 3 }, (_, index) => ({
  meta: document.getElementById(`cfg-now-item-${index + 1}-meta`),
  title: document.getElementById(`cfg-now-item-${index + 1}-title`),
  body: document.getElementById(`cfg-now-item-${index + 1}-body`)
}));
const cfgSeoHomeTitle = document.getElementById('cfg-seo-home-title');
const cfgSeoHomeDescription = document.getElementById('cfg-seo-home-description');
const cfgSeoAboutTitle = document.getElementById('cfg-seo-about-title');
const cfgSeoAboutDescription = document.getElementById('cfg-seo-about-description');
const cfgSeoNowTitle = document.getElementById('cfg-seo-now-title');
const cfgSeoNowDescription = document.getElementById('cfg-seo-now-description');
const btnSaveConfig = document.getElementById('btn-save-config');

const photoFile = document.getElementById('photo-file');
const photoTitle = document.getElementById('photo-title');
const photoSubtitle = document.getElementById('photo-subtitle');
const photoCategory = document.getElementById('photo-category');
const photoTime = document.getElementById('photo-time');
const photoLat = document.getElementById('photo-lat');
const photoLng = document.getElementById('photo-lng');
const btnSavePhoto = document.getElementById('btn-save-photo');
const photoList = document.getElementById('photo-list');
const fragmentText = document.getElementById('fragment-text');
const fragmentTags = document.getElementById('fragment-tags');
const btnSaveFragment = document.getElementById('btn-save-fragment');
const fragmentList = document.getElementById('fragment-list');

function authHeaders(extra = {}) {
  return { ...extra, 'x-admin-token': adminToken };
}

function clearAdminSession() {
  adminToken = '';
  localStorage.removeItem('plate-admin-token');
  tokenInput.value = '';
  loginPanel.style.display = 'flex';
  consoleApp.style.display = 'none';
}

function handleUnauthorized(message = '管理员令牌不正确，请重新登录') {
  clearAdminSession();
  tokenInput.focus();
  showToast(message, true);
}

function enterAdminSession(token) {
  adminToken = token;
  localStorage.setItem('plate-admin-token', adminToken);
  tokenInput.value = '';
  showConsole();
}

function requireAdminSession() {
  if (adminToken) return true;
  handleUnauthorized('请先输入管理员令牌登录');
  return false;
}

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.background = isError ? '#FF5F56' : '#002FA7';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showConsole() {
  loginPanel.style.display = 'none';
  consoleApp.style.display = 'grid';
  fetchPosts();
  fetchConfig();
  fetchPhotos();
  fetchFragments();
  fetchApiConfig();
}

async function verifyAdminToken(token) {
  const res = await fetch(ADMIN_SESSION_URL, {
    headers: { 'x-admin-token': token }
  });
  return res.ok;
}

async function adminFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: authHeaders(options.headers || {})
  });

  if (res.status === 401) {
    handleUnauthorized();
    return null;
  }

  return res;
}

function updatePreview() {
  previewPane.innerHTML = marked.parse(inputContent.value || '');
  previewPane.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block));
}

async function fetchPosts() {
  try {
    const res = await fetch(POSTS_URL);
    currentPosts = await res.json();
    renderPostList();
  } catch (e) {
    showToast('加载文章失败', true);
  }
}

function renderPostList() {
  postList.innerHTML = '';
  currentPosts.forEach((post) => {
    const li = document.createElement('li');
    li.className = `post-list-item ${post.id === activePostId ? 'active' : ''}`;
    li.innerHTML = `<h4>${post.title}</h4><span>${post.date || ''}</span>`;
    li.onclick = () => loadPost(post.id);
    postList.appendChild(li);
  });
}

async function loadPost(id) {
  try {
    const res = await fetch(`${POSTS_URL}/${id}`);
    const post = await res.json();
    activePostId = post.id;
    inputId.value = post.id;
    inputId.disabled = true;
    inputTitle.value = post.title || '';
    inputTags.value = (post.tags || []).join(', ');
    inputExcerpt.value = post.excerpt || '';
    inputContent.value = post.content || '';
    updatePreview();
    renderPostList();
    btnDelete.style.display = 'inline-flex';
  } catch (e) {
    showToast('加载文章失败', true);
  }
}

function setupNewPost() {
  activePostId = null;
  inputId.value = '';
  inputId.disabled = false;
  inputTitle.value = '';
  inputTags.value = '';
  inputExcerpt.value = '';
  inputContent.value = '';
  previewPane.innerHTML = '';
  btnDelete.style.display = 'none';
  renderPostList();
}

async function savePost() {
  if (!requireAdminSession()) return;
  const payload = {
    id: inputId.value.trim(),
    title: inputTitle.value.trim(),
    excerpt: inputExcerpt.value.trim(),
    tags: inputTags.value.split(',').map((tag) => tag.trim()).filter(Boolean),
    content: inputContent.value.trim()
  };
  if (!payload.id || !payload.title || !payload.content) return showToast('请填写 ID、标题和正文', true);

  const method = activePostId ? 'PUT' : 'POST';
  const url = activePostId ? `${POSTS_URL}/${activePostId}` : POSTS_URL;
  const res = await adminFetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res) return;
  if (!res.ok) return showToast(`保存失败：${res.status}`, true);
  showToast('保存成功！');
  activePostId = payload.id;
  fetchPosts();
}

async function deletePost() {
  if (!requireAdminSession() || !activePostId || !confirm('确定要删除这篇文章吗？')) return;
  const res = await adminFetch(`${POSTS_URL}/${activePostId}`, { method: 'DELETE' });
  if (!res) return;
  if (!res.ok) return showToast(`删除失败：${res.status}`, true);
  setupNewPost();
  fetchPosts();
  showToast('删除成功！');
}

function fillStructuredConfig(config) {
  cfgSiteName.value = config.site.name;
  cfgSiteTagline.value = config.site.tagline;
  cfgFooterText.value = config.site.footerText;
  cfgContactEmail.value = config.site.contactEmail;
  cfgHeroTitle.value = config.home.heroTitle;
  cfgHeroSubtitle.value = config.home.heroSubtitle;
  cfgPhotoNote.value = config.photography.note;
  cfgHomeAboutTitle.value = config.home.aboutTitle;
  cfgHomeAboutParagraph1.value = config.home.aboutParagraphs[0] || '';
  cfgHomeAboutParagraph2.value = config.home.aboutParagraphs[1] || '';

  cfgStats.forEach((fields, index) => {
    const stat = config.home.stats[index] || { value: '', label: '' };
    fields.value.value = stat.value || '';
    fields.label.value = stat.label || '';
  });

  cfgProjects.forEach((fields, index) => {
    const project = config.home.featuredProjects[index] || { bullets: [], badges: [] };
    fields.title.value = project.title || '';
    fields.subtitle.value = project.subtitle || '';
    fields.bullet1.value = project.bullets?.[0] || '';
    fields.bullet2.value = project.bullets?.[1] || '';
    fields.bullet3.value = project.bullets?.[2] || '';
    fields.badges.value = (project.badges || []).join(', ');
    fields.linkText.value = project.linkText || '';
    fields.linkUrl.value = project.linkUrl || '';
  });

  cfgAboutHeroLabel.value = config.aboutPage.heroLabel;
  cfgAboutHeroLine1.value = config.aboutPage.heroTitleLine1;
  cfgAboutHeroLine2.value = config.aboutPage.heroTitleLine2;
  cfgAboutHeroSubtitle.value = config.aboutPage.heroSubtitle;
  cfgAboutCards.forEach((fields, index) => {
    const card = config.aboutPage.cards[index] || { meta: '', title: '', body: '' };
    fields.meta.value = card.meta || '';
    fields.title.value = card.title || '';
    fields.body.value = card.body || '';
  });

  cfgNowHeroLabel.value = config.nowPage.heroLabel;
  cfgNowHeroLine1.value = config.nowPage.heroTitleLine1;
  cfgNowHeroLine2.value = config.nowPage.heroTitleLine2;
  cfgNowHeroSubtitle.value = config.nowPage.heroSubtitle;
  cfgNowItems.forEach((fields, index) => {
    const item = config.nowPage.items[index] || { meta: '', title: '', body: '' };
    fields.meta.value = item.meta || '';
    fields.title.value = item.title || '';
    fields.body.value = item.body || '';
  });

  cfgSeoHomeTitle.value = config.seo.homeTitle;
  cfgSeoHomeDescription.value = config.seo.homeDescription;
  cfgSeoAboutTitle.value = config.seo.aboutTitle;
  cfgSeoAboutDescription.value = config.seo.aboutDescription;
  cfgSeoNowTitle.value = config.seo.nowTitle;
  cfgSeoNowDescription.value = config.seo.nowDescription;
}

async function fetchConfig() {
  try {
    clearSiteConfigCache();
    const config = await fetchSiteConfig(true);
    fillStructuredConfig(config);
  } catch (error) {
    showToast('加载站点配置失败', true);
  }
}

function collectProject(fields) {
  return {
    title: fields.title.value.trim(),
    subtitle: fields.subtitle.value.trim(),
    bullets: [fields.bullet1.value, fields.bullet2.value, fields.bullet3.value].map((item) => item.trim()).filter(Boolean),
    badges: fields.badges.value.split(',').map((item) => item.trim()).filter(Boolean),
    linkText: fields.linkText.value.trim(),
    linkUrl: fields.linkUrl.value.trim()
  };
}

function collectInfoCard(fields) {
  return {
    meta: fields.meta.value.trim(),
    title: fields.title.value.trim(),
    body: fields.body.value.trim()
  };
}

async function saveConfig() {
  if (!requireAdminSession()) return;
  const payload = normalizeSiteConfig({
    site: {
      name: cfgSiteName.value.trim(),
      tagline: cfgSiteTagline.value.trim(),
      footerText: cfgFooterText.value.trim(),
      contactEmail: cfgContactEmail.value.trim()
    },
    home: {
      heroTitle: cfgHeroTitle.value.trim(),
      heroSubtitle: cfgHeroSubtitle.value.trim(),
      aboutTitle: cfgHomeAboutTitle.value.trim(),
      aboutParagraphs: [cfgHomeAboutParagraph1.value.trim(), cfgHomeAboutParagraph2.value.trim()].filter(Boolean),
      stats: cfgStats.map((fields) => ({
        value: fields.value.value.trim(),
        label: fields.label.value.trim()
      })),
      featuredProjects: cfgProjects.map(collectProject)
    },
    aboutPage: {
      heroLabel: cfgAboutHeroLabel.value.trim(),
      heroTitleLine1: cfgAboutHeroLine1.value.trim(),
      heroTitleLine2: cfgAboutHeroLine2.value.trim(),
      heroSubtitle: cfgAboutHeroSubtitle.value.trim(),
      cards: cfgAboutCards.map(collectInfoCard)
    },
    nowPage: {
      heroLabel: cfgNowHeroLabel.value.trim(),
      heroTitleLine1: cfgNowHeroLine1.value.trim(),
      heroTitleLine2: cfgNowHeroLine2.value.trim(),
      heroSubtitle: cfgNowHeroSubtitle.value.trim(),
      items: cfgNowItems.map(collectInfoCard)
    },
    photography: {
      note: cfgPhotoNote.value.trim()
    },
    seo: {
      homeTitle: cfgSeoHomeTitle.value.trim(),
      homeDescription: cfgSeoHomeDescription.value.trim(),
      aboutTitle: cfgSeoAboutTitle.value.trim(),
      aboutDescription: cfgSeoAboutDescription.value.trim(),
      nowTitle: cfgSeoNowTitle.value.trim(),
      nowDescription: cfgSeoNowDescription.value.trim()
    },
    heroTitle: cfgHeroTitle.value.trim(),
    heroSubtitle: cfgHeroSubtitle.value.trim(),
    aboutSummary: cfgHomeAboutParagraph1.value.trim(),
    contactEmail: cfgContactEmail.value.trim(),
    photoNote: cfgPhotoNote.value.trim()
  });

  const res = await adminFetch(CONFIG_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res) return;
  if (!res.ok) {
    return showToast(`保存失败：${res.status}`, true);
  }
  clearSiteConfigCache();
  showToast('配置保存成功！');
  fetchConfig();
}

async function fetchPhotos() {
  const res = await fetch(`${API_ROOT}/photos`);
  const photos = await res.json();
  photoList.innerHTML = '';
  photos.forEach((photo) => {
    const item = document.createElement('div');
    item.className = 'photo-console-item';
    item.innerHTML = `<img src="${photo.src}" alt=""><div><strong>${photo.title}</strong><span>${photo.category}  ${photo.shotTime || ''}</span></div><button data-id="${photo.id}">删除</button>`;
    item.querySelector('button').onclick = () => deletePhoto(photo.id);
    photoList.appendChild(item);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function savePhoto() {
  if (!requireAdminSession()) return;
  const file = photoFile.files[0];
  if (!file || !photoTitle.value.trim()) return showToast('请选择图片并填写标题', true);
  const dataUrl = await readFileAsDataUrl(file);
  const uploadRes = await adminFetch(`${API_ROOT}/upload-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, dataUrl })
  });
  if (!uploadRes) return;
  if (!uploadRes.ok) return showToast(`图片上传失败：${uploadRes.status}`, true);
  const uploaded = await uploadRes.json();
  const photoRes = await adminFetch(`${API_ROOT}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: photoTitle.value.trim(),
      subtitle: photoSubtitle.value.trim(),
      category: photoCategory.value,
      shotTime: photoTime.value.trim(),
      lat: photoLat.value.trim(),
      lng: photoLng.value.trim(),
      src: uploaded.url,
      alt: photoTitle.value.trim()
    })
  });
  if (!photoRes) return;
  if (!photoRes.ok) return showToast(`保存照片失败：${photoRes.status}`, true);
  photoFile.value = '';
  photoTitle.value = '';
  photoSubtitle.value = '';
  fetchPhotos();
  showToast('照片上传成功！');
}

async function deletePhoto(id) {
  if (!requireAdminSession() || !confirm('确定要删除这张照片吗？')) return;
  const res = await adminFetch(`${API_ROOT}/photos/${id}`, { method: 'DELETE' });
  if (!res) return;
  showToast(res.ok ? '删除成功！' : `删除失败：${res.status}`, !res.ok);
  if (res.ok) fetchPhotos();
}

document.querySelectorAll('.console-tab[data-panel]').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.console-tab').forEach((item) => item.classList.remove('active'));
    document.querySelectorAll('.console-panel').forEach((panel) => panel.classList.remove('active-panel'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel).classList.add('active-panel');
  });
});

document.querySelectorAll('.toolbar button[data-cmd]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const cmd = btn.getAttribute('data-cmd');
    const start = inputContent.selectionStart;
    const end = inputContent.selectionEnd;
    const text = inputContent.value;
    const selectedText = text.substring(start, end);
    const map = {
      bold: `**${selectedText || 'bold text'}**`,
      italic: `*${selectedText || 'italic text'}*`,
      h2: `
## ${selectedText || 'Heading'}
`,
      link: `[${selectedText || 'Link Text'}](https://)`,
      code: `
\`\`\`javascript
${selectedText || '// code here'}
\`\`\`
`,
      image: `![alt text](image_url)`
    };
    inputContent.value = text.substring(0, start) + map[cmd] + text.substring(end);
    updatePreview();
    inputContent.focus();
  });
});

btnLogin.addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  if (!token) return showToast('请输入管理员令牌', true);

  btnLogin.disabled = true;
  btnLogin.textContent = '验证中...';

  try {
    const isValid = await verifyAdminToken(token);
    if (!isValid) {
      clearAdminSession();
      return showToast('管理员令牌错误', true);
    }

    enterAdminSession(token);
  } catch (error) {
    showToast('无法连接到管理服务', true);
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Enter Console';
  }
});
btnLogout.addEventListener('click', () => {
  clearAdminSession();
  location.reload();
});
inputContent.addEventListener('input', updatePreview);
btnNewPost.addEventListener('click', setupNewPost);
btnSave.addEventListener('click', savePost);
btnDelete.addEventListener('click', deletePost);
btnSaveConfig.addEventListener('click', saveConfig);
btnSavePhoto.addEventListener('click', savePhoto);

// Fragments CRUD
async function fetchFragments() {
  const res = await fetch(FRAGMENTS_URL);
  if (!res.ok) return;
  const fragments = await res.json();
  fragmentList.innerHTML = '';
  fragments.forEach((f) => {
    const item = document.createElement('div');
    item.className = 'photo-console-item';
    item.style.flexDirection = 'column';
    item.style.alignItems = 'flex-start';
    item.style.gap = '0.3rem';
    const preview = f.text.length > 80 ? f.text.slice(0, 80) + '...' : f.text;
    const date = new Date(f.date).toLocaleDateString('zh-CN');
    item.innerHTML = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;"><strong>${date}</strong><button data-id="${f.id}" style="background:none;border:1px solid #ff5f5633;color:#FF5F56;border-radius:6px;padding:0.2rem 0.6rem;cursor:pointer;font-size:0.75rem;">删除</button></div><p style="margin:0;font-size:0.85rem;color:var(--text-secondary);">${preview}</p>`;
    item.querySelector('button').onclick = () => deleteFragment(f.id);
    fragmentList.appendChild(item);
  });
}

async function saveFragment() {
  if (!requireAdminSession()) return;
  const text = fragmentText.value.trim();
  if (!text) return showToast('请输入碎片内容', true);

  const tags = fragmentTags.value.split(/[,，]/).map(t => t.trim()).filter(Boolean);
  try {
    const res = await adminFetch(FRAGMENTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tags })
    });
    if (!res) return;
    if (res.ok) {
      showToast('碎片发布成功！');
      fragmentText.value = '';
      fragmentTags.value = '';
      fetchFragments();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || `发布失败 (${res.status})`, true);
    }
  } catch (e) {
    showToast('网络错误：' + e.message, true);
    console.error('saveFragment error:', e);
  }
}

async function deleteFragment(id) {
  if (!requireAdminSession() || !confirm('确定要删除这条碎片吗？')) return;
  const res = await adminFetch(`${FRAGMENTS_URL}/${id}`, { method: 'DELETE' });
  if (!res) return;
  if (res.ok) {
    showToast('删除成功！');
    fetchFragments();
  }
}

btnSaveFragment.addEventListener('click', saveFragment);

// API Configuration
const cfgApiKey = document.getElementById('cfg-api-key');
const cfgApiUrl = document.getElementById('cfg-api-url');
const cfgApiModel = document.getElementById('cfg-api-model');
const btnSaveApiConfig = document.getElementById('btn-save-api-config');
const btnToggleKeyVis = document.getElementById('btn-toggle-key-vis');
const apiKeyStatus = document.getElementById('api-key-status');

async function fetchApiConfig() {
  try {
    const res = await adminFetch(`${API_ROOT}/secrets`);
    if (!res) return;
    const data = await res.json();
    cfgApiUrl.value = data.apiUrl || '';
    cfgApiModel.value = data.model || '';
    if (data.siliconflowApiKey) {
      cfgApiKey.value = data.siliconflowApiKey;
      apiKeyStatus.textContent = `当前状态：已配置 (${data.siliconflowApiKeyMasked})`;
      apiKeyStatus.style.color = '#10b981';
    } else {
      cfgApiKey.value = '';
      apiKeyStatus.textContent = '当前状态：未配置';
      apiKeyStatus.style.color = 'var(--text-secondary)';
    }
  } catch (e) {
    console.error('fetchApiConfig error:', e);
  }
}

async function saveApiConfig() {
  if (!requireAdminSession()) return;

  try {
    const res = await adminFetch(`${API_ROOT}/secrets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siliconflowApiKey: cfgApiKey.value.trim(),
        apiUrl: cfgApiUrl.value.trim(),
        model: cfgApiModel.value.trim()
      })
    });
    if (!res) return;
    if (res.ok) {
      showToast('AI 配置保存成功！');
      fetchApiConfig();
    } else {
      showToast('保存失败', true);
    }
  } catch (e) {
    showToast('网络错误：' + e.message, true);
  }
}

btnToggleKeyVis.addEventListener('click', () => {
  const isPassword = cfgApiKey.type === 'password';
  cfgApiKey.type = isPassword ? 'text' : 'password';
  btnToggleKeyVis.textContent = isPassword ? '隐藏' : '显示';
});

btnSaveApiConfig.addEventListener('click', saveApiConfig);

tokenInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') btnLogin.click();
});

const savedAdminToken = localStorage.getItem('plate-admin-token') || '';

if (savedAdminToken) {
  verifyAdminToken(savedAdminToken)
    .then((isValid) => {
      if (isValid) enterAdminSession(savedAdminToken);
      else clearAdminSession();
    })
    .catch(() => clearAdminSession());
}
