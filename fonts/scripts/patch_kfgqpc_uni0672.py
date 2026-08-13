#!/usr/bin/env python3
"""Patch KFGQPC Colored: U+0672 (ٲ) → dagger glyph uni0670 (ٰ).

Quran.com emits U+0672 for madd in صراط; KFGQPC's uni0672 is a disc+dots
placeholder (~168 unsupported codepoints share that outline). Remap cmap so
ٲ uses the real dagger mark (same as ـٰ elsewhere in Fātiḥah).

Source/output: public/fonts/KFGQPCHAFSColored-Bold.woff2 (GPL-3 fork)
Then rebuild Validated: build_kfgqpc_validated_blue.py
"""
from __future__ import annotations

from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / "public" / "fonts" / "KFGQPCHAFSColored-Bold.woff2"

CP_BAD = 0x0672  # Arabic letter alef with wavy hamza below (Quran.com stand-in)
CP_DAGGER = 0x0670  # Arabic letter superscript alef


def main() -> None:
    if not FONT.exists():
        raise SystemExit(f"Missing font: {FONT}")

    font = TTFont(str(FONT))
    cmap = font.getBestCmap()
    if CP_DAGGER not in cmap:
        raise SystemExit(f"Missing dagger glyph for U+{CP_DAGGER:04X}")

    target = cmap[CP_DAGGER]
    before = cmap.get(CP_BAD)
    if before == target:
        print(f"already patched: U+{CP_BAD:04X} → {target}")
        return

    n = 0
    for table in font["cmap"].tables:
        mapping = table.cmap
        if CP_BAD in mapping or CP_DAGGER in mapping:
            mapping[CP_BAD] = target
            n += 1

    # Mark fork in name table (keep family CSS-stable)
    name = font["name"]
    name.setName(
        "KFGQPC HAFS Colored Bold (Tilmidh U+0672→0670)",
        4,
        3,
        1,
        0x409,
    )

    font.flavor = "woff2"
    font.save(str(FONT))
    print(f"wrote {FONT} ({FONT.stat().st_size} bytes)")
    print(f"cmap U+{CP_BAD:04X}: {before!r} → {target!r} ({n} subtables)")


if __name__ == "__main__":
    main()
