import { CONFIG_URL } from './config.js';

let configCache = null;

const DEFAULT_CONFIG = {
  site: {
    name: 'Plate.',
    tagline: 'Algorithm & Aesthetics',
    footerText: '© 2026 Plate. Powered by Logic & Space.',
    contactEmail: 'hello@example.com'
  },
  home: {
    heroTitle: 'Algorithmic\nAesthetics.',
    heroSubtitle: 'A clean, high-contrast blog template for developers, researchers, and makers who want writing, projects, and photography in one place.',
    aboutTitle: 'Build with clarity.',
    aboutParagraphs: [
      'This template is designed for people who want a portfolio and blog without a heavy framework. You can publish writing, highlight projects, and keep a lightweight personal home on the open web.',
      'Use the admin console to replace the default copy with your own voice, then keep growing the site through Markdown posts, structured metadata, and a small Node.js backend.'
    ],
    stats: [
      { value: '12+', label: 'Posts Ready' },
      { value: '3', label: 'Content Modes' },
      { value: '1', label: 'Admin Console' }
    ],
    featuredProjects: [
      {
        title: 'Project Alpha',
        subtitle: 'Your flagship project or research work',
        bullets: [
          'Describe the core idea in one strong sentence.',
          'Add a second bullet for implementation detail or outcome.',
          'Use the third bullet for what makes the work memorable.'
        ],
        badges: ['TypeScript', 'Node.js', 'Design Systems'],
        linkText: 'View Project ↗',
        linkUrl: 'https://example.com'
      },
      {
        title: 'Project Beta',
        subtitle: 'A product, tool, or experiment worth highlighting',
        bullets: [
          'Summarize what this project helps users do.',
          'Mention a notable technical or product decision.',
          'Share one result, tradeoff, or unique angle.'
        ],
        badges: ['React', 'Go', 'UX'],
        linkText: 'Live Demo ↗',
        linkUrl: 'https://example.com/demo'
      },
      {
        title: 'Project Gamma',
        subtitle: 'A supporting project card for the homepage grid',
        bullets: [
          'Keep each bullet short and readable.',
          'This slot works well for open-source work.',
          'You can also use it for freelance or research output.'
        ],
        badges: ['Open Source', 'API', 'Tooling'],
        linkText: '',
        linkUrl: ''
      },
      {
        title: 'Project Delta',
        subtitle: 'Another concise project summary',
        bullets: [
          'Good for infrastructure, experiments, or side projects.',
          'Keep the copy concrete instead of vague.',
          'Let the badges communicate stack quickly.'
        ],
        badges: ['LLM', 'Security', 'Data'],
        linkText: '',
        linkUrl: ''
      }
    ]
  },
  aboutPage: {
    heroLabel: '08 // About',
    heroTitleLine1: 'Creative',
    heroTitleLine2: 'Engineer.',
    heroSubtitle: 'Introduce your background, technical focus, and the kind of work you care about building.',
    cards: [
      {
        meta: 'Focus',
        title: 'What you work on',
        body: 'Use this card to explain your main interests, such as product engineering, AI tooling, security research, or frontend systems.'
      },
      {
        meta: 'Stack',
        title: 'How you build',
        body: 'Summarize your common languages, frameworks, and the kinds of systems you are comfortable designing or shipping.'
      },
      {
        meta: 'Taste',
        title: 'What you value',
        body: 'Explain the principles behind your work: clarity, performance, calm interfaces, strong writing, or maintainable architecture.'
      }
    ]
  },
  nowPage: {
    heroLabel: '09 // Now',
    heroTitleLine1: 'Current',
    heroTitleLine2: 'Signal.',
    heroSubtitle: 'A short snapshot of what you are exploring, building, or publishing right now.',
    items: [
      {
        meta: 'Research',
        title: 'What I am learning',
        body: 'Share the topic, paper trail, or technical direction you are actively studying.'
      },
      {
        meta: 'Product',
        title: 'What I am building',
        body: 'Describe the current product, tool, or internal system you are pushing forward.'
      },
      {
        meta: 'Writing',
        title: 'What I will publish next',
        body: 'Mention the next article, essay, tutorial, or release note you plan to ship.'
      }
    ]
  },
  photography: {
    note: 'Use this section for your visual taste, shooting habits, or the role photography plays in your creative practice.'
  },
  seo: {
    homeTitle: 'Plate. | Open Source Blog Template',
    homeDescription: 'An open-source personal blog template with writing, projects, photography, and a lightweight admin console.',
    aboutTitle: 'About | Plate.',
    aboutDescription: 'Learn about the person behind the site and the kind of work they build.',
    nowTitle: 'Now | Plate.',
    nowDescription: 'A current snapshot of ongoing work, research, and writing.'
  }
};

