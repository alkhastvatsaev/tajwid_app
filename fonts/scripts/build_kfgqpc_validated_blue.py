#!/usr/bin/env python3
"""Build KFGQPC Validated Blue — same outlines as Colored, every glyph COLR #3B82F6.

KFGQPC HAFS Colored only paints ~327 glyphs via COLR; the rest use CSS ink.
Validated words need *all* letters blue → expand COLR to every glyf + bake CPAL.

Source: public/fonts/KFGQPCHAFSColored-Bold.woff2 (GPL-3)
Output: public/fonts/KFGQPCHAFSColored-ValidatedBlue.woff2
"""
from __future__ import annotations

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.ttLib.tables.C_O_L_R_ import LayerRecord
from fontTools.ttLib.tables.C_P_A_L_ import Color

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "fonts" / "KFGQPCHAFSColored-Bold.woff2"
OUT = ROOT / "public" / "fonts" / "KFGQPCHAFSColored-ValidatedBlue.woff2"

BLUE = Color.fromRGBA(0x3B, 0x82, 0xF6, 0xFF)
FAMILY = "KFGQPC Validated"
FULL = "KFGQPC Validated Blue"
PS = "KFGQPCHAFSColored-ValidatedBlue"
SKIP = {".notdef"}


def set_name(font: TTFont, name_id: int, text: str) -> None:
    name = font["name"]
    name.setName(text, name_id, 3, 1, 0x409)
    try:
        name.setName(text, name_id, 1, 0, 0)
    except Exception:
        pass


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source font: {SRC}")

    font = TTFont(str(SRC))
    if "CPAL" not in font or "COLR" not in font or "glyf" not in font:
        raise SystemExit("Source missing CPAL/COLR/glyf")

    cpal = font["CPAL"]
    # Single blue ink at index 0; keep entry count stable for safety
    n = max(cpal.numPaletteEntries, 1)
    blue_pal = [BLUE for _ in range(n)]
    cpal.palettes = [blue_pal]
    cpal.numPaletteEntries = n

    colr = font["COLR"]
    layers = dict(colr.ColorLayers)  # copy
    before = len(layers)

    for gname in font["glyf"].keys():
        if gname in SKIP:
            continue
        # One solid layer: paint this glyph's outline with palette[0] (blue)
        layers[gname] = [LayerRecord(name=gname, colorID=0)]

    colr.ColorLayers = layers

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
    print(f"COLR bases {before} → {len(layers)} · CPAL[{n}] all {BLUE.hex()}")


if __name__ == "__main__":
    main()
