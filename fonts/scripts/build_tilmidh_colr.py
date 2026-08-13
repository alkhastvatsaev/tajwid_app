#!/usr/bin/env python3
"""Build TilmidhTajweed COLR from Amiri Quran (OFL).

Colors tajweed-relevant marks + all GSUB contextual forms of those
base glyphs so Safari/COLR paint works after init/medi/fina.

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
PUBLIC = ROOT / "public" / "fonts" / "TilmidhTajweed-Regular.ttf"

# Tilmidh palette (0–1) aligned with app CSS light theme
# 0 ink · 1 madd-tabii · 2 ghunnah · 3 madd-alt · 4 qalqalah-ish · 5 ikhfa-ish
PALETTE = [
    (0.086, 0.098, 0.086, 1.0),  # ink
    (0.078, 0.722, 0.651, 1.0),  # madd #14B8A6
    (0.184, 0.541, 0.322, 1.0),  # ghunnah
    (0.039, 0.647, 0.627, 1.0),  # madd alt
    (0.894, 0.255, 0.255, 1.0),  # soft red (lam-jalalah / emphasis)
    (0.894, 0.722, 0.478, 1.0),  # ikhfa-ish
]

# Base codepoints → palette index (marks + letters often tajweed-colored)
BASE_COLORS = {
    0x0670: 1,  # dagger alif — madd
    0x0640: 1,  # tatweel — madd carrier
    0x06E1: 1,  # Quranic sukun-like
    0x0651: 2,  # shadda — often ghunnah/idgham cue
}


def collect_related_glyphs(font: TTFont, base_names: set[str]) -> set[str]:
    """Include GSUB substitutes (init/medi/fina/…) that replace base glyphs."""
    related = set(base_names)
    if "GSUB" not in font:
        return related
    gsub = font["GSUB"].table
    if not gsub.LookupList:
        return related
    for lookup in gsub.LookupList.Lookup:
        for st in lookup.SubTable:
            mapping = getattr(st, "mapping", None)
            if isinstance(mapping, dict):
                for src, dst in mapping.items():
                    if src not in related:
                        continue
                    if isinstance(dst, (list, tuple)):
                        related.update(dst)
                    else:
                        related.add(dst)
            # Coverage-based ligatures etc. — skip for POC
    return related


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing base font: {SRC}")

    font = TTFont(str(SRC))
    cmap = font.getBestCmap() or {}
    glyph_order = set(font.getGlyphOrder())

    color_layers: dict[str, list] = {}
    bases: set[str] = set()
    for cp, color_id in BASE_COLORS.items():
        gname = cmap.get(cp)
        if gname and gname in glyph_order:
            bases.add(gname)

    related = collect_related_glyphs(font, bases)
    # Map each related glyph to the color of its originating base when possible
    base_color = {}
    for cp, color_id in BASE_COLORS.items():
        gname = cmap.get(cp)
        if gname:
            base_color[gname] = color_id

    for gname in related:
        if gname not in glyph_order:
            continue
        # Prefer explicit base color; marks keep their id; unknowns → madd
        cid = base_color.get(gname, 1)
        for b, c in base_color.items():
            if gname == b:
                cid = c
                break
        color_layers[gname] = [(gname, cid)]
        print(f"color {gname} → palette[{cid}]")

    if not color_layers:
        raise SystemExit("No glyphs to color")

    font["CPAL"] = buildCPAL([PALETTE])
    font["COLR"] = buildCOLR(color_layers, version=0)

    if "name" in font:
        def set_name(name_id: int, string: str) -> None:
            font["name"].setName(string, name_id, 3, 1, 0x409)
            font["name"].setName(string, name_id, 1, 0, 0)

        set_name(1, "Tilmidh Tajweed")
        set_name(4, "Tilmidh Tajweed Regular")
        set_name(6, "TilmidhTajweed-Regular")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    font.save(str(OUT))
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    font.save(str(PUBLIC))
    font.close()
    print(f"wrote {OUT} and {PUBLIC} ({OUT.stat().st_size} bytes, {len(color_layers)} glyphs)")


if __name__ == "__main__":
    main()
