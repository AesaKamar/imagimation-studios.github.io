#!/usr/bin/env python3
"""Check the new static section's local links, fragment targets, and page metadata."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(); self.links=[]; self.ids=set(); self.h1=0; self.title=False; self.canonical=False; self.analytics=[]
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a:
            assert a['id'] not in self.ids, f'Duplicate ID {a["id"]}'
            self.ids.add(a['id'])
        if tag=='h1': self.h1+=1
        if tag=='title': self.title=True
        if tag=='link' and a.get('rel')=='canonical': self.canonical=True
        if tag in ['a','link','img','script','video','source']:
            link=a.get('href') or a.get('src') or a.get('poster')
            if link: self.links.append(link)
        if tag=='script': self.analytics.append(a.get('src','inline script'))
        if tag=='img': assert 'alt' in a, 'Image missing alt attribute'
pages={p:Page(p) for p in (ROOT/'seethe').rglob('*.html')}
assert len(pages)==6
for path,page in pages.items():
    assert page.h1==1 and page.title and page.canonical, f'Invalid document metadata: {path}'
    assert not page.analytics, f'Unexpected script: {path}'
    for link in page.links:
        u=urlsplit(link)
        if u.scheme or u.netloc: continue
        target=ROOT/u.path.lstrip('/') if u.path.startswith('/') else path.parent/u.path
        if not u.path: target=path
        if target.is_dir(): target=target/'index.html'
        assert target.is_file(), f'Broken link {link} in {path}'
        if u.fragment:
            linked=pages.get(target) or Page(target)
            assert u.fragment in linked.ids, f'Broken fragment {link} in {path}'
print('PASS: six Seethe pages, internal links and anchors, metadata, image descriptions, and no embedded analytics.')
