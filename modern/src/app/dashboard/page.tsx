"use client";

import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useUserStats } from "@/hooks/useUserStats";
import Header from "@/components/Header";
import {
  Book,
  Award,
  Zap,
  TrendingUp,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DashboardPage() {
  const [user] = useAuthState(auth);
  const { stats, loading } = useUserStats();
  const [activeTab, setActiveTab] = useState<"overview" | "history">(
    "overview",
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Accès réservé</h1>
        <p className="text-zinc-500 mb-8 max-w-md">
          Connectez-vous pour voir votre progression et vos statistiques
          détaillées.
        </p>
        <Link
          href="/"
          className="px-8 py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const statCards = [
    {
      label: "Versets Maîtrisés",
      value: stats?.totalVersesMastered || 0,
      icon: <Book className="text-emerald-500" />,
      color: "emerald",
    },
    {
      label: "Mots Appris",
      value: stats?.totalWordsMastered || 0,
      icon: <Zap className="text-blue-500" />,
      color: "blue",
    },
    {
      label: "Série (Days)",
      value: stats?.streak || 0,
      icon: <TrendingUp className="text-orange-500" />,
      color: "orange",
    },
    {
      label: "Niveau Tajwid",
      value: "Apprenti",
      icon: <Award className="text-purple-500" />,
      color: "purple",
    },
  ];

  return (
    <main className="min-h-screen pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
      <Header
        onLangClick={() => {}}
        onDuoClick={() => {}}
        isDuoActive={false}
      />

      {/* Mesh Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-bold uppercase tracking-widest">
            Retour à la pratique
          </span>
        </Link>

        {/* User Hero */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 rounded-[40px] border-4 border-white/5 p-1 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 blur-xl opacity-20" />
            <img
              src={user.photoURL || ""}
              alt={user.displayName || ""}
              className="w-full h-full object-cover rounded-[36px] relative z-10"
            />
          </motion.div>
          <div className="text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold text-white mb-2 tracking-tight"
            >
              Salam, {user.displayName?.split(" ")[0]}
            </motion.h1>
            <p className="text-zinc-500 text-lg">
              Votre voyage de maîtrise du Tajwid progresse admirablement.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass rounded-[32px] p-8 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                  {stat.icon}
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                {stat.label}
              </div>
              <div
                className={`absolute bottom-0 left-0 w-full h-1 bg-${stat.color}-500/50 blur-sm opacity-0 group-hover:opacity-100 transition-opacity`}
              />
            </motion.div>
          ))}
        </div>

        {/* Tabs Content */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "overview" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
          >
            Maîtrise
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "history" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
          >
            Historique
          </button>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-[400px]"
        >
          {activeTab === "overview" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass rounded-[40px] p-10">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500" />
                  Derniers Versets Maîtrisés
                </h3>
                {stats?.masteredVerses && stats.masteredVerses.length > 0 ? (
                  <div className="space-y-4">
                    {stats.masteredVerses.map((ref, idx) => (
                      <div
                        key={ref}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">
                            {stats.masteredVerses.length - idx}
                          </span>
                          <span className="text-lg font-bold text-white/90">
                            Ayah {ref}
                          </span>
                        </div>
                        <Link
                          href={`/?ref=${ref}`}
                          className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-emerald-500 transition-colors"
                        >
                          Réviser
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                    <p className="text-zinc-500">
                      Aucun verset maîtrisé pour le moment. Commencez votre
                      première récitation !
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                <div className="glass rounded-[40px] p-10 flex-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp size={120} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Activité Hebdomadaire
                  </h3>
                  <p className="text-zinc-500 text-sm mb-8">
                    Votre régularité s'améliore de 12% cette semaine.
                  </p>
                  <div className="flex items-end gap-3 h-32 mt-4 px-2">
                    {[35, 65, 45, 90, 20, 0, 0].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div
                          className={`w-full rounded-t-lg transition-all duration-1000 ${i === 3 ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/10"}`}
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[10px] text-zinc-600 font-bold uppercase">
                          L M M J V S D
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-500 rounded-[40px] p-10 flex items-center justify-between text-black group hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all cursor-pointer">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      Continuer la pratique
                    </h3>
                    <p className="text-black/60 text-sm font-medium">
                      Prochaine étape : Surah Al-Ikhlas (112:1)
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap size={24} fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-[40px] p-10 text-center py-40">
              <p className="text-zinc-500 italic">
                Historique détaillé en cours de synchronisation...
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
