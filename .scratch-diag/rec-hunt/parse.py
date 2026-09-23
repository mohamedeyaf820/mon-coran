import re
import sys

def read(p):
    return open(p, encoding='utf-8', errors='replace').read()

def show(f, slug_re=r'/ar/reciters/([a-z0-9\-]+)', img=True):
    s = read(f)
    print('###', f, len(s))
    print('TITLE', re.findall(r'<title[^>]*>(.*?)</title>', s, re.S)[:1])
    print('H1', re.findall(r'<h1[^>]*>(.*?)</h1>', s, re.S)[:3])
    print('OGIMG', re.findall(r'property="og:image"\s+content="([^"]+)"', s)[:3])
    if img:
        urls = set(re.findall(r'https?://[^\s"\'<>\\]*\.(?:jpg|jpeg|png|webp)', s, re.I))
        print('IMGS', sorted(u for u in urls if 'logo' not in u.lower())[:25])
    print('SLUGS', sorted(set(re.findall(slug_re, s)))[:60])

if __name__ == '__main__':
    for f in sys.argv[1:]:
        show(f)
