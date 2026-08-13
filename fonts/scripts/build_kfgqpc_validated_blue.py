#!/usr/bin/env python3
"""Build KFGQPC Validated Blue — same COLR glyphs, entire CPAL → #3B82F6.

Source: public/fonts/KFGQPCHAFSColored-Bold.woff2 (KFGQPC HAFS Colored, GPL-3).
Output: public/fonts/KFGQPCHAFSColored-ValidatedBlue.woff2
"""
from __future__ import annotations

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.ttLib.tables.C_P_A_L_ import Color

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "fonts" / "KFGQPCHAFSColored-Bold.woff2"
OUT = ROOT / "public" / "fonts" / "KFGQPCHAFSColored-ValidatedBlue.woff2"

# App --validated
BLUE = Color.fromRGBA(0x3B, 0x82, 0xF6, 0xFF)
FAMILY = "KFGQPC Validated"
FULL = "KFGQPC Validated Blue"
PS = "KFGQPCHAFSColored-ValidatedBlue"


def set_name(font: TTFont, name_id: int, text: str) -> None:
    name = font["name"]
    # Windows Unicode BMP English
    name.setName(text, name_id, 3, 1, 0x409)
    # Mac Roman (best-effort ASCII)
    try:
        name.setName(text, name_id, 1, 0, 0)
    except Exception:
        pass


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source font: {SRC}")

    font = TTFont(str(SRC))
    if "CPAL" not in font:
        raise SystemExit("Source has no CPAL — not a color font")

    cpal = font["CPAL"]
    for pi, pal in enumerate(cpal.palettes):
        cpal.palettes[pi] = [BLUE for _ in pal]

    set_name(font, 1, FAMILY)
    set_name(font, 2, "Blue")
    set_name(font, 4, FULL)
    set_name(font, 6, PS)
    set_name(font, 16, FAMILY)
    set_name(font, 17, "Blue")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(str(OUT))
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
    print(f"family={FAMILY!r} palette_entries={cpal.numPaletteEntries} → {BLUE.hex()}")


if __name__ == "__main__":
    main()
