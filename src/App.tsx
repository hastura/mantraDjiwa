import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getGuardianResponse } from './services/guardianService';
import { useSpaceWarp } from './hooks/useSpaceWarp';
import { useCustomCursor } from './hooks/useCustomCursor';
import { RitualStep } from './components/RitualStep';

import { RITUAL_ANCHORS, EMOTIONS, EMOTION_RESPONSES, PHASE_ANCHORS } from './constants';

export default function App() {
  const [step, setStep] = useState(0); 
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Custom Hooks for engine and input
  const { cursorRef, mouse } = useCustomCursor();
  const mountRef = useSpaceWarp(step, mouse);

  // Flow States
  const [selectedLights, setSelectedLights] = useState<Set<string>>(new Set());
  const [selectedAnchors, setSelectedAnchors] = useState<Set<string>>(new Set());
  const [selectedEmotion, setSelectedEmotion] = useState<{n: string, p: string} | null>(null);
  const [loopStep, setLoopStep] = useState(0); 
  const [memText, setMemText] = useState("");
  const [feelText, setFeelText] = useState("");
  const [refText, setRefText] = useState("");
  const [guardianText, setGuardianText] = useState<string | null>(null);
  const [isGeneratingGuardian, setIsGeneratingGuardian] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const transitionToStep = (nextStep: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
    }, 800);
  };

  const toggleLight = (key: string) => {
    const next = new Set(selectedLights);
    if (next.has(key)) next.delete(key);
    else if (next.size < 5) next.add(key);
    setSelectedLights(next);
  };

  const toggleAnchor = (key: string) => {
    const next = new Set(selectedAnchors);
    if (next.has(key)) next.delete(key);
    else if (next.size < 3) next.add(key);
    setSelectedAnchors(next);
  };

  const fetchGuardianResponse = async () => {
    if (!selectedEmotion) return;
    setIsGeneratingGuardian(true);
    try {
      const response = await getGuardianResponse(feelText, selectedEmotion.n, selectedEmotion.p);
      setGuardianText(response);
    } catch (e) {
      setGuardianText("Keheningan menyelimuti ruang ini. Namun, cahaya di dalam dirimu tetap bersinar.");
    }
    setIsGeneratingGuardian(false);
  };

  return (
    <div className="font-sans min-h-screen bg-dark-bg text-cream overflow-hidden relative flex flex-col items-center cursor-none">
      
      {/* 3D Engine & Cursor */}
      <div className="space-vignette" />
      <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-auto" />
      <div ref={cursorRef} className="custom-cursor" />

      {/* Transition Curtain */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }}
            style={{ originY: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} 
            className="fixed inset-0 bg-[#08080A] z-[9999] pointer-events-none" 
          />
        )}
      </AnimatePresence>

      {/* Pause Button */}
      {step >= 2 && step <= 5 && !isPaused && (
        <button 
          onClick={() => setIsPaused(true)}
          className="fixed top-8 right-8 z-[200] text-cream/50 hover:text-white uppercase tracking-[0.2em] text-[10px] transition-colors cursor-none px-4 py-2 border border-transparent hover:border-white/20 rounded-full pointer-events-auto"
        >
          Pause Room
        </button>
      )}

      {/* Paused State Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[10000] bg-dark-bg flex flex-col items-center justify-center pointer-events-auto cursor-none"
          >
            <div className="text-center">
              <p className="font-display text-3xl font-light mb-8 italic">Breathe. You can return whenever you are ready.</p>
              <button onClick={() => setIsPaused(false)} className="btn-ritual">
                Return to Room
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="z-10 flex flex-col w-full min-h-screen relative pointer-events-none items-center justify-center">
        
        {/* ── LANDING (STEP 0) ── */}
        <RitualStep step={0} currentStep={step} className="text-center">
          <div className="w-full max-w-2xl pointer-events-auto flex flex-col items-center">
            <p className="tracking-[0.5em] text-[0.7rem] mb-4 uppercase text-gold font-light">MANTRA DJIWA PRESENTS</p>
            <h1 className="font-display text-5xl sm:text-7xl font-light tracking-[0.1em] mb-6 gold-gradient-text text-glow leading-tight">
              The Art of <br/> Remembering
            </h1>
            <p className="text-base text-cream/60 mb-10 font-light leading-relaxed max-w-md mx-auto">
              Sebuah ruang suci untuk memanggil kembali pendaran cahaya yang membentuk jiwamu hari ini.
            </p>
            <button onClick={() => transitionToStep(1)} className="btn-ritual">
              Mulai Ritual
            </button>
          </div>
        </RitualStep>

        {/* ── SELECTION (STEP 1) ── */}
        <RitualStep step={1} currentStep={step} className="text-center">
          <div className="w-full max-w-2xl pointer-events-auto">
            <h1 className="font-display text-4xl font-light mb-2 gold-gradient-text">Pilih Cahaya Utamamu</h1>
            <p className="font-display italic text-lg text-cream/60 mb-10">Pilih pendaran mana saja yang membentuk dirimu (3 - 5)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {[ {k:'mother', i:'🌕'}, {k:'father', i:'🌑'}, {k:'sibling', i:'✨'}, {k:'friend', i:'🌿'}, {k:'mentor', i:'🪐'}, {k:'rival', i:'🔺'}, {k:'stranger', i:'🌫'}, {k:'self', i:'☀'} ].map(l => (
                <div 
                  key={l.k} 
                  onClick={() => toggleLight(l.k)} 
                  className={`flex flex-col items-center justify-center p-6 border rounded-2xl transition-all duration-300 cursor-none glass-panel ${selectedLights.has(l.k) ? 'glass-panel-active' : 'hover:bg-white/10'}`}
                >
                  <span className="text-4xl mb-2">{l.i}</span>
                </div>
              ))}
            </div>
            <button onClick={() => transitionToStep(2)} disabled={selectedLights.size < 3} className="btn-ritual">
              Simpan Konstelasi
            </button>
          </div>
        </RitualStep>

        {/* ── MIRROR (STEP 2) ── */}
        <RitualStep step={2} currentStep={step} className="text-center">
          <div className="w-full max-w-3xl pointer-events-auto flex flex-col items-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5 }}>
              <h1 className="font-display text-5xl font-light mb-8 gold-gradient-text leading-tight">These are the lights <br/> you chose.</h1>
              <p className="font-display italic text-2xl text-cream/80 mb-12">...And they chose you.</p>
            </motion.div>
            <button onClick={() => transitionToStep(3)} className="btn-ritual">
              Lanjutkan
            </button>
          </div>
        </RitualStep>

        {/* ── ANCHORS (STEP 3) ── */}
        <RitualStep step={3} currentStep={step} className="text-center">
          <div className="w-full max-w-3xl pointer-events-auto">
            <h1 className="font-display text-4xl font-light mb-2 gold-gradient-text">Ritual Penjangkaran</h1>
            <p className="font-display italic text-lg text-cream/60 mb-10">Pilih jangkar yang akan menemanimu (Pilih 2)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-12">
              {RITUAL_ANCHORS.map(a => (
                <div 
                  key={a.k} 
                  onClick={() => toggleAnchor(a.k)} 
                  className={`p-8 border rounded-3xl transition-all duration-500 glass-panel cursor-none ${selectedAnchors.has(a.k) ? 'glass-panel-active' : 'hover:bg-white/10'}`}
                >
                  <div className="text-4xl mb-3">{a.i}</div>
                  <div className="text-[10px] uppercase tracking-[0.3em] opacity-50 font-bold">{a.n}</div>
                </div>
              ))}
            </div>
            <button onClick={() => transitionToStep(4)} disabled={selectedAnchors.size < 2} className="btn-ritual">
              Masuk ke Kedalaman
            </button>
          </div>
        </RitualStep>

        {/* ── EMOTION (STEP 4) ── */}
        <RitualStep step={4} currentStep={step} className="text-center">
          <div className="w-full max-w-3xl pointer-events-auto">
            <AnimatePresence mode="wait">
              {loopStep === 0 && (
                <motion.div key="e-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="font-display text-4xl font-light mb-10 gold-gradient-text">Kenali Getaran Hatimu</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-12">
                    {EMOTIONS.map(e => (
                      <button 
                        key={e.n} 
                        onClick={() => { setSelectedEmotion(e); setLoopStep(1); }} 
                        className="p-4 border border-white/10 rounded-2xl glass-panel hover:border-gold hover:bg-gold/10 text-[10px] uppercase tracking-widest transition-all cursor-none"
                      >
                        {e.n}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              {loopStep === 1 && selectedEmotion && (
                <motion.div key="e-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                  <p className="font-display text-3xl mb-4 italic text-gold">{EMOTION_RESPONSES[selectedEmotion.n].text}</p>
                  <p className="font-display text-xl mb-8 text-cream/70">{EMOTION_RESPONSES[selectedEmotion.n].q}</p>
                  <textarea 
                    value={feelText} onChange={(e) => setFeelText(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-cream font-sans text-base focus:border-gold/50 outline-none mb-10 min-h-[180px] transition-all resize-none cursor-none backdrop-blur-md"
                    placeholder="Tuliskan di sini..."
                  />
                  <div className="flex gap-6 justify-center">
                    <button onClick={() => setLoopStep(0)} className="btn-ritual">
                      Kembali
                    </button>
                    <button 
                      onClick={() => { fetchGuardianResponse(); transitionToStep(5); }} 
                      disabled={!feelText.trim()} 
                      className="btn-ritual btn-primary"
                    >
                      Kirim ke Guardian
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </RitualStep>

        {/* ── GUARDIAN (STEP 5) ── */}
        <RitualStep step={5} currentStep={step} className="text-center">
          <div className="w-full max-w-2xl pointer-events-auto">
            <h2 className="tracking-[0.5em] text-[0.7rem] mb-16 uppercase text-gold/60 font-light">Guardian Echo</h2>
            <div className="min-h-[250px] flex items-center justify-center mb-16 relative">
              <AnimatePresence mode="wait">
                {isGeneratingGuardian ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                    <div className="w-16 h-16 border-2 border-gold/20 border-t-gold rounded-full animate-spin mb-6" />
                    <p className="text-[10px] uppercase tracking-[0.4em] opacity-50">Menerjemahkan pendaran...</p>
                  </motion.div>
                ) : (
                  <motion.div key="resp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                    <p className="font-display text-3xl font-light leading-relaxed italic text-cream/90 text-glow">{guardianText}</p>
                    <div className="w-20 h-[1px] bg-gold/30 mx-auto" />
                    <p className="font-display text-xl text-cream/60 italic">{selectedEmotion ? PHASE_ANCHORS[selectedEmotion.p] : ""}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isGeneratingGuardian && (
              <button onClick={() => transitionToStep(6)} className="btn-ritual btn-primary">
                Selesaikan Ritual
              </button>
            )}
          </div>
        </RitualStep>

        {/* ── FINAL (STEP 6) ── */}
        <RitualStep step={6} currentStep={step} className="text-center">
          <div className="w-full max-w-2xl pointer-events-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}>
              <h1 className="font-display text-6xl font-light mb-6 gold-gradient-text">You have returned.</h1>
              <p className="font-display text-2xl italic opacity-60 mb-16 leading-relaxed">Cahayamu kini lebih jernih <br/> dari sebelumnya.</p>
            </motion.div>
            <div className="flex flex-col items-center gap-10">
              <button 
                onClick={() => { setStep(0); setSelectedLights(new Set()); setFeelText(""); setGuardianText(null); setLoopStep(0); }} 
                className="btn-ritual"
              >
                Mulai Ritual Baru
              </button>
              <p className="text-[10px] uppercase tracking-[0.6em] opacity-30">Mantra Djiwa © 2026</p>
            </div>
          </div>
        </RitualStep>

      </main>

      {/* Progress Dots */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex gap-5 opacity-40 pointer-events-none">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div 
            key={i} 
            onClick={() => i <= step && setStep(i)} 
            className={`w-1.5 h-1.5 rounded-full bg-white transition-all duration-700 cursor-none ${i <= step ? 'pointer-events-auto' : ''} ${step === i ? 'bg-gold scale-[1.8] shadow-[0_0_15px_#C9A55A]' : ''}`} 
          />
        ))}
      </div>
    </div>
  );
}
