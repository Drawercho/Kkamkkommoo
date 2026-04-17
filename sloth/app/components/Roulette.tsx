"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const UGLY_COLORS = [
  "#FF00FF", "#00FF00", "#FF6600", "#0000FF",
  "#FF0000", "#FFFF00", "#00FFFF", "#FF69B4",
  "#7FFF00", "#FF4500", "#9400D3", "#00CED1",
  "#FF1493", "#32CD32", "#FF8C00", "#1E90FF",
];

interface RouletteProps {
  slices: string[];
}

export default function Roulette({ slices }: RouletteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const rotationRef = useRef(0);

  const drawWheel = useCallback((rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 10;
    const n = slices.length;
    const arc = (2 * Math.PI) / n;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // outer ugly border
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "#FF00FF";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 14, 0, 2 * Math.PI);
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let i = 0; i < n; i++) {
      const startAngle = rot + i * arc;
      const endAngle = rot + (i + 1) * arc;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = UGLY_COLORS[i % UGLY_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px 'Comic Sans MS', cursive";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.strokeText(slices[i], radius - 10, 5);
      ctx.fillText(slices[i], radius - 10, 5);
      ctx.restore();
    }

    // center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [slices]);

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, [drawWheel]);

  const spin = () => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);

    const extraSpins = 5 + Math.random() * 5;
    const extraAngle = Math.random() * 2 * Math.PI;
    const totalRotation = extraSpins * 2 * Math.PI + extraAngle;
    const duration = 3000 + Math.random() * 1000;
    const startTime = performance.now();
    const startRot = rotationRef.current;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRot + totalRotation * eased;
      rotationRef.current = currentRot;
      setRotation(currentRot);
      drawWheel(currentRot);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const n = slices.length;
        const arc = (2 * Math.PI) / n;
        // pointer is at top (-PI/2), normalize angle
        const normalized = ((currentRot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        // pointer at top means angle 0 from top = -PI/2 in canvas coords
        const pointerAngle = ((-Math.PI / 2 - normalized) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(pointerAngle / arc) % n;
        setResult(slices[idx]);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ filter: "drop-shadow(0 0 12px #FF00FF) drop-shadow(0 0 6px #00FF00)" }}>
        {/* pointer */}
        <div
          className="absolute left-1/2 z-10"
          style={{
            top: -10,
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "30px solid #FF0000",
            filter: "drop-shadow(0 2px 2px #000)",
          }}
        />
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          style={{ borderRadius: "50%", border: "5px dashed #FF6600" }}
        />
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="px-8 py-3 text-2xl font-bold uppercase tracking-widest cursor-pointer"
        style={{
          fontFamily: "'Comic Sans MS', cursive",
          background: spinning ? "#888" : "linear-gradient(135deg, #FF00FF, #FFFF00, #00FF00)",
          color: "#000080",
          border: "4px solid #FF0000",
          boxShadow: "6px 6px 0 #0000FF, -2px -2px 0 #FF6600",
          textDecoration: "underline overline",
          transform: spinning ? "none" : "skew(-3deg)",
        }}
      >
        {spinning ? "돌아가는 중...🌀" : "🎰 돌려돌려 돌림판!! 🎰"}
      </button>

      {result && (
        <div
          className="mt-2 px-6 py-4 text-center text-xl font-bold"
          style={{
            fontFamily: "'Comic Sans MS', cursive",
            background: "#FFFF00",
            border: "5px double #FF00FF",
            boxShadow: "8px 8px 0 #00FF00, -4px -4px 0 #FF0000",
            color: "#FF0000",
            textDecoration: "underline",
            animation: "none",
          }}
        >
          🎉 결과: <span style={{ color: "#0000FF", fontSize: "1.4em" }}>{result}</span> 🎉
        </div>
      )}
    </div>
  );
}
