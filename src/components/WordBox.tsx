"use client";

import { motion } from "framer-motion";
import { parseTajwidHtml } from "@/lib/tajwid/parser";

interface WordBoxProps {
  arabic: string;
  transliteration: string;
  isActive: boolean;
  isCorrect: boolean;
  onClick: () => void;
}

export default function WordBox({ arabic, transliteration, isActive, isCorrect, onClick }: WordBoxProps) {
  const tajwidTokens = parseTajwidHtml(arabic);

  return (
    <motion.div
      whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      className={`
        relative flex flex-col items-center p-4 md:p-6 rounded-[20px] transition-all duration-300 cursor-pointer min-w-[100px]
        ${isActive ? "ring-2 ring-emerald-500 bg-white/5 shadow-[0_0_30px_rgba(16,185,129,0.15)]" : "bg-white/[0.02]"}
        ${isCorrect ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/[0.05]"}
        border
      `}
    >
      <div className="arabic-text text-3xl md:text-5xl mb-2 font-amiri text-center flex gap-0 direction-rtl">
        {tajwidTokens.map((token, idx) => (
          <span 
            key={idx} 
            className={token.type === 'rule' ? `tajwid-${token.ruleType}` : ""}
          >
            {token.content}
          </span>
        ))}
      </div>
      <div className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest font-medium opacity-70">
        {transliteration}
      </div>
      
      {isActive && (
        <motion.div 
          layoutId="isActive-aura"
          className="absolute inset-0 rounded-[20px] border border-emerald-500/30 blur-sm pointer-events-none"
        />
      )}
    </motion.div>
  );
}
