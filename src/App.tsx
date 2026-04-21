import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { getGuardianResponse } from './services/guardianService';

const emotionResponses: Record<string, {text: string, q: string}> = {
  Fear: { text: "Fear is present here. Sometimes fear appears when something important feels uncertain or at risk.", q: "What part of this moment feels most uncertain for you?" },
  Anger: { text: "There seems to be anger connected to this experience.", q: "What do you think the anger might be protecting?" },
  Overwhelm: { text: "It sounds like a lot is happening inside at once.", q: "If you could focus on just one part of this, what would it be?" },
  Guilt: { text: "Guilt is here. Sometimes guilt appears when something inside us still cares deeply.", q: "What part of this memory stays with you most today?" },
  Sadness: { text: "Sadness is present. It often appears when something meaningful has changed or been lost.", q: "What part of this memory still feels tender for you?" },
  Confusion: { text: "Confusion is here. It often appears when old assumptions start loosening.", q: "What part of this experience still feels unclear?" },
  Acceptance: { text: "There is a quality of acceptance present. It often means we are no longer fighting reality.", q: "What becomes possible now that you see this more clearly?" },
  Courage: { text: "Courage is here, quietly. It often appears when we choose to respond differently.", q: "What step feels possible now?" },
  Gratitude: { text: "Gratitude is present. Sometimes it appears when we can see meaning even inside difficulty.", q: "What part of this experience shaped you the most?" },
  Clarity: { text: "There is a sense of clarity here. It often arrives after sitting with uncertainty long enough.", q: "What direction feels clearer now?" },
  Compassion: { text: "Compassion is present — toward yourself or others. It allows us to hold both our mistakes and our humanity.", q: "How would you speak to yourself from this place?" },
  Peace: { text: "There is a quiet here. Peace often arrives when the struggle with the past softens.", q: "What helped you arrive at this feeling?" }
};

const phaseAnchors: Record<string, string> = {
  dim: "You don't have to solve anything right now. Just notice what is here.",
  soft: "What you felt here deserves gentleness. You can carry that with you.",
  grow: "There is a small step waiting for you, when you are ready.",
  bright: "You can carry this clarity into your day."
};



