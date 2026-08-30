/*
 * Runtime patches for the Framer-rendered work listings.
 *
 * 1. Repairs project links. After hydration Framer's router rewrites
 *    "kamino-finance/index.html" to "./works/kamino-finance", which resolves to
 *    /works/works/kamino-finance — a 404 on this static mirror. In-page clicks
 *    still work because the router intercepts them, but opening a card in a new
 *    tab, copying its link, or a crawler following it all hit the 404. We rewrite
 *    those hrefs back to real paths.
 *
 * 2. Replaces the Kamino Finance card with Klærus, cloning the existing card so
 *    it inherits Framer's generated styling, and swapping the still image for
 *    the looping product video.
 *
 * Runs after hydration and re-applies whenever React rebuilds the grid — the
 * same approach as services-nav.js.
 */
(function () {
	var script = document.currentScript;
	var BASE = (script && script.getAttribute('data-base')) || '';

	// Klærus takes over the Kamino tile; Cortex is inserted straight after it, so
	// the two current projects lead the grid and the older work follows.
	var REPLACEMENTS = [
		{
			slug: 'kamino-finance',
			title: 'Klærus',
			href: 'works/klaerus/index.html',
			video: 'assets/videos/klaerus-card.mp4',
			poster: 'assets/images/klaerus/card-poster.jpg',
			mark: 'klaerus-card'
		}
	];

	var INSERTIONS = [
		{
			after: 'klaerus-card',
			title: 'Cortex',
			href: 'works/cortex/index.html',
			image: 'assets/images/cortex/brain-graph.jpg',
			mark: 'cortex-card'
		}
	];

	// Slot three: UltraProp replaces the Fuse Wallet tile.
	REPLACEMENTS.push({
		slug: 'fuse-wallet-android',
		title: 'UltraProp',
		href: 'works/ultraprop/index.html',
		image: 'assets/images/ultraprop/terminal.png',
		mark: 'ultraprop-card'
	});

	// Lydus keeps its slot and title — tile art swapped for a crop of the concept.
	REPLACEMENTS.push({
		slug: 'lydus',
		title: 'Lydus',
		href: 'works/lydus/index.html',
		image: 'assets/images/lydus/card.jpg',
		mark: 'lydus-card'
	});

	// Slean keeps its slot and title — this only swaps the tile art, which was a
	// 2.8 MB PNG, for a 116 KB crop of the app itself.
	REPLACEMENTS.push({
		slug: 'slean',
		title: 'Slean',
		href: 'works/slean/index.html',
		image: 'assets/images/slean/card.jpg',
		mark: 'slean-card'
	});

	// 6H sits third, straight after Klærus. Cortex is inserted first (above), so
	// inserting after the same card lands 6H between Klærus and Cortex.
	INSERTIONS.push({
		after: 'klaerus-card',
		title: '6H Agency',
		href: 'works/6h-agency/index.html',
		image: 'assets/images/sixh/card.svg',
		mark: 'sixh-card'
	});

	// NorthStar leads the grid — inserted before Klærus rather than displacing a
	// tile, giving the order NorthStar, Klærus, Cortex, UltraProp, Lydus, Slean.
	INSERTIONS.push({
		before: 'klaerus-card',
		title: 'NorthStar Surgery',
		href: 'works/northstar/index.html',
		image: 'assets/images/northstar/card.jpg',
		mark: 'northstar-card'
	});

	var ALL_MARKS = REPLACEMENTS.concat(INSERTIONS).map(function (s) { return s.mark; });

	// "./works/some-slug" or "./case-studies/some-slug" -> a path that actually exists
	var ROUTER_HREF = /^\.\/(works|case-studies)\/([a-z0-9-]+)\/?$/;

	function repairLinks() {
		var links = document.querySelectorAll('a[href^="./works/"], a[href^="./case-studies/"]');
		for (var i = 0; i < links.length; i++) {
			var m = ROUTER_HREF.exec(links[i].getAttribute('href') || '');
			if (m) links[i].setAttribute('href', BASE + m[1] + '/' + m[2] + '/index.html');
		}
	}

	function buildCard(original, spec) {
		var card = original.cloneNode(true);
		// Shed any marker inherited from the card we cloned, or the copy would
		// answer to the original's selector too. Derived from the specs so a new
		// project can't be forgotten here.
		for (var m = 0; m < ALL_MARKS.length; m++) card.classList.remove(ALL_MARKS[m]);
		card.classList.add(spec.mark);

		var link = card.querySelector('a');
		if (!link) return null;
		link.setAttribute('href', BASE + spec.href);
		// Framer's router delegates clicks on links inside the app root; this node
		// isn't part of its tree, so navigate explicitly rather than risk a no-op.
		link.addEventListener('click', function (e) {
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
			e.preventDefault();
			e.stopPropagation();
			window.location.href = link.getAttribute('href');
		}, true);

		// The source card may hold an <img> or, if we cloned an already-swapped
		// card, a <video>. Either way it is the thing we replace.
		var img = card.querySelector('img, video');
		if (img) {
			var media;
			if (spec.video) {
				media = document.createElement('video');
				media.src = BASE + spec.video;
				media.poster = BASE + spec.poster;
				media.autoplay = true;
				media.muted = true;
				media.loop = true;
				media.playsInline = true;
				media.setAttribute('muted', '');
				media.setAttribute('playsinline', '');
				media.setAttribute('preload', 'metadata');
			} else {
				media = document.createElement('img');
				media.src = BASE + spec.image;
				media.alt = spec.title;
			}
			media.setAttribute('aria-label', spec.title);
			media.style.cssText = 'display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit;';
			img.parentNode.replaceChild(media, img);
			// A <picture>/srcset sibling would otherwise still paint the old image
			var leftovers = card.querySelectorAll('source');
			for (var i = 0; i < leftovers.length; i++) leftovers[i].remove();
		}

		var heading = card.querySelector('h1, h2, h3, h4, h5');
		if (heading) heading.textContent = spec.title;

		return card;
	}

	function swapCard(spec) {
		if (document.querySelector('.' + spec.mark)) return;
		var link = document.querySelector('a[href*="' + spec.slug + '"]');
		if (!link) return;

		// The card sits in a Framer container div; fall back to the anchor itself.
		var original = link.closest('[class*="-container"]') || link;
		if (!original.parentNode) return;

		var card = buildCard(original, spec);
		if (!card) return;

		original.parentNode.insertBefore(card, original);
		original.remove();
	}

	function insertCard(spec) {
		if (document.querySelector('.' + spec.mark)) return;
		var anchor = document.querySelector('.' + (spec.after || spec.before));
		if (!anchor || !anchor.parentNode) return; // wait until the neighbour card exists

		var card = buildCard(anchor, spec);
		if (!card) return;
		anchor.parentNode.insertBefore(card, spec.before ? anchor : anchor.nextSibling);
	}

	function apply() {
		repairLinks();
		for (var i = 0; i < REPLACEMENTS.length; i++) swapCard(REPLACEMENTS[i]);
		for (var j = 0; j < INSERTIONS.length; j++) insertCard(INSERTIONS[j]);
	}

	var running = false;
	function schedule() {
		if (running) return;
		running = true;
		try { apply(); } finally { running = false; }
	}

	function start() {
		apply();
		new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });

		// Framer hydrates the grid in stages, and a pass can land mid-render — the
		// card we anchor to may not be committed yet. Once the grid settles no
		// further mutations fire, so the observer alone gives us no second chance.
		// A few bounded sweeps cover that race; apply() is idempotent, so they
		// no-op once everything is in place.
		var sweeps = 0;
		var timer = setInterval(function () {
			apply();
			if (++sweeps >= 10) clearInterval(timer);
		}, 400);
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
	else start();
})();
