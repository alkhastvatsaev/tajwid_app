"use client";

import { motion, AnimatePresence } from "framer-motion";
import { parseTajwidHtml } from "@/lib/tajwid/parser";
import { Play, Loader2 } from "lucide-react";
import { useState } from "react";

interface WordBoxProps {
  arabic: string;
  arabicOriginal: string;
  transliteration: string;
  isActive: boolean;
  isCorrect: boolean;
  onClick: () => void;
}

export default function WordBox({
  arabic,
  arabicOriginal,
  transliteration,
  isActive,
  isCorrect,
  onClick,
}: WordBoxProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const tajwidTokens = parseTajwidHtml(arabic);

  const playModel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;

    setIsPlaying(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: arabicOriginal }),
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setIsPlaying(false);
      audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
      setIsPlaying(false);
    }
  };

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
            className={token.type === "rule" ? `tajwid-${token.ruleType}` : ""}
          >
            {token.content}
          </span>
        ))}
      </div>
      <div className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest font-medium opacity-70">
        {transliteration}
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={playModel}
            className="mt-4 p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all z-20"
          >
            {isPlaying ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {isActive && (
        <motion.div
          layoutId="isActive-aura"
          className="absolute inset-0 rounded-[20px] border border-emerald-500/30 blur-sm pointer-events-none"
        />
      )}
    </motion.div>
  );
}
