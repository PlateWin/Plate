import { POSTS_URL } from './config.js';
import { fetchSiteConfig, initHeroReveal, initRevealOnScroll, renderMetaDescription, renderOpenGraph, splitTitleLines } from './site-content.js';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

function escapeHtml(value = '') {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function renderSiteName(name) {
    document.querySelectorAll('[data-site-name]').forEach((element) => {
        element.innerHTML = `${escapeHtml(name)}<span class="dot">.</span>`;
    });
}

function renderHomeHero(config) {
    const line1 = document.getElementById('home-hero-line-1');
    const line2 = document.getElementById('home-hero-line-2');
    const heroSubtitle = document.getElementById('home-hero-subtitle');
    const [firstLine, secondLine] = splitTitleLines(config.home.heroTitle);

    if (line1) line1.textContent = firstLine || 'Algorithmic';
    if (line2) line2.textContent = secondLine || 'Aesthetics.';
    if (heroSubtitle) heroSubtitle.textContent = config.home.heroSubtitle;
}

function renderHomeAbout(config) {
    const aboutTitle = document.getElementById('home-about-title');
    const aboutText = document.getElementById('home-about-text');
    const aboutStats = document.getElementById('home-about-stats');

    if (aboutTitle) aboutTitle.textContent = config.home.aboutTitle;
    if (aboutText) {
        aboutText.innerHTML = config.home.aboutParagraphs
            .map((paragraph) => `<p>${marked.parseInline(paragraph)}</p>`)
            .join('');
    }
    if (aboutStats) {
        aboutStats.innerHTML = config.home.stats.map((stat) => `
            <div class="stat-item">
                <span class="stat-num">${escapeHtml(stat.value)}</span>
                <span class="stat-label">${escapeHtml(stat.label)}</span>
            </div>
        `).join('');
    }
}

function renderProjectCard(project, index) {
    const badges = (project.badges || []).map((badge) => `<span class="tech-badge">${escapeHtml(badge)}</span>`).join('');
    const bullets = (project.bullets || []).map((bullet) => `<li>${marked.parseInline(bullet)}</li>`).join('');
    const link = project.linkText && project.linkUrl
        ? `<a href="${escapeHtml(project.linkUrl)}" target="_blank" rel="noreferrer" class="live-link">${escapeHtml(project.linkText)}</a>`
        : '';

    if (index < 2) {
        return `
            <div class="project-card reveal-element${index === 0 ? ' klein-blue-card' : ''}">
                <div class="card-glow"></div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; gap: 1rem;">
                    <h2 class="project-title italic-brand${index === 0 ? ' white-text' : ''}" style="margin-bottom: 0;">${escapeHtml(project.title)}</h2>
                    ${link}
                </div>
                <p class="project-subtitle${index === 0 ? ' white-text-sub' : ''}">${escapeHtml(project.subtitle)}</p>
                <ul class="project-bullets${index === 0 ? ' white-bullets' : ''}">${bullets}</ul>
                <div class="tech-badges${index === 0 ? ' dark-badges' : ''}">${badges}</div>
            </div>
        `;
    }

    return `
        <div class="project-card-small reveal-element${index === 2 ? ' substantial-small' : ''}">
            ${index === 2 ? '<div class="small-card-visual small-card-visual-placeholder"><div class="small-card-placeholder-mark">Project</div></div>' : ''}
            <h3 class="small-project-title">${escapeHtml(project.title)}</h3>
            <p class="small-project-subtitle">${escapeHtml(project.subtitle)}</p>
            <ul class="small-project-bullets">${bullets}</ul>
            <div class="tech-badges small-badges">${badges}</div>
        </div>
    `;
}

function renderHomeProjects(config) {
    const featured = document.getElementById('home-featured-projects');
    const secondary = document.getElementById('home-secondary-projects');
    if (!featured || !secondary) return;

    const projects = config.home.featuredProjects || [];
    featured.innerHTML = projects.slice(0, 2).map((project, index) => renderProjectCard(project, index)).join('');
    secondary.innerHTML = projects.slice(2).map((project, index) => renderProjectCard(project, index + 2)).join('');
}

async function applyHomeConfig() {
    const heroTitle = document.getElementById('home-hero-title');
    if (!heroTitle) return;

    try {
        const config = await fetchSiteConfig();
        document.title = config.seo.homeTitle;
        renderMetaDescription(config.seo.homeDescription);
        renderOpenGraph('og:title', config.seo.homeTitle);
        renderOpenGraph('og:description', config.seo.homeDescription);
        renderSiteName(config.site.name);
        renderHomeHero(config);
        renderHomeAbout(config);
        renderHomeProjects(config);
        const footer = document.getElementById('site-footer-text');
        if (footer) footer.textContent = config.site.footerText;
    } catch (error) {
        console.error('Failed to apply homepage config:', error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await applyHomeConfig();
    let lenis = null;

    // 0. Lenis Smooth Scrolling
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
        });

        const progressBar = document.querySelector('.scroll-progress-bar');
        let latestScrollY = window.scrollY;
        let tickingProgress = false;

        lenis.on('scroll', () => {
            ScrollTrigger.update();
            latestScrollY = window.scrollY;
            if (!progressBar || tickingProgress) return;
            tickingProgress = true;
            requestAnimationFrame(() => {
                const docHeight = document.body.scrollHeight - window.innerHeight;
                const scrollPercent = docHeight > 0 ? (latestScrollY / docHeight) * 100 : 0;
                progressBar.style.width = `${scrollPercent}%`;
                tickingProgress = false;
            });
        });

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0, 0);
    }

    // 0.25 Smooth anchor navigation for in-page links
    const hashLinks = document.querySelectorAll('a[href^="#"]');
    hashLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();

            if (lenis) {
                lenis.scrollTo(target, {
                    duration: 1.1,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                });
                return;
            }

            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    });

    // 0.5 Custom Cursor (Lerp Damping)
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let outlinePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        // Dot follows instantly via transform for performance
        if (cursorDot) {
            cursorDot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
        }
    });

    // Lerp loop for silky outline tracking
    function renderCursor() {
        outlinePos.x += (mouse.x - outlinePos.x) * 0.15; // Damping factor
        outlinePos.y += (mouse.y - outlinePos.y) * 0.15;
        
        if (cursorOutline) {
            cursorOutline.style.transform = `translate3d(${outlinePos.x}px, ${outlinePos.y}px, 0) translate(-50%, -50%)`;
        }
        requestAnimationFrame(renderCursor);
    }
    renderCursor();

    const hoverTargets = document.querySelectorAll('a, .project-card, .project-card-small, .magnetic');
    hoverTargets.forEach(target => {
        target.addEventListener('mouseenter', () => {
            cursorOutline.classList.add('cursor-hover');
        });
        target.addEventListener('mouseleave', () => {
            cursorOutline.classList.remove('cursor-hover');
        });
    });

    // 1. Initial Hero Reveal (Masked)
    initHeroReveal();

    // 2. Navigation Blur/Border on Scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Magnetic Links (Nav)
    const magneticElements = document.querySelectorAll('.magnetic');

    magneticElements.forEach(elem => {
        elem.addEventListener('mousemove', (e) => {
            if (elem.closest('#navbar')) return;
            const rect = elem.getBoundingClientRect();
            const x = (e.clientX - rect.left) - (rect.width / 2);
            const y = (e.clientY - rect.top) - (rect.height / 2);

            gsap.to(elem, {
                x: x * 0.4,
                y: y * 0.4,
                duration: 0.4,
                ease: "power2.out"
            });
        });

        elem.addEventListener('mouseleave', () => {
            if (elem.closest('#navbar')) return;
            gsap.to(elem, {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });

    // 4. Scroll Reveal Elements
    initRevealOnScroll(document.querySelectorAll('.reveal-element'), {
        threshold: 0.16,
        visibleClass: 'is-visible'
    });

    // 5. Subtle Parallax for Honors Column
    if (window.innerWidth > 768) {
        gsap.to(".parallax-col", {
            y: 100,
            ease: "none",
            scrollTrigger: {
                trigger: ".honors-wrapper",
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    }

    // 6. Project Cards 3D Tilt on Hover (GSAP)
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -2; // Reduced rotation for taller cards
            const rotateY = ((x - centerX) / centerX) * 2;
            
            // Set CSS variables for Magnetic Glow
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            
            gsap.to(card, {
                rotationX: rotateX,
                rotationY: rotateY,
                transformPerspective: 1000,
                duration: 0.5,
                ease: "power2.out"
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                duration: 1,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });

    // 8. Node Graph Network Logic
    const nodeContainer = document.querySelector('.node-graph-container');
    const svgLines = document.querySelector('.node-lines');
    const satellites = document.querySelectorAll('.node-satellite');
    
    if (nodeContainer && svgLines && satellites.length > 0) {
        const radius = 220; // orbit radius
        
        const drawLines = () => {
            let svgHTML = '';
            
            satellites.forEach((node, index) => {
                // Organic variation: alternate radius and add slight angle jitter
                const baseAngle = (index / satellites.length) * Math.PI * 2 - Math.PI / 2;
                const angleOffset = (index % 2 === 0 ? 0.05 : -0.05); // slight angle irregularity
                const angle = baseAngle + angleOffset;
                
                const nodeRadius = radius + (index % 2 === 0 ? 30 : -20); // alternate distance
                
                const x = Math.cos(angle) * nodeRadius;
                const y = Math.sin(angle) * nodeRadius;
                
                // Position node
                node.style.left = `calc(50% + ${x}px - 35px)`;
                node.style.top = `calc(50% + ${y}px - 35px)`;
                
                // Organic floating animation delay
                node.style.animationDelay = `${-(index * 0.7)}s`;
                node.style.animationDuration = `${5 + (index % 3)}s`; // slightly different speeds
                
                // Add SVG line (straight line is fine now that layout is staggered, but we can make them thinner)
                svgHTML += `<line x1="50%" y1="50%" x2="calc(50% + ${x}px)" y2="calc(50% + ${y}px)" class="node-line" id="line-${index}" />`;
            });
            
            svgLines.innerHTML = svgHTML;
        };
        
        drawLines();
        window.addEventListener('resize', drawLines);
        
        // Hover interactions
        satellites.forEach((node, index) => {
            node.addEventListener('mouseenter', () => {
                const line = document.getElementById(`line-${index}`);
                if(line) line.classList.add('active');
            });
            node.addEventListener('mouseleave', () => {
                const line = document.getElementById(`line-${index}`);
                if(line) line.classList.remove('active');
            });
        });
    }

    // 9. Timeline Scroll Animation
    const timelineContainer = document.querySelector('.timeline-container');
    if (timelineContainer) {
        // Animate the progress line down
        gsap.to('.timeline-progress', {
            scrollTrigger: {
                trigger: '.timeline-container',
                start: "top center",
                end: "bottom center",
                scrub: 1
            },
            height: "100%",
            ease: "none"
        });

        // Trigger each item to become active when scrolled into view
        const timelineItems = gsap.utils.toArray('.timeline-item');
        timelineItems.forEach(item => {
            ScrollTrigger.create({
                trigger: item,
                start: "top 70%",
                toggleClass: "active"
            });
        });
    }

});

// --- Section Connector Animations ---
document.addEventListener('DOMContentLoaded', () => {
    function easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    function clamp01(value) {
        return Math.max(0, Math.min(1, value));
    }

    document.querySelectorAll('.section-connector').forEach((connector) => {
        const svg = connector.querySelector('.connector-svg');
        if (!svg) return;

        const paths = Array.from(svg.querySelectorAll('path'));
        const circles = Array.from(svg.querySelectorAll('circle'));

        const pathData = paths.map((path) => {
            const len = path.getTotalLength();
            const order = parseFloat(path.dataset.order ?? '0');

            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = len;

            return { el: path, len, order };
        });

        circles.forEach((circle) => {
            circle._r = parseFloat(circle.getAttribute('r'));
            circle.setAttribute('r', 0);
            circle.style.opacity = 0;
        });

        ScrollTrigger.create({
            trigger: connector,
            start: 'top 96%',
            end: 'bottom 4%',
            scrub: 0.65,
            onUpdate(self) {
                const p = self.progress;
                const easedProgress = easeInOutQuart(p);
                connector.style.setProperty('--connector-progress', easedProgress.toFixed(3));
                connector.style.setProperty('--connector-line-opacity', (0.08 + easedProgress * 0.22).toFixed(3));
                connector.style.setProperty('--connector-svg-opacity', (0.035 + easedProgress * 0.08).toFixed(3));
                connector.style.setProperty('--connector-path-opacity', (0.08 + easedProgress * 0.18).toFixed(3));
                connector.style.setProperty('--connector-ghost-opacity', (0.03 + easedProgress * 0.06).toFixed(3));
                connector.style.setProperty('--connector-circle-opacity', (0.08 + easedProgress * 0.2).toFixed(3));
                connector.style.setProperty('--connector-scale', (0.2 + easedProgress * 0.8).toFixed(3));
                connector.style.setProperty('--connector-svg-shift', `${((0.5 - easedProgress) * 18).toFixed(2)}px`);

                pathData.forEach(({ el, len, order }) => {
                    const local = clamp01((p - order) / Math.max(0.12, 1 - order));
                    const eased = easeInOutQuart(local);
                    const offset = len * (1 - eased);
                    el.style.strokeDashoffset = offset;
                });

                circles.forEach((circle) => {
                    const appear = parseFloat(circle.dataset.appear ?? '0.5');
                    const maxOpacity = parseFloat(circle.dataset.mo ?? '0.65');
                    const t = clamp01((p - appear + 0.12) / 0.12);
                    circle.style.opacity = t * maxOpacity;
                    circle.setAttribute('r', circle._r * (0.6 + t * 1.4));
                });
            },
        });
    });
});

// --- Dynamic CMS Integration ---
document.addEventListener('DOMContentLoaded', async () => {
    const articlesList = document.getElementById('dynamic-articles-list');
    const searchInput = document.getElementById('article-search-input');
    if (!articlesList) return;

    try {
        const res = await fetch(POSTS_URL);
        if (!res.ok) throw new Error('CMS Backend offline');
        const posts = await res.json();

        const renderPosts = (list) => {
            articlesList.innerHTML = '';
            list.forEach(post => {
                const tagHtml = post.tags && post.tags.length > 0
                    ? post.tags.map(t => `<span class="article-tag">${t}</span>`).join('')
                    : '<span class="article-tag">ARTICLE</span>';

                const card = document.createElement('a');
                card.href = '/article.html?id=' + post.id;
                card.className = 'article-card magnetic reveal-element';
                card.innerHTML = `
                    <div class="article-meta">
                        <span class="article-date">${post.date}</span>
                        <div style="display:flex; gap:0.5rem;">${tagHtml}</div>
                    </div>
                    <h3 class="article-title">${post.title}</h3>
                    <p class="article-excerpt">${post.excerpt}</p>
                    <div class="article-stats" style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-secondary);">
                        <span style="margin-right: 1rem;">❤️ ${post.likes || 0}</span>
                        <span>💬 ${post.comments ? post.comments.length : 0}</span>
                    </div>
                `;
                articlesList.appendChild(card);
            });

            if (list.length === 0) {
                articlesList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No matching articles.</p>';
            }
        };

        const applyArticleReveal = () => {
            initRevealOnScroll(document.querySelectorAll('.article-card.reveal-element'), {
                threshold: 0.14,
                visibleClass: 'is-visible'
            });
        };

        renderPosts(posts);
        applyArticleReveal();

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const keyword = searchInput.value.trim().toLowerCase();
                if (!keyword) {
                    renderPosts(posts);
                    applyArticleReveal();
                    return;
                }
                const filtered = posts.filter((post) => {
                    const tags = Array.isArray(post.tags) ? post.tags.join(' ').toLowerCase() : '';
                    return (
                        (post.title || '').toLowerCase().includes(keyword) ||
                        (post.excerpt || '').toLowerCase().includes(keyword) ||
                        tags.includes(keyword)
                    );
                });
                renderPosts(filtered);
                applyArticleReveal();
            });
        }

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    } catch (e) {
        console.error('Failed to load dynamic articles:', e);
        articlesList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Error: Could not connect to CMS Backend. Please run <code>node server.js</code></p>';
    }
});

// --- 3D Holographic Cube Interaction ---
document.addEventListener('DOMContentLoaded', () => {
    const cube = document.getElementById('code-cube');
    if (!cube) return;

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Target rotation angles
    let rotX = -15;
    let rotY = 25;
    
    // Current rotation angles (for lerping)
    let currentRotX = -15;
    let currentRotY = 25;

    // Auto-rotation flag
    let autoRotate = true;

    // Mouse events
    document.addEventListener('mousedown', (e) => {
        isDragging = true;
        autoRotate = false; // Stop auto-rotation when user interacts
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) {
            // Optional: slight parallax effect on hover
            return;
        }

        const deltaMove = {
            x: e.offsetX - previousMousePosition.x,
            y: e.offsetY - previousMousePosition.y
        };

        // Adjust rotation speed multiplier here
        rotY += deltaMove.x * 0.5;
        rotX -= deltaMove.y * 0.5;

        // Clamp X rotation to prevent flipping upside down completely
        rotX = Math.max(-90, Math.min(90, rotX));

        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        // Resume auto-rotation after a short delay
        setTimeout(() => { if (!isDragging) autoRotate = true; }, 3000);
    });
    
    // Touch support for mobile
    document.addEventListener('touchstart', (e) => {
        isDragging = true;
        autoRotate = false;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, {passive: true});
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const deltaMove = {
            x: e.touches[0].clientX - previousMousePosition.x,
            y: e.touches[0].clientY - previousMousePosition.y
        };
        rotY += deltaMove.x * 0.5;
        rotX -= deltaMove.y * 0.5;
        rotX = Math.max(-90, Math.min(90, rotX));
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, {passive: true});
    
    document.addEventListener('touchend', () => {
        isDragging = false;
        setTimeout(() => { if (!isDragging) autoRotate = true; }, 3000);
    });

    // Render loop with lerping for smoothness
    const renderCube = () => {
        if (autoRotate && !isDragging) {
            rotY += 0.2; // Auto spin speed
        }

        // Linear interpolation (lerp)
        currentRotX += (rotX - currentRotX) * 0.1;
        currentRotY += (rotY - currentRotY) * 0.1;

        cube.style.transform = "rotateX(" + currentRotX + "deg) rotateY(" + currentRotY + "deg)";

        requestAnimationFrame(renderCube);
    };

    renderCube();
});
