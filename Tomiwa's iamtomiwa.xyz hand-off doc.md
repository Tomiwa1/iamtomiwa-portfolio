---
project: iamtomiwa-portfolio
consumer: successor-agent
version: 1
date: 2026-08-30
repo: https://github.com/Tomiwa1/iamtomiwa-portfolio
live: https://iamtomiwa.xyz
description: Portfolio site for Samuel (Tomiwa) Akinbode, a Framer export being progressively replaced with hand-built static pages. Written for the next AI session picking this up cold.
---

# Tomiwa's iamtomiwa.xyz hand-off doc

https://iamtomiwa.xyz

**Read this layer if…** you are an AI session or developer about to touch this
repo and have never seen it before.

---

## Level 0 · What this is

A personal portfolio site for a product designer and design engineer, live at
iamtomiwa.xyz. It began as an export from Framer, and most of what matters now
is hand-written HTML sitting alongside that export. Eight project case studies,
a services page, and an about page.

**Stop here if** you only needed to know what the site is.

---

## Level 1 · Executive summary

The owner is Samuel Akinbode (also goes by Tomiwa), a product designer and
design engineer based in Newcastle, UK, who moved there in late August 2026. The
site exists to get him hired and to win client work, there is an active job
application in crypto product design driving most recent decisions.

The site is a **static site on GitHub Pages**, served from the `main` branch of
`Tomiwa1/iamtomiwa-portfolio` at the custom domain `iamtomiwa.xyz` (see `CNAME`).
There is no build step. What is in the repo is what is served. Deploy is
`git push origin main`, then GitHub Pages builds in roughly a minute.

The critical thing to understand before changing anything: **the original site
is a Framer export whose pages are re-rendered by React on load.** Editing the
HTML of those pages does not work, hydration discards your changes. Several
runtime scripts exist purely to work around this, and they are the single
biggest source of surprise in this codebase. Everything in Level 4 is about
living with that constraint.

The direction of travel is to replace Framer pages with plain hand-built HTML.
Four pages have already been converted and one more (the homepage) is the
remaining candidate. Each conversion has removed a class of bug rather than just
changing how a page looks.

**Stop here if** you are triaging whether to pick this up at all.

---

## Level 2 · What the site contains

The site is organised around **Works**, which is the point of the whole thing.
Eight projects, in this deliberate order, which the owner set personally:

| Order | Project | What it is | URL |
|---|---|---|---|
| 1 | Octant | Project registry for public-goods funding | `/works/octant/` |
| 2 | NorthStar Surgery | Austin surgical practice, SEO/design engineering | `/works/northstar/` |
| 3 | Klærus | Probability perpetuals protocol on Arbitrum | `/works/klaerus/` |
| 4 | 6H Agency | Cologne native-advertising agency, 2022 | `/works/6h-agency/` |
| 5 | Cortex | Sovereign AI memory layer on Sui | `/works/cortex/` |
| 6 | UltraProp | On-chain crypto prop-trading firm | `/works/ultraprop/` |
| 7 | Lydus | Self-initiated DeFi trading concept | `/works/lydus/` |
| 8 | Slean | Gamified Solana learning app | `/works/slean/` |

Navigation is exactly four items: **Works, About, Services, Contact**. A Case
Studies section used to exist and was archived deliberately, do not reinstate it.

Each project page follows the same shape: a hero with title, lede, a **See Live**
button and a metadata block (role, scope, period, status), then a sticky
table-of-contents beside prose organised as problem → design approach →
numbered decision blocks → outcomes. The decision blocks are the heart of each
page; the owner cares that the writing is about *decisions and trade-offs*, not
feature lists. That standard was set after an early review found the existing
case studies were strong on reasoning but had no outcome metrics.

The site is **not** a blog, not a CMS, and no longer sells payment-verified
services. A `/services/` page with three fixed-price packages exists and is
linked in the nav, but the policy pages that once backed it (terms, refunds,
privacy) have been archived because the Flutterwave application they were built
for is no longer being pursued.

**Stop here if** you are writing copy or planning content and will not touch code.

---

## Level 3 · Voice, vocabulary and house rules

The writing voice is plain, concrete and allergic to marketing language. Sentences
state what was decided and why. Numbers appear only when real. Where a number
cannot be verified, the page says so or omits it rather than estimating.

**Hard rules, learned from corrections during the build:**

**No em dashes.** The owner asked for every em dash to be replaced with a comma.
All 234 instances across visible copy were converted. Do not reintroduce them.
Note that in page *titles*, a comma created nonsense (`Klærus, Samuel Akinbode`
reads as a list), so titles use a middot: `Klærus · Samuel Akinbode`. Follow that
pattern.