const MOTION_HERO = {
  ease: 'power4.out',
  titleDuration: 1.5,
  subtitleDuration: 1.2,
  stagger: 0.2,
  subtitleOverlap: '-=1'
};

function cleanString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function cleanStringArray(values, fallback = []) {
  if (!Array.isArray(values)) return fallback;
  const cleaned = values.map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function cleanObjectArray(values, normalizeItem, fallback = []) {
  if (!Array.isArray(values)) return fallback;
  const cleaned = values.map(normalizeItem).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function normalizeStat(item, fallback) {
  if (!item || typeof item !== 'object') return fallback;
  return {
    value: cleanString(item.value, fallback.value),
    label: cleanString(item.label, fallback.label)
  };
}

function normalizeProject(project, fallback) {
  if (!project || typeof project !== 'object') return fallback;
  return {
    title: cleanString(project.title, fallback.title),
    subtitle: cleanString(project.subtitle, fallback.subtitle),
    bullets: cleanStringArray(project.bullets, fallback.bullets),
    badges: cleanStringArray(project.badges, fallback.badges),
    linkText: cleanString(project.linkText, fallback.linkText || ''),
    linkUrl: cleanString(project.linkUrl, fallback.linkUrl || '')
  };
}

function normalizeInfoCard(card, fallback) {
  if (!card || typeof card !== 'object') return fallback;
  return {
    meta: cleanString(card.meta, fallback.meta),
    title: cleanString(card.title, fallback.title),
    body: cleanString(card.body, fallback.body)
  };
}

export function normalizeSiteConfig(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};

  const site = source.site || {};
  const home = source.home || {};
  const aboutPage = source.aboutPage || {};
  const nowPage = source.nowPage || {};
  const photography = source.photography || {};
  const seo = source.seo || {};

  return {
    site: {
      name: cleanString(site.name, DEFAULT_CONFIG.site.name),
      tagline: cleanString(site.tagline, DEFAULT_CONFIG.site.tagline),
      footerText: cleanString(site.footerText, DEFAULT_CONFIG.site.footerText),
      contactEmail: cleanString(site.contactEmail || source.contactEmail, DEFAULT_CONFIG.site.contactEmail)
    },
    home: {
      heroTitle: cleanString(home.heroTitle || source.heroTitle, DEFAULT_CONFIG.home.heroTitle),
      heroSubtitle: cleanString(home.heroSubtitle || source.heroSubtitle, DEFAULT_CONFIG.home.heroSubtitle),
      aboutTitle: cleanString(home.aboutTitle, DEFAULT_CONFIG.home.aboutTitle),
      aboutParagraphs: cleanStringArray(home.aboutParagraphs, source.aboutSummary ? [source.aboutSummary] : DEFAULT_CONFIG.home.aboutParagraphs),
      stats: DEFAULT_CONFIG.home.stats.map((fallback, index) => normalizeStat(home.stats?.[index], fallback)),
      featuredProjects: DEFAULT_CONFIG.home.featuredProjects.map((fallback, index) => normalizeProject(home.featuredProjects?.[index], fallback))
    },
    aboutPage: {
      heroLabel: cleanString(aboutPage.heroLabel, DEFAULT_CONFIG.aboutPage.heroLabel),
      heroTitleLine1: cleanString(aboutPage.heroTitleLine1, DEFAULT_CONFIG.aboutPage.heroTitleLine1),
      heroTitleLine2: cleanString(aboutPage.heroTitleLine2, DEFAULT_CONFIG.aboutPage.heroTitleLine2),
      heroSubtitle: cleanString(aboutPage.heroSubtitle, DEFAULT_CONFIG.aboutPage.heroSubtitle),
      cards: DEFAULT_CONFIG.aboutPage.cards.map((fallback, index) => normalizeInfoCard(aboutPage.cards?.[index], fallback))
    },
    nowPage: {
      heroLabel: cleanString(nowPage.heroLabel, DEFAULT_CONFIG.nowPage.heroLabel),
      heroTitleLine1: cleanString(nowPage.heroTitleLine1, DEFAULT_CONFIG.nowPage.heroTitleLine1),
      heroTitleLine2: cleanString(nowPage.heroTitleLine2, DEFAULT_CONFIG.nowPage.heroTitleLine2),
      heroSubtitle: cleanString(nowPage.heroSubtitle, DEFAULT_CONFIG.nowPage.heroSubtitle),
      items: DEFAULT_CONFIG.nowPage.items.map((fallback, index) => normalizeInfoCard(nowPage.items?.[index], fallback))
    },
    photography: {
      note: cleanString(photography.note || source.photoNote, DEFAULT_CONFIG.photography.note)
    },
    seo: {
      homeTitle: cleanString(seo.homeTitle, DEFAULT_CONFIG.seo.homeTitle),
      homeDescription: cleanString(seo.homeDescription, DEFAULT_CONFIG.seo.homeDescription),
      aboutTitle: cleanString(seo.aboutTitle, DEFAULT_CONFIG.seo.aboutTitle),
      aboutDescription: cleanString(seo.aboutDescription, DEFAULT_CONFIG.seo.aboutDescription),
      nowTitle: cleanString(seo.nowTitle, DEFAULT_CONFIG.seo.nowTitle),
      nowDescription: cleanString(seo.nowDescription, DEFAULT_CONFIG.seo.nowDescription)
    }
  };
}

export async function fetchSiteConfig(force = false) {
  if (configCache && !force) return configCache;
  const response = await fetch(CONFIG_URL);
  if (!response.ok) {
    throw new Error('Failed to load site config');
  }
  const data = await response.json();
  configCache = normalizeSiteConfig(data);
  return configCache;
}

export function clearSiteConfigCache() {
  configCache = null;
}

export function splitTitleLines(value) {
  const text = cleanString(value);
  const lines = text.split('\n').map((item) => item.trim()).filter(Boolean);
  if (lines.length >= 2) return [lines[0], lines.slice(1).join(' ')];
  if (lines.length === 1) {
    const words = lines[0].split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return [words.slice(0, -1).join(' '), words.at(-1)];
    }
    return [lines[0], ''];
  }
  return ['', ''];
}

