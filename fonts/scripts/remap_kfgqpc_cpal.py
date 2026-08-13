#!/usr/bin/env python3
"""Remap KFGQPC Colored CPAL to Tilmidh chromatic families.

Aligns baked COLR hues with app CSS (warm madd / gray silent):
  colorID 19 (madd / dagger)  #E66D00 → #D97706  (--madd-tabii)
  colorID 18 (maddah)         #E9A70E → #B45309  (--madd-munfasil)
  colorID  2 (silent/wasla)   #979797 → #8B8680
  colorID 16 (harakat noise)  #C68E8E → #57534E  (ink-adjacent, less “rule”)

Source/output: public/fonts/KFGQPCHAFSColored-Bold.woff2
Then: build_kfgqpc_validated_blue.py
"""
from __future__ import annotations

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.ttLib.tables.C_P_A_L_ import Color

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / "public" / "fonts" / "KFGQPCHAFSColored-Bold.woff2"

# colorID → RGBA
REMAP = {
    19: Color.fromRGBA(0xD9, 0x77, 0x06, 0xFF),  # madd
    18: Color.fromRGBA(0xB4, 0x53, 0x09, 0xFF),  # maddah
    2: Color.fromRGBA(0x8B, 0x86, 0x80, 0xFF),  # silent
    16: Color.fromRGBA(0x57, 0x53, 0x4E, 0xFF),  # harakat → muted ink
}


def main() -> None:
    if not FONT.exists():
        raise SystemExit(f"Missing font: {FONT}")

    font = TTFont(str(FONT))
    if "CPAL" not in font:
        raise SystemExit("No CPAL table")

    cpal = font["CPAL"]
    changed = []
    for pal in cpal.palettes:
        for idx, color in REMAP.items():
            if idx >= len(pal):
                continue
            before = pal[idx].hex()
            after = color.hex()
            if before != after:
                pal[idx] = color
                changed.append(f"[{idx}] {before} → {after}")

    name = font["name"]
    name.setName(
        "KFGQPC HAFS Colored Bold (Tilmidh chromatic)",
        4,
        3,
        1,
        0x409,
    )

    font.flavor = "woff2"
    font.save(str(FONT))
    print(f"wrote {FONT} ({FONT.stat().st_size} bytes)")
    if changed:
        print("CPAL:", "; ".join(changed))
    else:
        print("CPAL already aligned")


if __name__ == "__main__":
    main()