**Never invent metrics.** Several pages carry real figures supplied by the owner
(Klærus: 2,000+ beta requests, ~5% admitted, $200k+ traded; NorthStar: an 80%
revenue-growth figure, deliberately expressed as a percentage because the
underlying revenue is not public). Where results were unknown the page says
"where it stands" and describes status instead. Lydus explicitly ends in open
questions because it was never built.

**Attribute other people's numbers.** The 6H Agency page quotes the agency's own
campaign results (−35% CPA and similar) and states plainly that those are the
agency's results across its client base, not the owner's personal attribution.
The page also quotes a reference letter from 6H's CTO, Leon Soliman, with
attribution; the letter PDF itself is deliberately **not** published because it
carries a third party's signature.

**Canonical vocabulary:** Klærus always takes the æ ligature. UltraProp is one
word, capital U and P. 6H Agency, not 6h. NorthStar Surgery, one word, capital S.
The owner's name on the site is "Samuel"; his résumé and LinkedIn use "Tomiwa
Samuel Akinbode". Both are correct; don't "fix" one to match the other.

**Anti-patterns.** Do not describe Lydus as client work, it was a personal
exploration, and the honesty is the point. Do not restore Kamino Finance; it was
retired because its copy was 58% identical to the Aftermath case study, which
would have read as boilerplate to anyone opening both. Do not add a Case Studies
nav item. Do not publish the reference letter PDF.

**Stop here if** you are editing copy only.

---

## Level 4 · Working spec: the codebase and its traps

This is the layer that will save you time. Read all of it before editing.

### The Framer hydration problem

Four pages are still Framer exports: `index.html` (homepage), `about/index.html`,
`contact/index.html`, and `works/fuse-wallet-android/index.html`. These ship
server-rendered HTML that React re-renders on load. **Any static edit you make to
their markup is discarded during hydration.** This was verified directly: a nav
link added to the HTML was gone from the DOM after load.

The workaround is a set of small runtime scripts in `assets/js/` that wait for
hydration, then patch the DOM, and re-apply via a `MutationObserver` whenever
React rebuilds:

| Script | Loaded on | What it does |
|---|---|---|
| `services-nav.js` | homepage, about, contact, fuse-wallet | Adds the Services nav item, removes the archived Case Studies item |
| `legal-links.js` | same four | Appends the footer link row |
| `works-cards.js` | homepage only | Swaps and inserts the seven project cards into the Framer grid, and repairs project links |
| `home-bio.js` | homepage | Replaces the hero bio with a multi-paragraph version |
| `about-bio.js` | about | Replaces the About copy, repoints the CV button at the hosted PDF |

**Two bugs in these scripts were found and fixed. Do not reintroduce them.**

First, they originally debounced with `requestAnimationFrame`. **rAF never fires
in a backgrounded tab**, so anyone opening the site in a background tab, very
common, got none of these patches. All five now run synchronously with a
re-entrancy guard instead.

Second, Framer's router rewrites project links on hydration from
`klaerus/index.html` to `./works/klaerus`, which resolves to
`/works/works/klaerus`, a 404. In-page clicks still worked because the router
intercepted them, but opening a card in a new tab, copying its link, or crawling
the site all broke. `works-cards.js` rewrites those hrefs back to real paths.

### What was converted to static HTML, and why it mattered

`works/index.html` was the Framer Works listing. Its actual markup listed
**Kamino Finance, Fuse Wallet Android, Lydus and Slean**, the retired projects,
with the seven current ones swapped in by JavaScript afterwards. A stale cache,
a slow connection or a crawler saw the old set. The owner hit this directly and
reported seeing old projects. It is now plain HTML with a real seven-card grid,
styled by `assets/css/works.css`. **What is in the markup is what is on the page.**

Also static: every project page under `works/*/`, plus `/services/`. These use
`assets/css/site.css` (fonts, tokens, header, footer, prose) plus
`assets/css/case-study.css` (project page furniture and theming).

### Per-project theming

Each project page carries its subject's brand colour on accents only, buttons,
decision tags, bullets, while site chrome stays neutral. Themes live at the top
of `case-study.css` as body classes:

```
body.cs-klaerus   { --brand: #c408a4; --accent: #c408a4; }
body.cs-cortex    { --brand: #6339d4; --accent: #6339d4; }
body.cs-ultraprop { --brand: #e7151e; --accent: #e7151e; }
body.cs-slean     { --brand: #84e8e8; --accent: #0f766e; --brand-ink: #0b0b0b; }
body.cs-lydus     { --brand: #047857; --accent: #047857; }
body.cs-northstar { --brand: #003060; --accent: #003060; }
body.cs-sixh      { --brand: #ff3c00; --accent: #c72e00; --brand-ink: #0b0b0b; }
```

There are **three** tokens, and the split exists for a real reason. Slean's brand
cyan is 14.7:1 against black but **1.43:1 against white**, unreadable as text.
So `--brand` fills buttons, `--brand-ink` is the text colour on that fill, and
`--accent` is a separate, darker value for text on white. Adding a theme means
sampling the colour from the live product (never guessing), checking contrast
both ways, and adding one line here plus the body class on the page.

### Cache busting · the rule that keeps getting broken

Every script and stylesheet is referenced with a `?v=N` query. This exists
because the owner twice reported "I don't see it" when the file on disk was
correct but their browser served a cached copy.

**If you edit a shared asset, bump its version on every page that references it.**
I found three different pins for one stylesheet (`case-study.css` at v=9, v=10
and v=12) and unified them to **v=13**; `legal-links.js` is now **v=3**
everywhere. A mismatch is silent, pages keep working, and then one day an edit
only reaches some of them.

### Archived, not deleted

Retired pages follow a consistent pattern: the original is preserved beside the
redirect as `index.archived.html`, and `index.html` becomes a stub with
`<meta http-equiv="refresh">`, a `noindex`, a canonical, and a JS
`location.replace`. Restoring one is a rename.

Currently archived: `policies/`, `case-studies/` and its two children, and
`works/{kamino-finance,xend-global,loozr,hanju,findr,hdh}`.

### Supporting scripts

`scripts/check_placeholders.py` fails if any `[[ PLACEHOLDER ]]` remains in the
pages it tracks, run it before every publish. Pages carrying unfilled business
details show them in a loud yellow highlight so they cannot ship unnoticed.
`scripts/add_services_nav.py` and `scripts/add_legal_links.py` re-apply the
script tags if the Framer pages are ever re-exported.

**Stop here if** you are making changes but not deploying.

---

## Level 5 · Environment, deploy and verification

Local preview is a plain static server on port 8734, configured in
`.claude/launch.json`. Use the preview tooling rather than `python3 -m http.server`
in a shell. The owner asks for this constantly, "start the server" means start
that preview and give them `http://localhost:8734/...` links.

Deploy: `git push origin main`, then poll the Pages build. The GitHub CLI lives
at `~/.local/bin/gh`, **not on `PATH`**, so call it by full path. It is
authenticated via a keychain token (account `Tomiwa1`, scopes `gist`, `read:org`,
`repo`). A previous session installed `gh` into a temp directory and pointed the
global git credential helper at it; the directory was cleaned up and pushes broke
with a confusing `could not read Username` error. It now points at the permanent
location. If pushes fail that way again, that config is the first place to look.

```
git push origin main
~/.local/bin/gh api repos/Tomiwa1/iamtomiwa-portfolio/pages/builds/latest --jq .status
```

**Verify against the live site, not the local one.** The owner reported "I don't
see it" four separate times, and every single time the cause was that he was
looking at `iamtomiwa.xyz` while the work sat unpushed locally, or his browser
had cached an old asset. Before telling him something is done, `curl` the live
URL and check the actual bytes.

A caveat about the browser preview tool: screenshots frequently return blank or
stale frames after a programmatic scroll, and `requestAnimationFrame` does not
advance because the pane reports `document.visibilityState === "hidden"`. CSS
transitions therefore appear frozen. Measure the DOM with JavaScript instead of
trusting a screenshot, and do not diagnose an animation as broken from a
screenshot alone.

**Stop here unless** you need the full audit trail.

---

## Level 6 · Sources, exclusions and open questions

### Where the facts came from

Project content was taken from the live products themselves, klaerus.xyz,
usecortexai.xyz, ultraprop.xyz, northstarsurgery.com and 6h.agency, browsed and
screenshotted during the build, not written from imagination. Product imagery was
captured with headless Chrome at 2× device scale and cropped, which is why the
screenshots are crisp; the method is worth reusing. Slean and Lydus imagery came
from existing assets already in the repo.

Biographical facts, titles, dates and the NorthStar analytics figures came from
the owner's résumé (`Tomiwa_Akinbode_Resume.docx`). The 6H role, dates and client
came from the reference letter PDF from 6H's CTO. The Klærus beta numbers and the
NorthStar revenue range were supplied directly by the owner in conversation.