export function renderMetaDescription(content) {
  let element = document.querySelector('meta[name="description"]');
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', 'description');
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function renderOpenGraph(field, content) {
  let element = document.querySelector(`meta[property="${field}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', field);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function initHeroReveal(root = document) {
  if (typeof gsap === 'undefined') return;

  const titleLines = root.querySelectorAll('.hero-title .reveal-inner');
  const subtitle = root.querySelector('.hero-subtitle.reveal-inner');
  if (!titleLines.length && !subtitle) return;

  const heroTl = gsap.timeline({ defaults: { ease: MOTION_HERO.ease } });
  if (titleLines.length) {
    heroTl.to(titleLines, {
      y: 0,
      duration: MOTION_HERO.titleDuration,
      stagger: MOTION_HERO.stagger
    });
  }
  if (subtitle) {
    heroTl.to(subtitle, {
      y: 0,
      duration: MOTION_HERO.subtitleDuration
    }, titleLines.length ? MOTION_HERO.subtitleOverlap : 0);
  }
}

export function initRevealOnScroll(targets, {
  threshold = 0.14,
  rootMargin = '0px 0px -6% 0px',
  visibleClass = 'is-visible',
  once = true
} = {}) {
  const elements = Array.from(targets || []).filter(Boolean);
  if (!elements.length) return [];

  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add(visibleClass));
    return elements;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add(visibleClass);
      if (once) obs.unobserve(entry.target);
    });
  }, { threshold, rootMargin });

  elements.forEach((element) => observer.observe(element));
  return elements;
}
