# imagimation-studios.github.io

Static ImagiMation Studios website for `imagimationstudios.org`, including Talk Like Ape, Cat Game, and Seethe. GitHub Pages serves the HTML directly; this is not a Next.js project.

## Seethe

The `seethe/` directory contains the overview, about, support, privacy, data-request, and terms pages. Fonts and artwork are bundled locally.

Preview from the repository root:

```sh
python3 -m http.server 4190 --bind 127.0.0.1
```

Open `http://127.0.0.1:4190/seethe/`. Check links and page metadata with:

```sh
python3 scripts/check_seethe.py
```

The Seethe pages are prepared locally. After publishing, verify their public URLs before uploading store metadata. The sibling `flame-lab` repository records those URLs in `publishing/web-presence.json` and checks them with `scripts/verify_store_urls.py`.
