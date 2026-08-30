/*
 * Adds the policy links (About Us, Contact Us, Refund Policy, Privacy Policy,
 * Terms and Conditions) to the footer of the Framer-exported pages.
 *
 * Payment processors check these are reachable from the site, and the Framer
 * footer is rendered by the React bundle — anything written into the exported
 * HTML is dropped on hydration. So the row is added at runtime and re-applied
 * whenever React rebuilds the footer, the same approach as services-nav.js.
 */
(function () {
	var script = document.currentScript;
	var BASE = (script && script.getAttribute('data-base')) || '';
	var MARK = 'legal-links-row';

	var LINKS = [
		['Services', 'services/index.html']
	];

	function addStyles() {
		if (document.getElementById('legal-links-style')) return;
		var style = document.createElement('style');
		style.id = 'legal-links-style';
		style.textContent =
			'.' + MARK + '{display:flex;flex-wrap:wrap;gap:12px 28px;width:100%;' +
			'margin-top:28px;padding-top:28px;border-top:1px solid #1f1f1f;order:99}' +
			'.' + MARK + ' a{color:#8a8a8a;font-family:"Inter","Inter Placeholder",sans-serif;' +
			'font-size:15px;font-weight:500;text-decoration:none;transition:color .3s ease}' +
			'.' + MARK + ' a:hover{color:#fff}';
		document.head.appendChild(style);
	}

	function buildRow() {
		var row = document.createElement('div');
		row.className = MARK;
		LINKS.forEach(function (pair) {
			var a = document.createElement('a');
			a.textContent = pair[0];
			a.setAttribute('href', BASE + pair[1]);
			row.appendChild(a);
		});
		return row;
	}

	function inject() {
		var footers = document.querySelectorAll('footer');
		for (var i = 0; i < footers.length; i++) {
			var container = footers[i].querySelector('[data-framer-name="Container"]');
			if (!container || container.querySelector('.' + MARK)) continue;
			container.appendChild(buildRow());
		}
	}

	// Run synchronously rather than via requestAnimationFrame: rAF never fires while
	// the tab is backgrounded, so a page opened in a background tab would never get
	// these links. `running` stops our own insertion from re-entering the observer.
	var running = false;
	function schedule() {
		if (running) return;
		running = true;
		try { inject(); } finally { running = false; }
	}

	function start() {
		addStyles();
		inject();
		new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
	else start();
})();
