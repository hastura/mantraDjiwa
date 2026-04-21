import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { COLORS, PALETTE, SPACE_CONFIG } from '../constants';

export const useSpaceWarp = (step: number, mouse: React.MutableRefObject<{ x: number; y: number }>) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(step);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Clean up existing
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '0';
    mountRef.current.appendChild(renderer.domElement);

    // ── STARS ──
    const { STAR_COUNT, STREAK_COUNT, GLOW_COUNT, WARP_COUNT, ORB_COUNT, BASE_SPEED, WARP_SPEED, SPAWN_Z, RESET_Z } = SPACE_CONFIG;
    
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starColors = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 200;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      starPos[i * 3 + 2] = -Math.random() * 400;
      const warm = Math.random() > 0.5;
      starColors[i * 3] = warm ? 1.0 : 0.7;
      starColors[i * 3 + 1] = warm ? 0.95 : 0.85;
      starColors[i * 3 + 2] = warm ? 0.8 : 1.0;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.25, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── STREAKS ──
    const streakPos = new Float32Array(STREAK_COUNT * 6);
    const streakColors = new Float32Array(STREAK_COUNT * 6);
    const streakSpeeds = new Float32Array(STREAK_COUNT);
    for (let i = 0; i < STREAK_COUNT; i++) {
      const x = (Math.random() - 0.5) * 140;
      const y = (Math.random() - 0.5) * 140;
      const z = -Math.random() * 400;
      const len = 2 + Math.random() * 8;
      streakPos[i * 6] = x; streakPos[i * 6 + 1] = y; streakPos[i * 6 + 2] = z;
      streakPos[i * 6 + 3] = x; streakPos[i * 6 + 4] = y; streakPos[i * 6 + 5] = z + len;
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      streakColors[i * 6] = color.r; streakColors[i * 6 + 1] = color.g; streakColors[i * 6 + 2] = color.b;
      streakColors[i * 6 + 3] = color.r * 0.3; streakColors[i * 6 + 4] = color.g * 0.3; streakColors[i * 6 + 5] = color.b * 0.3;
      streakSpeeds[i] = 0.8 + Math.random() * 1.5;
    }
    const streakGeo = new THREE.BufferGeometry();
    const streakAttr = new THREE.BufferAttribute(streakPos, 3);
    streakAttr.setUsage(THREE.DynamicDrawUsage);
    streakGeo.setAttribute('position', streakAttr);
    streakGeo.setAttribute('color', new THREE.BufferAttribute(streakColors, 3));
    const streakMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    const streaks = new THREE.LineSegments(streakGeo, streakMat);
    scene.add(streaks);

    // ── GLOW PARTICLES ──
    const glowPos = new Float32Array(GLOW_COUNT * 3);
    const glowColors = new Float32Array(GLOW_COUNT * 3);
    const glowSpeeds = new Float32Array(GLOW_COUNT);
    const createTex = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };
    for (let i = 0; i < GLOW_COUNT; i++) {
      glowPos[i * 3] = (Math.random() - 0.5) * 160;
      glowPos[i * 3 + 1] = (Math.random() - 0.5) * 160;
      glowPos[i * 3 + 2] = -Math.random() * 400;
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      glowColors[i * 3] = color.r; glowColors[i * 3 + 1] = color.g; glowColors[i * 3 + 2] = color.b;
      glowSpeeds[i] = 1.0 + Math.random() * 2.0;
    }
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
    glowGeo.setAttribute('color', new THREE.BufferAttribute(glowColors, 3));
    const glowTex = createTex();
    const glowMat = new THREE.PointsMaterial({ size: 1.5, map: glowTex, vertexColors: true, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    const glowParticles = new THREE.Points(glowGeo, glowMat);
    scene.add(glowParticles);

    // ── ORBS ──
    const orbGeo = new THREE.SphereGeometry(0.15, 10, 10);
    const orbInstanced = new THREE.InstancedMesh(
      orbGeo,
      new THREE.MeshBasicMaterial({ color: COLORS.GOLD, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }),
      ORB_COUNT
    );
    scene.add(orbInstanced);
    const orbData = Array.from({ length: ORB_COUNT }, (_, i) => ({
      x: (Math.random() - 0.5) * 15, y: (Math.random() - 0.5) * 10, z: -5 - Math.random() * 20, phase: (i / ORB_COUNT) * Math.PI * 2
    }));
    const dummy = new THREE.Object3D();

    // ── WARP LINES ──
    const warpPos = new Float32Array(WARP_COUNT * 6);
    for (let i = 0; i < WARP_COUNT; i++) {
      const angle = (i / WARP_COUNT) * Math.PI * 2;
      const r0 = 0.05 + Math.random() * 0.3;
      const r1 = r0 + 0.1 + Math.random() * 0.4;
      warpPos[i * 6] = Math.cos(angle) * r0;
      warpPos[i * 6 + 1] = Math.sin(angle) * r0;
      warpPos[i * 6 + 2] = -2;
      warpPos[i * 6 + 3] = Math.cos(angle) * r1;
      warpPos[i * 6 + 4] = Math.sin(angle) * r1;
      warpPos[i * 6 + 5] = -2;
    }
    const warpGeo = new THREE.BufferGeometry();
    warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPos, 3));
    const warpMat = new THREE.LineBasicMaterial({ color: COLORS.GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const warpLines = new THREE.LineSegments(warpGeo, warpMat);
    scene.add(warpLines);

    let reqId: number;
    let lastTime = 0;
    const _v3 = new THREE.Vector3();

    const animate = (time: number) => {
      reqId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const t = time * 0.001;
      const isActive = stepRef.current > 0;
      const warpSpeed = isActive ? WARP_SPEED : BASE_SPEED;

      // Update Stars
      const sArr = starGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < STAR_COUNT; i++) {
        sArr[i * 3 + 2] += warpSpeed * dt;
        if (sArr[i * 3 + 2] > RESET_Z) { sArr[i * 3] = (Math.random() - 0.5) * 200; sArr[i * 3 + 1] = (Math.random() - 0.5) * 200; sArr[i * 3 + 2] = SPAWN_Z; }
      }
      starGeo.attributes.position.needsUpdate = true;

      // Update Streaks
      const stArr = streakGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < STREAK_COUNT; i++) {
        const spd = streakSpeeds[i] * warpSpeed * dt;
        stArr[i * 6 + 2] += spd; stArr[i * 6 + 5] += spd;
        if (stArr[i * 6 + 2] > RESET_Z) {
          const x = (Math.random() - 0.5) * 140; const y = (Math.random() - 0.5) * 140; const z = SPAWN_Z; const len = 2 + Math.random() * 8;
          stArr[i * 6] = x; stArr[i * 6 + 1] = y; stArr[i * 6 + 2] = z; stArr[i * 6 + 3] = x; stArr[i * 6 + 4] = y; stArr[i * 6 + 5] = z + len;
        }
      }
      streakAttr.needsUpdate = true;
      streakMat.opacity = isActive ? 0.22 : 0.12;

      // Update Glow
      const gArr = glowGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < GLOW_COUNT; i++) {
        gArr[i * 3 + 2] += glowSpeeds[i] * warpSpeed * dt;
        if (gArr[i * 3 + 2] > RESET_Z) { gArr[i * 3] = (Math.random() - 0.5) * 160; gArr[i * 3 + 1] = (Math.random() - 0.5) * 160; gArr[i * 3 + 2] = SPAWN_Z; }
      }
      glowGeo.attributes.position.needsUpdate = true;
      glowMat.opacity = isActive ? 0.6 : 0.3;

      warpMat.opacity += ((isActive ? 0.18 : 0) - warpMat.opacity) * 0.05;
      warpLines.scale.setScalar(1 + Math.sin(t * 3) * 0.06);

      // Update Orbs
      const orbTargetOpacity = isActive ? 0.7 : 0.15;
      (orbInstanced.material as THREE.MeshBasicMaterial).opacity += (orbTargetOpacity - (orbInstanced.material as THREE.MeshBasicMaterial).opacity) * 0.04;
      for (let i = 0; i < ORB_COUNT; i++) {
        const o = orbData[i]; o.z += warpSpeed * dt * 0.4; if (o.z > RESET_Z) { o.z = -25; o.x = (Math.random() - 0.5) * 15; o.y = (Math.random() - 0.5) * 10; }
        _v3.set(o.x + Math.sin(t * 0.4 + o.phase) * 0.5, o.y + Math.cos(t * 0.3 + o.phase) * 0.4, o.z);
        dummy.position.copy(_v3); dummy.updateMatrix(); orbInstanced.setMatrixAt(i, dummy.matrix);
      }
      orbInstanced.instanceMatrix.needsUpdate = true;

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
      if (renderer) {
        renderer.dispose();
        if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      starGeo.dispose(); starMat.dispose();
      streakGeo.dispose(); streakMat.dispose();
      glowGeo.dispose(); glowTex.dispose(); glowMat.dispose();
      orbGeo.dispose();
      warpGeo.dispose(); warpMat.dispose();
    };
  }, []);

  return mountRef;
};
