#!/usr/bin/env python3
"""Generate NEXX Cipher Deck — 52 cyberpunk playing cards + artwork."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from art_engine import render_cipher_card

DATA = ROOT / "data" / "cipher-deck.json"
ASSETS = ROOT / "assets" / "cipher"

SUITS = {
    "sparks": {
        "label": "Sparks",
        "symbol": "⚡",
        "theme": "initiative / edge / ignition",
        "colors": ((255, 60, 120), (255, 160, 40), (28, 8, 18)),
    },
    "signal": {
        "label": "Signal",
        "symbol": "◎",
        "theme": "connection / pulse / warmth",
        "colors": ((0, 240, 255), (140, 90, 255), (8, 14, 36)),
    },
    "cache": {
        "label": "Cache",
        "symbol": "◇",
        "theme": "value / data / resource",
        "colors": ((80, 255, 200), (0, 200, 255), (6, 22, 20)),
    },
    "grid": {
        "label": "Grid",
        "symbol": "▣",
        "theme": "structure / grit / foundation",
        "colors": ((200, 220, 255), (100, 180, 255), (10, 16, 28)),
    },
}

RANKS = [
    ("A", "Ace", 1), ("2", "Two", 2), ("3", "Three", 3), ("4", "Four", 4),
    ("5", "Five", 5), ("6", "Six", 6), ("7", "Seven", 7), ("8", "Eight", 8),
    ("9", "Nine", 9), ("10", "Ten", 10), ("J", "Jack", 11), ("Q", "Queen", 12), ("K", "King", 13),
]

RANK_DATA = {
    "A": ("Raw ignition.", "Boot one micro-action in the next ten minutes. No preamble."),
    "2": ("Dual channel.", "Pair with someone or split the task in two clean halves."),
    "3": ("Triangulate.", "Add a third perspective before you commit."),
    "4": ("Four walls secure.", "Fortify one boundary — physical, digital, or emotional."),
    "5": ("Static spike.", "Expect noise. Filter it. Don't broadcast back."),
    "6": ("Harmonic restore.", "Repair one broken loop in your day."),
    "7": ("Hold the line.", "You're mid-run. Don't quit at the hard packet."),
    "8": ("Full throttle.", "Eight cylinders firing — act while momentum is hot."),
    "9": ("Penultimate.", "Almost there. Trim one nonessential load."),
    "10": ("Capacity max.", "Close ten tabs — literal or metaphorical. Ship or shelve."),
    "J": ("Scout packet.", "Gather intel. Ask one question you've avoided."),
    "Q": ("Deep receive.", "Listen longer than you speak. Let data settle."),
    "K": ("Command node.", "Decide once. Deploy calm authority."),
}

SUIT_MOVES = {
    "sparks": {
        "A": "Strike the match — send the message, start the file, open the repo.",
        "2": "Two sparks: pick the bolder path for one, safe path for the other.",
        "3": "Broadcast a small win. Let others see the flame.",
        "4": "Lock the workshop. One hour, one project, door closed.",
        "5": "Walk away from the flame war. Save your fuel.",
        "6": "Reconnect with what used to excite you. One nostalgic win.",
        "7": "Keep building even when results lag. Trust the burn.",
        "8": "Sprint. Finish before the energy dips.",
        "9": "One last push — then schedule rest.",
        "10": "You're running hot. Cool down before you melt something.",
        "J": "Explore sideways. Try the weird approach.",
        "Q": "Tend the fire in someone else today.",
        "K": "Own the room. Set tempo for the team.",
    },
    "signal": {
        "A": "Reach out to one person. Short ping. Real warmth.",
        "2": "Mirror someone well. Reflect, don't fix.",
        "3": "Share a feeling in three words. No essay.",
        "4": "Protect your bandwidth. Silence notifications one hour.",
        "5": "Heart static — don't read tone into delays.",
        "6": "Give without tracking return. One generous act.",
        "7": "Stay on the call. Presence is the move.",
        "8": "Amplify someone else's signal. Boost, don't compete.",
        "9": "Near connection — schedule the follow-up now.",
        "10": "Emotional overload. Log off. Touch grass or water.",
        "J": "Carry a message between two people who should talk.",
        "Q": "Hold space. No advice unless asked.",
        "K": "Set the emotional temperature. Steady, not cold.",
    },
    "cache": {
        "A": "Invest in one asset — skill, savings, or backup.",
        "2": "Compare two options on paper. Pick the higher ROI.",
        "3": "Diversify: don't store everything in one folder.",
        "4": "Audit storage — disk, inbox, or mental clutter.",
        "5": "Leak detected. Patch the hole before filling the tank.",
        "6": "Restore from backup. What worked before still works.",
        "7": "Hold value through volatility. Don't panic-sell your effort.",
        "8": "Compound: stack a habit on a habit.",
        "9": "Harvest. Cash in one delayed reward.",
        "10": "Wallet full, hands tired. Spend on rest, not more stuff.",
        "J": "Scout a deal, tool, or shortcut. Report back.",
        "Q": "Curate quality over quantity. Keep the best three.",
        "K": "Allocate resources like a CFO. Ruthless kindness.",
    },
    "grid": {
        "A": "Lay one brick. Foundation beats blueprint.",
        "2": "Build in parallel — two small structures, same day.",
        "3": "Tripod rule: three supports before you load weight.",
        "4": "Square the room. Clean desk, clear calendar block.",
        "5": "Crack in the wall. Fix it small before it spreads.",
        "6": "Return to routine. Same wake time, same walk.",
        "7": "Defend the perimeter. One rule, enforced.",
        "8": "Scale the scaffold. Systematize what worked once.",
        "9": "Renovation phase. Tear out one old habit.",
        "10": "Load-bearing stress. Remove one structural lie.",
        "J": "Survey the site. Map before you dig.",
        "Q": "Maintain what others ignore. Quiet upkeep wins.",
        "K": "Architect the week. Block time like load-bearing walls.",
    },
}


def build_deck() -> list[dict]:
    deck = []
    for suit_id, meta in SUITS.items():
        for rank_id, rank_name, _ in RANKS:
            kw, _ = RANK_DATA[rank_id]
            nexx = SUIT_MOVES[suit_id][rank_id]
            cid = f"{suit_id[0].upper()}{rank_id}"
            deck.append({
                "id": cid,
                "rank": rank_id,
                "rank_name": rank_name,
                "suit": suit_id,
                "suit_label": meta["label"],
                "suit_symbol": meta["symbol"],
                "suit_theme": meta["theme"],
                "name": f"{rank_name} of {meta['label']}",
                "keyword": kw,
                "meaning": f"{kw} ({meta['theme']})",
                "nexx_move": nexx,
                "art": f"assets/cipher/{suit_id}-{rank_id.lower()}.png",
            })
    return deck


def main():
    deck = build_deck()
    assert len(deck) == 52
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(deck, indent=2), encoding="utf-8")
    print(f"Wrote {len(deck)} cards -> {DATA}")
    for card in deck:
        render_cipher_card(card, SUITS[card["suit"]], ROOT / card["art"])
    print("Cipher artwork complete.")


if __name__ == "__main__":
    main()