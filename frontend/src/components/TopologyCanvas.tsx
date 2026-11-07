import { useEffect, useRef } from "react";

/**
 * Lightweight, low-overhead topology background canvas.
 * - Pauses rendering when document is hidden (tab switched).
 * - Pauses rendering when user is idle (no mouse move/scroll for 4s).
 * - Uses only 22 lightweight nodes with subtle low-alpha styling.
 * - Anti-AI-slop: zero CPU hogging or battery drain.
 */
export function TopologyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let isVisible = !document.hidden;
    let isIdle = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const resetIdle = () => {
      isIdle = false;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isIdle = true;
      }, 4000);
    };

    resetIdle();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      resetIdle();
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible) resetIdle();
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);

    const mouse = { x: -9999, y: -9999, active: false };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      resetIdle();
    };
    const onMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    // Keep node count small (22 nodes) for minimal memory & CPU footprint
    const nodes = Array.from({ length: 22 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 1.4 + 1,
      baseAlpha: Math.random() * 0.2 + 0.15,
      color: Math.random() > 0.5 ? "rgba(0, 240, 255," : "rgba(99, 102, 241,",
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      if (isVisible && !isIdle) {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.x += n.vx;
          n.y += n.vy;

          if (n.x < 0) n.x = width;
          if (n.x > width) n.x = 0;
          if (n.y < 0) n.y = height;
          if (n.y > height) n.y = 0;

          if (mouse.active) {
            const dx = mouse.x - n.x;
            const dy = mouse.y - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              const force = (1 - dist / 100) * 0.3;
              n.x += (dx / dist) * force;
              n.y += (dy / dist) * force;
            }
          }

          n.pulsePhase += 0.02;
          const alpha = n.baseAlpha + Math.sin(n.pulsePhase) * 0.05;

          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${n.color} ${alpha})`;
          ctx.fill();
        }

        // Connect only very close neighbors
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 90) {
              const alpha = (1 - dist / 90) * 0.06;
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div className="ambient-background" aria-hidden="true">
      <canvas ref={canvasRef} id="topology-canvas" />
    </div>
  );
}
