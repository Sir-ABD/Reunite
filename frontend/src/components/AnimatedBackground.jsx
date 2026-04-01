import { useEffect, useRef } from 'react';

const random = (min, max) => Math.random() * (max - min) + min;

const AnimatedBackground = ({ particleCount = 140 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resizeCanvas();

    const mouse = { x: width / 2, y: height / 2, radius: Math.min(width, height) * 0.14 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = width / 2;
      mouse.y = height / 2;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resizeCanvas);

    const particles = Array.from({ length: particleCount }, () => {
      const px = random(0, width);
      const py = random(0, height);
      const v = random(0.1, 0.5);
      const s = random(1.3, 4.5);
      const h = random(180, 300);
      const a = random(0.5, 0.95);
      const m = random(70, 180);
      const tx = random(0.2, 0.8);
      const ty = random(0.2, 0.8);

      return { x: px, y: py, vx: v * (Math.random() > 0.5 ? 1 : -1), vy: v * (Math.random() > 0.5 ? 1 : -1), size: s, hue: h, alpha: a, mass: m, tx, ty };
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(8,12,28,0.22)';
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < mouse.radius) {
          const force = (mouse.radius - d) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.03;
          p.vy += Math.sin(angle) * force * 0.03;
        }

        p.x += p.vx + Math.cos(p.tx + performance.now() / 6000) * 0.4;
        p.y += p.vy + Math.sin(p.ty + performance.now() / 6500) * 0.4;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        p.vx *= 0.985;
        p.vy *= 0.985;

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grd.addColorStop(0, `hsla(${p.hue}, 90%, 68%, ${p.alpha})`);
        grd.addColorStop(0.5, `hsla(${p.hue + 20}, 100%, 60%, ${p.alpha * 0.32})`);
        grd.addColorStop(1, 'transparent');

        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      const lineThreshold = 80;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < lineThreshold) {
            ctx.strokeStyle = `hsla(${(p1.hue + p2.hue) / 2}, 90%, 70%, ${0.25 - dist / lineThreshold / 4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20 h-screen w-full pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default AnimatedBackground;
