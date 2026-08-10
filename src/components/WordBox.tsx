"use client";

import { parseTajwidHtml } from "@/lib/tajwid/parser";

interface WordBoxProps {
  arabic: string;
  transliteration: string;
  isActive: boolean;
  isCorrect: boolean;
  onClick: () => void;
}

export default function WordBox({
  arabic,
  transliteration,
  isActive,
  isCorrect,
  onClick,
}: WordBoxProps) {
  const tajwidTokens = parseTajwidHtml(arabic);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`
        relative flex flex-col items-center p-3 md:p-5 rounded-2xl transition-all duration-300 min-w-[88px]
        border outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
        ${isActive ? "ring-2 ring-emerald-500 bg-white/5" : "bg-white/[0.02]"}
        ${isCorrect ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/[0.05]"}
      `}
    >
      <div className="font-amiri text-3xl md:text-4xl mb-1 text-center flex flex-wrap justify-center gap-0 direction-rtl leading-relaxed">
        {tajwidTokens.map((token, idx) => (
          <span
            key={idx}
            className={token.type === "rule" ? `tajwid-${token.ruleType}` : ""}
          >
            {token.content}
          </span>
        ))}
      </div>
      <div className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest font-medium opacity-80">
        {transliteration}
      </div>
    </button>
  );
}
