#!/usr/bin/env python3
"""Load legal-links.js on every Framer-exported page, at the bodyEnd marker."""

PAGES = {
    'index.html': ('assets/js/legal-links.js', ''),
    'about/index.html': ('../assets/js/legal-links.js', '../'),
    'works/index.html': ('../assets/js/legal-links.js', '../'),
    'case-studies/index.html': ('../assets/js/legal-links.js', '../'),
    'contact/index.html': ('../assets/js/legal-links.js', '../'),
}

MARKER = '<!-- Start of bodyEnd -->'
TAG = '<script src="{src}" data-base="{base}"></script>'


def patch(path, src, base):
    html = open(path, encoding='utf-8').read()
    if 'legal-links.js' in html:
        return 'already patched'
    if MARKER not in html:
        return 'NO MARKER'
    html = html.replace(MARKER, MARKER + '\n    ' + TAG.format(src=src, base=base), 1)
    open(path, 'w', encoding='utf-8').write(html)
    return 'added'


if __name__ == '__main__':
    for page, (src, base) in PAGES.items():
        print('%-24s %s' % (page, patch(page, src, base)))
