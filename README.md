# NEXX Tarot · Daily Relief Protocol

Cyberpunk tarot for daily relief — one card per calendar day, one actionable **NEXX Move** per draw.

**Two decks:**

| Deck | Cards | Mode |
|------|-------|------|
| **NEXX Tarot** | 78 | One card per day (deterministic) |
| **NEXX Cipher** | 52 | Multi-card pull engine (random, no repeats per cycle) |
| **NEXX Oracle** | — | Sigil pull, mantra pull, Elder Futhark rune throwing |

## Quick start

```bash
nexx-tarot
```

Opens `http://127.0.0.1:8765/` in your browser and serves the app locally.

**Cipher pull (52 cards):** `http://127.0.0.1:8765/pull.html`  
**Oracle (sigil / mantra / runes):** `http://127.0.0.1:8765/oracle.html`  
Pull all 52 via URL: `pull.html?count=52&auto=1`

### Question types

| Type | Use for |
|------|---------|
| General | Open reading |
| Yes / No | Binary or leaning verdict |
| Love & Connection | Relationships |
| Career & Money | Work, income, direction |
| Decision | Which path to take |
| Shadow / Block | Hidden drains |
| Timing | Pace and window |
| Self & Healing | Inner recovery |

**Terminal pull:**

```bash
python3 scripts/pull_cards.py --all
python3 scripts/pull_cards.py -n 7
```

**Environment**

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXX_TAROT_PORT` | `8765` | Server port |
| `NEXX_TAROT_NO_BROWSER` | unset | Set to `1` to skip auto-open |

## Features

- **78-card deck** — full major + minor arcana with custom cyberpunk artwork
- **One draw per day** — deterministic by date; same card until midnight local time
- **NEXX Move** — concrete relief directive on every card (not generic fluff)
- **Question prompt** — pick a type (Yes/No, Love, Career, Decision, etc.) and ask anything; answers synthesize from the cards
- **Clarity card** — every reading ends with a final Clarity card (pull +1 in Cipher; paired card in Daily Tarot)
- **Share / save** — copy or export today's reading as plain text
- **30-day history** — stored in browser `localStorage`
- **Deep link** — `?card=17` or `?card=star` opens a specific card (great for sharing a pull)

## Project layout

```
nexx-tarot/
├── index.html          # App shell
├── css/nexx-tarot.css  # Cyberpunk UI
├── js/app.js           # Daily draw logic
├── data/deck.json      # Card metadata + nexx_move text
├── assets/             # Logo, card back, per-card art
├── scripts/generate_deck.py  # Regenerate PNG art + deck.json
└── nexx-tarot          # Launcher script
```

## Regenerating card art

```bash
cd /home/nexx/nexx-tarot
python3 scripts/generate_deck.py      # 78-card tarot
python3 scripts/generate_cipher_deck.py # 52-card cipher
```

Skips existing AI art (e.g. `assets/major/17-star.jpg`) when present.

### Cipher suits (52 cards)

| Suit | Symbol | Theme |
|------|--------|-------|
| Sparks | ⚡ | initiative / edge |
| Signal | ◎ | connection / pulse |
| Cache | ◇ | value / data |
| Grid | ▣ | structure / grit |

## License

See [LICENSE](LICENSE).

- **Personal use** — free
- **Commercial / redistribution** — contact rights holder for a commercial license before selling or bundling

## Packaging for sale or share

1. Zip the `nexx-tarot/` folder (exclude `.git` if added later)
2. Include LICENSE and this README
3. Buyer runs `nexx-tarot` or any static file host (`deck.json` must be served over HTTP, not `file://`)
4. Optional: host on GitHub Pages, Netlify, or itch.io as a web app

---

*NEXX Tarot © nexx · Relief edition v1.0*