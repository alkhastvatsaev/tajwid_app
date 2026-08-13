#!/usr/bin/env python3
"""Build a minimal Tilmidh COLR font from Amiri Quran (OFL).

Proof-of-concept: paint dagger-alif (U+0670) and tatweel (U+0640) with
Tilmidh madd teal via COLR/CPAL — joining GSUB untouched.

Usage:
  .venv/bin/python fonts/scripts/build_tilmidh_colr.py
"""
from __future__ import annotations

from pathlib import Path

from fontTools.colorLib.builder import buildCOLR, buildCPAL
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "fonts" / "vendor" / "AmiriQuran-Regular.ttf"
OUT_DIR = ROOT / "fonts" / "tilmidh"
OUT = OUT_DIR / "TilmidhTajweed-Regular.ttf"

# Tilmidh palette (sRGB 0–1) — matches public/index.html light theme accents
PALETTE = [
    (0.086, 0.098, 0.086, 1.0),   # 0 ink ≈ #161914
    (0.078, 0.722, 0.651, 1.0),   # 1 madd-tabii ≈ #14B8A6
    (0.184, 0.541, 0.322, 1.0),   # 2 ghunnah ≈ #2F8A52
    (0.039, 0.647, 0.627, 1.0),   # 3 madd alt ≈ #0EA5A0
]


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing base font: {SRC}")

    font = TTFont(str(SRC))
    cmap = font.getBestCmap() or {}
    glyph_order = font.getGlyphOrder()

    # Map codepoints → glyph names present in font
    targets = {
        0x0670: 1,  # dagger alif → madd teal
        0x0640: 1,  # tatweel → madd teal (stroke, not CSS bar)
    }

    color_layers = {}
    for cp, color_id in targets.items():
        gname = cmap.get(cp)
        if not gname or gname not in glyph_order:
            print(f"skip U+{cp:04X}: not in cmap")
            continue
        # COLR v0: paint the same outline with a palette color
        color_layers[gname] = [(gname, color_id)]
        print(f"color U+{cp:04X} ({gname}) → palette[{color_id}]")

    if not color_layers:
        raise SystemExit("No glyphs to color")

    font["CPAL"] = buildCPAL([PALETTE])
    font["COLR"] = buildCOLR(color_layers, version=0)

    # Rename for clarity
    if "name" in font:
        from fontTools.ttLib.tables._n_a_m_e import NameRecord

        def set_name(name_id: int, string: str) -> None:
            font["name"].setName(string, name_id, 3, 1, 0x409)
            font["name"].setName(string, name_id, 1, 0, 0)

        set_name(1, "Tilmidh Tajweed")
        set_name(4, "Tilmidh Tajweed Regular")
        set_name(6, "TilmidhTajweed-Regular")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    font.save(str(OUT))
    font.close()
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
