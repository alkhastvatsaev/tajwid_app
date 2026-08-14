#!/usr/bin/env python3
"""Patch KFGQPC Colored: remap Quranic marks that still use the disc+dots placeholder.

U+06DF (۟ ARABIC SMALL HIGH ROUNDED ZERO) marks silent letters in Uthmani
(آمنوا۟, أولئك). KFGQPC's uni06DF is the 1255×1255 placeholder disc — not a mark.
Point cmap at uni0652 (sukun), which already has COLR + mark anchors.

Also remap U+06E3 (placeholder) → uni06DC (small high seen).
U+0672 → uni0670 is already applied by patch_kfgqpc_uni0672.py.

Source/output: public/fonts/KFGQPCHAFSColored-Bold.woff2
Then rebuild Validated: build_kfgqpc_validated_blue.py
"""
from __future__ import annotations

from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / "public" / "fonts" / "KFGQPCHAFSColored-Bold.woff2"

# codepoint → existing glyph name that actually draws a small mark
REMAP = {
    0x06DF: "uni0652",  # silent rounded zero → sukun
    0x06E3: "uni06DC",  # small low seen placeholder → small high seen
}


def main() -> None:
    if not FONT.exists():
        raise SystemExit(f"Missing font: {FONT}")

    font = TTFont(str(FONT))
    cmap = font.getBestCmap()
    glyf_names = set(font["glyf"].keys()) if "glyf" in font else set()

    changed = 0
    for cp, target in REMAP.items():
        if target not in glyf_names and target not in set(cmap.values()):
            raise SystemExit(f"Missing target glyph {target} for U+{cp:04X}")
        before = cmap.get(cp)
        if before == target:
            print(f"already patched: U+{cp:04X} → {target}")
            continue
        for table in font["cmap"].tables:
            table.cmap[cp] = target
        print(f"cmap U+{cp:04X}: {before!r} → {target}")
        changed += 1

    if changed:
        name = font["name"]
        name.setName(
            "KFGQPC HAFS Colored Bold (Tilmidh 0672+06DF)",
            4,
            3,
            1,
            0x409,
        )
        font.flavor = "woff2"
        font.save(str(FONT))
        print(f"wrote {FONT} ({FONT.stat().st_size} bytes)")
    else:
        print("no cmap changes")


if __name__ == "__main__":
    main()
