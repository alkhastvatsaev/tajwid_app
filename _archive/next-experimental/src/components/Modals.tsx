"use client";

import { useMemo, useState } from "react";
import { SURAHS_LIST, SURAHS_AYAH_COUNT } from "@/lib/surahs";
import type { Translation } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (ref: string) => void;
  t: Translation;
};

export function SurahBrowser({ open, onClose, onSelect, t }: Props) {
  const [query, setQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SURAHS_LIST.map((name, i) => ({ name, index: i + 1 })).filter(
      ({ name, index }) =>
        !q || name.toLowerCase().includes(q) || String(index).includes(q),
    );
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.browserTitle}
    >
      <div
        className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">{t.browserTitle}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
            >
              {t.browserClose}
            </button>
          </div>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedSurah(null);
            }}
            placeholder={t.browserSearch}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {selectedSurah == null ? (
            filtered.map(({ name, index }) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedSurah(index)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 flex justify-between items-center"
              >
                <span className="text-white text-sm font-medium">
                  {index}. {name}
                </span>
                <span className="text-zinc-500 text-xs">
                  {SURAHS_AYAH_COUNT[index - 1]} ayahs
                </span>
              </button>
            ))
          ) : (
            <div className="p-2">
              <button
                type="button"
                onClick={() => setSelectedSurah(null)}
                className="text-xs text-emerald-400 mb-3 uppercase tracking-widest font-bold"
              >
                ← {SURAHS_LIST[selectedSurah - 1]}
              </button>
              <div className="grid grid-cols-6 gap-2">
                {Array.from(
                  { length: SURAHS_AYAH_COUNT[selectedSurah - 1] },
                  (_, i) => i + 1,
                ).map((ayah) => (
                  <button
                    key={ayah}
                    type="button"
                    onClick={() => {
                      onSelect(`${selectedSurah}:${ayah}`);
                      onClose();
                    }}
                    className="aspect-square rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-emerald-600 hover:border-emerald-500"
                  >
                    {ayah}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ImportProps = {
  open: boolean;
  onClose: () => void;
  onImport: (ref: string) => void;
  t: Translation;
};

export function ImportModal({ open, onClose, onImport, t }: ImportProps) {
  const [value, setValue] = useState("");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-2">{t.importTitle}</h2>
        <p className="text-zinc-400 text-sm mb-4">{t.importDesc}</p>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.importPlaceholder}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none mb-4"
          onKeyDown={(e) => {
            if (e.key === "Enter" && /^\d+:\d+$/.test(value.trim())) {
              onImport(value.trim());
              onClose();
            }
          }}
        />
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400"
          >
            {t.importCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (/^\d+:\d+$/.test(value.trim())) {
                onImport(value.trim());
                onClose();
              }
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest"
          >
            {t.importBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

type StatsProps = {
  open: boolean;
  onClose: () => void;
  completed: number;
  favorites: number;
  t: Translation;
};

export function StatsModal({
  open,
  onClose,
  completed,
  favorites,
  t,
}: StatsProps) {
  if (!open) return null;
  const pct = ((completed / 6236) * 100).toFixed(1);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-6">{t.statsTitle}</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-2xl p-4">
            <div className="text-2xl font-bold text-white">{completed}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
              {t.statsVerses}
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="text-2xl font-bold text-white">{favorites}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
              {t.statsFavs}
            </div>
          </div>
        </div>
        <div className="mb-2 flex justify-between text-xs text-zinc-500 uppercase tracking-widest">
          <span>{t.statsGoal}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-6">
          <div
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${Math.min(Number(pct), 100)}%` }}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest"
        >
          {t.statsContinue}
        </button>
      </div>
    </div>
  );
}
