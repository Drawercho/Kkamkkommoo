"use client";

export interface Slice {
  label: string;
  weight: number;
}

interface SliceEditorProps {
  slices: Slice[];
  onChange: (slices: Slice[]) => void;
}

export default function SliceEditor({ slices, onChange }: SliceEditorProps) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.weight), 0);

  const updateLabel = (idx: number, val: string) => {
    const next = [...slices];
    next[idx] = { ...next[idx], label: val };
    onChange(next);
  };

  const updateWeight = (idx: number, val: number) => {
    const next = [...slices];
    next[idx] = { ...next[idx], weight: isNaN(val) ? 0 : Math.max(0, val) };
    onChange(next);
  };

  const setCount = (n: number) => {
    if (n < 2 || n > 16) return;
    if (n > slices.length) {
      onChange([
        ...slices,
        ...Array.from({ length: n - slices.length }, (_, i) => ({
          label: `항목 ${slices.length + i + 1}`,
          weight: 1,
        })),
      ]);
    } else {
      onChange(slices.slice(0, n));
    }
  };

  const resetWeights = () => {
    onChange(slices.map((s) => ({ ...s, weight: 1 })));
  };

  return (
    <div
      className="w-full max-w-sm p-4"
      style={{
        fontFamily: "'Comic Sans MS', cursive",
        background: "#00FF00",
        border: "6px ridge #FF00FF",
        boxShadow: "10px 10px 0 #0000FF",
      }}
    >
      <h2
        className="text-xl font-bold mb-3 text-center"
        style={{
          color: "#FF0000",
          textDecoration: "underline overline",
          textShadow: "2px 2px #FFFF00",
          background: "#FF69B4",
          padding: "4px",
          border: "3px dotted #0000FF",
        }}
      >
        ✏️ 조각 설정 ✏️
      </h2>

      <div className="flex items-center gap-2 mb-3">
        <label
          className="font-bold text-sm"
          style={{ color: "#000080", textDecoration: "underline" }}
        >
          조각 수:
        </label>
        <button
          onClick={() => setCount(slices.length - 1)}
          className="w-8 h-8 font-bold text-lg"
          style={{
            background: "#FF0000",
            color: "#FFFF00",
            border: "3px solid #000",
            boxShadow: "3px 3px 0 #0000FF",
            cursor: "pointer",
          }}
        >
          −
        </button>
        <span
          className="text-2xl font-bold px-3"
          style={{ color: "#FF00FF", textShadow: "1px 1px #000" }}
        >
          {slices.length}
        </span>
        <button
          onClick={() => setCount(slices.length + 1)}
          className="w-8 h-8 font-bold text-lg"
          style={{
            background: "#0000FF",
            color: "#FFFF00",
            border: "3px solid #000",
            boxShadow: "3px 3px 0 #FF0000",
            cursor: "pointer",
          }}
        >
          +
        </button>
        <span
          className="text-xs ml-1"
          style={{ color: "#666", fontFamily: "sans-serif" }}
        >
          (2~16)
        </span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-3 text-xs font-bold" style={{ color: "#000080" }}>
          <span style={{ width: "1.5rem" }}>#</span>
          <span className="flex-1">항목</span>
          <span style={{ width: "3.5rem" }}>가중치</span>
          <span style={{ width: "2.5rem", textAlign: "right" }}>확률</span>
        </div>
        <button
          onClick={resetWeights}
          className="text-xs px-2 py-0.5 font-bold"
          style={{
            background: "#FFFF00",
            color: "#FF0000",
            border: "2px solid #000",
            cursor: "pointer",
          }}
        >
          균등
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {slices.map((s, i) => {
          const w = Math.max(0, s.weight);
          const pct = total > 0 ? Math.round((w / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-6 text-right font-bold text-sm shrink-0"
                style={{ color: "#FF6600" }}
              >
                {i + 1}.
              </span>
              <input
                type="text"
                value={s.label}
                onChange={(e) => updateLabel(i, e.target.value)}
                className="flex-1 px-2 py-1 text-sm min-w-0"
                style={{
                  fontFamily: "'Comic Sans MS', cursive",
                  background: i % 2 === 0 ? "#FFFF00" : "#FF69B4",
                  border: "3px dashed #0000FF",
                  color: "#000080",
                  outline: "none",
                  boxShadow: "inset 2px 2px 0 #FF0000",
                }}
              />
              <input
                type="number"
                min={0}
                step={1}
                value={s.weight}
                onChange={(e) => updateWeight(i, parseFloat(e.target.value))}
                className="px-1 py-1 text-sm text-center"
                style={{
                  width: "3.5rem",
                  fontFamily: "'Comic Sans MS', cursive",
                  background: "#00FFFF",
                  border: "3px double #FF00FF",
                  color: "#FF0000",
                  outline: "none",
                  fontWeight: "bold",
                }}
              />
              <span
                className="text-xs font-bold text-right"
                style={{
                  width: "2.5rem",
                  color: "#FF0000",
                  textShadow: "1px 1px #FFFF00",
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      {total <= 0 && (
        <p
          className="mt-3 text-xs text-center font-bold p-2"
          style={{
            background: "#FF0000",
            color: "#FFFF00",
            border: "2px dashed #000",
          }}
        >
          ⚠️ 모든 가중치가 0입니다. 최소 1개 항목에 1 이상을 입력하세요!
        </p>
      )}
    </div>
  );
}
