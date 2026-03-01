"use client";

import { motion } from "framer-motion";
import { Mic, Heart, Settings, Languages, Users } from "lucide-react";

import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useUserStats } from "@/hooks/useUserStats";

interface HeaderProps {
  onLangClick: () => void;
  onDuoClick: () => void;
  isDuoActive: boolean;
}

export default function Header({
  onLangClick,
  onDuoClick,
  isDuoActive,
}: HeaderProps) {
  const [user] = useAuthState(auth);
  const { stats } = useUserStats();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/20 backdrop-blur-xl border-b border-white/5">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          <Mic className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-white/90 uppercase">
            Tajwid AI
          </h1>
          <p className="text-[10px] text-emerald-500/80 font-medium uppercase tracking-widest">
            Mastery Engine
          </p>
        </div>
      </motion.div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          type="button"
          onClick={onDuoClick}
          aria-label="Ouvrir le mode Duo"
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
            isDuoActive
              ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
          }`}
        >
          <Users size={16} />
          <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">
            Mode Duo
          </span>
        </button>

        <button
          type="button"
          onClick={onLangClick}
          aria-label="Changer de langue"
          className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <Languages size={20} />
        </button>

        <button
          type="button"
          aria-label="Ajouter aux favoris"
          className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <Heart size={20} />
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <div
              role="button"
              tabIndex={0}
              onClick={handleLogout}
              className="w-10 h-10 rounded-full border border-white/10 overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all"
              title="Click to sign out"
            >
              <img
                src={user.photoURL || ""}
                alt={user.displayName || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            <Link
              href="/dashboard"
              className="hidden lg:block text-right hover:text-emerald-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                {user.displayName}
              </p>
              <p className="text-[8px] text-emerald-500 uppercase font-medium">
                {stats?.totalVersesMastered || 0} Verses •{" "}
                {stats?.totalWordsMastered || 0} Words
              </p>
            </Link>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="px-4 py-2 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-105"
          >
            Sign In
          </button>
        )}

        <div
          role="button"
          tabIndex={0}
          aria-label="Paramètres"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors ml-2"
        >
          <Settings size={20} className="text-zinc-400" />
        </div>
      </div>
    </header>
  );
}
