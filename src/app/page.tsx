"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import WordBox from "@/components/WordBox";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useDuoMode } from "@/hooks/useDuoMode";
import { fetchVerseData, Verse } from "@/lib/tajwid/api";
import { checkPronunciation } from "@/lib/tajwid/pronunciation";
import { Mic, ChevronRight, Share2, Play, Info, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TajwidPage() {
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [completedWords, setCompletedWords] = useState<number[]>([]);
  const [showDuoOverlay, setShowDuoOverlay] = useState(false);
  const [currentRef, setCurrentRef] = useState("112:1");
  const [language, setLanguage] = useState<'fr' | 'en' | 'ar'>('fr');
  const [lastTranscript, setLastTranscript] = useState("");
  const [feedback, setFeedback] = useState<{type: 'success' | 'error' | 'none', text: string}>({type: 'none', text: ""});

  const { isListening, toggleListening } = useSpeechRecognition((transcript) => {
    handleTranscript(transcript);
  });

  const { state: duoState, initPeer, sendData } = useDuoMode();

  // Load verse when ref changes
  useEffect(() => {
    setCurrentVerse(null);
    fetchVerseData(currentRef).then(setCurrentVerse);
    setActiveWordIdx(0);
    setCompletedWords([]);
  }, [currentRef]);

  const handleNextAyah = () => {
    const [chapter, ayah] = currentRef.split(':');
    const nextAyah = parseInt(ayah) + 1;
    setCurrentRef(`${chapter}:${nextAyah}`);
  };

  const handleTranscript = (transcript: string) => {
    if (!currentVerse) return;
    setLastTranscript(transcript);
    
    const targetWord = currentVerse.words[activeWordIdx].text;
    const result = checkPronunciation(transcript, targetWord);

    if (result.isMatch) {
      setFeedback({ type: 'success', text: "Excellent !" });
      if (!completedWords.includes(activeWordIdx)) {
        setCompletedWords([...completedWords, activeWordIdx]);
        setTimeout(() => {
          if (activeWordIdx < currentVerse.words.length - 1) {
            setActiveWordIdx(activeWordIdx + 1);
            setFeedback({ type: 'none', text: "" });
          }
        }, 1000);
      }
    } else if (result.score > 0.4) {
      setFeedback({ type: 'error', text: result.feedback || "Continuez..." });
    }
  };

  const handleWordClick = (idx: number) => {
    setActiveWordIdx(idx);
  };

  return (
    <main className="min-h-screen pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center">
      <Header 
        onLangClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} 
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
                    {currentVerse.words[activeWordIdx]?.text.slice(0, 3)}...
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
          <div className="flex items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Navigator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 glass px-6 py-4 rounded-full z-50 shadow-2xl">
        <button className="text-zinc-400 hover:text-white transition-colors p-2"><Info size={20}/></button>
        <div className="w-[1px] h-6 bg-white/10" />
        <button className="flex items-center gap-2 bg-emerald-500 px-6 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-widest shadow-lg">
          <Play size={14} fill="white" />
          Listen
        </button>
        <button 
          onClick={handleNextAyah}
          className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
        >
          Next Ayah
          <ChevronRight size={14} />
        </button>
        <div className="w-[1px] h-6 bg-white/10" />
        <button className="text-zinc-400 hover:text-white transition-colors p-2"><Share2 size={20}/></button>
      </div>

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
