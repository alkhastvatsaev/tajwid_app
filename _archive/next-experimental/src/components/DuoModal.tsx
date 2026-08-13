"use client";

import { useState } from "react";
import type { Translation } from "@/lib/i18n";
import type { DuoState } from "@/hooks/useDuoMode";

type Props = {
  open: boolean;
  onClose: () => void;
  t: Translation;
  duo: DuoState;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onDisconnect: () => void;
};

export function DuoModal({
  open,
  onClose,
  t,
  duo,
  onCreate,
  onJoin,
  onDisconnect,
}: Props) {
  const [joinCode, setJoinCode] = useState("");

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
        <h2 className="text-2xl font-bold text-white mb-2">{t.duoTitle}</h2>
        <p className="text-zinc-400 text-sm mb-6">{t.duoDesc}</p>

        {duo.status === "connected" || duo.status === "waiting" ? (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                {t.duoCode}
              </div>
              <div className="text-3xl font-bold tracking-[0.3em] text-emerald-400">
                {duo.roomCode}
              </div>
              <div className="mt-3 text-xs text-zinc-400">
                {duo.status === "connected" ? t.duoConnected : t.duoWaiting}
              </div>
            </div>
            <button
              type="button"
              onClick={onDisconnect}
              className="w-full py-3 rounded-xl border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-widest"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={onCreate}
              className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm uppercase tracking-widest"
            >
              {t.duoCreate}
            </button>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={t.duoRoom}
                maxLength={8}
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white tracking-widest uppercase outline-none"
              />
              <button
                type="button"
                onClick={() => onJoin(joinCode)}
                className="px-4 rounded-xl bg-white/10 text-white text-xs font-bold uppercase tracking-widest"
              >
                {t.duoJoin}
              </button>
            </div>
            {duo.error && (
              <p className="text-orange-400 text-xs text-center">{duo.error}</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
