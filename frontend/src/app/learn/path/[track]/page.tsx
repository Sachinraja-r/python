'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Lock, PlayCircle, BookOpen, Zap, ArrowLeft, Trophy } from 'lucide-react';
import api from '@/lib/api';
import { Module, Level, UserProgress } from '@/types';

const DIFF_DOT: Record<string, string> = {
  easy:   'bg-emerald-400',
  medium: 'bg-amber-400',
  hard:   'bg-rose-400',
};

export default function TrackPage() {
  const params = useParams();
  const track = (params?.track as string) || 'analyst';
  
  const [modules, setModules]       = useState<Module[]>([]);
  const [levels, setLevels]         = useState<Level[]>([]);
  const [progress, setProgress]     = useState<UserProgress[]>([]);
  const [loading, setLoading]       = useState(true);
  const [readTheories, setReadTheories] = useState<Record<number, boolean>>({});
  const [xpTotal, setXpTotal] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [modsRes, levelsRes, progRes] = await Promise.all([
          api.get(`/modules?track=${track}`),
          api.get('/levels'),
          api.get('/user/guest/progress'),
        ]);
        setModules(modsRes.data);
        setLevels(levelsRes.data);
        setProgress(progRes.data);
        const readStates: Record<number, boolean> = {};
        modsRes.data.forEach((m: Module) => {
          readStates[m.id] = localStorage.getItem(`theory_read_${m.id}`) === 'true';
        });
        setReadTheories(readStates);
        setXpTotal(parseInt(localStorage.getItem('xp_total') || '0'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [track]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p>Loading {track} track...</p>
        </div>
      </div>
    );
  }

  const isAnalyst = track === 'analyst';
  const trackName = isAnalyst ? 'Data Analyst' : 'Data Engineer';
  const headerGradient = isAnalyst 
    ? 'from-indigo-400 via-purple-400 to-pink-400' 
    : 'from-cyan-400 via-teal-400 to-emerald-400';
  
  const theme = isAnalyst ? {
    text: 'text-indigo-400',
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-500/10',
    border: 'border-indigo-500/40',
    borderLight: 'border-indigo-500/20',
    borderHover: 'hover:border-indigo-400',
    button: 'bg-indigo-600 hover:bg-indigo-500',
    ring: 'ring-indigo-400',
    shadowGate: 'shadow-[0_0_30px_rgba(0,0,0,0.15)] bg-indigo-900/20 border-indigo-500/50',
    shadowGateActive: 'shadow-[0_0_30px_rgba(0,0,0,0.2)] bg-slate-900 border-indigo-500'
  } : {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500',
    bgLight: 'bg-cyan-500/10',
    border: 'border-cyan-500/40',
    borderLight: 'border-cyan-500/20',
    borderHover: 'hover:border-cyan-400',
    button: 'bg-cyan-600 hover:bg-cyan-500',
    ring: 'ring-cyan-400',
    shadowGate: 'shadow-[0_0_30px_rgba(0,0,0,0.15)] bg-cyan-900/20 border-cyan-500/50',
    shadowGateActive: 'shadow-[0_0_30px_rgba(0,0,0,0.2)] bg-slate-900 border-cyan-500'
  };

  // Gate levels have module_id=null; the "Final Project" module has no linked levels
  const regularModules = modules.filter(m =>
    levels.some(l => l.module_id === m.id && !l.is_gate)
  );
  const gateModule = modules.find(m =>
    !levels.some(l => l.module_id === m.id)
  ) ?? modules[modules.length - 1];

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
            : `bg-slate-900 ${theme.border} shadow-[0_0_18px_rgba(99,102,241,0.08)] ${theme.borderHover}`
      }`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {isLocked
              ? <Lock className="w-4 h-4 text-slate-600 shrink-0" />
              : isDone
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                : <PlayCircle className={`w-4 h-4 ${theme.text} shrink-0`} />}
            <h2 className="text-sm font-semibold text-slate-200">
              {mod.order_index}: {mod.name}
            </h2>
          </div>
          <span className={`text-xs font-medium ${isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
            {completed}/{total}
          </span>
        </div>

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
                  isCurr  ? `${DIFF_DOT[l.difficulty] ?? theme.bg} ring-1 ring-white/30` :
                  lp?.status === 'locked' ? 'bg-slate-700' :
                  `${DIFF_DOT[l.difficulty] ?? theme.bg} opacity-50`
                }`}
              />
            );
          })}
        </div>

        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : theme.bg}`}
            style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
          />
        </div>

        {!isLocked && (
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/learn/module/${mod.id}/theory`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                readTheories[mod.id]
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
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
                  : `${theme.button} text-white`
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

  // Gate Module (Final Project) — gate levels have module_id=null
  // Analyst levels: IDs 100–199, Engineer levels: IDs 200–299
  const trackIdMin = track === 'analyst' ? 100 : 200;
  const trackIdMax = track === 'analyst' ? 199 : 299;
  const gateLevel = levels.find(l =>
    l.is_gate && l.id >= trackIdMin && l.id <= trackIdMax
  ) ?? null;
  const gateProgress = gateLevel ? progress.find(p => p.level_id === gateLevel.id) : null;
  const gateUnlocked = gateProgress?.status !== 'locked';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-8">
          <Link href="/learn" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Core Path
          </Link>
        </div>

        <header className="mb-10 flex justify-between items-start">
          <div>
            <h1 className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${headerGradient}`}>
              {trackName} Track
            </h1>
            <p className="text-slate-400 mt-2 text-sm flex items-center gap-3">
              <span>Specialized curriculum to master {trackName.toLowerCase()} skills.</span>
              <span className={`flex items-center gap-1 ${theme.text} ${theme.bgLight} px-2 py-0.5 rounded-full font-medium shadow-sm border ${theme.borderLight}`}>
                <Zap className="w-3.5 h-3.5" /> {xpTotal} XP
              </span>
            </p>
          </div>
        </header>

        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {regularModules.map(mod => <ModuleCard key={mod.id} mod={mod} />)}
          </div>
        </section>

        {gateLevel && (
          <div className={`my-8 p-6 rounded-2xl border-2 text-center transition-all duration-500 ${
            !gateUnlocked
              ? 'bg-slate-900/40 border-slate-800 opacity-50'
              : gateProgress?.status === 'completed'
                ? theme.shadowGate
                : `${theme.shadowGateActive} scale-[1.01]`
          }`}>
            <Trophy className={`w-10 h-10 mx-auto mb-3 ${!gateUnlocked ? 'text-slate-600' : theme.text}`} />
            <h2 className={`text-xl font-bold mb-1 ${!gateUnlocked ? 'text-slate-500' : theme.text}`}>
              Final Project: {gateModule?.name}
            </h2>
            <p className="text-slate-400 text-sm mb-5">
              Complete the track by passing the final real-world scenario.
            </p>
            {gateUnlocked ? (
              <Link
                href={`/learn/level/${gateLevel.id}`}
                className={`inline-block px-7 py-2.5 rounded-xl font-bold ${theme.button} text-white shadow-lg transition-all hover:scale-105 text-sm`}
              >
                {gateProgress?.status === 'completed' ? '✅ Review Submission' : '⚡ Start Project'}
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-800 text-slate-500 text-sm cursor-not-allowed">
                <Lock className="w-4 h-4" /> Complete all track modules first
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
