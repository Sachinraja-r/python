'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  BarChart2,
  Settings2,
  ChevronRight,
  CheckCircle2,
  Database,
  FileText,
  TrendingUp,
  GitBranch,
} from 'lucide-react';

const TRACKS = [
  {
    id: 'analyst',
    icon: BarChart2,
    emoji: '📊',
    title: 'Data Analyst',
    tagline: 'Turn raw data into clear insights',
    description:
      'Explore, clean, and visualise datasets. Learn to find patterns, draw conclusions, and present findings with charts and statistics.',
    tools: ['pandas', 'matplotlib', 'NumPy', 'statistics', 'EDA'],
    modules: [
      { icon: FileText,   label: 'Lists & Dicts'          },
      { icon: TrendingUp, label: 'Pandas & NumPy'         },
      { icon: BarChart2,  label: 'Data Visualisation'     },
      { icon: CheckCircle2, label: 'EDA Final Project'    },
    ],
    from: 'from-indigo-600',
    to:   'to-violet-600',
    ring: 'ring-indigo-500/40',
    glow: 'shadow-indigo-500/25',
    tag:  'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    btn:  'from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/30',
  },
  {
    id: 'engineer',
    icon: Settings2,
    emoji: '⚙️',
    title: 'Data Engineer',
    tagline: 'Build robust data pipelines',
    description:
      'Process, store, and move data at scale. Learn to work with files, databases, JSON, and build real ETL pipelines.',
    tools: ['file I/O', 'SQL · sqlite3', 'JSON', 'ETL', 'pipelines'],
    modules: [
      { icon: FileText,    label: 'File & JSON I/O'      },
      { icon: Database,    label: 'SQLite with Python'   },
      { icon: GitBranch,   label: 'Data Pipelines'       },
      { icon: CheckCircle2, label: 'ETL Final Project'   },
    ],
    from: 'from-cyan-600',
    to:   'to-teal-600',
    ring: 'ring-cyan-500/40',
    glow: 'shadow-cyan-500/25',
    tag:  'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    btn:  'from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-cyan-500/30',
  },
];

export default function CareerChoicePage() {
  const router = useRouter();
  const [choosing, setChoosing] = useState<string | null>(null);
  const [stars, setStars] = useState<{ x: number; y: number; size: number; delay: number }[]>([]);

  // Generate sparkle particles on mount (client only)
  useEffect(() => {
    setStars(
      Array.from({ length: 24 }, () => ({
        x:     Math.random() * 100,
        y:     Math.random() * 100,
        size:  Math.random() * 4 + 2,
        delay: Math.random() * 2,
      }))
    );
  }, []);

  const handleChoose = async (track: string) => {
    if (choosing) return;
    setChoosing(track);
    try {
      await api.post('/user/guest/career-path', { path: track });
      localStorage.setItem('career_path', track);
      router.push(`/learn/path/${track}`);
    } catch {
      setChoosing(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden font-sans">

      {/* ── Animated background ───────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        {stars.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${s.x}%`,
              top:  `${s.y}%`,
              width:  `${s.size}px`,
              height: `${s.size}px`,
              opacity: 0.15,
              animationDelay: `${s.delay}s`,
              animationDuration: `${2 + s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="relative z-10 text-center mb-12 space-y-3">
        <div className="text-5xl mb-4 animate-bounce">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
          Python Fundamentals Complete!
        </h1>
        <p className="text-slate-400 text-lg max-w-lg mx-auto">
          You&apos;ve mastered the core. Now choose your specialisation track.
        </p>

        {/* Confetti-style badge row */}
        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          {['Variables ✓', 'Output ✓', 'Data Types ✓', 'Input ✓', 'Conditionals ✓', 'Loops ✓', 'Gate 🏆'].map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Track cards ────────────────────────────────────── */}
      <div className="relative z-10 grid sm:grid-cols-2 gap-6 w-full max-w-3xl">
        {TRACKS.map(track => {
          const Icon = track.icon;
          const isLoading = choosing === track.id;

          return (
            <div
              key={track.id}
              className={`relative group rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-7 flex flex-col gap-5
                transition-all duration-300 hover:border-slate-600 hover:shadow-2xl ${track.glow}
                ring-0 hover:ring-1 ${track.ring}`}
            >
              {/* Card accent top bar */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r ${track.from} ${track.to} opacity-0 group-hover:opacity-100 transition-opacity`} />

              {/* Icon + title */}
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${track.from} ${track.to} shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">{track.emoji} Track</p>
                  <h2 className="text-xl font-bold text-slate-100">{track.title}</h2>
                  <p className="text-sm text-slate-400">{track.tagline}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-400 leading-relaxed">{track.description}</p>

              {/* Module previews */}
              <div className="grid grid-cols-2 gap-2">
                {track.modules.map(m => {
                  const MIcon = m.icon;
                  return (
                    <div key={m.label} className="flex items-center gap-2 text-xs text-slate-400">
                      <MIcon className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                      <span>{m.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Tool tags */}
              <div className="flex flex-wrap gap-1.5">
                {track.tools.map(t => (
                  <span key={t} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${track.tag}`}>
                    {t}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleChoose(track.id)}
                disabled={!!choosing}
                className={`mt-auto flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl
                  text-white font-semibold text-sm transition-all shadow-lg
                  bg-gradient-to-r ${track.btn}
                  disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Choose {track.title}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="relative z-10 mt-8 text-xs text-slate-600">
        You can switch tracks later from your dashboard.
      </p>
    </div>
  );
}
