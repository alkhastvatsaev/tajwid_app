#!/usr/bin/env python3
"""Analyse un enregistrement Fātiḥah (JSON dataset opt-in).

Usage:
  python3 scripts/analyze-session.py
  python3 scripts/analyze-session.py /path/to/fatiha-....json
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

HOME = Path.home()
SEARCH_DIRS = [
    HOME / "Downloads",
    Path(__file__).resolve().parents[1] / "recordings",
]


def find_latest(explicit: str | None = None) -> Path:
    if explicit:
        p = Path(explicit).expanduser()
        if not p.exists():
            raise SystemExit(f"Fichier introuvable: {p}")
        return p
    candidates: list[Path] = []
    for d in SEARCH_DIRS:
        if d.is_dir():
            candidates.extend(d.glob("fatiha-*.json"))
    if not candidates:
        raise SystemExit("Aucun fatiha-*.json dans Downloads/ ou recordings/")
    return max(candidates, key=lambda p: p.stat().st_mtime)


def analyze(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    matches = data.get("matches") or []
    heard = data.get("heard") or []
    errors = data.get("errors") or []
    expected = data.get("expected") or []

    manual = [m for m in matches if "MANUAL" in str(m.get("heard", ""))]
    auto = [m for m in matches if "MANUAL" not in str(m.get("heard", ""))]
    reasons = Counter(m.get("reason", "manual") for m in matches)

    # Dernier mot STT vu avant chaque manuel
    stuck = []
    for m in manual:
        idx = m.get("index")
        exp = m.get("expected") or (expected[idx] if isinstance(idx, int) and idx < len(expected) else "?")
        raw_heard = str(m.get("heard", ""))
        # extract trailing STT snippet
        snip = raw_heard
        if "Heard:" in raw_heard:
            snip = raw_heard.split("Heard:", 1)[-1].rstrip(")").strip()
        stuck.append({"index": idx, "expected": exp, "stt_window": snip[-60:]})

    mismatch_errs = [e for e in errors if e.get("type") == "pronunciation_mismatch"]
    top_mismatch = Counter(
        (e.get("expected"), e.get("heard")) for e in mismatch_errs
    ).most_common(12)

    auto_rate = (100.0 * len(auto) / len(matches)) if matches else 0.0

    return {
        "file": str(path),
        "ref": data.get("ref"),
        "engine": data.get("engine"),
        "timestamp": data.get("timestamp"),
        "total": len(matches),
        "auto": len(auto),
        "manual": len(manual),
        "auto_rate_pct": round(auto_rate, 1),
        "reasons": dict(reasons),
        "heard_events": len(heard),
        "errors": len(errors),
        "manual_stuck": stuck,
        "top_mismatches": [
            {"expected": a, "heard": b, "count": c} for (a, b), c in top_mismatch
        ],
        "expected": expected,
    }


def print_report(r: dict) -> None:
    print("=" * 60)
    print(f"Fichier : {r['file']}")
    print(f"Ref     : {r['ref']} | engine={r['engine']} | {r['timestamp']}")
    print("-" * 60)
    print(f"Score   : {r['auto']}/{r['total']} auto ({r['auto_rate_pct']}%)  |  manuel={r['manual']}")
    print(f"Raisons : {r['reasons']}")
    print(f"Events  : heard={r['heard_events']} errors={r['errors']}")
    print("-" * 60)
    if r["manual_stuck"]:
        print("Mots validés à la MAIN (cible vs fenêtre STT) :")
        for s in r["manual_stuck"]:
            print(f"  [{s['index']:02d}] attendu={s['expected']!r}")
            print(f"       stt≈…{s['stt_window']!r}")
    if r["top_mismatches"]:
        print("-" * 60)
        print("Top mismatches STT (expected ← heard) :")
        for m in r["top_mismatches"]:
            print(f"  {m['count']:3d}×  {m['expected']!r} ← {m['heard']!r}")
    print("=" * 60)
    if r["auto_rate_pct"] >= 90:
        print("Verdict : BON (≥90% auto) — itérer sur les manuels restants seulement.")
    elif r["auto_rate_pct"] >= 70:
        print("Verdict : MOYEN — corrections matching ciblées encore utiles.")
    else:
        print("Verdict : FAIBLE — bug systémique probable (normalize / fenêtre / lexicon).")


def main() -> None:
    path = find_latest(sys.argv[1] if len(sys.argv) > 1 else None)
    report = analyze(path)
    print_report(report)
    out = path.with_suffix(".analysis.json")
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Rapport JSON : {out}")


if __name__ == "__main__":
    main()
