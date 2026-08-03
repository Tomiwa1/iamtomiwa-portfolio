#!/usr/bin/env python3
"""
Mirrors https://iamtomiwa.framer.website into a fully local, self-hosted static site.
Downloads every page (from sitemap.xml), every image/font/JS bundle they reference,
rewrites all internal navigation links to relative local paths, and rewrites asset
URLs (images/fonts/JS) to local copies under assets/.
"""
import os
import re
import sys
import time
import posixpath
import urllib.request
import urllib.error
from urllib.parse import urljoin, urlsplit

BASE = "https://iamtomiwa.framer.website"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # portfolio dir
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

ROUTES = [
    "/", "/works", "/case-studies", "/contact", "/about",
    "/case-studies/aftermath-finance", "/case-studies/xend-global",
    "/works/kamino-finance", "/works/fuse-wallet-android", "/works/lydus", "/works/slean",
    "/works/hanju", "/works/6h-agency", "/works/xend-global", "/works/loozr",
    "/works/findr", "/works/hdh",
]

IMG_RE = re.compile(r'https://framerusercontent\.com/images/[A-Za-z0-9_-]+\.(?:png|jpe?g|webp|svg|gif|avif)(?:\?[^\s"\'<>`)]*)?')
FONT_ASSET_RE = re.compile(r'https://framerusercontent\.com/assets/[A-Za-z0-9_-]+\.woff2?')
GSTATIC_RE = re.compile(r'https://fonts\.gstatic\.com/[^\s"\'<>`)]+\.woff2?')
SITEJS_RE = re.compile(r'https://framerusercontent\.com/sites/[A-Za-z0-9_-]+/[A-Za-z0-9_.\-]+\.(?:mjs|json)')
ANALYTICS_SCRIPT_RE = re.compile(r'<script async src="https://events\.framer\.com/script\?v=2"[^>]*></script>')


def route_to_local(route):
    if route == "/":
        return "index.html"
    return route.strip("/") + "/index.html"


ROUTE_MAP = {r: route_to_local(r) for r in ROUTES}


def fetch(url, retries=3):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last_err = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read()
        except Exception as e:
            last_err = e
            time.sleep(1)
    raise RuntimeError(f"Failed to fetch {url}: {last_err}")


def local_asset_path(kind, basename):
    return f"assets/{kind}/{basename}"


def basename_no_query(url):
    path = urlsplit(url).path
    return posixpath.basename(path)


def relpath(from_file, to_file):
    """relpath between two repo-root-relative file paths, posix style, for use in href/src."""
    from_dir = posixpath.dirname(from_file)
    rel = posixpath.relpath(to_file, from_dir or ".")
    return rel


