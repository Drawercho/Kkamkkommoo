"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { PointerEvent } from "react";
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
  const ledRingRef = useRef<HTMLDivElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const cameraRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const dragRef = useRef<{ id: number; angle: number; time: number; velocity: number; distance: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const wobble = (offset: number, tilt: number) => {
    cameraRef.current?.style.setProperty("--rattle-x", `${offset}px`);
    cameraRef.current?.style.setProperty("--rattle-tilt", `${tilt}deg`);
  };

  const totalWeight = slices.reduce((s, x) => s + Math.max(0, x.weight), 0);

  const drawWheel = useCallback((rot: number) => {
    if (ledRingRef.current) ledRingRef.current.style.transform = `rotate(${rot}rad)`;
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
    // Editing the entries cancels the old draw/selection snapshot.
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    busyRef.current = false;
    dragRef.current = null;
    setDragging(false);
    setSpinning(false);
    setResult(null);
    if (cameraRef.current) cameraRef.current.style.transform = "scale(1)";
    wobble(0, 0);
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

  const spin = (velocity = 0.012) => {
    if (busyRef.current) return;
    if (totalWeight <= 0) return;
    busyRef.current = true;
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
    const strength = Math.min(Math.abs(velocity) / 0.02, 1);
    const direction = velocity < 0 ? -1 : 1;
    const extraSpins = 4 + Math.floor(strength * 5);
    const baseFinalRot = pointerAngle - targetAngleInWheel;
    const twoPi = 2 * Math.PI;
    const offset = ((direction * (baseFinalRot - startRot)) % twoPi + twoPi) % twoPi;
    const finalRot = startRot + direction * (extraSpins * twoPi + offset);

    const duration = 4200 + strength * 1600;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spinDuration = reducedMotion ? 250 : duration;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRot + (finalRot - startRot) * eased;
      rotationRef.current = currentRot;
      drawWheel(currentRot);
      // Cosmetic loose axle only: selection and final angle remain unchanged.
      const rattle = reducedMotion ? 0 : Math.sin(elapsed / 90) * (0.5 + progress * 1.1) * Math.min(progress * 12, 1);
      wobble(rattle, rattle * 0.65);
      const zoomProgress = Math.max(0, Math.min((progress - 0.55) / 0.45, 1));
      const zoom = reducedMotion ? 1 : 1 + 1.2 * zoomProgress * zoomProgress * (3 - 2 * zoomProgress);
      if (cameraRef.current) cameraRef.current.style.transform = `scale(${zoom})`;

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        const revealStart = now;
        const reveal = (time: number) => {
          const settle = Math.min((time - revealStart) / 600, 1);
          const kick = reducedMotion ? 0 : Math.sin(settle * Math.PI * 4) * (1 - settle) * 2;
          wobble(kick, kick * 0.7);
          const returnProgress = reducedMotion ? 1 : Math.min(Math.max((time - revealStart - 650) / 500, 0), 1);
          if (cameraRef.current) cameraRef.current.style.transform = `scale(${1 + (zoom - 1) * (1 - returnProgress)})`;
          if (returnProgress < 1) {
            animFrameRef.current = requestAnimationFrame(reveal);
          } else {
            rotationRef.current = ((finalRot % twoPi) + twoPi) % twoPi;
            busyRef.current = false;
            setSpinning(false);
            setResult(slices[targetIdx].label);
          }
        };
        animFrameRef.current = requestAnimationFrame(reveal);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  const pointerAngle = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2);
  };

  const startDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    if (busyRef.current || dragRef.current || totalWeight <= 0 || !event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: event.pointerId, angle: pointerAngle(event), time: performance.now(), velocity: 0, distance: 0 };
    setDragging(true);
    setResult(null);
  };

  const moveDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const angle = pointerAngle(event);
    const delta = Math.atan2(Math.sin(angle - drag.angle), Math.cos(angle - drag.angle));
    const now = performance.now();
    drag.velocity = delta / Math.max(now - drag.time, 8);
    drag.distance += Math.abs(delta);
    drag.angle = angle;
    drag.time = now;
    rotationRef.current += delta;
    drawWheel(rotationRef.current);
  };

  const endDrag = (event: PointerEvent<HTMLCanvasElement>, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && drag.distance > 0.12) {
      const velocity = drag.velocity * Math.max(0, 1 - (performance.now() - drag.time) / 180);
      spin(velocity);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-center">룰렛을 잡고 돌린 뒤 놓아보세요! 빠르게 돌릴수록 오래 돌아가요.</p>
      <div style={{ width: "min(380px, 75vw)", overflow: "hidden", paddingTop: 24 }}>
      <div ref={cameraRef} className="relative" style={{ transformOrigin: "50% 20px", willChange: "transform", filter: "drop-shadow(0 0 12px #FF00FF)" }}>
        <div ref={ledRingRef} className="roulette-led-ring" data-active={spinning || dragging} aria-hidden="true">
          <span className="roulette-tacky-hub">★</span>
          {Array.from({ length: 32 }, (_, index) => {
            const angle = (index / 32) * Math.PI * 2;
            return (
              <span
                key={index}
                className="roulette-led"
                style={{
                  left: `${50 + 47 * Math.sin(angle)}%`,
                  top: `${50 - 47 * Math.cos(angle)}%`,
                  color: ["#ff00ff", "#eaff00", "#00ffff", "#39ff14"][index % 4],
                  animationDelay: `${-index * 0.15}s`,
                }}
              />
            );
          })}
        </div>
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
          aria-label="드래그해서 돌리는 룰렛. 아래 버튼으로도 돌릴 수 있습니다."
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={(event) => endDrag(event)}
          onPointerCancel={(event) => endDrag(event, true)}
          onLostPointerCapture={(event) => endDrag(event, true)}
          style={{ width: "100%", height: "auto", display: "block", touchAction: "none", cursor: spinning ? "wait" : dragging ? "grabbing" : "grab", borderRadius: "50%", border: "5px dashed #FF6600" }}
        />
      </div>
      </div>

      <button
        onClick={() => spin()}
        disabled={spinning || dragging || totalWeight <= 0}
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
          role="status"
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
