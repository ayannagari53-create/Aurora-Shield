import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * CustomCursor renders a subtle animated cursor that follows the mouse.
 * It is lightweight and uses Framer Motion for smooth motion.
 * The component is hidden on devices without a fine pointer (e.g., touch screens).
 */
export const CustomCursor = () => {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const cursorX = useSpring(mouseX, { stiffness: 600, damping: 28 });
  const cursorY = useSpring(mouseY, { stiffness: 600, damping: 28 });

  // trailing larger circle
  const trailX = useSpring(mouseX, { stiffness: 1200, damping: 30 });
  const trailY = useSpring(mouseY, { stiffness: 1200, damping: 30 });

  const [isDown, setIsDown] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)');
    if (!media.matches) return;

    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX - 8);
      mouseY.set(e.clientY - 8);
    };
    const down = () => setIsDown(true);
    const up = () => setIsDown(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* trailing blurred circle */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 w-12 h-12 rounded-full bg-cyan-400/30 mix-blend-difference"
        style={{ x: trailX, y: trailY }}
      />
      {/* main cursor */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 w-4 h-4 rounded-full bg-cyan-400/80 mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          scale: isDown ? 0.7 : 1,
        }}
      />
    </>
  );
};






