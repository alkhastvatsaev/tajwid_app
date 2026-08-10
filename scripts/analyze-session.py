#!/usr/bin/env python3
"""Analyse un enregistrement Fātiḥah (JSON dataset opt-in).

Usage:
  python3 scripts/analyze-session.py
  python3 scripts/analyze-session.py /path/to/fatiha-....json

Détecte aussi les BLOCAGES : combien de fois / combien de temps tu restes
collé sur un mot (STT n’avance pas) — utile si tu prononces bien mais l’app refuse.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

HOME = Path.home()
SEARCH_DIRS = [
    HOME / "Downloads",
    Path(__file__).resolve().parents[1] / "recordings",
]

# Seuils « collé longtemps alors que tu récites »
BLOCK_EVENTS_WARN = 4
BLOCK_MS_WARN = 2500


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


def _norm_light(s: str) -> str:
    if not s:
        return ""
    s = re.sub(r"[\u200B-\u200F\u061C\u202A-\u202E\u2066-\u2069]", "", s)
    s = re.sub(r"[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]", "", s)
    s = s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ٱ", "ا")
    s = s.replace("ى", "ي").replace("ة", "ه")
    return re.sub(r"\s+", "", s).strip().lower()


def _last_token(transcript: str) -> str:
    parts = [p for p in re.split(r"\s+", (transcript or "").strip()) if p]
    return parts[-1] if parts else ""


def _transcript_has_expected(transcript: str, expected: str, last_n: int = 4) -> bool:
    """True si le mot attendu apparaît dans les *derniers* tokens STT (pas tout le cumul)."""
    if not expected:
        return False
    exp = _norm_light(expected)
    if not exp:
        return False
    toks = [_norm_light(t) for t in re.split(r"\s+", transcript or "") if t]
    toks = toks[-last_n:] if len(toks) > last_n else toks
    if exp in toks:
        return True
    exp2 = exp[2:] if exp.startswith("ال") and len(exp) > 4 else exp
    for t in toks:
        t2 = t[2:] if t.startswith("ال") and len(t) > 4 else t
        if len(t2) < 3 and len(exp2) >= 3:
            continue
        if t == exp or t2 == exp2:
            return True
        if len(exp2) >= 4 and (t2 == exp2 or t.endswith(exp2) or exp2.endswith(t2) and len(t2) >= 4):
            return True
    return False


def compute_blocks(data: dict) -> list[dict]:
    """Par mot cible : nb d'échecs STT, durée bloquée, suspicion faux refus."""
    matches = data.get("matches") or []
    stt_events = data.get("sttEvents") or []
    expected_list = data.get("expected") or []
    errors = data.get("errors") or []

    match_by_idx = {}
    for m in matches:
        idx = m.get("index")
        if isinstance(idx, int):
            match_by_idx[idx] = m

    # Events groupés par idx courant
    by_idx: dict[int, list] = defaultdict(list)
    for e in stt_events:
        idx = e.get("idx")
        if isinstance(idx, int):
            by_idx[idx].append(e)

    # Mismatches par expected
    mismatch_by_exp = Counter()
    for e in errors:
        if e.get("type") == "pronunciation_mismatch":
            mismatch_by_exp[e.get("expected")] += 1

    blocks = []
    # Couvrir tous les index vus (matches + stt)
    indices = sorted(set(match_by_idx) | set(by_idx) | set(range(len(expected_list))))
    for idx in indices:
        evs = by_idx.get(idx, [])
        m = match_by_idx.get(idx)
        exp = (
            (m or {}).get("expected")
            or (expected_list[idx] if idx < len(expected_list) else None)
            or (evs[0].get("expected") if evs else None)
        )
        if exp is None and not evs:
            continue

        ms_list = [e.get("ms") for e in evs if isinstance(e.get("ms"), (int, float))]
        match_ms = (m or {}).get("ms")
        if match_ms is None and m and m.get("time"):
            # "12.34s" → ms
            try:
                match_ms = int(float(str(m["time"]).rstrip("s")) * 1000)
            except ValueError:
                match_ms = None

        block_ms = 0
        if ms_list:
            t0 = min(ms_list)
            t1 = match_ms if isinstance(match_ms, (int, float)) else max(ms_list)
            block_ms = max(0, int(t1 - t0))

        # Tentatives = events STT pendant ce mot (chaque onresult)
        attempts = len(evs)
        # Tokens distincts « entendus » pendant le blocage
        heard_tokens = []
        saw_expected_in_stt = 0
        for e in evs:
            tok = _last_token(e.get("transcript") or "")
            if tok:
                heard_tokens.append(_norm_light(tok))
            if _transcript_has_expected(e.get("transcript") or "", str(exp or "")):
                saw_expected_in_stt += 1

        uniq_heard = list(dict.fromkeys(heard_tokens))
        is_manual = bool(m and "MANUAL" in str(m.get("heard", "")))
        reason = (m or {}).get("reason") or ("manual" if is_manual else None)

        # Suspicion : le bon mot est déjà dans le STT mais ça n’a pas avancé vite / manuel
        false_reject_suspect = False
        if saw_expected_in_stt >= 2 and (attempts >= BLOCK_EVENTS_WARN or block_ms >= BLOCK_MS_WARN or is_manual):
            false_reject_suspect = True
        if is_manual and saw_expected_in_stt >= 1:
            false_reject_suspect = True

        # « Bloqué » si assez d’events ou durée, ou manuel
        is_blocked = (
            attempts >= BLOCK_EVENTS_WARN
            or block_ms >= BLOCK_MS_WARN
            or is_manual
            or mismatch_by_exp.get(exp, 0) >= 3
        )

        if not is_blocked and attempts < 2:
            continue

        blocks.append({
            "index": idx,
            "expected": exp,
            "attempts": attempts,
            "block_ms": block_ms,
            "mismatch_errors": mismatch_by_exp.get(exp, 0),
            "unique_heard_tokens": uniq_heard[:12],
            "stt_already_had_expected": saw_expected_in_stt,
            "matched_reason": reason,
            "manual": is_manual,
            "false_reject_suspect": false_reject_suspect,
            "energy_avg": round(
                sum(e.get("energy") or 0 for e in evs) / len(evs), 1
            ) if evs else None,
        })

    # Tri : suspects d’abord, puis attempts
    blocks.sort(
        key=lambda b: (
            0 if b["false_reject_suspect"] else 1,
            -b["attempts"],
            -b["block_ms"],
        )
    )
    return blocks


