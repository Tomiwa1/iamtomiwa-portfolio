/*
 * Rewrites the About page intro.
 *
 * The Framer copy predates the current work and contradicts the homepage:
 * "businesses of all sizes worldwide" and "multiple hackathons" against a
 * homepage naming Nebula-Q, Solloh and Entrypoint Labs with real numbers.
 * A reader hitting both pages met two different people.
 *
 * Framer re-renders this text on hydration, so the swap happens at runtime,
 * the same approach as home-bio.js.
 */
(function () {
	// Two separate Framer blocks carry the old intro; match each on its opening words.
	var TARGETS = [
		{
			match: 'I collaborate with businesses of all sizes',
			paras: [
				'I’m a product designer and design engineer working across crypto, AI, fintech, ' +
				'healthcare and developer tools. I design the product and, more often than not, ' +
				'build it: Figma through to Webflow, front-end implementation and CMS architecture.',

				'I’m Senior Product Designer at <strong>Nebula-Q Protocol</strong>, where I own ' +
				'<strong>Klærus</strong> end to end, and Lead Design Engineer at ' +
				'<strong>Solloh</strong>, where I designed and built a 40+ page site for ' +
				'<strong>NorthStar Surgery Specialists</strong> that now draws 595,481 search ' +
				'impressions and 472 organic keywords.',

				'Before that I was Lead Product Designer at <strong>Entrypoint Labs</strong>, ' +
				'covering <strong>UltraProp</strong>, <strong>Xend</strong> and ' +
				'<strong>Cortex</strong>. I started out building landing pages and a Webflow ' +
				'component system at <strong>6H Agency</strong> in Cologne, where every page ' +
				'was measured against its cost per acquisition.'
			]
		},
		{
			match: 'My work isn’t just about',
			paras: [
				'My work isn’t about pixels or flows in the abstract. It’s about outcomes: ' +
				'higher adoption, smoother onboarding, and the moment a user says ' +
				'“oh, this makes sense now.”',

				'I work across product strategy, research, interaction design, design systems ' +
				'and engineering, and I use AI tools throughout the process, from early flow ' +
				'exploration to production build.'
			]
		}
	];

	var MARK = 'about-rewritten';

	// The CV button still pointed at a Google Doc. Repoint it at the PDF served
	// from this site, so the link can't break when doc sharing changes.
	var CV_HREF = '../assets/docs/Tomiwa-Akinbode-Resume.pdf';
	function repointCV() {
		var links = document.querySelectorAll('a');
		for (var i = 0; i < links.length; i++) {
			var a = links[i];
			var label = a.textContent.trim().toLowerCase();
			if (label !== 'read.cv' && label !== 'resume' && label !== 'view resume') continue;
			if (a.getAttribute('href') === CV_HREF) continue;
			a.setAttribute('href', CV_HREF);
			a.setAttribute('target', '_blank');
			a.setAttribute('rel', 'noopener');
			if (a.textContent.trim() === 'Read.cv') a.textContent = 'Resume';
		}
	}
	var P_STYLE = 'font-family:"Onest","Onest Placeholder",sans-serif;font-size:19px;' +
	              'line-height:1.6;letter-spacing:normal;margin:0 0 18px;color:inherit;';

	function build(container, paras) {
		container.innerHTML = '';
		for (var i = 0; i < paras.length; i++) {
			var p = document.createElement('p');
			p.className = 'framer-text';
			p.setAttribute('style', P_STYLE + (i === paras.length - 1 ? 'margin-bottom:0;' : ''));
			p.innerHTML = paras[i];
			container.appendChild(p);
		}
		container.classList.add(MARK);
	}

	function apply() {
		repointCV();
		var paras = document.querySelectorAll('p');
		for (var i = 0; i < paras.length; i++) {
			var text = paras[i].textContent;
			for (var t = 0; t < TARGETS.length; t++) {
				if (text.indexOf(TARGETS[t].match) === -1) continue;
				var container = paras[i].closest('[data-framer-component-type="RichTextContainer"]') || paras[i].parentNode;
				if (container && !container.classList.contains(MARK)) build(container, TARGETS[t].paras);
			}
		}
	}

	// Synchronous rather than rAF, which never fires in a backgrounded tab.
	var running = false;
	function schedule() {
		if (running) return;
		running = true;
		try { apply(); } finally { running = false; }
	}

	function start() {
		apply();
		new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
	else start();
})();