export default function App() {
  const [step, setStep] = useState(0); 
  const [isTransitioning, setIsTransitioning] = useState(false);
  const stepRef = useRef(step);
  
  // Flow States
  const [selectedLights, setSelectedLights] = useState<Set<string>>(new Set());
  const [selectedAnchors, setSelectedAnchors] = useState<Set<string>>(new Set());
  const [selectedEmotion, setSelectedEmotion] = useState<{n: string, p: string} | null>(null);
  const [loopStep, setLoopStep] = useState(0); 
  const [memText, setMemText] = useState("");
  const [feelText, setFeelText] = useState("");
  const [refText, setRefText] = useState("");
  const [chosenPath, setChosenPath] = useState<string | null>(null);
  const [guardianText, setGuardianText] = useState<string | null>(null);
  const [isGeneratingGuardian, setIsGeneratingGuardian] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const cursorScale = useRef(1);
  const cursorRaf = useRef(0);
  // lerped cursor position for smooth lag-free tracking
  const cursorPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // Update stepRef for Three.js closure
  useEffect(() => { stepRef.current = step; }, [step]);

  // Handle Flow Transition
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
    const response = await getGuardianResponse(feelText, selectedEmotion.n, selectedEmotion.p);
    setGuardianText(response);
    setIsGeneratingGuardian(false);
  };

  // Zero-lag CSS cursor — uses rAF lerp, no GSAP, no style thrashing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      cursorScale.current = t.closest('button, textarea, [data-hover]') ? 2.2 : 1;
    };

    let scale = 1;
    const loop = () => {
      cursorRaf.current = requestAnimationFrame(loop);
      const cp = cursorPos.current;
      const m = mouse.current;
      // lerp for slight smoothness without lag
      cp.x += (m.x - cp.x) * 0.45;
      cp.y += (m.y - cp.y) * 0.45;
      scale += (cursorScale.current - scale) * 0.18;
      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate3d(${cp.x - 10}px, ${cp.y - 10}px, 0) scale(${scale})`;
      }
    };
    cursorRaf.current = requestAnimationFrame(loop);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      cancelAnimationFrame(cursorRaf.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  // Optimized Three.js Space Warp Engine
  useEffect(() => {
    if (!mountRef.current) return;
    // Clean up any existing canvas to prevent "duplicate context" errors
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 0;

    // Cap pixel ratio at 2 to avoid overdraw on hi-DPI screens
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '0';
    mountRef.current.appendChild(renderer.domElement);

    // ── STARS (static Points — single draw call) ──────────────────────
    const STAR_COUNT = 2500;
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starColors = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 200;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      starPos[i * 3 + 2] = -Math.random() * 400;
      // Subtle warm/cool tint
      const warm = Math.random() > 0.5;
      starColors[i * 3]     = warm ? 1.0 : 0.7;
      starColors[i * 3 + 1] = warm ? 0.95 : 0.85;
      starColors[i * 3 + 2] = warm ? 0.8 : 1.0;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── STREAKS (LineSegments — Varied Harmony Colors) ────────────────
    const STREAK_COUNT = 1500;
    const streakPos = new Float32Array(STREAK_COUNT * 6);
    const streakColors = new Float32Array(STREAK_COUNT * 6);
    const streakSpeeds = new Float32Array(STREAK_COUNT);
    
    const palette = [
      new THREE.Color(0xC9A55A), // Gold
      new THREE.Color(0xA3C9E2), // Soft Blue
      new THREE.Color(0xFFFFFF), // White
      new THREE.Color(0xEEE8DC)  // Cream
    ];

    for (let i = 0; i < STREAK_COUNT; i++) {
      const x = (Math.random() - 0.5) * 140;
      const y = (Math.random() - 0.5) * 140;
      const z = -Math.random() * 400;
      const len = 2 + Math.random() * 8; // Longer for motion blur effect
      
      streakPos[i * 6]     = x;   streakPos[i * 6 + 1] = y;   streakPos[i * 6 + 2] = z;
      streakPos[i * 6 + 3] = x;   streakPos[i * 6 + 4] = y;   streakPos[i * 6 + 5] = z + len;
      
      const color = palette[Math.floor(Math.random() * palette.length)];
      // Fade from color to transparent/darker color at the tail for blur look
      streakColors[i * 6]     = color.r; streakColors[i * 6 + 1] = color.g; streakColors[i * 6 + 2] = color.b;
      streakColors[i * 6 + 3] = color.r * 0.3; streakColors[i * 6 + 4] = color.g * 0.3; streakColors[i * 6 + 5] = color.b * 0.3;
      
      streakSpeeds[i] = 0.8 + Math.random() * 1.5;
    }
    const streakGeo = new THREE.BufferGeometry();
    const streakAttr = new THREE.BufferAttribute(streakPos, 3);
    streakAttr.setUsage(THREE.DynamicDrawUsage);
    streakGeo.setAttribute('position', streakAttr);
    streakGeo.setAttribute('color', new THREE.BufferAttribute(streakColors, 3));
    
    const streakMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const streaks = new THREE.LineSegments(streakGeo, streakMat);
    scene.add(streaks);

    // ── GOLDEN LIGHT ORBS (visible on step > 0) ───────────────────────
    const ORB_COUNT = 6;
    const orbGeo = new THREE.SphereGeometry(0.15, 10, 10);
    const orbInstanced = new THREE.InstancedMesh(
      orbGeo,
      new THREE.MeshBasicMaterial({ color: 0xC9A55A, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }),
      ORB_COUNT
    );
    scene.add(orbInstanced);
    const orbData = Array.from({ length: ORB_COUNT }, (_, i) => ({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 5,
      z: -5 - Math.random() * 10,
      phase: (i / ORB_COUNT) * Math.PI * 2,
    }));
    const dummy = new THREE.Object3D();

    // ── GLOW PARTICLES (Soft Lights) ──────────────────────────────────
    const GLOW_COUNT = 300;
    const glowPos = new Float32Array(GLOW_COUNT * 3);
    const glowColors = new Float32Array(GLOW_COUNT * 3);
    const glowSpeeds = new Float32Array(GLOW_COUNT);
    
    // Procedural Glow Texture
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    };

    for (let i = 0; i < GLOW_COUNT; i++) {
      glowPos[i * 3]     = (Math.random() - 0.5) * 160;
      glowPos[i * 3 + 1] = (Math.random() - 0.5) * 160;
      glowPos[i * 3 + 2] = -Math.random() * 400;
      
      const color = palette[Math.floor(Math.random() * palette.length)];
      glowColors[i * 3]     = color.r;
      glowColors[i * 3 + 1] = color.g;
      glowColors[i * 3 + 2] = color.b;
      
      glowSpeeds[i] = 1.0 + Math.random() * 2.0;
    }
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
    glowGeo.setAttribute('color', new THREE.BufferAttribute(glowColors, 3));
    
    const glowMat = new THREE.PointsMaterial({
      size: 1.5,
      map: createParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    const glowParticles = new THREE.Points(glowGeo, glowMat);
    scene.add(glowParticles);

    // ── WARP SPEED LINES (radial burst near center) ───────────────────
    const WARP_COUNT = 400;
    const warpPos = new Float32Array(WARP_COUNT * 6);
    for (let i = 0; i < WARP_COUNT; i++) {
      const angle = (i / WARP_COUNT) * Math.PI * 2;
      const r0 = 0.05 + Math.random() * 0.3;
      const r1 = r0 + 0.1 + Math.random() * 0.4;
      warpPos[i * 6]     = Math.cos(angle) * r0;
      warpPos[i * 6 + 1] = Math.sin(angle) * r0;
      warpPos[i * 6 + 2] = -2;
      warpPos[i * 6 + 3] = Math.cos(angle) * r1;
      warpPos[i * 6 + 4] = Math.sin(angle) * r1;
      warpPos[i * 6 + 5] = -2;
    }
    const warpGeo = new THREE.BufferGeometry();
    warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPos, 3));
    const warpMat = new THREE.LineBasicMaterial({
      color: 0xC9A55A,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warpLines = new THREE.LineSegments(warpGeo, warpMat);
    scene.add(warpLines);

    let reqId: number;
    let lastTime = 0;
    // Reuse vectors to avoid GC pressure
    const _v3 = new THREE.Vector3();

    const animate = (time: number) => {
      reqId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.05); // cap dt
      lastTime = time;
      const t = time * 0.001;

      const isActive = stepRef.current > 0;
      const warpSpeed = isActive ? 60 : 28; // units/sec

      // ── Move stars forward ──
      const sArr = starGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < STAR_COUNT; i++) {
        sArr[i * 3 + 2] += warpSpeed * dt;
        if (sArr[i * 3 + 2] > 5) {
          sArr[i * 3]     = (Math.random() - 0.5) * 200;
          sArr[i * 3 + 1] = (Math.random() - 0.5) * 200;
          sArr[i * 3 + 2] = -400;
        }
      }
      starGeo.attributes.position.needsUpdate = true;

      // ── Move streaks forward ──
      const stArr = streakGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < STREAK_COUNT; i++) {
        const spd = streakSpeeds[i] * warpSpeed * dt;
        stArr[i * 6 + 2] += spd;
        stArr[i * 6 + 5] += spd;
        if (stArr[i * 6 + 2] > 5) {
          const x = (Math.random() - 0.5) * 140;
          const y = (Math.random() - 0.5) * 140;
          const z = -400;
          const len = 2 + Math.random() * 8;
          stArr[i * 6]     = x; stArr[i * 6 + 1] = y; stArr[i * 6 + 2] = z;
          stArr[i * 6 + 3] = x; stArr[i * 6 + 4] = y; stArr[i * 6 + 5] = z + len;
        }
      }
      streakAttr.needsUpdate = true;
      streakMat.opacity = isActive ? 0.22 : 0.12;

      // ── Move glow particles forward ──
      const gArr = glowGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < GLOW_COUNT; i++) {
        gArr[i * 3 + 2] += glowSpeeds[i] * warpSpeed * dt;
        if (gArr[i * 3 + 2] > 5) {
          gArr[i * 3]     = (Math.random() - 0.5) * 160;
          gArr[i * 3 + 1] = (Math.random() - 0.5) * 160;
          gArr[i * 3 + 2] = -400;
        }
      }
      glowGeo.attributes.position.needsUpdate = true;
      glowMat.opacity = isActive ? 0.6 : 0.3;

      // ── Warp radial burst (step > 0) ──
      warpMat.opacity += ((isActive ? 0.18 : 0) - warpMat.opacity) * 0.05;
      warpLines.scale.setScalar(1 + Math.sin(t * 3) * 0.06);

      // ── Orbs ──
      const orbTargetOpacity = isActive ? 0.7 : 0.15; // Slightly visible on landing for depth
      (orbInstanced.material as THREE.MeshBasicMaterial).opacity +=
        (orbTargetOpacity - (orbInstanced.material as THREE.MeshBasicMaterial).opacity) * 0.04;
      for (let i = 0; i < ORB_COUNT; i++) {
        const o = orbData[i];
        o.z += warpSpeed * dt * 0.4;
        if (o.z > 5) {
            o.z = -25;
            o.x = (Math.random() - 0.5) * 15;
            o.y = (Math.random() - 0.5) * 10;
        }
        _v3.set(
          o.x + Math.sin(t * 0.4 + o.phase) * 0.5,
          o.y + Math.cos(t * 0.3 + o.phase) * 0.4,
          o.z
        );
        dummy.position.copy(_v3);
        dummy.updateMatrix();
        orbInstanced.setMatrixAt(i, dummy.matrix);
      }
      orbInstanced.instanceMatrix.needsUpdate = true;

      // ── Gentle parallax camera (mouse already read from ref) ──
      const mx = mouse.current.x / window.innerWidth - 0.5;
      const my = -(mouse.current.y / window.innerHeight - 0.5);
      camera.position.x += (mx * 1.5 - camera.position.x) * 0.03;
      camera.position.y += (my * 0.8 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, -10);

      renderer.render(scene, camera);
    };

    reqId = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqId);
      renderer.dispose();
      starGeo.dispose(); starMat.dispose();
      streakGeo.dispose(); streakMat.dispose();
      glowGeo.dispose(); 
      if (glowMat.map) glowMat.map.dispose();
      glowMat.dispose();
      orbGeo.dispose();
      warpGeo.dispose(); warpMat.dispose();
      const currentMount = mountRef.current;
      if (currentMount && currentMount.contains(renderer.domElement))
        currentMount.removeChild(renderer.domElement);
    };
  }, []);



  return (
    <div className="font-['Plus_Jakarta_Sans'] min-h-screen bg-[#050507] text-[#EEE8DC] overflow-hidden relative flex flex-col items-center cursor-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;1,300&family=Plus+Jakarta+Sans:wght@200;300;400&display=swap');
        /* Vignette overlay only — no CSS animation on top of WebGL */
        .space-vignette {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, #050507 90%);
          pointer-events: none;
          z-index: 1;
        }
        /* Cursor: will-change ensures GPU compositing, no layout triggers */
        .custom-cursor {
          position: fixed;
          top: 0; left: 0;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          pointer-events: none;
          z-index: 10000;
          will-change: transform;
          mix-blend-mode: difference;
        }
      `}</style>

      {/* Vignette only — Three.js handles the rest */}
      <div className="space-vignette" />

      {/* 3D Background Canvas */}
      <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-auto" />

      {/* Custom Cursor — GPU-composited, zero layout cost */}
      <div ref={cursorRef} className="custom-cursor" />

      {/* Transition Curtain */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ scaleY: 0 }} 
            animate={{ scaleY: 1 }} 
            exit={{ scaleY: 0 }}
            style={{ originY: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} 
            className="fixed inset-0 bg-[#08080A] z-[9999] pointer-events-none" 
          />
        )}
      </AnimatePresence>



      {/* Bottom Step Dots */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex gap-4 opacity-30 pointer-events-none">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full bg-white transition-all duration-500 ${step === i ? 'bg-[#C9A55A] scale-150 shadow-[0_0_10px_#C9A55A]' : ''}`} />
        ))}
      </div>

      {/* Pause Button (Module B: RR-07) */}
      {step >= 2 && step <= 5 && !isPaused && (
        <button 
          onClick={() => setIsPaused(true)}
          className="fixed top-8 right-8 z-[200] text-[#EEE8DC]/50 hover:text-white uppercase tracking-[0.2em] text-[10px] font-['Plus_Jakarta_Sans'] transition-colors cursor-none px-4 py-2 border border-transparent hover:border-white/20 rounded-full"
        >
          Pause Room
        </button>
      )}

      {/* Paused State Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[10000] bg-[#050507] flex flex-col items-center justify-center pointer-events-auto cursor-none"
          >
            <div className="text-center">
              <p className="font-['Cormorant_Garamond'] text-3xl font-light mb-8 text-[#EEE8DC] italic">Breathe. You can return whenever you are ready.</p>
              <button 
                onClick={() => setIsPaused(false)}
                className="px-8 py-3 bg-white/5 border border-white/10 text-[#EEE8DC] font-['Plus_Jakarta_Sans'] text-xs tracking-[0.3em] uppercase cursor-none transition-all duration-500 rounded-full hover:border-[#C9A55A] hover:tracking-[0.4em]"
              >
                Return to Room
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="z-10 flex flex-col w-full min-h-screen relative pointer-events-none">
        
        {/* ── SCREEN 0: LANDING ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: step === 0 ? 1 : 0, y: step === 0 ? 0 : 20 }} 
          style={{ display: step === 0 ? 'flex' : 'none' }}
          className="flex flex-col items-center justify-center flex-1 text-center p-8 pointer-events-none"
        >
          <div className="w-full max-w-2xl pointer-events-auto">
            <p className="tracking-[0.5em] text-[0.7rem] mb-2 uppercase text-[#C9A55A]/80 font-light">MANTRA DJIWA PRESENTS</p>
            <h1 className="font-['Cormorant_Garamond'] text-5xl sm:text-6xl font-light tracking-[0.1em] mb-4 bg-gradient-to-b from-white to-[#999] bg-clip-text text-transparent">
              The Art of Remembering
            </h1>
            <p className="text-base text-[#EEE8DC]/60 mb-8 font-light leading-relaxed max-w-lg mx-auto">
              Sebuah ruang suci untuk memanggil kembali pendaran cahaya yang membentuk jiwamu hari ini.
            </p>
            <button 
              onClick={() => transitionToStep(1)} 
              className="px-10 py-4 bg-white/5 border border-white/10 text-[#EEE8DC] font-['Plus_Jakarta_Sans'] text-xs tracking-[0.3em] uppercase cursor-none relative overflow-hidden transition-all duration-500 rounded-full backdrop-blur-[10px] hover:border-[#C9A55A] hover:shadow-[0_0_20px_rgba(201,165,90,0.2)] hover:tracking-[0.4em]"
            >
              Mulai Ritual
            </button>
          </div>
        </motion.div>

        {/* ── SCREEN 1: LIGHT SELECTION (Constellation Logic) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: step === 1 ? 1 : 0, y: step === 1 ? 0 : 20 }} 
          style={{ display: step === 1 ? 'flex' : 'none' }}
          className="flex flex-col flex-1 p-6 sm:p-12 items-center justify-center pointer-events-none"
        >
          <div className="w-full max-w-2xl text-center pointer-events-auto">
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-light mb-2 bg-gradient-to-b from-white to-[#999] bg-clip-text text-transparent">
              Pilih Cahaya Utamamu
            </h1>
            <p className="font-['Cormorant_Garamond'] italic text-lg text-[#EEE8DC]/60 mb-8">
              Pilih pendaran mana saja yang membentuk dirimu hingga hari ini (Pilih 3 - 5)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[ {k:'mother', i:'🌕'}, {k:'father', i:'🌑'}, {k:'sibling', i:'✨'}, {k:'friend', i:'🌿'}, {k:'mentor', i:'🪐'}, {k:'rival', i:'🔺'}, {k:'stranger', i:'🌫'}, {k:'self', i:'☀'} ].map(l => (
                <div key={l.k} onClick={() => toggleLight(l.k)} 
                     className={`flex flex-col items-center justify-center p-6 border rounded-2xl cursor-none transition-all duration-300 backdrop-blur-md ${selectedLights.has(l.k) ? 'bg-[#C9A55A]/20 border-[#C9A55A] shadow-[0_0_15px_rgba(201,165,90,0.2)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                  <span className="text-4xl">{l.i}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => transitionToStep(2)} 
              disabled={selectedLights.size < 3}
              className="px-10 py-4 bg-white/5 border border-white/10 text-[#EEE8DC] disabled:opacity-30 disabled:tracking-[0.3em] font-['Plus_Jakarta_Sans'] text-xs tracking-[0.3em] uppercase cursor-none relative overflow-hidden transition-all duration-500 rounded-full backdrop-blur-[10px] hover:border-[#C9A55A] hover:shadow-[0_0_20px_rgba(201,165,90,0.2)] hover:tracking-[0.4em]"
            >
              Simpan Konstelasi
            </button>
          </div>
        </motion.div>

        {/* ── SCREEN 2: CONSTELLATION MIRROR (NEW) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: step === 2 ? 1 : 0, y: step === 2 ? 0 : 20 }} 
          style={{ display: step === 2 ? 'flex' : 'none' }}
          className="flex flex-col flex-1 p-6 sm:p-12 items-center justify-center pointer-events-none"
        >
          <div className="w-full max-w-2xl text-center pointer-events-auto">
            <h1 className="font-['Cormorant_Garamond'] text-4xl font-light mb-6 bg-gradient-to-b from-white to-[#C9A55A] bg-clip-text text-transparent">
              These are the lights you chose.
            </h1>
            <p className="font-['Cormorant_Garamond'] italic text-2xl text-[#EEE8DC]/80 mb-12">
              ...And they chose you.
            </p>
            <button 
              onClick={() => transitionToStep(3)} 
              className="px-8 py-3 bg-white/5 border border-white/10 text-[#EEE8DC] font-['Plus_Jakarta_Sans'] text-xs tracking-[0.3em] uppercase cursor-none relative transition-all duration-500 rounded-full backdrop-blur-[10px] hover:border-[#C9A55A] hover:tracking-[0.4em]"
            >
              Lanjutkan
            </button>
          </div>
        </motion.div>

        {/* ── SCREEN 3: RITUAL ANCHOR DISCOVERY (NEW) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: step === 3 ? 1 : 0, y: step === 3 ? 0 : 20 }} 
          style={{ display: step === 3 ? 'flex' : 'none' }}
          className="flex flex-col flex-1 p-6 sm:p-12 items-center justify-center pointer-events-none"
        >
          <div className="w-full max-w-2xl text-center pointer-events-auto">
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-light mb-2 bg-gradient-to-b from-white to-[#999] bg-clip-text text-transparent">
              Ritual Anchor Discovery
            </h1>
            <p className="font-['Cormorant_Garamond'] italic text-lg text-[#EEE8DC]/60 mb-8">
              Pilih tindakan kecil yang membantumu kembali pada dirimu sendiri (Pilih max 3)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[ 'Doa / Meditasi', 'Mendengarkan Musik', 'Berjalan Kaki', 'Membaca Buku', 'Menulis Jurnal', 'Menyeduh Teh', 'Menyentuh Alam', 'Satu Tarikan Napas' ].map(a => (
                <div key={a} onClick={() => toggleAnchor(a)} 
                     className={`flex flex-col items-center justify-center p-4 border rounded-2xl cursor-none transition-all duration-300 backdrop-blur-md ${selectedAnchors.has(a) ? 'bg-[#C9A55A]/20 border-[#C9A55A] shadow-[0_0_15px_rgba(201,165,90,0.2)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                  <span className={`text-xs uppercase tracking-widest text-center leading-relaxed ${selectedAnchors.has(a) ? 'text-[#C9A55A]' : 'text-[#EEE8DC]/60'}`}>{a}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => transitionToStep(4)} 
              disabled={selectedAnchors.size === 0}
              className="px-10 py-4 bg-white/5 border border-white/10 text-[#EEE8DC] disabled:opacity-30 disabled:tracking-[0.3em] font-['Plus_Jakarta_Sans'] text-xs tracking-[0.3em] uppercase cursor-none relative overflow-hidden transition-all duration-500 rounded-full backdrop-blur-[10px] hover:border-[#C9A55A] hover:tracking-[0.4em]"
            >
              Simpan Anchors
            </button>
          </div>
        </motion.div>

        {/* ── SCREEN 4: ENTRANCE RITUAL (Emotions) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: step === 4 ? 1 : 0, y: step === 4 ? 0 : 20 }} 
          style={{ display: step === 4 ? 'flex' : 'none' }}
          className="flex flex-col flex-1 p-6 items-center justify-center pointer-events-none"
        >
          <div className="w-full max-w-3xl text-center pointer-events-auto bg-white/[0.02] border border-white/5 backdrop-blur-[20px] p-8 sm:p-12 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-light mb-4 bg-gradient-to-b from-white to-[#999] bg-clip-text text-transparent">
              Perasaan Apa yang Hadir Saat Ini?
            </h1>
            <p className="font-['Cormorant_Garamond'] italic text-base text-[#EEE8DC]/60 mb-6 max-w-xl mx-auto">
              You don't need to have the right words here. You can just be as you are.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
              {[
                {n:'Fear',p:'dim'},{n:'Anger',p:'dim'},{n:'Overwhelm',p:'dim'},
                {n:'Guilt',p:'soft'},{n:'Sadness',p:'soft'},{n:'Confusion',p:'soft'},
                {n:'Acceptance',p:'grow'},{n:'Courage',p:'grow'},{n:'Gratitude',p:'bright'},
                {n:'Clarity',p:'bright'},{n:'Compassion',p:'bright'},{n:'Peace',p:'bright'}
              ].map(em => (
                <div key={em.n} onClick={() => setSelectedEmotion(em)} 
                     className={`p-3 border rounded-xl text-center cursor-none transition-all duration-300 ${selectedEmotion?.n === em.n ? 'bg-[#C9A55A]/20 border-[#C9A55A]' : 'bg-transparent border-white/10 hover:border-white/30'}`}>
                  <span className={`block text-sm font-light ${selectedEmotion?.n === em.n ? 'text-[#C9A55A]' : 'text-[#EEE8DC]/70'}`}>{em.n}</span>
                </div>
              ))}
            </div>

            {selectedEmotion && (
              <motion.div initial={{ opacity:0, y: 10 }} animate={{ opacity:1, y: 0 }} className="mb-8 border-t border-white/5 pt-6 text-left">
                <div className="text-[10px] tracking-[0.2em] uppercase text-[#C9A55A] mb-2 font-light">Guardian Response</div>
                <div className="font-['Cormorant_Garamond'] italic text-lg text-[#EEE8DC]/90">{emotionResponses[selectedEmotion.n].text}</div>
              </motion.div>
            )}

            <button 
              onClick={() => transitionToStep(5)} 
              disabled={!selectedEmotion}
              className="px-8 py-3 bg-white/5 border border-white/10 text-[#EEE8DC] disabled:opacity-30 disabled:tracking-[0.2em] font-['Plus_Jakarta_Sans'] text-[10px] tracking-[0.2em] uppercase cursor-none transition-all duration-500 rounded-full backdrop-blur-md hover:border-[#C9A55A] hover:tracking-[0.3em]"
            >
              Enter the Room
            </button>
          </div>
        </motion.div>

        {/* ── SCREEN 5: AWAKENING LOOP (Memory Input) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: step === 5 ? 1 : 0, y: step === 5 ? 0 : 20 }} 
          style={{ display: step === 5 ? 'flex' : 'none' }}
          className="flex flex-col flex-1 p-6 items-center justify-center pointer-events-none"
        >
          <div className="w-full max-w-lg pointer-events-auto bg-white/[0.03] border border-white/5 backdrop-blur-[20px] p-8 sm:p-12 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <p className="text-left mb-6 tracking-[0.1em] text-xs text-[#C9A55A] uppercase">Etching the Memory</p>
            
            <div className="mb-6 h-[120px]">
              <AnimatePresence mode="wait">
                {loopStep === 0 && (
                  <motion.div key="l0" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                    <p className="font-['Cormorant_Garamond'] text-xl mb-4 text-[#EEE8DC]/80 font-light">What memory do you still carry, but rarely speak about?</p>
                    <textarea value={memText} onChange={e=>setMemText(e.target.value)} placeholder="Bisikkan satu memori yang ingin kamu abadikan..." className="w-full bg-transparent border-b border-white/10 text-white font-['Cormorant_Garamond'] text-xl resize-none h-[60px] outline-none transition-colors focus:border-[#C9A55A] placeholder:text-white/20"/>
                  </motion.div>
                )}
                {loopStep === 1 && (
                  <motion.div key="l1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                    <p className="font-['Cormorant_Garamond'] text-xl mb-4 text-[#EEE8DC]/80 font-light">What did you feel when you were in that moment?</p>
                    <textarea value={feelText} onChange={e=>setFeelText(e.target.value)} placeholder="Describe what you felt..." className="w-full bg-transparent border-b border-white/10 text-white font-['Cormorant_Garamond'] text-xl resize-none h-[60px] outline-none transition-colors focus:border-[#C9A55A] placeholder:text-white/20"/>
                  </motion.div>
                )}
                {loopStep === 2 && (
                  <motion.div key="l2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                     <div className="text-[10px] tracking-[0.2em] uppercase text-[#C9A55A] mb-2 font-light">Guardian AI</div>
                     {isGeneratingGuardian ? (
                       <p className="font-['Cormorant_Garamond'] text-xl mb-4 text-[#EEE8DC]/50 italic animate-pulse">Menyelaraskan deburan emosi...</p>
                     ) : (
                       <p className="font-['Cormorant_Garamond'] text-xl mb-4 text-[#EEE8DC]/90 font-light italic">"{guardianText || 'Aku di sini.'}"</p>
                     )}
                    <textarea value={refText} onChange={e=>setRefText(e.target.value)} placeholder="Tuliskan renunganmu di sini..." className="w-full bg-transparent border-b border-white/10 text-white font-['Cormorant_Garamond'] text-xl resize-none h-[60px] outline-none transition-colors focus:border-[#C9A55A] placeholder:text-white/20"/>
                  </motion.div>
                )}
                {loopStep === 3 && (
                  <motion.div key="l3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                     <p className="font-['Cormorant_Garamond'] text-xl mb-4 text-[#EEE8DC]/80 font-light">Choose a gentle path forward for this memory.</p>
                     <div className="grid grid-cols-2 gap-2 mt-2">
                      {['Listen and notice', 'Write one sentence', 'A quiet walk', 'Leave this here'].map(p => (
                        <div key={p} onClick={()=>setChosenPath(p)} className={`p-2 border rounded-xl text-center cursor-none transition-all text-xs font-light ${chosenPath === p ? 'bg-[#C9A55A]/20 border-[#C9A55A]' : 'bg-transparent border-white/10'}`}>{p}</div>
                      ))}
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-center mt-8">
              <button onClick={() => { if (loopStep > 0) setLoopStep(loopStep - 1); else transitionToStep(4); }} className="text-[#EEE8DC]/40 hover:text-[#EEE8DC] uppercase text-[10px] tracking-widest cursor-none transition-colors">
                 ← Back
              </button>
              <button 
                onClick={async () => { 
                  if (loopStep === 1) {
                    setLoopStep(2);
                    await fetchGuardianResponse();
                  } else if (loopStep < 3) {
                    setLoopStep(loopStep + 1);
                  } else {
                    transitionToStep(6);
                  }
                }} 
                disabled={
                  (loopStep === 0 && memText.length < 5) || 
                  (loopStep === 1 && feelText.length < 5) || 
                  (loopStep === 2 && (refText.length < 5 || isGeneratingGuardian)) || 
                  (loopStep === 3 && !chosenPath)
                }
                className="px-8 py-3 bg-white/5 border border-white/10 text-[#EEE8DC] disabled:opacity-30 disabled:tracking-[0.2em] font-['Plus_Jakarta_Sans'] text-[10px] tracking-[0.2em] uppercase cursor-none transition-all duration-500 rounded-full hover:border-[#C9A55A] hover:tracking-[0.3em]"
              >
                {loopStep === 3 ? 'Selesaikan Ritual' : 'Lanjutkan'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── SCREEN 6: GOODBYE RITUAL ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: step === 6 ? 1 : 0, y: step === 6 ? 0 : 20 }} 
          style={{ display: step === 6 ? 'flex' : 'none' }}
          className="flex flex-col items-center justify-center flex-1 text-center p-8 pointer-events-none"
        >
          <div className="w-full max-w-2xl pointer-events-auto">
            <h1 className="font-['Cormorant_Garamond'] text-4xl sm:text-5xl font-light mb-6 bg-gradient-to-b from-white to-[#999] bg-clip-text text-transparent">
              Cahaya Awal
            </h1>
            <p className="text-lg text-[#EEE8DC]/80 mb-8 font-light leading-relaxed max-w-lg mx-auto font-['Cormorant_Garamond'] italic">
              Memorimu kini menjadi bagian dari konstelasi abadi. Kamu tidak pernah benar-benar sendirian.
            </p>
            <div className="bg-[#13161E]/80 border border-[#C9A55A]/30 backdrop-blur-md rounded-2xl p-6 max-w-[340px] mx-auto mb-10">
              <div className="text-[10px] tracking-[0.18em] uppercase text-[#C9A55A] mb-2 font-['Plus_Jakarta_Sans']">Carry this with you</div>
              <div className="font-['Cormorant_Garamond'] italic text-[15px]">"{phaseAnchors[selectedEmotion?.p || 'soft']}"</div>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-10 py-4 bg-white/5 border border-white/10 text-[#EEE8DC] font-['Plus_Jakarta_Sans'] text-xs tracking-[0.3em] uppercase cursor-none relative overflow-hidden transition-all duration-500 rounded-full backdrop-blur-[10px] hover:border-[#C9A55A] hover:shadow-[0_0_20px_rgba(201,165,90,0.2)] hover:tracking-[0.4em]"
            >
              Kembali ke Keheningan
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
