"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Slice } from "./SliceEditor";

const UGLY_COLORS = [
  "#FF00FF", "#00FF00", "#FF6600", "#0000FF",
  "#FF0000", "#FFFF00", "#00FFFF", "#FF69B4",
  "#7FFF00", "#FF4500", "#9400D3", "#00CED1",
  "#FF1493", "#32CD32", "#FF8C00", "#1E90FF",
];

interface RouletteProps {
  slices: Slice[];
}

export default function Roulette({ slices }: RouletteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const rotationRef = useRef(0);

  const totalWeight = slices.reduce((s, x) => s + Math.max(0, x.weight), 0);

  const drawWheel = useCallback((rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 10;
    const n = slices.length;
    const total = totalWeight > 0 ? totalWeight : n;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    let acc = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.max(0, slices[i].weight);
      const arc = (w / total) * 2 * Math.PI;
      const startAngle = rot + acc;
      const endAngle = rot + acc + arc;
      acc += arc;

      if (arc <= 0) continue;

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
      const pct = total > 0 ? Math.round((w / total) * 100) : 0;
      const text = `${slices[i].label} (${pct}%)`;
      ctx.strokeText(text, radius - 10, 5);
      ctx.fillText(text, radius - 10, 5);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [slices, totalWeight]);

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, [drawWheel]);

  const pickIndexByWeight = (): number => {
    const total = totalWeight;
    if (total <= 0) return Math.floor(Math.random() * slices.length);
    const r = Math.random() * total;
    let acc = 0;
    for (let i = 0; i < slices.length; i++) {
      acc += Math.max(0, slices[i].weight);
      if (r < acc) return i;
    }
    return slices.length - 1;
  };

  const spin = () => {
    if (spinning) return;
    if (totalWeight <= 0) return;
    setResult(null);
    setSpinning(true);

    const total = totalWeight;
    const targetIdx = pickIndexByWeight();
    let acc = 0;
    for (let i = 0; i < targetIdx; i++) acc += Math.max(0, slices[i].weight);
    const targetArc = (Math.max(0, slices[targetIdx].weight) / total) * 2 * Math.PI;
    // random offset within the slice (leave small margin from edges)
    const margin = targetArc * 0.15;
    const withinSlice = margin + Math.random() * (targetArc - 2 * margin);
    const targetAngleInWheel = (acc / total) * 2 * Math.PI + withinSlice;

    const pointerAngle = -Math.PI / 2;
    const startRot = rotationRef.current;
    const extraSpins = 5 + Math.floor(Math.random() * 4);
    const baseFinalRot = pointerAngle - targetAngleInWheel;
    const minFinal = startRot + extraSpins * 2 * Math.PI;
    const twoPi = 2 * Math.PI;
    let finalRot = baseFinalRot;
    while (finalRot < minFinal) finalRot += twoPi;

    const duration = 3500 + Math.random() * 1000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRot + (finalRot - startRot) * eased;
      rotationRef.current = currentRot;
      drawWheel(currentRot);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setResult(slices[targetIdx].label);
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
        disabled={spinning || totalWeight <= 0}
        className="px-8 py-3 text-2xl font-bold uppercase tracking-widest cursor-pointer"
        style={{
          fontFamily: "'Comic Sans MS', cursive",
          background: spinning || totalWeight <= 0 ? "#888" : "linear-gradient(135deg, #FF00FF, #FFFF00, #00FF00)",
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
          }}
        >
          🎉 결과: <span style={{ color: "#0000FF", fontSize: "1.4em" }}>{result}</span> 🎉
        </div>
      )}
    </div>
  );
}
