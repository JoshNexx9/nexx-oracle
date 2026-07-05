#!/usr/bin/env python3
"""CLI pull from NEXX Cipher 52-card deck."""
from __future__ import annotations

import argparse
import json
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DECK_PATH = ROOT / "data" / "cipher-deck.json"


def main():
    parser = argparse.ArgumentParser(description="Pull cards from NEXX Cipher deck")
    parser.add_argument("-n", "--count", type=int, default=5, help="Cards to pull (1-52)")
    parser.add_argument("--all", action="store_true", help="Pull all 52 cards")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--seed", type=int, default=None, help="RNG seed for reproducible pull")
    args = parser.parse_args()

    deck = json.loads(DECK_PATH.read_text(encoding="utf-8"))
    n = 52 if args.all else max(1, min(52, args.count))

    rng = random.Random(args.seed)
    pulled = rng.sample(deck, n)

    if args.json:
        print(json.dumps({"count": n, "cards": pulled}, indent=2))
        return

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    print(f"NEXX Cipher · {n} card pull · {ts}\n")
    for i, card in enumerate(pulled, 1):
        print(f"{i:2}. {card['name']} ({card['id']})")
        print(f"    {card['keyword']}")
        print(f"    ▶ NEXX MOVE: {card['nexx_move']}\n")


if __name__ == "__main__":
    main()