def analyze(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    matches = data.get("matches") or []
    heard = data.get("heard") or []
    errors = data.get("errors") or []
    expected = data.get("expected") or []

    manual = [m for m in matches if "MANUAL" in str(m.get("heard", ""))]
    auto = [m for m in matches if "MANUAL" not in str(m.get("heard", ""))]
    reasons = Counter(m.get("reason", "manual") for m in matches)

    stuck = []
    for m in manual:
        idx = m.get("index")
        exp = m.get("expected") or (expected[idx] if isinstance(idx, int) and idx < len(expected) else "?")
        raw_heard = str(m.get("heard", ""))
        snip = raw_heard
        if "Heard:" in raw_heard:
            snip = raw_heard.split("Heard:", 1)[-1].rstrip(")").strip()
        stuck.append({"index": idx, "expected": exp, "stt_window": snip[-60:]})

    mismatch_errs = [e for e in errors if e.get("type") == "pronunciation_mismatch"]
    top_mismatch = Counter(
        (e.get("expected"), e.get("heard")) for e in mismatch_errs
    ).most_common(12)

    auto_rate = (100.0 * len(auto) / len(matches)) if matches else 0.0
    blocks = compute_blocks(data)
    suspects = [b for b in blocks if b["false_reject_suspect"]]

    return {
        "file": str(path),
        "ref": data.get("ref"),
        "engine": data.get("engine"),
        "timestamp": data.get("timestamp"),
        "schemaVersion": data.get("schemaVersion"),
        "mistakeTestMode": bool(data.get("mistakeTestMode")),
        "summary": data.get("summary"),
        "sttEvents": len(data.get("sttEvents") or []),
        "voiceSamples": len(data.get("voiceEnergy") or []),
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
        "blocks": blocks,
        "false_reject_suspects": suspects,
        "expected": expected,
    }


def print_report(r: dict) -> None:
    print("=" * 60)
    print(f"Fichier : {r['file']}")
    print(f"Ref     : {r['ref']} | engine={r['engine']} | {r['timestamp']}")
    print("-" * 60)
    print(f"Score   : {r['auto']}/{r['total']} auto ({r['auto_rate_pct']}%)  |  manuel={r['manual']}")
    if r.get("summary"):
        s = r["summary"]
        print(f"Summary : sttEvents={s.get('sttEvents')} voiceSamples={s.get('voiceSamples')} "
              f"eAvg={s.get('voiceEnergyAvg')} durationMs={s.get('durationMs')}")
    else:
        print(f"Rich    : sttEvents={r.get('sttEvents')} voiceSamples={r.get('voiceSamples')}")
    if r.get("mistakeTestMode"):
        print("MODE    : test fautes volontaires (grammar off)")
    if r.get("schemaVersion"):
        print(f"Schema  : v{r.get('schemaVersion')}")
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

    print("-" * 60)
    print("BLOCAGES (tentatives / durée avant validation) :")
    blocks = r.get("blocks") or []
    if not blocks:
        print("  (aucun blocage notable — besoin sttEvents schema v3)")
    else:
        for b in blocks[:15]:
            flag = " ⚠ FAUX-REFUS?" if b.get("false_reject_suspect") else ""
            man = " [MANUEL]" if b.get("manual") else ""
            print(
                f"  [{b['index']:02d}] {b['expected']!r}  "
                f"×{b['attempts']} essais  {b['block_ms']}ms  "
                f"mismatchErr={b['mismatch_errors']}  "
                f"sttHadWord={b['stt_already_had_expected']}×  "
                f"→ {b.get('matched_reason')}{man}{flag}"
            )
            if b.get("unique_heard_tokens"):
                print(f"       entendu≈ {b['unique_heard_tokens'][:8]}")

    suspects = r.get("false_reject_suspects") or []
    print("-" * 60)
    if suspects:
        print(f"Suspicion FAUX REFUS (STT avait déjà le mot, mais bloqué) : {len(suspects)}")
        for b in suspects:
            print(f"  → [{b['index']:02d}] {b['expected']!r}  ({b['attempts']} essais, {b['block_ms']}ms)")
    else:
        print("Suspicion FAUX REFUS : aucune (ou STT n’a jamais écrit le bon mot).")

    print("=" * 60)
    if r["auto_rate_pct"] >= 90:
        print("Verdict : BON (≥90% auto) — regarder surtout les blocages ⚠.")
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
