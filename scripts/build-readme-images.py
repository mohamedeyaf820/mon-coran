"""Builds the README images from the raw captures (scripts/capture-readme-screenshots.mjs).

Output in docs/images/: WebP gallery shots, hero.webp (banner), mobile.webp (phone strip)
and social-preview.png (1280x640, GitHub "Social preview" setting).
Run: python scripts/build-readme-images.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAW = Path("docs/images/raw")
OUT = Path("docs/images")
GREEN_DARK = (9, 54, 33)
GREEN = (15, 106, 67)
GOLD = (233, 200, 120)
CREAM = (248, 244, 232)
FONT_DIR = Path("C:/Windows/Fonts")


def font(name, size):
    for candidate in (name, "segoeui.ttf"):
        try:
            return ImageFont.truetype(str(FONT_DIR / candidate), size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded(img, radius):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *img.size), radius, fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def shadow(size, radius, blur=36, opacity=110):
    pad = blur * 3
    layer = Image.new("RGBA", (size[0] + pad * 2, size[1] + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle((pad, pad + blur // 2, pad + size[0], pad + size[1] + blur // 2), radius, fill=(0, 0, 0, opacity))
    return layer.filter(ImageFilter.GaussianBlur(blur)), pad


def paste_card(canvas, img, xy, radius, border=None):
    sh, pad = shadow(img.size, radius)
    canvas.alpha_composite(sh, (xy[0] - pad, xy[1] - pad))
    card = rounded(img, radius)
    canvas.alpha_composite(card, xy)
    if border:
        ImageDraw.Draw(canvas).rounded_rectangle((xy[0], xy[1], xy[0] + img.size[0], xy[1] + img.size[1]), radius, outline=border, width=2)


def load(name, crop_bottom=0):
    img = Image.open(RAW / f"{name}.png").convert("RGB")
    if crop_bottom:
        img = img.crop((0, 0, img.width, img.height - crop_bottom))
    return img


def fit_width(img, width):
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


# 1. Gallery WebP ---------------------------------------------------------
PLAYER_BAR = 108  # the sticky mini player hides the last lines of desktop reader shots
GALLERY = {
    "home-desktop": (1600, 0), "reader-list-desktop": (1600, 0), "reader-mushaf-desktop": (1600, PLAYER_BAR),
    "reader-mushaf-dark": (1600, PLAYER_BAR), "reader-warsh": (1600, PLAYER_BAR), "search-desktop": (1600, 0),
    "settings-desktop": (1600, 0), "home-mobile": (780, 0), "reader-mobile": (780, 0),
    "reader-arabic-mobile": (780, 0), "audio-mobile": (780, 0), "menu-mobile": (780, 0),
}
for name, (width, crop) in GALLERY.items():
    src = RAW / f"{name}.png"
    if not src.exists():
        continue
    fit_width(load(name, crop), width).save(OUT / f"{name}.webp", "WEBP", quality=84, method=6)

# 2. Hero banner ----------------------------------------------------------
W, H = 2400, 1200
hero = Image.new("RGBA", (W, H), GREEN_DARK)
grad = Image.new("RGBA", (W, H))
gd = ImageDraw.Draw(grad)
for x in range(W):
    t = x / W
    gd.line((x, 0, x, H), fill=(int(8 + 14 * t), int(48 + 40 * t), int(30 + 30 * t), 255))
hero.alpha_composite(grad)
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse((1300, -300, 2500, 700), fill=(233, 200, 120, 38))
hero.alpha_composite(glow.filter(ImageFilter.GaussianBlur(120)))

d = ImageDraw.Draw(hero)
d.text((140, 150), "MushafPlus", font=font("segoeuib.ttf", 150), fill=(255, 255, 255))
d.text((146, 340), "Lire, écouter et", font=font("segoeui.ttf", 64), fill=GOLD)
d.text((146, 420), "comprendre le Coran.", font=font("segoeui.ttf", 64), fill=GOLD)
lines = ["Hafs & Warsh", "Tajwid aux couleurs de Quran.com", "54 récitateurs · hors-ligne · FR · EN · AR"]
for i, line in enumerate(lines):
    d.text((146, 560 + i * 66), line, font=font("segoeui.ttf", 44), fill=(214, 232, 222))
d.rounded_rectangle((146, 810, 690, 900), 45, fill=GOLD)
d.text((190, 826), "mushafplus.netlify.app", font=font("segoeuib.ttf", 42), fill=GREEN_DARK)
d.text((146, 960), "PWA gratuite, sans compte, sans serveur.", font=font("segoeui.ttf", 38), fill=(170, 204, 188))
d.text((146, 1016), "Vos notes restent sur votre appareil.", font=font("segoeui.ttf", 38), fill=(170, 204, 188))

desk = fit_width(load("reader-mushaf-desktop", PLAYER_BAR), 1020)
paste_card(hero, desk, (1290, 150), 24)
phone = fit_width(load("reader-mobile"), 400)
paste_card(hero, phone, (1080, 470), 44, border=(255, 255, 255, 60))
phone2 = fit_width(load("reader-arabic-mobile"), 340)
paste_card(hero, phone2, (2000, 640), 40, border=(255, 255, 255, 60))
hero.convert("RGB").save(OUT / "hero.webp", "WEBP", quality=88, method=6)

# 3. Social preview (1280x640) ---------------------------------------------
social = hero.convert("RGB").resize((1280, 640), Image.LANCZOS)
social.save(OUT / "social-preview.png", optimize=True)

# 4. Phone strip -----------------------------------------------------------
CAPTIONS = [("home-mobile", "Accueil"), ("reader-mobile", "Lecture"), ("reader-arabic-mobile", "Arabe · RTL · sépia"), ("audio-mobile", "Récitateurs"), ("menu-mobile", "Menu · mode sombre")]
card_w, gap, top = 420, 56, 60
strip_w = len(CAPTIONS) * card_w + (len(CAPTIONS) + 1) * gap
shots = [fit_width(load(n), card_w) for n, _ in CAPTIONS]
strip_h = max(s.height for s in shots) + top + 140
strip = Image.new("RGBA", (strip_w, strip_h), CREAM + (255,))
sd = ImageDraw.Draw(strip)
for i, ((name, caption), shot) in enumerate(zip(CAPTIONS, shots)):
    x = gap + i * (card_w + gap)
    paste_card(strip, shot, (x, top), 40, border=(0, 0, 0, 40))
    w = sd.textlength(caption, font=font("segoeuib.ttf", 40))
    sd.text((x + (card_w - w) / 2, top + shot.height + 36), caption, font=font("segoeuib.ttf", 40), fill=GREEN)
strip.convert("RGB").save(OUT / "mobile.webp", "WEBP", quality=86, method=6)
print("done", sorted(p.name for p in OUT.glob("*.webp")) + ["social-preview.png"])
