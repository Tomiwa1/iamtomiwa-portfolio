/*
 * Replaces the homepage hero bio.
 *
 * The original is a single 40px display paragraph. That size can only carry one
 * sentence, which reads as a tagline rather than an introduction, so this swaps
 * it for a multi-paragraph bio at body size: what I do, who I do it for, the
 * current roles, and the numbers behind them.
 *
 * The hero is Framer-rendered, so a static edit to index.html is discarded on
 * hydration. Same runtime approach as services-nav.js: match the old copy,
 * rebuild the block, re-apply whenever React rebuilds the hero.
 */
(function () {
	var OLD = 'designer who thinks like a builder';
	var MARK = 'bio-rewritten';

	// One entry per paragraph. <strong> marks the names worth scanning for.
	var PARAS = [
		'I help startups and product-led companies design and build web and mobile ' +
		'experiences across crypto, AI, fintech, healthcare and developer tools.',

		'I’m Senior Product Designer at <strong>Nebula-Q Protocol</strong>, where I own ' +
		'<strong>Klærus</strong> end to end: a probability-trading protocol on Arbitrum, ' +
		'from the landing page through the trading terminal and admin dashboard.',

		'I’m also Lead Design Engineer at <strong>Solloh</strong>, where I designed and ' +
		'built a 40+ page site for <strong>NorthStar Surgery Specialists</strong>. It now ' +
		'returns 595,481 search impressions and 472 organic keywords, with organic search ' +
		'driving 55.5% of traffic.',

		'Before that I was Lead Product Designer at <strong>Entrypoint Labs</strong>, owning ' +
		'UX across <strong>UltraProp</strong>, an on-chain prop-trading platform on Sui; ' +
		'<strong>Xend</strong>, a passkey-based USD smart-account app on Solana; and ' +
		'<strong>Cortex</strong>, a decentralised AI memory layer.',

		'I work across product strategy, research, interaction design, design systems ' +
		'and engineering.'
	];

	// 40px display type suits one line; a real bio needs body size and leading.
	var P_STYLE = 'font-family:"Onest","Onest Placeholder",sans-serif;font-size:19px;' +
	              'line-height:1.6;letter-spacing:normal;margin:0 0 18px;color:inherit;';

	function build(container) {
		container.innerHTML = '';
		for (var i = 0; i < PARAS.length; i++) {
			var p = document.createElement('p');
			p.className = 'framer-text';
			p.setAttribute('style', P_STYLE + (i === PARAS.length - 1 ? 'margin-bottom:0;' : ''));
			p.innerHTML = PARAS[i];
			container.appendChild(p);
		}
		container.classList.add(MARK);
	}

	function apply() {
		var paras = document.querySelectorAll('p');
		for (var i = 0; i < paras.length; i++) {
			if (paras[i].textContent.indexOf(OLD) === -1) continue;
			var container = paras[i].closest('[data-framer-component-type="RichTextContainer"]') || paras[i].parentNode;
			if (container && !container.classList.contains(MARK)) build(container);
		}
	}

	// Synchronous rather than requestAnimationFrame: rAF never fires in a
	// backgrounded tab, so the bio would never swap in a tab opened in the background.
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
