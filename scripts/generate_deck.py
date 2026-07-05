#!/usr/bin/env python3
"""Generate NEXX Tarot deck data + cyberpunk card artwork."""
from __future__ import annotations

import json
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "deck.json"
ASSETS = ROOT / "assets"
MINOR = ASSETS / "minor"
MAJOR = ASSETS / "major"

import sys
sys.path.insert(0, str(ROOT / "scripts"))
from art_engine import render_tarot_card, render_card_back

PALETTES = {
    "wands": ((255, 60, 120), (255, 140, 0), (40, 8, 20)),
    "cups": ((0, 240, 255), (120, 80, 255), (8, 16, 40)),
    "swords": ((180, 220, 255), (80, 200, 255), (10, 18, 32)),
    "pentacles": ((0, 255, 160), (200, 255, 80), (8, 24, 16)),
    "major": ((255, 0, 180), (0, 255, 255), (12, 6, 24)),
}

MAJORS = [
    ("00", "The Fool", "New signal. Leap before the loop restarts.", "Boot a fresh session. One brave click. No backup plan needed."),
    ("01", "The Magician", "You already have the stack.", "List four tools within arm's reach. Use one in the next hour."),
    ("02", "The High Priestess", "Listen beneath the noise floor.", "Twenty minutes offline. Write what you know without proof."),
    ("03", "The Empress", "Grow what's still alive.", "Feed something — plant, pet, project, or your own body."),
    ("04", "The Emperor", "Build the boundary wall.", "Say one clear no. Mean it. No apology subroutine."),
    ("05", "The Hierophant", "Borrow a map.", "Ask someone who's crossed this bridge. Take notes."),
    ("06", "The Lovers", "Align head and heart ports.", "One decision: pick the path that feels quiet, not loud."),
    ("07", "The Chariot", "Drive — don't drift.", "Pick one target today. Finish it before entertainment."),
    ("08", "Strength", "Soft hands on a wild process.", "Breathe four counts in, six out. Repeat until the spike drops."),
    ("09", "The Hermit", "Lantern mode.", "Solitude before answers. Walk without headphones."),
    ("10", "Wheel of Fortune", "The cycle turned without you.", "Stop forcing. Notice what shifted on its own."),
    ("11", "Justice", "Balance the ledger.", "Write what happened. Strip story. Keep facts."),
    ("12", "The Hanged Man", "Suspend action. Gain angle.", "Deliberately do nothing about the problem for 24 hours."),
    ("13", "Death", "Kill the old process.", "Delete, archive, or close one chapter today."),
    ("14", "Temperance", "Mix slowly.", "Blend work and rest — not all throttle, not all idle."),
    ("15", "The Devil", "Name the chain.", "Identify what you're still feeding. Starve it one day."),
    ("16", "The Tower", "Let the bad architecture fall.", "Don't rebuild the same bug. Patch different."),
    ("17", "The Star", "Clear sky protocol.", "Close every spiral tab. Pour water. Name three things already fixed."),
    ("18", "The Moon", "Fog is not enemy territory.", "Don't trust 3am conclusions. Wait for daylight data."),
    ("19", "The Sun", "Full visibility granted.", "Share one win out loud. Let warmth be evidence."),
    ("20", "Judgement", "Answer the call.", "Respond to the thing you've been putting off. Rise."),
    ("21", "The World", "Cycle complete.", "Celebrate closure. Ship it. Rest inside the finish."),
]

MINOR_KEYWORDS = {
    "wands": "fire / will / spark",
    "cups": "water / feeling / flow",
    "swords": "air / mind / cut",
    "pentacles": "earth / body / coin",
}

RANKS = [
    ("ace", "Ace", "Seed packet received.", "Start small. One ignition event today."),
    ("02", "Two", "Dual channel open.", "Pair up — delegate or co-pilot one task."),
    ("03", "Three", "Network broadcast.", "Ship a draft. Let three eyes see it."),
    ("04", "Four", "Stable frame.", "Fortify home base — desk, room, or routine."),
    ("05", "Five", "Static on the line.", "Expect friction. Don't take noise as verdict."),
    ("06", "Six", "Uplink restored.", "Reach toward calmer bandwidth. Move laterally."),
    ("07", "Seven", "Hold the port.", "Defend one boundary. You're almost through."),
    ("08", "Eight", "Packets flying.", "Act fast on clean signal. Momentum is now."),
    ("09", "Nine", "Last firewall.", "You're tired because you stayed. One more watch."),
    ("10", "Ten", "Load limit hit.", "Drop a burden. You can't carry ten fires."),
    ("page", "Page", "Scout process.", "Learn one new thing. Stay curious, not certain."),
    ("knight", "Knight", "Charge routine.", "Move with focus. One direction only."),
    ("queen", "Queen", "Deep receive.", "Nurture the signal — rest, hydrate, listen."),
    ("king", "King", "Master node.", "Lead with calm authority. Decide and deploy."),
]


def slug(name: str) -> str:
    return name.lower().replace(" ", "-").replace("'", "")


def major_art(num: str, name: str) -> str:
    base = f"{num}-{slug(name)}"
    aliases = [base]
    if num == "17":
        aliases.insert(0, "17-star")
    for stem in aliases:
        for ext in (".jpg", ".png"):
            if (MAJOR / f"{stem}{ext}").exists():
                return f"assets/major/{stem}{ext}"
    return f"assets/major/{base}.png"


def build_deck() -> list[dict]:
    deck = []
    for num, name, keyword, nexx in MAJORS:
        deck.append({
            "id": num,
            "name": name,
            "suit": "major",
            "arcana": "major",
            "keyword": keyword,
            "meaning": keyword,
            "nexx_move": nexx,
            "art": major_art(num, name),
        })
    for suit in ("wands", "cups", "swords", "pentacles"):
        for rank_id, rank_name, keyword, nexx in RANKS:
            name = f"{rank_name} of {suit.title()}"
            cid = f"{suit[0].upper()}{rank_id}"
            deck.append({
                "id": cid,
                "name": name,
                "suit": suit,
                "arcana": "minor",
                "keyword": keyword,
                "meaning": f"{keyword} ({MINOR_KEYWORDS[suit]})",
                "nexx_move": nexx,
                "art": f"assets/minor/{suit}-{rank_id}.png",
            })
    return deck


def main():
    deck = build_deck()
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(deck, indent=2), encoding="utf-8")
    print(f"Wrote {len(deck)} cards -> {DATA}")

    for card in deck:
        art = ROOT / card["art"]
        if art.suffix == ".jpg" and art.exists():
            continue
        render_tarot_card(card, PALETTES[card["suit"]], art if art.suffix == ".png" else art.with_suffix(".png"))
    render_card_back(ASSETS / "card-back.png")
    print("Artwork generation complete.")


if __name__ == "__main__":
    main()