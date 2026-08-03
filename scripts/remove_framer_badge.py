#!/usr/bin/env python3
"""Strips the SSR'd '__framer-badge-container' div (the "Made in Framer" badge)
out of every mirrored HTML page. Uses balanced-tag scanning since the badge
markup contains nested <div>s."""
import glob
import re

START = '<div id="__framer-badge-container">'


def strip_badge(html):
    idx = html.find(START)
    if idx == -1:
        return html, False
    # Walk forward counting div open/close tags to find the matching close tag.
    pos = idx + len(START)
    depth = 1
    tag_re = re.compile(r'<div\b|</div>')
    for m in tag_re.finditer(html, pos):
        if m.group(0) == '</div>':
            depth -= 1
        else:
            depth += 1
        if depth == 0:
            end = m.end()
            return html[:idx] + html[end:], True
    raise RuntimeError("unbalanced div - could not find end of badge container")


changed_files = []
for path in sorted(glob.glob('**/index.html', recursive=True)):
    with open(path, encoding='utf-8') as f:
        html = f.read()
    new_html, changed = strip_badge(html)
    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_html)
        changed_files.append(path)
        print(f"stripped badge from {path}")

print(f"Done. {len(changed_files)} files updated.")
