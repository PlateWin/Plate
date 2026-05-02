/**
 * Plate. Page Transition & Splash Logic
 * Optimized for zero-flash and smooth 60fps performance
 */

import { fetchSiteConfig } from '/assets/js/site-content.js';

const initTransition = async () => {
    const mask = document.querySelector('.page-mask');
    const logoContainer = document.querySelector('.transition-logo');
    if (!mask || !logoContainer) return;

    const isFirstLoad = !sessionStorage.getItem('plate_visited');

    // Failsafe: If anything hangs, reveal the page after 2.5s anyway
    const failsafe = setTimeout(() => {
        gsap.to(mask, { scaleY: 0, duration: 0.5, ease: "power2.out" });
        gsap.set(mask, { pointerEvents: "none" });
    }, 2500);

    try {
        if (typeof gsap === 'undefined') {
            console.error('GSAP not loaded');
            clearTimeout(failsafe);
            mask.style.display = 'none';
            return;
        }

        gsap.config({ force3D: true });

        if (isFirstLoad) {
            sessionStorage.setItem('plate_visited', 'true');
            // Everything is Klein Blue now
            gsap.set(mask, { scaleY: 1, opacity: 1, backgroundColor: '#002FA7', pointerEvents: 'all' });

            let siteName = 'Plate';
            try {
                // Set a timeout for config fetch to avoid hanging
                const configPromise = fetchSiteConfig();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('timeout'), 1000));
                const config = await Promise.race([configPromise, timeoutPromise]);
                siteName = config.site.name || 'Plate';
            } catch (e) {
                console.warn('Config fetch failed or timed out, using default name');
            }
            
            logoContainer.innerHTML = `${siteName}<span class="dot">.</span>`;

            const tl = gsap.timeline();
            tl.to(logoContainer, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out",
                delay: 0.2
            })
            .to(logoContainer, {
                opacity: 0,
                y: -15,
                duration: 0.5,
                ease: "power3.in",
                delay: 0.5
            })
            .to(mask, {
                scaleY: 0,
                duration: 0.8,
                ease: "expo.inOut",
                onStart: () => {
                    gsap.set(mask, { transformOrigin: "top" });
                },
                onComplete: () => {
                    gsap.set(mask, { pointerEvents: "none", backgroundColor: '#002FA7' });
                    clearTimeout(failsafe);
                }
            });

        } else {
            // Subsequent Page Load: Smooth reveal from top
            // If we are coming from a transition, it might be blue. 
            // We ensure it's blue for consistency if it was just loaded.
            gsap.set(mask, { transformOrigin: "top", backgroundColor: '#002FA7' });
            gsap.to(mask, {
                scaleY: 0,
                duration: 0.6,
                ease: "expo.out",
                onComplete: () => {
                    gsap.set(mask, { pointerEvents: "none" });
                    clearTimeout(failsafe);
                }
            });
        }
    } catch (err) {
        console.error('Transition error:', err);
        mask.style.display = 'none';
        clearTimeout(failsafe);
    }
};

// Listen for clicks
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && link.origin === window.location.origin && 
        !link.getAttribute('href')?.startsWith('#') && link.target !== '_blank' &&
        !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        
        const href = link.getAttribute('href');
        if (href.startsWith('javascript:') || link.hasAttribute('download')) return;

        e.preventDefault();
        const mask = document.querySelector('.page-mask');
        if (mask) {
            // Ensure transition is Klein Blue
            gsap.set(mask, { transformOrigin: "bottom", backgroundColor: '#002FA7', pointerEvents: "all" });
            gsap.to(mask, {
                scaleY: 1,
                duration: 0.5,
                ease: "expo.inOut",
                onComplete: () => {
                    requestAnimationFrame(() => {
                        window.location.href = link.href;
                    });
                }
            });
        }
    }
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const mask = document.querySelector('.page-mask');
        if (mask) gsap.set(mask, { scaleY: 0, pointerEvents: "none" });
    }
});

// Run as soon as DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTransition);
} else {
    initTransition();
}
