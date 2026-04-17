"use client";

interface SliceEditorProps {
  slices: string[];
  onChange: (slices: string[]) => void;
}

export default function SliceEditor({ slices, onChange }: SliceEditorProps) {
  const updateSlice = (idx: number, val: string) => {
    const next = [...slices];
    next[idx] = val;
    onChange(next);
  };

  const setCount = (n: number) => {
    if (n < 2 || n > 16) return;
    if (n > slices.length) {
      onChange([...slices, ...Array.from({ length: n - slices.length }, (_, i) => `항목 ${slices.length + i + 1}`)]);
    } else {
      onChange(slices.slice(0, n));
    }
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

      <div className="flex items-center gap-2 mb-4">
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

      <div className="flex flex-col gap-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-6 text-right font-bold text-sm shrink-0"
              style={{ color: "#FF6600" }}
            >
              {i + 1}.
            </span>
            <input
              type="text"
              value={s}
              onChange={(e) => updateSlice(i, e.target.value)}
              className="flex-1 px-2 py-1 text-sm"
              style={{
                fontFamily: "'Comic Sans MS', cursive",
                background: i % 2 === 0 ? "#FFFF00" : "#FF69B4",
                border: "3px dashed #0000FF",
                color: "#000080",
                outline: "none",
                boxShadow: "inset 2px 2px 0 #FF0000",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
