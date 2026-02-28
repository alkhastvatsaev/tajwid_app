"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import WordBox from "@/components/WordBox";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useDuoMode } from "@/hooks/useDuoMode";
import { fetchVerseData, Verse } from "@/lib/tajwid/api";
import { checkPronunciation } from "@/lib/tajwid/pronunciation";
import { Mic, ChevronRight, Share2, Play, Info, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TajwidPage() {
  const router = useRouter();

  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [completedWords, setCompletedWords] = useState<number[]>([]);
  const [showDuoOverlay, setShowDuoOverlay] = useState(false);
  const [currentRef, setCurrentRef] = useState("112:1");
  const [refInput, setRefInput] = useState("112:1");
  const [language, setLanguage] = useState<"fr" | "en" | "ar">("fr");
  const [lastTranscript, setLastTranscript] = useState("");
  const [feedback, setFeedback] = useState<{type: 'success' | 'error' | 'none', text: string}>({type: 'none', text: ""});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");

  const { isListening, toggleListening } = useSpeechRecognition((transcript) => {
    handleTranscript(transcript);
  });

  const { state: duoState, initPeer, sendData } = useDuoMode();

  const tajwidLegend = useMemo(
    () => [
      { label: "Ghunnah", className: "tajwid-ghunnah" },
      { label: "Ikhfā’", className: "tajwid-ikhfa" },
      { label: "Idghām (avec ghunnah)", className: "tajwid-idgham-with-ghunnah" },
      { label: "Qalqalah", className: "tajwid-qalqalah" },
      { label: "Iqlāb", className: "tajwid-iqlab" },
      { label: "Madd Ṭabī‘ī (normal)", className: "tajwid-madda-normal" },
      { label: "Madd Munfaṣil (permissible)", className: "tajwid-madda-permissible" },
      { label: "Madd Muttaṣil (necessary)", className: "tajwid-madda-necessary" },
      { label: "Madd Lāzim (compulsory)", className: "tajwid-madda-compulsory" },
    ],
    []
  );

  // Initialize from URL (?ref=112:1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refFromUrl = params.get("ref");
    if (refFromUrl && /^\d+:\d+$/.test(refFromUrl)) {
      setCurrentRef(refFromUrl);
      setRefInput(refFromUrl);
    }
  }, []);

  // Load verse when ref changes
  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setIsLoadingVerse(true);
    setCurrentVerse(null);
    setActiveWordIdx(0);
    setCompletedWords([]);

    fetchVerseData(currentRef)
      .then((v) => {
        if (cancelled) return;
        setCurrentVerse(v);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Erreur lors du chargement du verset.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingVerse(false);
      });

    // keep URL shareable without pushing history
    router.replace(`/?ref=${encodeURIComponent(currentRef)}`);

    return () => {
      cancelled = true;
    };
  }, [currentRef, router]);

  const handleNextAyah = () => {
    const [chapter, ayah] = currentRef.split(':');
    const nextAyah = parseInt(ayah) + 1;
    setCurrentRef(`${chapter}:${nextAyah}`);
    setRefInput(`${chapter}:${nextAyah}`);
  };

  const handleTranscript = useCallback((transcript: string) => {
    if (!currentVerse) return;
    setLastTranscript(transcript);
    
    const targetWord = currentVerse.words[activeWordIdx]?.text;
    if (!targetWord) return;
    const result = checkPronunciation(transcript, targetWord);

    if (result.isMatch) {
      setFeedback({ type: 'success', text: "Excellent !" });
      if (!completedWords.includes(activeWordIdx)) {
        setCompletedWords((prev) => (prev.includes(activeWordIdx) ? prev : [...prev, activeWordIdx]));
        setTimeout(() => {
          setActiveWordIdx((prevIdx) => {
            if (prevIdx < currentVerse.words.length - 1) {
              setFeedback({ type: "none", text: "" });
              return prevIdx + 1;
            }
            return prevIdx;
          });
        }, 1000);
      }
    } else if (result.score > 0.4) {
      setFeedback({ type: 'error', text: result.feedback || "Continuez..." });
    }
  }, [activeWordIdx, completedWords, currentVerse]);

  const handleWordClick = (idx: number) => {
    setActiveWordIdx(idx);
  };

  const submitRef = useCallback(() => {
    const normalized = refInput.trim();
    if (!/^\d+:\d+$/.test(normalized)) {
      setLoadError("Référence invalide. Format attendu: 112:1");
      return;
    }
    setCurrentRef(normalized);
  }, [refInput]);

  const handleShare = useCallback(async () => {
    try {
      const url = `${window.location.origin}/?ref=${encodeURIComponent(currentRef)}`;
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 1200);
    } catch {
      setShareStatus("error");
      setTimeout(() => setShareStatus("idle"), 1500);
    }
  }, [currentRef]);

  return (
    <main className="min-h-screen pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center">
      <Header 
        onLangClick={() =>
          setLanguage((prev) => (prev === "fr" ? "en" : prev === "en" ? "ar" : "fr"))
        }
        onDuoClick={() => setShowDuoOverlay(true)}
        isDuoActive={duoState.isConnected}
      />

      {/* Mesh Background Decorations */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {currentVerse ? (
          <motion.div 
            key={currentVerse.ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full relative z-10 flex flex-col items-center"
          >
            {/* Ref Picker */}
            <div className="w-full max-w-xl mb-10 glass rounded-2xl p-4 flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                  Référence (surah:ayah)
                </label>
                <input
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitRef();
                  }}
                  inputMode="numeric"
                  placeholder="112:1"
                  className="w-full bg-transparent outline-none text-white font-bold tracking-wide"
                />
              </div>
              <button
                type="button"
                onClick={submitRef}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Go
              </button>
            </div>

            {/* Title & Stats */}
            <div className="mb-12 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                Surah {currentVerse.title}
              </span>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-2 tracking-tight">
                {currentVerse.ref}
              </h2>
              <p className="text-zinc-500 text-sm italic">
                {completedWords.length} of {currentVerse.words.length} words mastered
              </p>
            </div>

            {/* Ghost Word Background (Dynamic) */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-[0.03] select-none">
              <span className="text-[20vw] font-amiri text-white whitespace-nowrap">
                {currentVerse.words[activeWordIdx]?.text}
              </span>
            </div>

            {/* Verse Grid */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 w-full max-w-4xl direction-rtl transition-all duration-500">
              {currentVerse.words.map((word, idx) => (
                <WordBox 
                  key={idx}
                  arabic={word.tajwid || word.text}
                  transliteration={word.transliteration}
                  isActive={activeWordIdx === idx}
                  isCorrect={completedWords.includes(idx)}
                  onClick={() => handleWordClick(idx)}
                />
              ))}
            </div>

            {/* Live Feedback Widget */}
            <motion.div 
              layout
              className="mt-16 w-full max-w-xl glass rounded-[32px] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-700" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-full ${isListening ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'bg-white/5 border border-white/10'} transition-all duration-500`}>
                  <Mic className={isListening ? 'text-white translate-y-[-1px]' : 'text-zinc-500'} size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold uppercase tracking-widest text-xs">Live Recognition</h3>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider">{isListening ? 'AI is listening...' : 'Inactive'}</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {feedback.type !== 'none' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`mb-6 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${
                      feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-orange-500/20 text-orange-500'
                    }`}
                  >
                    {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {feedback.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full h-[2px] bg-white/5 mb-6" />

              <div className="w-full mb-6 p-4 bg-white/[0.02] rounded-2xl border border-white/5 text-center min-h-[60px] flex items-center justify-center">
                <p className="text-zinc-500 font-amiri text-2xl">
                  {lastTranscript || "..."}
                </p>
              </div>

              <div className="flex justify-between items-center w-full px-4">
                <div className="text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Target Letter</span>
                  <span className="text-2xl font-amiri text-emerald-500">
                    {currentVerse.words[activeWordIdx]?.text?.slice(0, 3) || "..."}
                  </span>
                </div>
                <div className="w-[1px] h-10 bg-white/5" />
                <div className="text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Fluidity</span>
                  <span className="text-2xl font-bold text-white">94%</span>
                </div>
                <div className="w-[1px] h-10 bg-white/5" />
                <div className="text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Tajwid Accuracy</span>
                  <span className="text-2xl font-bold text-emerald-500">High</span>
                </div>
              </div>

              <button 
                onClick={toggleListening}
                className={`mt-8 w-full py-4 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
                  isListening 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20' 
                  : 'bg-emerald-500 text-white shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]'
                }`}
              >
                {isListening ? 'Stop Analysis' : 'Start Récitation'}
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 gap-6">
            {isLoadingVerse && (
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            )}
            {loadError && (
              <div className="glass rounded-2xl p-6 max-w-xl w-full text-center">
                <div className="flex items-center justify-center gap-2 text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">
                  <AlertCircle size={16} />
                  Erreur
                </div>
                <p className="text-zinc-400 text-sm mb-4">{loadError}</p>
                <button
                  type="button"
                  onClick={submitRef}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Navigator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 glass px-6 py-4 rounded-full z-50 shadow-2xl">
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          aria-label="Afficher la légende Tajwid"
          className="text-zinc-400 hover:text-white transition-colors p-2"
        >
          <Info size={20} />
        </button>
        <div className="w-[1px] h-6 bg-white/10" />
        <button
          type="button"
          onClick={toggleListening}
          className="flex items-center gap-2 bg-emerald-500 px-6 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-widest shadow-lg"
        >
          <Play size={14} fill="white" />
          {isListening ? "Stop" : "Listen"}
        </button>
        <button 
          type="button"
          onClick={handleNextAyah}
          className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
        >
          Next Ayah
          <ChevronRight size={14} />
        </button>
        <div className="w-[1px] h-6 bg-white/10" />
        <button
          type="button"
          onClick={handleShare}
          aria-label="Copier le lien du verset"
          className="text-zinc-400 hover:text-white transition-colors p-2"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Share toast */}
      <AnimatePresence>
        {shareStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${
              shareStatus === "copied" ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"
            }`}
          >
            {shareStatus === "copied" ? "Lien copié" : "Copie impossible"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info / Legend modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-3xl"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-[32px] p-8 max-w-2xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-6 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Légende Tajwid</h2>
                  <p className="text-zinc-400 text-sm mt-1">
                    Les couleurs/traits viennent directement des balises Tajwid de Quran.com.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfo(false)}
                  className="text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest"
                >
                  Fermer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tajwidLegend.map((item) => (
                  <div key={item.className} className="glass rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-white font-bold text-sm">{item.label}</div>
                      <div className={`font-amiri text-xl ${item.className}`}>نم</div>
                    </div>
                    <div className="text-zinc-500 text-xs mt-2">{item.className}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-zinc-500 text-xs">
                Langue UI: <span className="text-white/80 font-bold uppercase tracking-widest">{language}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duo Mode Overlay */}
      <AnimatePresence>
        {showDuoOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-3xl"
            onClick={() => setShowDuoOverlay(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-[40px] p-12 max-w-2xl w-full text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Mode Duo</h2>
              <p className="text-zinc-400 mb-12">Learn together with real-time peer-to-peer audio and sync.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <button 
                  type="button"
                  onClick={() => { initPeer('user1'); setShowDuoOverlay(false); }}
                  className="group relative h-48 rounded-[30px] border border-white/5 bg-white/[0.02] hover:bg-emerald-500 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center justify-center p-8">
                    <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-500">👤</span>
                    <span className="text-lg font-bold text-white uppercase tracking-widest">Imam</span>
                    <span className="text-[10px] text-zinc-500 group-hover:text-white/70 mt-1 uppercase">Lead Recitation</span>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => { initPeer('user2'); setShowDuoOverlay(false); }}
                  className="group relative h-48 rounded-[30px] border border-white/5 bg-white/[0.02] hover:bg-blue-500 transition-all duration-500 overflow-hidden"
                >
                   <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center justify-center p-8">
                    <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-500">👥</span>
                    <span className="text-lg font-bold text-white uppercase tracking-widest">Talib</span>
                    <span className="text-[10px] text-zinc-500 group-hover:text-white/70 mt-1 uppercase">Practice & Sync</span>
                  </div>
                </button>
              </div>

              <button 
                type="button"
                onClick={() => setShowDuoOverlay(false)}
                className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
