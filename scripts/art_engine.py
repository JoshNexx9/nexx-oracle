"""NEXX Tarot art engine — Rider-Waite layout, Poe gothic, sci-fi collage."""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 720, 1080

FONT_PATHS = (
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
)


def try_font(size: int, serif: bool = False):
    paths = (FONT_PATHS[1], FONT_PATHS[0], FONT_PATHS[2]) if serif else FONT_PATHS
    for path in paths:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _seed(card_id: str) -> int:
    h = 0
    for c in card_id:
        h = (h * 131 + ord(c)) & 0xFFFFFFFF
    return h


def gradient_bg(img: Image.Image, c1, c2, c3):
    px = img.load()
    for y in range(H):
        t = y / H
        for x in range(W):
            u = x / W
            r = int(c3[0] + (c1[0] * (1 - t) + c2[0] * t) * 0.55 + u * 8)
            g = int(c3[1] + (c1[1] * (1 - t) + c2[1] * t) * 0.55)
            b = int(c3[2] + (c1[2] * (1 - t) + c2[2] * t) * 0.55 + (1 - u) * 6)
            px[x, y] = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))


def halftone_layer(d: ImageDraw.ImageDraw, color, density=28, alpha=0.08):
    rng = random.Random(42)
    for y in range(0, H, density):
        for x in range(0, W, density):
            if rng.random() < 0.55:
                r = rng.randint(1, 3)
                c = tuple(int(v * alpha * 4) for v in color)
                d.ellipse([x, y, x + r, y + r], fill=c)


