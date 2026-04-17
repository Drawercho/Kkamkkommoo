"use client";

import { useState } from "react";
import Roulette from "./components/Roulette";
import SliceEditor, { Slice } from "./components/SliceEditor";

const DEFAULT_SLICES: Slice[] = [
  { label: "항목 1", weight: 1 },
  { label: "항목 2", weight: 1 },
  { label: "항목 3", weight: 1 },
  { label: "항목 4", weight: 1 },
  { label: "항목 5", weight: 1 },
  { label: "항목 6", weight: 1 },
  { label: "항목 7", weight: 1 },
  { label: "항목 8", weight: 1 },
];

export default function Home() {
  const [slices, setSlices] = useState<Slice[]>(DEFAULT_SLICES);

  return (
    <main
      className="min-h-screen flex flex-col items-center py-8 px-4 gap-8"
      style={{
        fontFamily: "'Comic Sans MS', cursive",
        background: "repeating-linear-gradient(45deg, #FF69B4 0px, #FF69B4 10px, #FFFF00 10px, #FFFF00 20px)",
        minHeight: "100vh",
      }}
    >
      <header
        className="text-center py-3 px-8"
        style={{
          background: "#00FF00",
          border: "8px double #FF0000",
          boxShadow: "12px 12px 0 #0000FF, -6px -6px 0 #FF00FF",
          transform: "rotate(-1deg)",
        }}
      >
        <h1
          className="text-4xl font-black"
          style={{
            color: "#FF0000",
            textShadow: "3px 3px #FFFF00, -2px -2px #0000FF",
            textDecoration: "underline overline",
            letterSpacing: "0.1em",
          }}
        >
          🎡 최고의 룰렛!! 🎡
        </h1>
        <p
          className="text-sm mt-1"
          style={{
            color: "#000080",
            textDecoration: "line-through",
          }}
        >
          세상에서 제일 못생긴 룰렛 웹사이트
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-5xl">
        <div
          className="p-4"
          style={{
            background: "#FF6600",
            border: "6px solid #0000FF",
            boxShadow: "10px 10px 0 #FF00FF",
          }}
        >
          <Roulette slices={slices} />
        </div>
        <SliceEditor slices={slices} onChange={setSlices} />
      </div>

      <footer
        className="text-xs text-center"
        style={{
          color: "#000080",
          fontFamily: "'Comic Sans MS', cursive",
          background: "#FFFF00",
          padding: "4px 12px",
          border: "2px dashed #FF0000",
        }}
      >
        ★ Made with 💔 and zero taste ★
      </footer>
    </main>
  );
}
