#!/usr/bin/env python3
"""Voice Perf toolkit — idées 1 / 7 / 13 / 15 depuis les sessions fatiha-*.json

Usage:
  python3 scripts/voice-perf-toolkit.py mine [Downloads]
  python3 scripts/voice-perf-toolkit.py kpi [Downloads]
  python3 scripts/voice-perf-toolkit.py replay SESSION.json
  python3 scripts/voice-perf-toolkit.py confusion [Downloads]
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

# Confusions tajwid — ne jamais proposer en alias auto
TAJWID_FORBID_PAIRS = {
    ("سراط", "صراط"),
    ("السراط", "الصراط"),
    ("سيرات", "صراط"),
    ("سيرات", "الصراط"),
    ("ملك", "مالك"),
    ("بلا", "ولا"),
    ("نستني", "نستعين"),
    ("ظالين", "ضالين"),
    ("دول", "ضالين"),
}


def session_paths(root: Path) -> list[Path]:
    files = sorted(root.glob("fatiha-*.json"))
    return [p for p in files if not p.name.endswith(".analysis.json")]


def load(p: Path) -> dict:
    return json.loads(p.read_text(encoding="utf-8"))


def mine_aliases(root: Path, min_count: int = 3) -> None:
    """Idée 1 : proposer aliases STT fréquents (hors confusions tajwid)."""
    counts: Counter = Counter()
    for p in session_paths(root):
        d = load(p)
        for m in d.get("matches") or []:
            exp = (m.get("expected") or "").strip()
            heard = (m.get("heard") or "").strip()
            if not exp or not heard or heard.startswith("["):
                continue
            if m.get("reason") in ("manual",) or "MANUAL" in heard.upper():
                continue
            if heard == exp:
                continue
            if (heard, exp) in TAJWID_FORBID_PAIRS or (exp, heard) in TAJWID_FORBID_PAIRS:
                continue
            counts[(exp, heard)] += 1
        # mismatches from analysis companion if present
        ap = p.with_suffix(".analysis.json")
        if ap.exists():
            a = load(ap)
            for item in a.get("top_mismatches") or []:
                if isinstance(item, dict):
                    e, h, c = item.get("expected"), item.get("heard"), item.get("count", 1)
                elif isinstance(item, (list, tuple)) and len(item) >= 2:
                    if len(item) == 3:
                        c, e, h = item[0], item[1], item[2]
                    else:
                        e, h, c = item[0], item[1], 1
                else:
                    continue
                if not e or not h:
                    continue
                if (h, e) in TAJWID_FORBID_PAIRS:
                    continue
                counts[(e, h)] += int(c)

    print("=== Alias candidates (validate before merge) ===")
    for (e, h), c in counts.most_common(40):
        if c < min_count:
            continue
        flag = " ⚠ tajwid?" if any(x in h for x in ("س", "ملك", "بلا")) else ""
        print(f"  {c:3d}×  {e} ← {h}{flag}")


def confusion_matrix(root: Path) -> None:
    """Idée 7 : matrice expected ← heard."""
    mm: Counter = Counter()
    for p in session_paths(root):
        ap = p.with_suffix(".analysis.json")
        src = load(ap) if ap.exists() else load(p)
        for item in src.get("top_mismatches") or []:
            if isinstance(item, dict):
                e, h, c = item.get("expected"), item.get("heard"), item.get("count", 1)
                mm[(e, h)] += int(c or 1)
    print("=== Confusion matrix (top 25) ===")
    for (e, h), c in mm.most_common(25):
        print(f"  {c:3d}  {e!r} ← {h!r}")


def kpi(root: Path) -> None:
    """Idée 15 : KPI agrégés."""
    rows = []
    for p in session_paths(root):
        d = load(p)
        s = d.get("summary") or {}
        matches = d.get("matches") or []
        auto = s.get("auto")
        total = s.get("wordsTotal") or len(matches)
        if auto is None:
            auto = sum(
                1
                for m in matches
                if m.get("reason") not in (None, "manual")
                and "MANUAL" not in str(m.get("heard") or "").upper()
            )
        manual = s.get("manual")
        if manual is None:
            manual = max(0, total - auto)
        rate = s.get("autoRatePct")
        if rate is None and total:
            rate = round(1000 * auto / total) / 10
        rows.append(
            {
                "file": p.name,
                "auto": auto,
                "total": total,
                "manual": manual,
                "rate": rate or 0,
                "mistake": d.get("mistakeTestMode"),
                "dur": (s.get("durationMs") or 0) / 1000,
            }
        )
    if not rows:
        print("Aucune session.")
        return
    rates = [r["rate"] for r in rows]
    print("=== KPI Voice Perf ===")
    print(f"sessions={len(rows)}  avg_auto={sum(rates)/len(rates):.1f}%  "
          f"min={min(rates):.1f}%  max={max(rates):.1f}%")
    print(f"target: ≥98% auto, 0 manuel, p95 stuck < 3s / mot")
    for r in rows[-8:]:
        print(f"  {r['rate']:5.1f}%  man={r['manual']}  "
              f"{r['dur']:.0f}s  fautes={r['mistake']}  {r['file']}")


def _norm_simple(t: str) -> str:
    t = re.sub(r"<[^>]*>", "", t or "")
    t = re.sub(r"[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]", "", t)
    t = t.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي")
    return re.sub(r"\s+", "", t).lower()


def replay(session: Path) -> None:
    """Idée 13 : rejoue sttEvents / heard contre expected (smoke, pas le matcher JS)."""
    d = load(session)
    expected = [_norm_simple(x) for x in (d.get("expected") or [])]
    if not expected:
        print("Pas de expected[]")
        return
    events = d.get("sttEvents") or []
    heard_log = d.get("heard") or []
    print(f"=== Replay {session.name} ===")
    print(f"expected={len(expected)} sttEvents={len(events)} heard={len(heard_log)}")
    idx = 0
    hits = 0
    stream_sources = []
    if events:
        stream_sources = [e.get("transcript") or "" for e in events]
    else:
        stream_sources = [h.get("raw") or "" for h in heard_log]
    for raw in stream_sources:
        tokens = [_norm_simple(w) for w in re.split(r"\s+", raw) if w.strip()]
        for tok in tokens:
            if idx >= len(expected):
                break
            if tok == expected[idx] or (
                len(tok) >= 3 and expected[idx].endswith(tok)
            ) or (len(tok) >= 3 and tok.endswith(expected[idx])):
                hits += 1
                idx += 1
        if idx >= len(expected):
            break
    print(f"naive sequential hits={hits}/{len(expected)} ({100*hits/max(len(expected),1):.0f}%)")
    print("(Smoke only — le vrai matcher est dans public/index.html)")


def main() -> None:
    cmd = (sys.argv[1] if len(sys.argv) > 1 else "kpi").lower()
    default_root = Path.home() / "Downloads"
    if cmd == "replay":
        if len(sys.argv) < 3:
            print("usage: replay SESSION.json")
            sys.exit(1)
        replay(Path(sys.argv[2]).expanduser())
        return
    root = Path(sys.argv[2]).expanduser() if len(sys.argv) > 2 else default_root
    if cmd == "mine":
        mine_aliases(root)
    elif cmd == "confusion":
        confusion_matrix(root)
    elif cmd == "kpi":
        kpi(root)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