def draw_rw_border(d: ImageDraw.ImageDraw, c1, c2, c3):
    margin = 36
    inner = 52
    for i in range(4):
        d.rectangle([margin - i * 2, margin - i * 2, W - margin + i * 2, H - margin + i * 2],
                    outline=c1 if i % 2 == 0 else c2, width=1)
    d.rectangle([inner, inner, W - inner, H - inner], outline=c2, width=2)
    corners = [(inner, inner), (W - inner, inner), (inner, H - inner), (W - inner, H - inner)]
    for cx, cy in corners:
        d.arc([cx - 18, cy - 18, cx + 18, cy + 18], 0, 90, fill=c1, width=2)
        d.line([cx, cy, cx + (14 if cx < W // 2 else -14), cy], fill=c1, width=2)
        d.line([cx, cy, cx, cy + (14 if cy < H // 2 else -14)], fill=c1, width=2)


def draw_collage_tiles(d: ImageDraw.ImageDraw, seed: int, c1, c2):
    rng = random.Random(seed)
    for _ in range(6):
        tw = rng.randint(80, 180)
        th = rng.randint(60, 140)
        tx = rng.randint(60, W - tw - 60)
        ty = rng.randint(120, H - th - 140)
        fill = tuple(int(v * rng.uniform(0.08, 0.18)) for v in c1)
        d.rectangle([tx, ty, tx + tw, ty + th], fill=fill, outline=c2, width=1)
        for _ in range(3):
            lx = tx + rng.randint(8, tw - 20)
            ly = ty + rng.randint(8, th - 12)
            d.line([lx, ly, lx + rng.randint(20, 60), ly], fill=c2, width=1)


def draw_scanlines(img: Image.Image, strength=0.06):
    overlay = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for y in range(0, H, 4):
        d.line([(0, y), (W, y)], fill=(0, 0, 0), width=1)
    return Image.blend(img, overlay, strength)


def draw_hud_corners(d: ImageDraw.ImageDraw, c):
    pts = [
        [(48, 48), (120, 48), (120, 58), (58, 58), (58, 120), (48, 120)],
        [(W - 48, 48), (W - 120, 48), (W - 120, 58), (W - 58, 58), (W - 58, 120), (W - 48, 120)],
    ]
    for seq in pts:
        for i in range(len(seq) - 1):
            d.line([seq[i], seq[i + 1]], fill=c, width=2)


def draw_poe_moon(d, cx, cy, r, c1, c2):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c2, outline=c1, width=2)
    for i in range(5):
        ang = i * 1.2
        d.arc([cx - r + i * 8, cy - r, cx + r - i * 5, cy + r], int(ang * 40), 200, fill=c1, width=1)


def draw_raven(d, x, y, scale, c1, c2):
    s = scale
    d.ellipse([x, y, x + 20 * s, y + 14 * s], fill=c1)
    d.polygon([(x + 18 * s, y + 4 * s), (x + 34 * s, y - 6 * s), (x + 30 * s, y + 8 * s)], fill=c2)
    d.polygon([(x + 4 * s, y + 10 * s), (x - 8 * s, y + 18 * s), (x + 2 * s, y + 16 * s)], fill=c2)
    d.line([x + 28 * s, y + 2 * s, x + 32 * s, y - 2 * s], fill=c1, width=2)


def draw_gothic_arch(d, cx, base_y, w, h, c):
    d.rectangle([cx - w // 2, base_y - h, cx + w // 2, base_y], outline=c, width=2)
    d.arc([cx - w // 2, base_y - h - w // 3, cx + w // 2, base_y - h + w // 3], 180, 0, fill=c, width=2)


def draw_candles(d, x, y, c1, c2, n=3):
    for i in range(n):
        cx = x + i * 22
        d.rectangle([cx, y, cx + 8, y + 40], fill=c2, outline=c1)
        d.ellipse([cx - 2, y - 10, cx + 10, y + 4], fill=c1)


def draw_circuit_paths(d, cx, cy, r, c, seed):
    rng = random.Random(seed)
    for _ in range(10):
        ang = rng.uniform(0, math.pi * 2)
        x1 = cx + math.cos(ang) * r * 0.3
        y1 = cy + math.sin(ang) * r * 0.3
        x2 = cx + math.cos(ang) * r
        y2 = cy + math.sin(ang) * r
        d.line([x1, y1, x2, y2], fill=c, width=1)
        d.rectangle([x2 - 3, y2 - 3, x2 + 3, y2 + 3], outline=c)


def draw_rw_pips(d, rank: str, symbol: str, x, y, color, font, sym_font, invert=False):
    label = rank if rank != "10" else "10"
    if invert:
        d.text((x - 44, y - 52), label, fill=color, font=font)
        d.text((x - 32, y - 24), symbol, fill=color, font=sym_font)
    else:
        d.text((x, y), label, fill=color, font=font)
        d.text((x + 2, y + 30), symbol, fill=color, font=sym_font)


def tableau_rect():
    return (72, 200, W - 72, H - 200)


def draw_major_scene(d, card_id: str, name: str, c1, c2, c3):
    cx, cy = W // 2, H // 2 + 30
    seed = _seed(card_id)
    rng = random.Random(seed)
    draw_collage_tiles(d, seed, c1, c2)
    draw_poe_moon(d, cx, cy - 120, 36, c1, c2)
    draw_gothic_arch(d, cx, H - 220, 200, 160, c2)

    def tower_strike():
        d.rectangle([cx - 35, cy - 100, cx + 35, cy + 90], outline=c2, width=2)
        d.polygon([(cx, cy - 90), (cx + 60, cy + 80), (cx - 60, cy + 80)], outline=c1, width=4)
        for i in range(5):
            d.line([cx - 20 + i * 10, cy - 110 - i * 15, cx + rng.randint(-30, 30), cy - 40], fill=c1, width=2)
        d.ellipse([cx - 25, cy - 130, cx + 25, cy - 80], fill=c1)

    def sun_burst():
        for i in range(16):
            ang = i * math.pi / 8
            d.line([cx, cy - 40, cx + 120 * math.cos(ang), cy - 40 + 120 * math.sin(ang)], fill=c1, width=2)
        d.ellipse([cx - 50, cy - 90, cx + 50, cy + 10], fill=c2, outline=c1, width=3)

    def wheel_spin():
        for ring in (110, 75, 40):
            d.ellipse([cx - ring, cy - ring, cx + ring, cy + ring], outline=c1, width=2)
        for i in range(8):
            ang = i * math.pi / 4
            d.line([cx, cy, cx + 100 * math.cos(ang), cy + 100 * math.sin(ang)], fill=c2, width=2)

    scenes = {
        "00": lambda: (draw_raven(d, cx - 80, cy, 2.2, c1, (20, 20, 30)), d.line([cx, cy + 60, cx + rng.randint(-40, 40), H - 200], fill=c1, width=2)),
        "01": lambda: (draw_circuit_paths(d, cx, cy, 80, c1, seed), draw_candles(d, cx - 60, cy + 30, c1, c2, 4)),
        "02": lambda: (draw_poe_moon(d, cx, cy - 60, 55, c1, c2), d.rectangle([cx - 50, cy + 20, cx + 50, cy + 120], outline=c2, width=2)),
        "03": lambda: (draw_gothic_arch(d, cx, cy + 80, 160, 120, c2), draw_circuit_paths(d, cx, cy - 30, 50, c1, seed)),
        "04": lambda: d.rectangle([cx - 70, cy - 60, cx + 70, cy + 80], outline=c1, width=3),
        "06": lambda: (draw_poe_moon(d, cx, cy - 100, 30, c1, c2), d.line([cx - 50, cy, cx + 50, cy], fill=c2, width=2)),
        "09": lambda: (draw_candles(d, cx - 15, cy - 10, c1, c2, 1), d.ellipse([cx - 8, cy - 50, cx + 8, cy - 34], fill=c1)),
        "10": wheel_spin,
        "13": lambda: (draw_candles(d, cx - 40, cy - 20, c1, c2, 5), draw_raven(d, cx + 60, cy - 40, 1.8, c2, c1)),
        "15": lambda: (d.rectangle([cx - 60, cy - 40, cx + 60, cy + 60], outline=c1, width=2), draw_circuit_paths(d, cx, cy + 20, 45, c2, seed + 3)),
        "16": tower_strike,
        "17": lambda: (draw_circuit_paths(d, cx, cy, 100, c1, seed), draw_poe_moon(d, cx + 80, cy - 80, 22, c2, c1)),
        "18": lambda: (draw_poe_moon(d, cx, cy, 70, c1, (40, 40, 80)), draw_raven(d, cx - 90, cy + 40, 1.2, c2, c1)),
        "19": sun_burst,
        "20": lambda: (d.line([cx, cy - 100, cx, cy + 60], fill=c1, width=4), d.polygon([(cx - 40, cy - 80), (cx + 40, cy - 80), (cx, cy - 120)], fill=c2)),
        "21": lambda: (d.ellipse([cx - 100, cy - 60, cx + 100, cy + 80], outline=c1, width=3), wheel_spin()),
    }
    key = card_id.zfill(2) if card_id.isdigit() else card_id
    if key in scenes:
        scenes[key]()
    else:
        draw_circuit_paths(d, cx, cy, 90 + rng.randint(0, 40), c1, seed)
        if rng.random() > 0.4:
            draw_raven(d, cx + rng.randint(-100, 60), cy + rng.randint(-40, 60), 1.4, c1, c3)

    n = 12
    pts = []
    for i in range(n):
        ang = (2 * math.pi * i / n) - math.pi / 2
        rad = 100 if i % 2 == 0 else 62
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(pts, outline=c2, fill=None)
    d.line([cx - 70, cy, cx + 70, cy], fill=c1, width=2)
    d.line([cx, cy - 70, cx, cy + 70], fill=c1, width=2)


def draw_cipher_scene(d, suit: str, rank: str, c1, c2, c3):
    cx, cy = W // 2, H // 2 + 20
    seed = _seed(suit + rank)
    rng = random.Random(seed)
    draw_collage_tiles(d, seed + 7, c1, c2)

    if suit == "sparks":
        draw_raven(d, cx - 30, cy - 60, 1.6, c1, (30, 10, 20))
        for i in range(5):
            ang = -math.pi / 2 + i * 0.35
            d.line([cx, cy, cx + 90 * math.cos(ang), cy + 90 * math.sin(ang)], fill=c1, width=3)
    elif suit == "signal":
        draw_poe_moon(d, cx, cy - 80, 48, c1, c2)
        draw_candles(d, cx - 50, cy + 20, c1, c2, 4)
    elif suit == "cache":
        pts = [(cx, cy - 80), (cx + 70, cy), (cx, cy + 80), (cx - 70, cy)]
        d.polygon(pts, outline=c1, width=3)
        draw_circuit_paths(d, cx, cy, 60, c2, seed)
    else:
        draw_gothic_arch(d, cx, cy + 100, 180, 140, c2)
        draw_circuit_paths(d, cx, cy - 20, 75, c1, seed)

    rv = rank if rank not in ("J", "Q", "K", "A") else {"J": 11, "Q": 12, "K": 13, "A": 14}[rank]
    if isinstance(rv, str):
        rv = int(rv)
    for i in range(min(rv, 10)):
        px = cx + (i - rv / 2) * 22
        py = cy + 60 + (i % 2) * 14
        d.ellipse([px - 8, py - 8, px + 8, py + 8], outline=c2, width=2)


def draw_minor_scene(d, suit: str, rank_id: str, c1, c2, c3):
    cx, cy = W // 2, H // 2 + 10
    seed = _seed(suit + rank_id)
    draw_collage_tiles(d, seed, c1, c2)
    symbols = {"wands": "⚡", "cups": "◎", "swords": "†", "pentacles": "◇"}
    sym = symbols.get(suit, "✦")

    if suit == "cups":
        draw_poe_moon(d, cx, cy - 90, 40, c1, c2)
        draw_candles(d, cx - 30, cy, c1, c2)
    elif suit == "swords":
        draw_raven(d, cx - 20, cy - 70, 1.5, c1, c3)
        d.line([cx, cy - 100, cx, cy + 90], fill=c1, width=4)
        d.line([cx - 30, cy - 60, cx + 30, cy - 60], fill=c2, width=3)
    elif suit == "wands":
        for i in range(3):
            d.line([cx - 40 + i * 40, cy + 80, cx - 40 + i * 40, cy - 80], fill=c1, width=4)
    else:
        pts = [(cx, cy - 70), (cx + 55, cy), (cx, cy + 70), (cx - 55, cy)]
        d.polygon(pts, outline=c1, width=3)

    count = 1 if rank_id == "ace" else int(rank_id) if rank_id.isdigit() else 1
    if rank_id in ("page", "knight", "queen", "king"):
        draw_gothic_arch(d, cx, cy + 110, 120, 90, c2)
        count = 1
    for i in range(min(count, 10)):
        row = i // 3
        col = i % 3
        px = cx + (col - 1) * 50
        py = cy + 30 + row * 36
        d.text((px, py), sym, fill=c2, font=try_font(22))


def render_tarot_card(card: dict, palette: tuple, out: Path):
    suit = card["suit"]
    c1, c2, c3 = palette
    img = Image.new("RGB", (W, H), c3)
    gradient_bg(img, c1, c2, c3)
    d = ImageDraw.Draw(img)
    halftone_layer(d, c1)
    draw_rw_border(d, c1, c2, c3)
    draw_hud_corners(d, c1)

    title_font = try_font(30, serif=True)
    small_font = try_font(18)
    num_font = try_font(26)

    x0, y0, x1, y1 = tableau_rect()
    d.rectangle([x0, y0, x1, y1], fill=(0, 0, 0, 30), outline=c2, width=1)

    if suit == "major":
        draw_major_scene(d, card["id"], card["name"], c1, c2, c3)
    else:
        rank_id = card["art"].split("-")[-1].replace(".png", "")
        draw_minor_scene(d, suit, rank_id, c1, c2, c3)

    name = card["name"].upper()
    if len(name) > 22:
        d.text((W // 2 - len(name) * 6, 155), name[:22], fill=(240, 235, 255), font=title_font)
        d.text((W // 2 - len(name[22:]) * 6, 188), name[22:], fill=(240, 235, 255), font=title_font)
    else:
        d.text((W // 2 - len(name) * 6, 168), name, fill=(240, 235, 255), font=title_font)

    d.text((56, H - 100), "NEXX TAROT", fill=c1, font=small_font)
    d.text((56, H - 74), card.get("keyword", "")[:50], fill=(170, 190, 215), font=small_font)
    d.text((56, 72), f"· {card['id']} ·", fill=c2, font=num_font)

    img = draw_scanlines(img, 0.05)
    img = img.filter(ImageFilter.SHARPEN)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, quality=94)


def render_cipher_card(card: dict, suit_meta: dict, out: Path):
    c1, c2, c3 = suit_meta["colors"]
    symbol = suit_meta["symbol"]
    img = Image.new("RGB", (W, H), c3)
    gradient_bg(img, c1, c2, c3)
    d = ImageDraw.Draw(img)
    halftone_layer(d, c1)
    draw_rw_border(d, c1, c2, c3)
    draw_hud_corners(d, c1)

    rank_font = try_font(38)
    sym_font = try_font(30)
    title_font = try_font(26, serif=True)
    small_font = try_font(17)

    draw_rw_pips(d, card["rank"], symbol, 56, 64, c2, rank_font, sym_font)
    draw_rw_pips(d, card["rank"], symbol, W - 56, H - 64, c2, rank_font, sym_font, invert=True)

    draw_cipher_scene(d, card["suit"], card["rank"], c1, c2, c3)

    name = card["name"].upper()
    d.text((W // 2 - len(name) * 6, 158), name, fill=(238, 242, 255), font=title_font)

    d.text((56, H - 96), "NEXX CIPHER", fill=c1, font=small_font)
    d.text((56, H - 72), card.get("keyword", "")[:48], fill=(165, 185, 210), font=small_font)

    img = draw_scanlines(img, 0.05)
    img = img.filter(ImageFilter.SHARPEN)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, quality=94)


def render_card_back(out: Path):
    c1, c2, c3 = (255, 43, 214), (0, 240, 255), (8, 6, 18)
    img = Image.new("RGB", (W, H), c3)
    gradient_bg(img, c1, c2, c3)
    d = ImageDraw.Draw(img)
    halftone_layer(d, c2, 22, 0.12)
    draw_rw_border(d, c1, c2, c3)
    draw_collage_tiles(d, 999, c1, c2)

    cx, cy = W // 2, H // 2
    draw_poe_moon(d, cx, cy - 60, 55, c2, (30, 20, 50))
    draw_raven(d, cx - 25, cy - 10, 2.5, c1, (15, 12, 25))
    draw_gothic_arch(d, cx, cy + 140, 220, 160, c2)
    draw_circuit_paths(d, cx, cy, 120, c1, 77)
    draw_candles(d, cx - 60, cy + 40, c1, c2, 5)

    font = try_font(34, serif=True)
    d.text((W // 2 - 80, H - 120), "NEXX", fill=c2, font=font)
    d.text((W // 2 - 110, H - 82), "TAROT · CIPHER", fill=c1, font=try_font(20))

    img = draw_scanlines(img, 0.07)
    img = img.filter(ImageFilter.SHARPEN)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, quality=94)
