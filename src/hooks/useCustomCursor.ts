import { useEffect, useRef } from 'react';

export const useCustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const cursorScale = useRef(1);
  const cursorRaf = useRef(0);
  const cursorPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

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
      
      // Lerp for smooth tracking
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

  return { cursorRef, mouse };
};
