#!/usr/bin/env python3
"""
Second pass: catches asset URLs that only appear *inside* the downloaded JS bundles
(not in the original page HTML) - e.g. CSS-mask SVGs, /assets/*.png images referenced
as JS object literals, and .framercms CMS data modules used for client-side hydration.
"""
import os
import re
import urllib.request
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

IMAGE_RE = re.compile(r'https://framerusercontent\.com/(?:images|assets)/[A-Za-z0-9_-]+\.(?:png|jpe?g|webp|svg|gif|avif)(?:\?[^\s"\'<>`)]*)?')
FRAMERCMS_RE = re.compile(r'https://framerusercontent\.com/modules/[A-Za-z0-9_/\-]+\.framercms')


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def basename_no_query(url):
    return os.path.basename(urlsplit(url).path)


js_dir = os.path.join(ROOT, "assets", "js")
modules_dir = os.path.join(ROOT, "assets", "modules")
images_dir = os.path.join(ROOT, "assets", "images")
os.makedirs(modules_dir, exist_ok=True)

for fname in sorted(os.listdir(js_dir)):
    if not fname.endswith(".mjs"):
        continue
    fpath = os.path.join(js_dir, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        text = f.read()
    changed = False

    def sub_image(m):
        global changed
        url = m.group(0)
        base = basename_no_query(url)
        local_fs = os.path.join(images_dir, base)
        if not os.path.exists(local_fs):
            clean_url = urlsplit(url)._replace(query="").geturl()
            data = fetch(clean_url)
            with open(local_fs, "wb") as f:
                f.write(data)
            print(f"  image -> assets/images/{base} ({len(data)} bytes)")
        changed = True
        return "../images/" + base

    def sub_cms(m):
        global changed
        url = m.group(0)
        base = basename_no_query(url)
        local_fs = os.path.join(modules_dir, base)
        if not os.path.exists(local_fs):
            data = fetch(url)
            with open(local_fs, "wb") as f:
                f.write(data)
            print(f"  cms-module -> assets/modules/{base} ({len(data)} bytes)")
        changed = True
        return "../modules/" + base

    new_text = IMAGE_RE.sub(sub_image, text)
    new_text = FRAMERCMS_RE.sub(sub_cms, new_text)

    if new_text != text:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_text)
        print(f"patched {fname}")

print("Pass 2 done.")
