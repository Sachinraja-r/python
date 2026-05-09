'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Lightbulb, CheckCircle2, XCircle, Lock } from 'lucide-react';
import api from '@/lib/api';
import { Level, UserProgress } from '@/types';

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
  medium: { label: 'Medium', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',     dot: 'bg-amber-400'   },
  hard:   { label: 'Hard',   color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30',       dot: 'bg-rose-400'    },
};

export default function LevelPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const levelId = parseInt(params.id);

  const [level, setLevel] = useState<Level | null>(null);
  const [moduleLevels, setModuleLevels] = useState<Level[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);

  useEffect(() => {
    async function initLevel() {
      try {
        const [levelsRes, progRes] = await Promise.all([
          api.get('/levels'),
          api.get('/user/guest/progress'),
        ]);
        const levels = levelsRes.data as Level[];
        const prog = progRes.data as UserProgress[];
        setProgress(prog);

        const current = levels.find(l => l.id === levelId);
        if (current) {
          setLevel(current);
          setCode(current.starter_code);
          // Levels in same module (or gate stands alone)
          const siblings = current.is_gate
            ? [current]
            : levels.filter(l => l.module_id === current.module_id && !l.is_gate);
          setModuleLevels(siblings);

          await api.post('/levels/start', { user_id: 'guest', level_id: levelId });
        }
      } catch (err) {
        console.error('Failed to load level', err);
      }
    }
    initLevel();
    // Reset hint state on level change
    setShowHint(false);
    setHintIndex(0);
    setOutput('');
    setStatus('idle');
  }, [levelId]);

  const handleRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setStatus('idle');
    setOutput('Running…');
    try {
      const res = await api.post('/submissions', { user_id: 'guest', level_id: levelId, code });
      if (res.data.passed) {
        setStatus('success');
        setOutput('All tests passed! 🎉');
        
        // Award XP if first time passing
        const isAlreadyDone = progress.find(p => p.level_id === levelId)?.status === 'completed';
        if (!isAlreadyDone) {
          let xpGained = 0;
          if (level?.is_gate) xpGained = 100;
          else if (level?.difficulty === 'easy') xpGained = 10;
          else if (level?.difficulty === 'medium') xpGained = 20;
          else if (level?.difficulty === 'hard') xpGained = 30;
          
          if (xpGained > 0) {
            const currentXp = parseInt(localStorage.getItem('xp_total') || '0');
            localStorage.setItem('xp_total', (currentXp + xpGained).toString());
            setEarnedXp(xpGained);
          }
        }

        setTimeout(() => {
          if (res.data.next_level_id) {
            router.push(`/learn/level/${res.data.next_level_id}`);
          } else if (level?.is_gate) {
            router.push('/learn/career-choice');
          } else {
            router.push('/learn');
          }
        }, 1500);
      } else {
        setStatus('error');
        setOutput(res.data.message || 'Test failed.');
      }
    } catch (err: any) {
      setStatus('error');
      setOutput(err.response?.data?.detail || 'An error occurred.');
    } finally {
      setRunning(false);
    }
  };

  if (!level) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          Loading level…
        </div>
      </div>
    );
  }

  const isGate = level.is_gate;
  const diff = DIFFICULTY_CONFIG[level.difficulty] ?? DIFFICULTY_CONFIG.easy;
  const accentBase = isGate ? 'amber' : 'indigo';

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200 font-sans overflow-hidden">

      {/* ── TOP NAV ─────────────────────────────────────────── */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/learn" className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={`font-semibold truncate text-sm ${isGate ? 'text-amber-400' : 'text-slate-200'}`}>
                {level.title}
              </h1>
              {!isGate && (
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${diff.bg} ${diff.color}`}>
                  {diff.label}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isGate
                ? 'Gate Challenge'
                : moduleLevels.length > 0
                  ? `Level ${moduleLevels.findIndex(l => l.id === levelId) + 1} of ${moduleLevels.length}`
                  : `#${level.order_index}`}
            </p>
          </div>
        </div>

        {/* Level mini-map: dots for each level in this module */}
        {!isGate && moduleLevels.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 mx-4">
            {moduleLevels.map(l => {
              const lp = progress.find(p => p.level_id === l.id);
              const isCurrent = l.id === levelId;
              const isDone = lp?.status === 'completed';
              const isLocked = lp?.status === 'locked';
              const ldiff = DIFFICULTY_CONFIG[l.difficulty] ?? DIFFICULTY_CONFIG.easy;
              return (
                <Link key={l.id} href={`/learn/level/${l.id}`} title={l.title}>
                  <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isCurrent ? `${ldiff.dot} ring-2 ring-offset-1 ring-offset-slate-900 ring-white/50 scale-125` :
                    isDone    ? 'bg-emerald-500' :
                    isLocked  ? 'bg-slate-700' :
                    ldiff.dot + ' opacity-60'
                  }`} />
                </Link>
              );
            })}
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={running}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            running
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isGate
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_0_12px_rgba(217,119,6,0.4)]'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]'
          }`}
        >
          {running
            ? <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
            : <Play className="w-3.5 h-3.5" />}
          {running ? 'Running…' : 'Run Code'}
        </button>
      </header>

      {/* ── WORKSPACE ────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Instructions */}
        <div className="w-80 shrink-0 border-r border-slate-800 flex flex-col bg-slate-900/20 overflow-y-auto">
          <div className="p-5 flex-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Instructions</p>
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">{level.description}</p>

            {/* Hints */}
            {level.hints && level.hints.length > 0 && !isGate && (
              <div className="mt-8">
                <button
                  onClick={() => { setShowHint(!showHint); setHintIndex(0); }}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  {showHint ? 'Hide Hint' : 'Stuck? Show Hint'}
                </button>

                {showHint && (
                  <div className="mt-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm space-y-1.5">
                    <p>💡 {level.hints[hintIndex]}</p>
                    {level.hints.length > 1 && (
                      <button
                        onClick={() => setHintIndex(i => Math.min(i + 1, level.hints.length - 1))}
                        disabled={hintIndex >= level.hints.length - 1}
                        className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 mt-1"
                      >
                        {hintIndex < level.hints.length - 1 ? 'Next hint →' : 'No more hints'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {isGate && (
              <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                🏆 Gate challenge — hidden tests only. No hints provided.
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor + Console */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={val => setCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 20 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                fontFamily: 'JetBrains Mono, Consolas, monospace',
                lineNumbers: 'on',
                renderLineHighlight: 'gutter',
              }}
            />
          </div>

          {/* Output Console */}
          <div className="h-52 border-t border-slate-800 bg-[#0d1117] flex flex-col shrink-0">
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Output</span>
              <div className="flex items-center gap-2">
                {status === 'success' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> All tests passed
                  </span>
                )}
                {status === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                    <XCircle className="w-3 h-3" /> Failed
                  </span>
                )}
              </div>
            </div>
            <div className={`flex-1 p-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap ${
              status === 'error'   ? 'text-rose-400' :
              status === 'success' ? 'text-emerald-400' :
              'text-slate-300'
            }`}>
              {output || <span className="text-slate-600">Click Run Code to see output…</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {status === 'success' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 px-8 py-3 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 animate-bounce z-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Level Complete! Moving on…</span>
          </div>
          {earnedXp > 0 && <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full shadow-inner shadow-black/10">✨ +{earnedXp} XP</span>}
        </div>
      )}
    </div>
  );
}
