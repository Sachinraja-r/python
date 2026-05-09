'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { Module } from '@/types';

export default function TheoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const moduleId = parseInt(params.id);
  const [moduleData, setModuleData] = useState<Module | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    async function loadTheory() {
      try {
        const modRes = await api.get('/modules');
        const mod = (modRes.data as Module[]).find(m => m.id === moduleId);
        if (mod) {
          setModuleData(mod);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadTheory();
  }, [moduleId]);

  if (!moduleData) {
    return <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading theory...</div>;
  }

  const handleStartPracticing = () => {
    localStorage.setItem(`theory_read_${moduleId}`, 'true');
    router.push('/learn');
  };

  const activeExample = moduleData.theory?.examples?.[activeTab];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex items-center gap-4">
          <Link href="/learn" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Module {moduleData.order_index}: {moduleData.name}
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Theory & Examples
            </p>
          </div>
        </header>

        <div className="space-y-8">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-slate-200">What are we learning?</h2>
            <p className="text-lg leading-relaxed text-slate-300">
              {moduleData.theory?.explanation}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="flex border-b border-slate-800">
              {moduleData.theory?.examples?.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                    activeTab === idx 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {ex.label} Example
                </button>
              ))}
            </div>
            
            {activeExample && (
              <div className="p-6">
                <div className="mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Code</span>
                  <pre className="bg-[#0d1117] p-4 rounded-xl overflow-x-auto text-slate-300 font-mono text-sm border border-slate-800">
                    <code>{activeExample.code}</code>
                  </pre>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Output</span>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-sm whitespace-pre-wrap">
                    {activeExample.output}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleStartPracticing}
              className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-lg transition-all hover:scale-105"
            >
              Mark as Read & Practice →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
