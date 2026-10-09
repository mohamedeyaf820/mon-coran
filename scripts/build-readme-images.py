"""Builds the README images from the raw captures (scripts/capture-readme-screenshots.mjs).

Every capture is shown inside a device: a phone, a tablet (portrait and landscape)
or a browser window. Output in docs/images/ (WebP unless noted):

  hero.webp, social-preview.png (1280x640)      project banner
  devices-phone.webp, devices-phone-2.webp       two strips of phones
  devices-tablet.webp                            portrait and landscape tablets
  devices-desktop.webp                           browser windows
  desktop-*.webp                                 single framed desktop shots

Run: python scripts/build-readme-images.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAW = Path("docs/images/raw")
OUT = Path("docs/images")
SITE = "mon-coran-kappa.vercel.app"
GREEN_DARK = (9, 54, 33)
GREEN = (15, 106, 67)
GOLD = (233, 200, 120)
CREAM = (247, 243, 232)
INK = (22, 33, 28)
FONT_DIR = Path("C:/Windows/Fonts")


def font(name, size):
    for candidate in (name, "segoeui.ttf"):
        try:
            return ImageFont.truetype(str(FONT_DIR / candidate), size)
        except OSError:
            continue
    return ImageFont.load_default()


def load(name, crop_bottom=0, crop_top=0):
    img = Image.open(RAW / f"{name}.png").convert("RGB")
    if crop_bottom or crop_top:
        img = img.crop((0, crop_top, img.width, img.height - crop_bottom))
    return img


def fit_width(img, width):
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def rounded(img, radius):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *img.size), radius, fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def drop_shadow(size, radius, blur=40, opacity=120, dy=28):
    pad = blur * 3
    layer = Image.new("RGBA", (size[0] + pad * 2, size[1] + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle((pad, pad + dy, pad + size[0], pad + size[1] + dy), radius, fill=(0, 0, 0, opacity))
    return layer.filter(ImageFilter.GaussianBlur(blur)), pad


# --- device frames ----------------------------------------------------------
def phone(screen, width):
    """A phone: dark bezel, rounded glass, dynamic-island pill. `width` is the outer width."""
    bezel = max(10, round(width * 0.032))
    inner_w = width - 2 * bezel
    shot = fit_width(screen, inner_w)
    radius_out = round(width * 0.155)
    radius_in = radius_out - bezel
    size = (width, shot.height + 2 * bezel)
    body = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((0, 0, *size), radius_out, fill=(24, 26, 27, 255))
    d.rounded_rectangle((1, 1, size[0] - 2, size[1] - 2), radius_out - 1, outline=(78, 82, 84, 255), width=2)
    body.alpha_composite(rounded(shot, radius_in), (bezel, bezel))
    pill_w, pill_h = round(width * 0.27), round(width * 0.062)
    d.rounded_rectangle(((size[0] - pill_w) // 2, bezel + round(width * 0.025), (size[0] + pill_w) // 2, bezel + round(width * 0.025) + pill_h), pill_h // 2, fill=(12, 13, 14, 255))
    return body, radius_out


def tablet(screen, width):
    bezel = max(14, round(width * 0.03))
    inner_w = width - 2 * bezel
    shot = fit_width(screen, inner_w)
    radius_out = round(width * 0.062)
    radius_in = max(8, radius_out - bezel)
    size = (width, shot.height + 2 * bezel)
    body = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((0, 0, *size), radius_out, fill=(30, 32, 33, 255))
    d.rounded_rectangle((1, 1, size[0] - 2, size[1] - 2), radius_out - 1, outline=(86, 90, 92, 255), width=2)
    body.alpha_composite(rounded(shot, radius_in), (bezel, bezel))
    return body, radius_out


def browser(screen, width, url=SITE):
    """A browser window: traffic lights, address pill, rounded corners."""
    shot = fit_width(screen, width)
    bar = round(width * 0.036)
    radius = round(width * 0.012)
    size = (width, shot.height + bar)
    win = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(win)
    d.rounded_rectangle((0, 0, *size), radius, fill=(236, 238, 237, 255))
    r = round(bar * 0.17)
    cy = bar // 2
    for i, colour in enumerate(((255, 95, 87), (254, 188, 46), (40, 200, 64))):
        cx = round(bar * 0.62) + i * round(bar * 0.52)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=colour)
    pill_w = round(width * 0.34)
    px = (width - pill_w) // 2
    d.rounded_rectangle((px, round(bar * 0.2), px + pill_w, round(bar * 0.8)), round(bar * 0.3), fill=(255, 255, 255, 255))
    f = font("segoeui.ttf", round(bar * 0.4))
    tw = d.textlength(url, font=f)
    d.text((px + (pill_w - tw) / 2, round(bar * 0.27)), url, font=f, fill=(90, 100, 96))
    content = Image.new("RGBA", shot.size, (0, 0, 0, 0))
    content.alpha_composite(shot.convert("RGBA"))
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *size), radius, fill=255)
    win.alpha_composite(content, (0, bar))
    win.putalpha(Image.composite(win.getchannel("A"), Image.new("L", size, 0), mask))
    return win, radius


def place(canvas, device, xy, radius, rotate=0, shadow=True, blur=36):
    body, _ = device if isinstance(device, tuple) else (device, radius)
    if rotate:
        body = body.rotate(rotate, resample=Image.BICUBIC, expand=True)
    if shadow:
        sh, pad = drop_shadow(body.size, radius, blur=blur)
        canvas.alpha_composite(sh, (xy[0] - pad, xy[1] - pad))
    canvas.alpha_composite(body, xy)
    return body.size


def backdrop(size, top=(250, 247, 238), bottom=(232, 240, 233)):
    img = Image.new("RGBA", size)
    d = ImageDraw.Draw(img)
    for y in range(size[1]):
        t = y / size[1]
        d.line((0, y, size[0], y), fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
    return img


def caption(canvas, text, cx, y, size=40, colour=GREEN):
    d = ImageDraw.Draw(canvas)
    f = font("segoeuib.ttf", size)
    d.text((cx - d.textlength(text, font=f) / 2, y), text, font=f, fill=colour)


def save(img, name, **kw):
    img.convert("RGB").save(OUT / name, "WEBP", quality=88, method=6, **kw)


PLAYER = 108  # the sticky mini player hides the last lines of desktop reader shots

# --- 1. hero + social preview --------------------------------------------------
W, H = 2400, 1200
hero = Image.new("RGBA", (W, H), GREEN_DARK)
g = ImageDraw.Draw(hero)
for x in range(W):
    t = x / W
    g.line((x, 0, x, H), fill=(int(8 + 14 * t), int(48 + 40 * t), int(30 + 30 * t), 255))
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse((1300, -300, 2500, 700), fill=(233, 200, 120, 40))
hero.alpha_composite(glow.filter(ImageFilter.GaussianBlur(120)))
d = ImageDraw.Draw(hero)
d.text((140, 140), "MushafPlus", font=font("segoeuib.ttf", 150), fill=(255, 255, 255))
d.text((146, 330), "Lire, écouter et", font=font("segoeui.ttf", 64), fill=GOLD)
d.text((146, 410), "comprendre le Coran.", font=font("segoeui.ttf", 64), fill=GOLD)
for i, line in enumerate(["Hafs & Warsh", "Tajwid aux couleurs de Quran.com", "54 récitateurs · hors-ligne · FR · EN · AR"]):
    d.text((146, 550 + i * 66), line, font=font("segoeui.ttf", 44), fill=(214, 232, 222))
d.rounded_rectangle((146, 800, 700, 890), 45, fill=GOLD)
d.text((190, 816), SITE, font=font("segoeuib.ttf", 42), fill=GREEN_DARK)
d.text((146, 950), "PWA gratuite, sans compte, sans serveur.", font=font("segoeui.ttf", 38), fill=(170, 204, 188))
d.text((146, 1006), "Vos notes restent sur votre appareil.", font=font("segoeui.ttf", 38), fill=(170, 204, 188))

place(hero, browser(load("reader-mushaf-desktop", PLAYER), 1000), (1330, 120), 14)
place(hero, tablet(load("reader-mushaf-tablet"), 560), (1020, 520), 34)
place(hero, phone(load("reader-mushaf-mobile"), 330), (2000, 600), 51)
hero_rgb = hero.convert("RGB")
hero_rgb.save(OUT / "hero.webp", "WEBP", quality=88, method=6)
hero_rgb.resize((1280, 640), Image.LANCZOS).save(OUT / "social-preview.png", optimize=True)


# --- 2. phone strips ------------------------------------------------------------
def strip(items, name, width=1900, per_row=None, cap_size=38):
    n = len(items)
    gap = round(width * 0.04)
    card = (width - gap * (n + 1)) // n
    devices = [phone(load(shot), card) for shot, _ in items]
    top = 70
    height = max(dv[0].height for dv in devices) + top + 150
    canvas = backdrop((width, height))
    for i, ((shot, label), dv) in enumerate(zip(items, devices)):
        x = gap + i * (card + gap)
        place(canvas, dv, (x, top), dv[1], blur=30)
        caption(canvas, label, x + card // 2, top + dv[0].height + 36, size=cap_size)
    save(canvas, name)


strip([("home-mobile", "Accueil"), ("reader-mushaf-mobile", "Mushaf · Tajwid"), ("reader-mobile", "Liste · traduction"),
       ("audio-mobile", "54 récitateurs"), ("menu-mobile", "Menu · mode sombre")], "devices-phone.webp", width=2400, cap_size=42)
strip([("reader-arabic-mobile", "Arabe · RTL · sépia"), ("search-auto-mobile", "Recherche automatique"), ("duas-mobile", "Invocations"),
       ("reciter-mobile", "Récitateur"), ("settings-mobile", "Réglages")], "devices-phone-2.webp", width=2400, cap_size=38)
strip([("splash-mobile", "Démarrage animé"), ("prayers-mobile", "Mes prières"), ("about-mobile", "Transparence"),
       ("home-mobile", "Accueil")], "devices-phone-3.webp", width=2000, cap_size=40)

# --- 3. tablets ---------------------------------------------------------------
TW, TH = 2400, 1010
tab = backdrop((TW, TH))
a = tablet(load("reader-mushaf-tablet"), 600)
b = tablet(load("audio-tablet"), 600)
c = tablet(load("reader-tablet-wide-dark"), 1000)
x = 70
for dv, label in ((a, "Tablette · mushaf"), (b, "Tablette · récitateurs")):
    place(tab, dv, (x, 60), dv[1], blur=30)
    caption(tab, label, x + 300, 60 + dv[0].height + 34, size=40)
    x += 670
place(tab, c, (1380, 200), c[1], blur=30)
caption(tab, "Paysage · thème sombre", 1380 + 500, 200 + c[0].height + 34, size=40)
save(tab, "devices-tablet.webp")

# --- 4. desktop -------------------------------------------------------------
DW, DH = 2400, 1300
desk = backdrop((DW, DH))
big = browser(load("reader-list-desktop"), 1380)
place(desk, big, (100, 90), big[1], blur=40)
dark = browser(load("reader-mushaf-dark", PLAYER), 1120)
place(desk, dark, (1180, 440), dark[1], blur=40)
warsh = browser(load("reader-warsh", PLAYER), 760)
place(desk, warsh, (1560, 90), warsh[1], blur=30)
caption(desk, "Ordinateur · liste, mushaf, sombre, Warsh", DW // 2, DH - 90, size=44)
save(desk, "devices-desktop.webp")

# --- 5. single framed desktop shots -------------------------------------------
for name, crop in (("home-desktop", 0), ("reader-mushaf-desktop", PLAYER), ("reader-warsh", PLAYER), ("reader-mushaf-dark", PLAYER),
                   ("audio-desktop", 0), ("search-desktop", 0), ("search-auto-desktop", 0), ("about-desktop", 0), ("settings-desktop", 0)):
    if not (RAW / f"{name}.png").exists():
        continue
    win, radius = browser(load(name, crop), 1500)
    pad = 60
    canvas = backdrop((win.width + pad * 2, win.height + pad * 2))
    place(canvas, (win, radius), (pad, pad), radius, blur=28)
    save(canvas, f"desktop-{name.removesuffix('-desktop')}.webp")

print("done", sorted(p.name for p in OUT.glob("*.webp")))