### Deliberately excluded

The reference letter PDF is not published, it carries a third party's signature.
NorthStar's absolute revenue figures are not published; the page gives an 80%
growth figure instead, at the owner's instruction, because the practice is not a
public company. The policy pages are archived rather than live because the
payment application behind them was abandoned and their Lagos address is now
wrong after the move to Newcastle.

### Known inconsistencies the owner should resolve

The **résumé master file is out of sync with what is published**. The hosted PDF
at `/assets/docs/Tomiwa-Akinbode-Resume.pdf` was corrected so the 6H entry reads
*Web Designer & Developer, Jul 2022* and the contact address is
the published portfolio contact address, matching the reference letter and the site. The source
`.docx` in `~/Downloads` still says *Technical Product Owner / Product Designer,
Jun 2022* and an outdated personal email address. Sending that file to anyone
contradicts the site. This was flagged and not yet resolved.

**Fuse Wallet Android** is unfinished business. Its page is still the original
Framer export, live at `/works/fuse-wallet-android/`, no longer listed anywhere.
UltraProp took its place in the grid. The owner said explicitly that he would
give instructions for it later. Do not retire it without asking.

The **Aftermath Finance case study** contains three closing paragraphs that
belong to Xend Global, a copy-paste error found early on. It now only exists in
`case-studies/aftermath-finance/index.archived.html`, so it is no longer public,
but if that page is ever restored the error is still in it.

The **homepage grid is still Framer-rendered**. Its server-rendered card titles
were corrected so the no-JS view names current projects, but the cards themselves
are still inserted by `works-cards.js`. Converting the homepage to static HTML
would mean rebuilding the hero and its intro animation, which the owner judged
not worth the risk of changing a look he likes. That decision is recorded, not
closed.

### What the previous session was about to do

### Octant addition · 4 October 2026

Octant is now added locally at `/works/octant/`, and as the first card on the
homepage and Works listing, at the owner’s request. The prior seven projects
follow in their existing relative order.
The owner authorized publishing this addition to GitHub Pages on 4 October 2026.

- Full Figma mockup: https://www.figma.com/design/5pvfrrnoESjfK28sUYK8vb/My-LLms-Cooking.?node-id=0-1
- Application flow: node `29:13004` in the same file.
- Registry / Atlas: node `41:710839` in the same file.
- Live product: https://octant.app/dashboard/projects

Use the owner’s connected student Figma account for this file. Access was
verified. The other connected account sees a request-access screen. The local
bridge was unavailable. Account identifiers are intentionally omitted from
this repository handoff.

The owner confirmed **Product Designer**, **2026**, and the actual brief:
Octant was working on multiple products and needed design support to build its
project registry. The registry lets visitors discover projects, funding rounds,
and the Dragons curating them, with available funding, distributed funding,
and ecosystem activity. Do not frame this as repairing a broken existing flow.

The owner wants a strongly visual portfolio entry to attract clients and apply
for jobs. The page now uses a desktop/mobile registry hero, large paired project,
Dragon, round, and project-detail screens, then an application-flow gallery.
All ten PNGs are direct exports from the supplied Figma file, saved under
`assets/images/octant/`. Each screen links to its full-size image. Numbers
inside mockups are sample interface content, not outcome metrics.

Role, period, scope, brief, and observed design structure are filled in. Visible
copy placeholders have been removed. The owner confirmed he delivered the
designs following Octant’s existing design system, and Octant approved and
used them. This is stated in the metadata and closing delivery section. No
numerical outcome metrics or engineering contribution are claimed.

Styles are isolated in `assets/css/octant.css?v=3`. `works-cards.js` is pinned
at `v=13` on every referencing page, including archived pages. Desktop (1440px)
and mobile (390px) were checked: all images load, columns adapt, and neither
layout overflows horizontally. Local image/navigation references and
`git diff --check` pass. The existing placeholder checker passes for its
configured pages; it does not track Octant.

### Previous handoff state

Nothing was in flight. The last substantive change, rebuilding the Works listing
as real HTML, was committed as `3cbe8e6` and verified live. The version-pin
unification described in Level 4 and this document itself are uncommitted at the
time of writing.

The owner's working rhythm is worth knowing: he reviews in the browser, gives
feedback in voice-transcribed messages that are sometimes garbled (read for
intent, and ask when a name or number is ambiguous rather than guessing), and
says "push" when he wants it live. He asks for the server to be started often.
He responds well to being told plainly when something he asked for would cause a
problem, and he has overruled such flags more than once, when he does, do it his
way and say so.
