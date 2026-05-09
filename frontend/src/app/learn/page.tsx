'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock, PlayCircle, Trophy, BookOpen, Zap } from 'lucide-react';
import api from '@/lib/api';
import { Module, Level, UserProgress } from '@/types';

const DIFF_DOT: Record<string, string> = {
  easy:   'bg-emerald-400',
  medium: 'bg-amber-400',
  hard:   'bg-rose-400',
};

export default function LearnPage() {
  const [modules, setModules]       = useState<Module[]>([]);
  const [levels, setLevels]         = useState<Level[]>([]);
  const [progress, setProgress]     = useState<UserProgress[]>([]);
  const [loading, setLoading]       = useState(true);
  const [readTheories, setReadTheories] = useState<Record<number, boolean>>({});
  const [careerPath, setCareerPath] = useState<string | null>(null);
  const [xpTotal, setXpTotal] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const localPath = localStorage.getItem('career_path');
        setXpTotal(parseInt(localStorage.getItem('xp_total') || '0'));
        const [modsRes, levelsRes, progRes, pathRes] = await Promise.all([
          api.get('/modules'),
          api.get('/levels'),
          api.get('/user/guest/progress'),
          api.get('/user/guest/career-path').catch(() => ({ data: { career_path: null } }))
        ]);
        
        const fetchedPath = pathRes?.data?.career_path || localPath;
        if (fetchedPath && fetchedPath !== localPath) {
          localStorage.setItem('career_path', fetchedPath);
        }
        setCareerPath(fetchedPath);
        setModules(modsRes.data);
        setLevels(levelsRes.data);
        setProgress(progRes.data);
        const readStates: Record<number, boolean> = {};
        modsRes.data.forEach((m: Module) => {
          readStates[m.id] = localStorage.getItem(`theory_read_${m.id}`) === 'true';
        });
        setReadTheories(readStates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p>Loading your learning path…</p>
        </div>
      </div>
    );
  }

  const gateLevel    = levels.find(l => l.is_gate);
  const gateProgress = progress.find(p => p.level_id === gateLevel?.id);
  const gateUnlocked = gateProgress?.status !== 'locked';

  // Only show core-track modules on the main dashboard
  const coreModules   = modules.filter(m => m.track === 'core' && m.order_index <= 8);
  const bridgeModules = modules.filter(m => m.track === 'core' && m.order_index >= 9);

  function ModuleCard({ mod }: { mod: Module }) {
    const modLevels = levels.filter(l => l.module_id === mod.id && !l.is_gate);
    const modProg   = modLevels.map(l => progress.find(p => p.level_id === l.id));
    const completed = modProg.filter(p => p?.status === 'completed').length;
    const total     = modLevels.length;
    const isDone    = completed === total && total > 0;
    const isLocked  = modProg[0]?.status === 'locked';
    const activeLevel = modProg.find(p =>
      p?.status === 'in_progress' || p?.status === 'unlocked'
    )?.level_id ?? modLevels[0]?.id;

    return (
      <div className={`p-5 rounded-2xl border transition-all duration-300 ${
        isLocked
          ? 'bg-slate-900/40 border-slate-800 opacity-50'
          : isDone
            ? 'bg-slate-900 border-emerald-500/30 shadow-[0_0_18px_rgba(16,185,129,0.08)]'
            : 'bg-slate-900 border-indigo-500/40 shadow-[0_0_18px_rgba(99,102,241,0.08)] hover:border-indigo-400'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {isLocked
              ? <Lock className="w-4 h-4 text-slate-600 shrink-0" />
              : isDone
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                : <PlayCircle className="w-4 h-4 text-indigo-400 shrink-0" />}
            <h2 className="text-sm font-semibold text-slate-200">
              {mod.order_index <= 8 ? 'Core' : 'Bridge'} {mod.order_index}: {mod.name}
            </h2>
          </div>
          <span className={`text-xs font-medium ${isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
            {completed}/{total}
          </span>
        </div>

        {/* Difficulty dot mini-map */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {modLevels.map(l => {
            const lp      = progress.find(p => p.level_id === l.id);
            const isDoneL = lp?.status === 'completed';
            const isCurr  = l.id === activeLevel;
            return (
              <div
                key={l.id}
                title={`${l.title} (${l.difficulty})`}
                className={`w-2 h-2 rounded-full transition-all ${
                  isDoneL ? 'bg-emerald-500' :
                  isCurr  ? `${DIFF_DOT[l.difficulty] ?? 'bg-indigo-400'} ring-1 ring-white/30` :
                  lp?.status === 'locked' ? 'bg-slate-700' :
                  `${DIFF_DOT[l.difficulty] ?? 'bg-indigo-400'} opacity-50`
                }`}
              />
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
            style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
          />
        </div>

        {/* Buttons */}
        {!isLocked && (
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/learn/module/${mod.id}/theory`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                readTheories[mod.id]
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-600/30'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              {readTheories[mod.id] ? 'Review Theory' : 'Learn First'}
            </Link>
            <Link
              href={`/learn/level/${activeLevel}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isDone
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              {isDone ? 'Review' : 'Practice'}
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
              Python Learning Path
            </h1>
            <p className="text-slate-400 mt-2 text-sm flex items-center gap-3">
              <span>70% practice · 30% theory · 67 levels · 3 tracks</span>
              <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium shadow-sm border border-amber-500/20">
                <Zap className="w-3.5 h-3.5" /> {xpTotal} XP
              </span>
            </p>
          </div>
          {careerPath && (
            <Link href={`/learn/path/${careerPath}`} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg">
              Go to Your Track →
            </Link>
          )}
        </header>

        {/* ── CORE MODULES ──────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            📘 Phase 1 — Python Core (8 Modules)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coreModules.map(mod => <ModuleCard key={mod.id} mod={mod} />)}
          </div>
        </section>

        {/* ── GATE CHALLENGE ────────────────────────────── */}
        {gateLevel && (
          <div className={`my-8 p-6 rounded-2xl border-2 text-center transition-all duration-500 ${
            !gateUnlocked
              ? 'bg-slate-900/40 border-slate-800 opacity-50'
              : gateProgress?.status === 'completed'
                ? 'bg-amber-900/20 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                : 'bg-slate-900 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-[1.01]'
          }`}>
            <Trophy className={`w-10 h-10 mx-auto mb-3 ${!gateUnlocked ? 'text-slate-600' : 'text-amber-400'}`} />
            <h2 className={`text-xl font-bold mb-1 ${!gateUnlocked ? 'text-slate-500' : 'text-amber-400'}`}>
              Gate Challenge: Student Report Card
            </h2>
            <p className="text-slate-400 text-sm mb-5">
              Prove your core Python skills with hidden tests.
            </p>
            {gateUnlocked ? (
              <Link
                href={`/learn/level/${gateLevel.id}`}
                className="inline-block px-7 py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg transition-all hover:scale-105 text-sm"
              >
                {gateProgress?.status === 'completed' ? '✅ Review Submission' : '⚡ Enter the Gate'}
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-800 text-slate-500 text-sm cursor-not-allowed">
                <Lock className="w-4 h-4" /> Complete all core modules first
              </div>
            )}
          </div>
        )}

        {/* ── BRIDGE MODULES ────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            🔗 Phase 2 — Bridge Modules (Shared by Both Tracks)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bridgeModules.map(mod => <ModuleCard key={mod.id} mod={mod} />)}
          </div>
        </section>

        {/* ── CAREER PATH CTA ───────────────────────────── */}
        <div className="mt-6 p-6 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 text-center">
          <h2 className="text-lg font-bold text-slate-200 mb-1">Choose Your Specialization</h2>
          <p className="text-slate-400 text-sm mb-4">Complete the bridge modules, then pick your track.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {gateUnlocked ? (
              <>
                <Link href="/learn/path/analyst" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-600/30 transition">
                  📊 Data Analyst
                </Link>
                <Link href="/learn/path/engineer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-600/30 transition">
                  ⚙️ Data Engineer
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-500 text-sm font-medium">
                  <Lock className="w-4 h-4" /> Data Analyst
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-500 text-sm font-medium">
                  <Lock className="w-4 h-4" /> Data Engineer
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-3">Career path chooser unlocks after bridge modules.</p>
        </div>

      </div>
    </div>
  );
}
