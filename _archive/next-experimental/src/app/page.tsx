"use client";

import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from "react";
import Header from "@/components/Header";
import WordBox from "@/components/WordBox";
import { SurahBrowser, ImportModal, StatsModal } from "@/components/Modals";
import { DuoModal } from "@/components/DuoModal";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useDuoMode } from "@/hooks/useDuoMode";
import { fetchVerseData, Verse } from "@/lib/tajwid/api";
import { matchTranscriptStream } from "@/lib/tajwid/pronunciation";
import {
  getFavorites,
  toggleFavorite,
  getCompleted,
  markCompleted,
  getStoredLang,
  setStoredLang,
  type Lang,
} from "@/lib/storage";
import { t as translate } from "@/lib/i18n";
import { getDailyVerseRef, SURAHS_AYAH_COUNT } from "@/lib/surahs";
import {
  Mic,
  ChevronRight,
  Share2,
  Info,
  AlertCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";

function RemoteAudio({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      void ref.current.play().catch(() => undefined);
    }
  }, [stream]);
  if (!stream) return null;
  return <audio ref={ref} autoPlay playsInline className="hidden" />;
}

export default function TilmidhPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [completedWords, setCompletedWords] = useState<number[]>([]);
  const [currentRef, setCurrentRef] = useState("1:1");
  const [language, setLanguage] = useState<Lang>("fr");
  const [lastTranscript, setLastTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showDuo, setShowDuo] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [completedRefs, setCompletedRefs] = useState<string[]>([]);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [verseComplete, setVerseComplete] = useState(false);

  const labels = translate(language);
  const activeWordIdxRef = useRef(0);

  useEffect(() => {
    activeWordIdxRef.current = activeWordIdx;
  }, [activeWordIdx]);

  const handleTranscript = useCallback(
    (transcript: string) => {
      if (!currentVerse) return;
      setLastTranscript(transcript);
      const expected = currentVerse.words.map((w) => w.text);
      const { nextIdx, matchedCount } = matchTranscriptStream(
        transcript,
        expected,
        activeWordIdxRef.current,
      );

      if (matchedCount > 0) {
        setCompletedWords((prev) => {
          const next = new Set(prev);
          for (let i = activeWordIdxRef.current; i < nextIdx; i++) next.add(i);
          return Array.from(next).sort((a, b) => a - b);
        });
        setActiveWordIdx(nextIdx);
        setFeedback("");
        if (nextIdx >= expected.length) {
          setVerseComplete(true);
          document.body.classList.add("celebration-mode");
          setCompletedRefs(markCompleted(currentVerse.ref));
        }
      } else if (transcript.length > 5) {
        setFeedback(labels.hintAlmost);
      }
    },
    [currentVerse, labels.hintAlmost],
  );

  const {
    isListening,
    toggleListening,
    startListening,
    stopListening,
    volume,
    error: speechError,
  } = useSpeechRecognition(handleTranscript);

  const { state: duoState, createRoom, joinRoom, disconnect } = useDuoMode();

  const tajwidLegend = useMemo(
    () => [
      { label: "Ghunnah", className: "tajwid-ghunnah" },
      { label: "Ikhfā’", className: "tajwid-ikhfa" },
      { label: "Idghām", className: "tajwid-idgham-with-ghunnah" },
      { label: "Qalqalah", className: "tajwid-qalqalah" },
      { label: "Iqlāb", className: "tajwid-iqlab" },
      { label: "Madd Ṭabī‘ī", className: "tajwid-madda-normal" },
      { label: "Madd Munfaṣil", className: "tajwid-madda-permissible" },
      { label: "Madd Muttaṣil", className: "tajwid-madda-necessary" },
      { label: "Madd Lāzim", className: "tajwid-madda-compulsory" },
    ],
    [],
  );

  useEffect(() => {
    startTransition(() => {
      setFavorites(getFavorites());
      setCompletedRefs(getCompleted());
      setLanguage(getStoredLang());
      const params = new URLSearchParams(window.location.search);
      const refFromUrl = params.get("ref");
      if (refFromUrl && /^\d+:\d+$/.test(refFromUrl)) {
        setCurrentRef(refFromUrl);
      } else {
        setCurrentRef(getDailyVerseRef());
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      setLoadError(null);
      setIsLoadingVerse(true);
      setActiveWordIdx(0);
      setCompletedWords([]);
      setVerseComplete(false);
    });
    document.body.classList.remove("celebration-mode");

    fetchVerseData(currentRef)
      .then((v) => {
        if (!cancelled) {
          startTransition(() => setCurrentVerse(v));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          startTransition(() => {
            setCurrentVerse(null);
            setLoadError(
              err instanceof Error ? err.message : "Erreur de chargement",
            );
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          startTransition(() => setIsLoadingVerse(false));
        }
      });

    router.replace(`/?ref=${encodeURIComponent(currentRef)}`, { scroll: false });
    return () => {
      cancelled = true;
    };
  }, [currentRef, router]);

  const loadRef = useCallback((ref: string) => {
    setCurrentRef(ref);
    setStarted(false);
    stopListening();
  }, [stopListening]);

  const handleNextAyah = useCallback(() => {
    const [chapterStr, ayahStr] = currentRef.split(":");
    const chapter = parseInt(chapterStr, 10);
    const ayah = parseInt(ayahStr, 10);
    const max = SURAHS_AYAH_COUNT[chapter - 1] ?? 1;
    if (ayah < max) {
      loadRef(`${chapter}:${ayah + 1}`);
    } else if (chapter < 114) {
      loadRef(`${chapter + 1}:1`);
    }
  }, [currentRef, loadRef]);

  const handleStart = async () => {
    setStarted(true);
    await startListening();
  };

  const handleRestart = () => {
    setActiveWordIdx(0);
    setCompletedWords([]);
    setVerseComplete(false);
    setLastTranscript("");
    setFeedback("");
    document.body.classList.remove("celebration-mode");
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/?ref=${encodeURIComponent(currentRef)}`;
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 1200);
    } catch {
      setShareStatus("error");
      setTimeout(() => setShareStatus("idle"), 1500);
    }
  };

  const cycleLang = () => {
    const next: Lang =
      language === "fr" ? "en" : language === "en" ? "ru" : "fr";
    setLanguage(next);
    setStoredLang(next);
  };

  const progress =
    currentVerse && currentVerse.words.length > 0
      ? (completedWords.length / currentVerse.words.length) * 100
      : 0;

  const ghostScale = 1 + volume / 180;
  const auraScale = 0.8 + volume / 45;
  const auraOpacity = volume > 5 ? Math.min(0.2 + volume / 30, 0.7) : 0;

  return (
    <main
      className="min-h-screen pb-32 px-4 md:px-8 max-w-5xl mx-auto flex flex-col items-center"
      style={{ paddingTop: "calc(var(--safe-top) + 96px)" }}
    >
      <Header
        onLangClick={cycleLang}
        onDuoClick={() => setShowDuo(true)}
        onFavoriteClick={() => {
          if (!currentVerse) return;
          setFavorites(toggleFavorite(currentVerse.ref));
        }}
        onBrowserClick={() => setShowBrowser(true)}
        onStatsClick={() => setShowStats(true)}
        isDuoActive={duoState.isConnected}
        isFavorite={favorites.includes(currentRef)}
        langLabel={language}
      />

      <RemoteAudio stream={duoState.remoteStream} />

      {/* Session progress */}
      <div
        className="fixed left-0 right-0 z-40 h-0.5 bg-white/5"
        style={{ top: "calc(var(--safe-top) + 56px)" }}
      >
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Ghost + aura */}
      {currentVerse && started && (
        <>
          <div
            className="fixed top-1/2 left-1/2 pointer-events-none z-0 rounded-full"
            style={{
              width: "60vmin",
              height: "60vmin",
              transform: `translate(-50%, -50%) scale(${auraScale})`,
              opacity: auraOpacity,
              background:
                "radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.05) 50%, transparent 70%)",
              transition: "opacity 80ms linear",
            }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 select-none font-amiri text-emerald-500"
            style={{
              fontSize: "18vw",
              opacity: volume > 5 ? Math.min(0.02 + volume / 300, 0.08) : 0,
              transform: `translate(-50%, -50%) scale(${ghostScale})`,
            }}
          >
            {currentVerse.words[activeWordIdx]?.text || ""}
          </div>
        </>
      )}

      {isLoadingVerse && (
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mt-20" />
      )}

      {loadError && (
        <div className="glass rounded-2xl p-6 max-w-xl w-full text-center mt-20">
          <div className="flex items-center justify-center gap-2 text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">
            <AlertCircle size={16} />
            Erreur
          </div>
          <p className="text-zinc-400 text-sm mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest"
          >
            {labels.importBtn}
          </button>
        </div>
      )}

      {currentVerse && (
        <div className="w-full relative z-10 flex flex-col items-center">
          <div className="mb-8 text-center">
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-3 hover:bg-emerald-500/20"
            >
              {currentVerse.title} · {currentVerse.ref}
            </button>
            <p className="text-zinc-500 text-sm">
              {completedWords.length} / {currentVerse.words.length}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 md:gap-4 w-full direction-rtl mb-10">
            {currentVerse.words.map((word, idx) => (
              <WordBox
                key={`${currentVerse.ref}-${idx}`}
                arabic={word.tajwid || word.text}
                transliteration={word.transliteration}
                isActive={activeWordIdx === idx && !verseComplete}
                isCorrect={completedWords.includes(idx)}
                onClick={() => {
                  if (!verseComplete) setActiveWordIdx(idx);
                }}
              />
            ))}
          </div>

          {/* Live assistant */}
          {started && (
            <div className="w-full max-w-xl glass rounded-3xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-3 rounded-full ${
                    isListening
                      ? "bg-emerald-600"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <Mic
                    className={isListening ? "text-white" : "text-zinc-500"}
                    size={20}
                  />
                </div>
                <div>
                  <h3 className="text-white font-bold uppercase tracking-widest text-xs">
                    {labels.assistantTitle}
                  </h3>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider">
                    {isListening ? labels.statusListen : "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                    {labels.assistantTarget}
                  </div>
                  <div className="font-amiri text-2xl text-emerald-400">
                    {currentVerse.words[activeWordIdx]?.text || "✓"}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {currentVerse.words[activeWordIdx]?.transliteration || ""}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                    {labels.assistantHeard}
                  </div>
                  <div className="font-amiri text-2xl text-zinc-300 truncate">
                    {lastTranscript.split(/\s+/).slice(-3).join(" ") || "…"}
                  </div>
                </div>
              </div>

              {feedback && (
                <p className="text-center text-orange-400 text-xs mb-3">
                  {feedback}
                </p>
              )}
              {speechError && (
                <p className="text-center text-red-400 text-xs mb-3">
                  {speechError}
                </p>
              )}

              {verseComplete && (
                <div className="text-center mb-4">
                  <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-3">
                    {labels.summaryTitle}
                  </p>
                  <button
                    type="button"
                    onClick={handleNextAyah}
                    className="px-6 py-3 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2"
                  >
                    {labels.nextVerse}
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Start overlay */}
      {!started && currentVerse && !isLoadingVerse && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm px-6">
          <button
            type="button"
            onClick={handleStart}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center hover:bg-white/[0.06] transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-6">
              <Play size={28} fill="white" className="text-white ml-1" />
            </div>
            <p className="text-white text-lg font-semibold mb-2">
              {labels.start}
            </p>
            <p className="text-zinc-500 text-sm">
              {labels.dailyLabel}: {currentRef}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setShowDuo(true)}
            className="mt-6 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
          >
            {labels.duoTitle}
          </button>
        </div>
      )}

      {/* Bottom nav */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 16px)" }}
      >
        <div className="flex items-center gap-2 md:gap-3 glass px-4 md:px-6 py-3 rounded-full shadow-2xl">
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            aria-label={labels.legendTitle}
            className="text-zinc-400 hover:text-white p-2"
          >
            <Info size={18} />
          </button>
          <div className="w-px h-5 bg-white/10" />
          <button
            type="button"
            onClick={() => {
              if (!started) void handleStart();
              else toggleListening();
            }}
            className="flex items-center gap-2 bg-emerald-600 px-5 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-widest"
          >
            {isListening ? labels.stop : labels.listen}
          </button>
          <button
            type="button"
            onClick={handleRestart}
            aria-label={labels.restart}
            className="text-zinc-400 hover:text-white p-2"
          >
            <RotateCcw size={18} />
          </button>
          <button
            type="button"
            onClick={handleNextAyah}
            className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10"
          >
            {labels.nextVerse}
            <ChevronRight size={14} />
          </button>
          <div className="w-px h-5 bg-white/10" />
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share"
            className="text-zinc-400 hover:text-white p-2"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {shareStatus !== "idle" && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${
            shareStatus === "copied"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-orange-500/20 text-orange-400"
          }`}
        >
          {shareStatus === "copied" ? "Lien copié" : "Copie impossible"}
        </div>
      )}

      {showInfo && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
          onClick={() => setShowInfo(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-zinc-950 border border-white/10 rounded-3xl p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {labels.legendTitle}
              </h2>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="text-xs font-bold uppercase tracking-widest text-zinc-400"
              >
                {labels.browserClose}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tajwidLegend.map((item) => (
                <div
                  key={item.className}
                  className="glass rounded-2xl p-4 border border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">
                      {item.label}
                    </span>
                    <span className={`font-amiri text-xl ${item.className}`}>
                      نم
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <SurahBrowser
        open={showBrowser}
        onClose={() => setShowBrowser(false)}
        onSelect={loadRef}
        t={labels}
      />
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={loadRef}
        t={labels}
      />
      <StatsModal
        open={showStats}
        onClose={() => setShowStats(false)}
        completed={completedRefs.length}
        favorites={favorites.length}
        t={labels}
      />
      <DuoModal
        open={showDuo}
        onClose={() => setShowDuo(false)}
        t={labels}
        duo={duoState}
        onCreate={() => {
          void createRoom();
        }}
        onJoin={(code) => {
          void joinRoom(code);
        }}
        onDisconnect={disconnect}
      />
    </main>
  );
}
