"use client";

import { Mic, Heart, Languages, Users, BookOpen, BarChart3 } from "lucide-react";

interface HeaderProps {
  onLangClick: () => void;
  onDuoClick: () => void;
  onFavoriteClick: () => void;
  onBrowserClick: () => void;
  onStatsClick: () => void;
  isDuoActive: boolean;
  isFavorite: boolean;
  langLabel: string;
}

export default function Header({
  onLangClick,
  onDuoClick,
  onFavoriteClick,
  onBrowserClick,
  onStatsClick,
  isDuoActive,
  isFavorite,
  langLabel,
}: HeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-white/5"
      style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
          <Mic className="text-white w-5 h-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-white/90 uppercase">
            Tajwid
          </h1>
          <p className="text-[10px] text-emerald-500/80 font-medium uppercase tracking-widest">
            Practice
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          type="button"
          onClick={onBrowserClick}
          aria-label="Choisir une sourate"
          className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <BookOpen size={18} />
        </button>
        <button
          type="button"
          onClick={onStatsClick}
          aria-label="Statistiques"
          className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <BarChart3 size={18} />
        </button>
        <button
          type="button"
          onClick={onDuoClick}
          aria-label="Mode Duo"
          className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
            isDuoActive
              ? "bg-emerald-600 border-emerald-500 text-white"
              : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
          }`}
        >
          <Users size={16} />
          <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">
            Duo
          </span>
        </button>
        <button
          type="button"
          onClick={onLangClick}
          aria-label="Changer de langue"
          className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider hover:text-white transition-colors"
        >
          <span className="inline-flex items-center gap-1.5">
            <Languages size={14} />
            {langLabel}
          </span>
        </button>
        <button
          type="button"
          onClick={onFavoriteClick}
          aria-label="Favori"
          aria-pressed={isFavorite}
          className={`p-2.5 rounded-full border transition-colors ${
            isFavorite
              ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
              : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
          }`}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
    </header>
  );
}
