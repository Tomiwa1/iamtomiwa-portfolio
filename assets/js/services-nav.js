/*
 * Adds a "Services" item to the site nav.
 *
 * These pages are Framer exports: the React bundle re-renders the nav on hydration
 * and again whenever the mobile menu opens, so a link baked into the exported HTML
 * gets thrown away. This runs after hydration instead, and re-applies itself
 * whenever React rebuilds the nav.
 */
(function () {
	var script = document.currentScript;
	var HREF = (script && script.getAttribute('data-services-href')) || 'services/index.html';
	var LABEL = 'Services';
	var MARK = 'services-nav-item';

	// Depth of this page, derived from the Services path we were handed
	// ("../../services/index.html" -> "../../").
	var BASE = HREF.replace(/services\/index\.html$/, '');

	// Framer's router rewrites nav hrefs to its own route paths ("../works"),
	// which on this static mirror resolve to /works/works and 404 on a new tab
	// or a shared link. Point them back at real files.
	var NAV_TARGETS = {
		'Works': 'works/index.html',
		'About': 'about/index.html',
		'Contact': 'contact/index.html'
	};

	function repairNav(link, label) {
		var target = NAV_TARGETS[label];
		if (!target) return;
		var href = link.getAttribute('href') || '';
		if (href.indexOf(BASE + target) === 0 || /index\.html$/.test(href)) return;
		link.setAttribute('href', BASE + target);
	}

	// Clone the "About" item so the new one inherits Framer's generated classes,
	// text presets and hover transitions exactly.
	function addAfter(aboutLink) {
		var item = aboutLink.closest('[data-framer-component-type="RichTextContainer"]');
		if (!item || !item.parentNode) return;

		var next = item.nextElementSibling;
		if (next && next.classList.contains(MARK)) return;

		var clone = item.cloneNode(true);
		var link = clone.querySelector('a');
		if (!link) return;

		clone.classList.add(MARK);
		clone.removeAttribute('data-framer-appear-id'); // don't collide with the original's entrance animation

		// The source item may be mid entrance-animation when we clone it. Framer only
		// animates its own nodes, so pin the copy to the finished state or it stays invisible.
		clone.style.opacity = '1';
		clone.style.transform = 'none';

		link.textContent = LABEL;
		link.setAttribute('href', HREF);
		link.removeAttribute('data-framer-page-link-current');

		item.parentNode.insertBefore(clone, item.nextSibling);
	}

	// Case Studies is archived — the section no longer exists in the site's
	// information architecture, so drop it from the Framer-rendered nav too.
	function removeArchived(link) {
		var item = link.closest('[data-framer-component-type="RichTextContainer"]');
		if (item && item.parentNode) item.remove();
	}

	function inject() {
		var links = document.querySelectorAll('nav a');
		for (var i = 0; i < links.length; i++) {
			var link = links[i];
			var label = link.textContent.trim();
			if (label === 'Case Studies') { removeArchived(link); continue; }
			repairNav(link, label);
			if (label === 'About' && !link.closest('.' + MARK)) addAfter(link);
		}
	}

	// Run synchronously rather than via requestAnimationFrame: rAF never fires while
	// the tab is backgrounded, so a page opened in a background tab would never get
	// the link. `running` stops our own insertion from re-entering the observer.
	var running = false;
	function schedule() {
		if (running) return;
		running = true;
		try { inject(); } finally { running = false; }
	}

	function start() {
		inject();
		new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
	else start();
})();
