import { POSTS_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('graph-root');
    if (!container) return;

    // Fetch posts
    let posts;
    try {
        const res = await fetch(POSTS_URL);
        if (!res.ok) throw new Error('CMS offline');
        posts = await res.json();
    } catch (e) {
        console.error('Graph: failed to load posts', e);
        container.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--text-secondary);">Failed to load posts. Is the backend running?</div>';
        return;
    }

    if (!posts.length) {
        container.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--text-secondary);">No posts yet.</div>';
        return;
    }

    // Build graph data
    const tagMap = {};
    const nodes = [];
    const links = [];

    posts.forEach(p => {
        nodes.push({
            type: 'post',
            id: p.id,
            title: p.title,
            likes: p.likes || 0,
            radius: Math.min(8 + (p.likes || 0) * 0.5, 24)
        });
        (p.tags || []).forEach(tag => {
            if (!tagMap[tag]) tagMap[tag] = [];
            tagMap[tag].push(p.id);
        });
    });

    Object.keys(tagMap).forEach(tag => {
        nodes.push({ type: 'tag', id: tag, radius: 5 });
        tagMap[tag].forEach(postId => {
            links.push({ source: postId, target: tag });
        });
    });

    // Build adjacency map for hover highlighting
    const neighbors = {};
    nodes.forEach(n => { neighbors[n.id] = new Set(); });
    links.forEach(l => {
        neighbors[l.source].add(l.target);
        neighbors[l.target].add(l.source);
    });

    // Setup SVG
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;

    // Add legend
    const legend = document.createElement('div');
    legend.className = 'graph-legend';
    legend.innerHTML = `
        <div class="graph-legend-item"><div class="graph-legend-dot post"></div>Article</div>
        <div class="graph-legend-item"><div class="graph-legend-dot tag"></div>Tag</div>
    `;
    container.parentElement.insertBefore(legend, container);

    // Add tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'graph-tooltip';
    document.body.appendChild(tooltip);

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Arrow marker for directed feel (optional, using simple lines)
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', 'rgba(0, 47, 167, 0.2)');

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-150))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 6))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05));

    // Draw links
    const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', 'rgba(0, 47, 167, 0.15)')
        .attr('stroke-width', 1.5);

    // Draw nodes
    const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('cursor', d => d.type === 'post' ? 'pointer' : 'default')
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    // Post nodes: white fill, Klein blue stroke
    node.filter(d => d.type === 'post')
        .append('circle')
        .attr('r', d => d.radius)
        .attr('fill', '#fff')
        .attr('stroke', '#002FA7')
        .attr('stroke-width', 2);

    // Tag nodes: Klein blue fill
    node.filter(d => d.type === 'tag')
        .append('circle')
        .attr('r', d => d.radius)
        .attr('fill', '#002FA7')
        .attr('stroke', 'none');

    // Tag labels
    node.filter(d => d.type === 'tag')
        .append('text')
        .text(d => d.id)
        .attr('font-size', '0.65rem')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-weight', '600')
        .attr('fill', '#002FA7')
        .attr('dx', 8)
        .attr('dy', 4);

    // Post title labels (shown on hover via tooltip)

    // Hover interaction
    node.on('mouseenter', (event, d) => {
        // Highlight neighbors
        node.select('circle')
            .attr('opacity', n => (n.id === d.id || neighbors[d.id].has(n.id)) ? 1 : 0.15);
        link.attr('opacity', l =>
            (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05
        );

        // Tooltip
        if (d.type === 'post') {
            tooltip.textContent = d.title;
        } else {
            tooltip.textContent = `#${d.id} (${tagMap[d.id].length} posts)`;
        }
        tooltip.classList.add('visible');
    })
    .on('mousemove', (event) => {
        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${event.clientY - 30}px`;
    })
    .on('mouseleave', () => {
        node.select('circle').attr('opacity', 1);
        link.attr('opacity', 1);
        tooltip.classList.remove('visible');
    });

    // Click to navigate
    node.filter(d => d.type === 'post')
        .on('click', (event, d) => {
            window.location.href = `/article.html?id=${d.id}`;
        });

    // Tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag handlers
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Responsive resize
    window.addEventListener('resize', () => {
        const r = container.getBoundingClientRect();
        svg.attr('width', r.width).attr('height', r.height);
        simulation.force('center', d3.forceCenter(r.width / 2, r.height / 2));
        simulation.force('x', d3.forceX(r.width / 2).strength(0.05));
        simulation.force('y', d3.forceY(r.height / 2).strength(0.05));
        simulation.alpha(0.3).restart();
    });

    // GSAP entrance
    gsap.from(container, { opacity: 0, y: 30, duration: 1, ease: 'power3.out' });
});
