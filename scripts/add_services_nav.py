#!/usr/bin/env python3
"""Load services-nav.js on every Framer-exported page, at the bodyEnd marker."""

PAGES = {
    'index.html': ('assets/js/services-nav.js', 'services/index.html'),
    'about/index.html': ('../assets/js/services-nav.js', '../services/index.html'),
    'works/index.html': ('../assets/js/services-nav.js', '../services/index.html'),
    'case-studies/index.html': ('../assets/js/services-nav.js', '../services/index.html'),
    'contact/index.html': ('../assets/js/services-nav.js', '../services/index.html'),
}

MARKER = '<!-- Start of bodyEnd -->'
TAG = '<script src="{src}" data-services-href="{href}"></script>'


def patch(path, src, href):
    html = open(path, encoding='utf-8').read()
    if 'services-nav.js' in html:
        return 'already patched'
    if MARKER not in html:
        return 'NO MARKER'
    tag = TAG.format(src=src, href=href)
    html = html.replace(MARKER, MARKER + '\n    ' + tag, 1)
    open(path, 'w', encoding='utf-8').write(html)
    return 'added'


if __name__ == '__main__':
    for page, (src, href) in PAGES.items():
        print('%-24s %s' % (page, patch(page, src, href)))