def main():
    print("Fetching pages...")
    pages = {}
    for route in ROUTES:
        url = BASE + route
        pages[route] = fetch(url).decode("utf-8")
        print(f"  {route} ({len(pages[route])} bytes)")

    # Collect asset URLs
    images = set()
    fonts = set()
    site_assets = set()

    for html in pages.values():
        images.update(IMG_RE.findall(html))
        fonts.update(FONT_ASSET_RE.findall(html))
        fonts.update(GSTATIC_RE.findall(html))
        site_assets.update(SITEJS_RE.findall(html))

    print(f"Found {len(images)} unique images, {len(fonts)} unique fonts, {len(site_assets)} unique JS/JSON bundles")

    # Download images (strip query string -> canonical file)
    img_url_to_local = {}  # any exact matched string (incl query) -> local repo path
    img_base_downloaded = {}  # basename -> local repo path (dedup by basename)
    for img_url in sorted(images):
        base = basename_no_query(img_url)
        if base not in img_base_downloaded:
            local_path = local_asset_path("images", base)
            local_fs = os.path.join(ROOT, local_path)
            os.makedirs(os.path.dirname(local_fs), exist_ok=True)
            clean_url = urlsplit(img_url)._replace(query="").geturl()
            try:
                data = fetch(clean_url)
            except Exception as e:
                print(f"  ! image fetch failed, retrying with original query: {img_url}: {e}")
                data = fetch(img_url)
            with open(local_fs, "wb") as f:
                f.write(data)
            img_base_downloaded[base] = local_path
            print(f"  image -> {local_path} ({len(data)} bytes)")
        img_url_to_local[img_url] = img_base_downloaded[base]

    # Download fonts
    font_url_to_local = {}
    for font_url in sorted(fonts):
        base = basename_no_query(font_url)
        local_path = local_asset_path("fonts", base)
        local_fs = os.path.join(ROOT, local_path)
        if not os.path.exists(local_fs):
            os.makedirs(os.path.dirname(local_fs), exist_ok=True)
            data = fetch(font_url)
            with open(local_fs, "wb") as f:
                f.write(data)
            print(f"  font -> {local_path} ({len(data)} bytes)")
        font_url_to_local[font_url] = local_path

    # Download site JS/JSON bundles (flat dir; relative imports between them are sibling-relative)
    site_url_to_local = {}
    for su in sorted(site_assets):
        base = basename_no_query(su)
        local_path = local_asset_path("js", base)
        local_fs = os.path.join(ROOT, local_path)
        if not os.path.exists(local_fs):
            os.makedirs(os.path.dirname(local_fs), exist_ok=True)
            data = fetch(su)
            with open(local_fs, "wb") as f:
                f.write(data)
            print(f"  site-asset -> {local_path} ({len(data)} bytes)")
        site_url_to_local[su] = local_path

    # Patch JS/JSON bundle contents: rewrite embedded framerusercontent image/font URLs
    # to paths relative to assets/js/ (module-relative resolution).
    for su, local_path in site_url_to_local.items():
        local_fs = os.path.join(ROOT, local_path)
        if not local_fs.endswith(".mjs"):
            continue
        with open(local_fs, "r", encoding="utf-8") as f:
            text = f.read()
        changed = False

        def sub_img(m):
            nonlocal changed
            base = basename_no_query(m.group(0))
            if base in img_base_downloaded:
                changed = True
                return "../images/" + base
            return m.group(0)

        def sub_font(m):
            nonlocal changed
            base = basename_no_query(m.group(0))
            changed = True
            return "../fonts/" + base

        text = IMG_RE.sub(sub_img, text)
        text = FONT_ASSET_RE.sub(sub_font, text)
        text = GSTATIC_RE.sub(sub_font, text)
        if changed:
            with open(local_fs, "w", encoding="utf-8") as f:
                f.write(text)

    # Rewrite each HTML page
    print("Rewriting pages...")
    for route, html in pages.items():
        local_file = ROUTE_MAP[route]

        # Remove Framer analytics script (tied to the original Framer project id)
        html = ANALYTICS_SCRIPT_RE.sub("", html)

        # Rewrite asset URLs to local relative paths
        html = IMG_RE.sub(lambda m: relpath(local_file, img_url_to_local[m.group(0)]), html)
        html = FONT_ASSET_RE.sub(lambda m: relpath(local_file, font_url_to_local[m.group(0)]), html)
        html = GSTATIC_RE.sub(lambda m: relpath(local_file, font_url_to_local[m.group(0)]), html)
        html = SITEJS_RE.sub(lambda m: relpath(local_file, site_url_to_local[m.group(0)]), html)

        # Rewrite internal nav links: href="./..." resolved against current route
        def sub_href(m):
            href_val = m.group(1)
            target_route = urljoin(BASE + route, href_val)
            split = urlsplit(target_route)
            target_path = split.path
            if target_path != "/" and target_path.endswith("/"):
                target_path = target_path[:-1]
            if target_path in ROUTE_MAP:
                return 'href="' + relpath(local_file, ROUTE_MAP[target_path]) + '"'
            return m.group(0)

        html = re.sub(r'href="(\./[^"]*)"', sub_href, html)

        out_fs = os.path.join(ROOT, local_file)
        os.makedirs(os.path.dirname(out_fs) or ROOT, exist_ok=True)
        with open(out_fs, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  wrote {local_file}")

    print("Done.")


if __name__ == "__main__":
    main()
