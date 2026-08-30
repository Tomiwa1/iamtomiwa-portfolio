#!/usr/bin/env python3
"""Fail if any [[ PLACEHOLDER ]] is still in the policy pages.

The payment-processor pages carry business details that only the owner knows
(address, phone). Run this before publishing:

    python3 scripts/check_placeholders.py

Exits non-zero and lists every remaining placeholder with its file and line.
"""
import re
import sys
from pathlib import Path

PAGES = [
    'about-us/index.html',
    'contact-us/index.html',
    'refund-policy/index.html',
    'privacy-policy/index.html',
    'terms/index.html',
    'policies/index.html',
    'works/klaerus/index.html',
    'works/northstar/index.html',
]

PLACEHOLDER = re.compile(r'\[\[\s*([^\]]+?)\s*\]\]')


def main():
    root = Path(__file__).resolve().parent.parent
    found = []

    for page in PAGES:
        path = root / page
        if not path.exists():
            print('missing: %s' % page)
            continue
        for lineno, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
            for match in PLACEHOLDER.finditer(line):
                found.append((page, lineno, match.group(1)))

    if not found:
        print('OK — no placeholders left in %d pages.' % len(PAGES))
        return 0

    print('%d placeholder(s) still to fill in:\n' % len(found))
    for page, lineno, name in found:
        print('  %s:%d  %s' % (page, lineno, name))
    print('\nFill these in before publishing.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
