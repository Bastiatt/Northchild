"use client";

import { useEffect, useMemo, useState } from "react";

const maxPerAnimal = 4;
const maxTotal = 15;

type AnimalKey =
  | "wolf"
  | "orca"
  | "serpent"
  | "raven"
  | "owl"
  | "eagle"
  | "elk"
  | "bear";

const runeFile: Record<AnimalKey, string> = {
  wolf: "wolf",
  orca: "orca",
  serpent: "serpent",
  raven: "raven",
  owl: "owl",
  eagle: "eagle",
  elk: "elk",
  bear: "bear",
};

const metaRuneFile = {
  hf: "highflame",
  gs: "gravesong",
} as const;

function Pip({ active, rune }: { active: boolean; rune: string }) {
  return (
    <div
      style={{
        width: "26px",
        height: "26px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <img
        src={`/ui/runes/${rune}.svg`}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          opacity: active ? 0.95 : 0.22,
          filter: active
            ? "contrast(120%) brightness(65%)"
            : "contrast(70%) brightness(120%)",
          transition: "all 0.15s ease",
        }}
      />
    </div>
  );
}

export default function Home() {
  const [animals, setAnimals] = useState<Record<AnimalKey, number>>({
    wolf: 0,
    orca: 0,
    serpent: 0,
    raven: 0,
    owl: 0,
    eagle: 0,
    elk: 0,
    bear: 0,
  });

const [hfCount, setHfCount] = useState(0);
const [gsCount, setGsCount] = useState(0);

  // Alignment state
  const [alignMode, setAlignMode] = useState(true);
  const [selected, setSelected] = useState<AnimalKey>("wolf");
const layout: Record<AnimalKey, { x: number; y: number }> = {
  wolf: { x: 37.4, y: 69.3 },
  raven: { x: 61.3, y: 84.2 },
  orca: { x: 61.2, y: 69.5 },
  elk: { x: 37.4, y: 84.4 },
  eagle: { x: 61.2, y: 27.7 },
  serpent: { x: 61, y: 42.2 },
  owl: { x: 37.2, y: 42.1 },
  bear: { x: 37, y: 27.5 },
};

  const total = useMemo(
    () => Object.values(animals).reduce((a, b) => a + b, 0),
    [animals]
  );
  const remaining = maxTotal - total;
  const isReady = total === maxTotal;

  const increment = (key: AnimalKey) => {
    if (total >= maxTotal) return;
    if (animals[key] >= maxPerAnimal) return;
    setAnimals((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const decrement = (key: AnimalKey) => {
    if (animals[key] <= 0) return;
    setAnimals((prev) => ({ ...prev, [key]: prev[key] - 1 }));
  };

  const sealFate = () => {
  if (total !== maxTotal) return;
  if (isSealed) return;

  setIsSealed(true);
  setFadePhase("toBlack");

  // Fade to black, pause, then reveal result
  window.setTimeout(() => {
    setFadePhase("showResult");
  }, 1900); // ~700ms fade + ~1200ms pause
};

  // Keyboard nudging for alignment mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "a") {
        setAlignMode((v) => !v);
        return;
      }

      if (!alignMode) return;

      const step = e.shiftKey ? 1 : 0.1;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        setLayout((prev) => {
          const cur = prev[selected];
          let { x, y } = cur;

          if (e.key === "ArrowUp") y -= step;
          if (e.key === "ArrowDown") y += step;
          if (e.key === "ArrowLeft") x -= step;
          if (e.key === "ArrowRight") x += step;

          // keep sane bounds
          x = Math.max(0, Math.min(100, Number(x.toFixed(2))));
          y = Math.max(0, Math.min(100, Number(y.toFixed(2))));

          return { ...prev, [selected]: { x, y } };
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [alignMode, selected]);

  const renderRow = (key: AnimalKey) => {
    const count = animals[key];
    const pos = layout[key];
    const isSelected = key === selected;

    return (
      <div
        key={key}
        onClick={() => {
          if (alignMode) {
            setSelected(key);
          } else {
            increment(key);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!alignMode) decrement(key);
        }}
        title={
          alignMode
            ? "Alignment mode: click to select row, use arrow keys to nudge. Press A to toggle."
            : "Left click adds, right click removes."
        }
        style={{
          position: "absolute",
          top: `${pos.y}%`,
          left: `${pos.x}%`,
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: "12px",
          cursor: alignMode ? "crosshair" : "pointer",
          userSelect: "none",

          // Alignment guides
          outline: alignMode
            ? isSelected
              ? "2px solid rgba(255,255,255,0.55)"
              : "1px dashed rgba(255,255,255,0.25)"
            : "none",
          backgroundColor: alignMode ? "rgba(255,255,255,0.03)" : "transparent",
          padding: alignMode ? "6px" : "0px",
          borderRadius: "6px",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Pip key={i} active={i < count} rune={runeFile[key]} />
        ))}
      </div>
    );
  };

   const renderStack = (
  kind: "hf" | "gs",
  x: number,
  y: number,
  count: number,
  setCount: (n: number) => void
) => {
  const max = 5;

  const inc = () => {
    if (isSealed) return;
    if (count >= max) return;
    setCount(count + 1);
  };

  const dec = () => {
    if (isSealed) return;
    if (count <= 0) return;
    setCount(count - 1);
  };

  return (
    <div
      onClick={inc}
      onContextMenu={(e) => {
        e.preventDefault();
        dec();
      }}
      title={kind === "hf" ? "High Flames" : "Grave Songs"}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const active = i < count;
        const rune = kind === "hf" ? metaRuneFile.hf : metaRuneFile.gs;

        return (
          <div
            key={i}
            style={{
              width: "26px",
              height: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <img
              src={`/ui/runes/${rune}.svg`}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                opacity: active ? 0.95 : 0.22,
                filter: active
                  ? "contrast(120%) brightness(65%)"
                  : "contrast(70%) brightness(120%)",
                transition: "all 0.15s ease",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

{renderStack("hf", 86.5, 46.5, hfCount, setHfCount)}
{renderStack("gs", 86.5, 73.0, gsCount, setGsCount)}

  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
  style={{
    position: "relative",
    width: "min(100%, 1400px)",
    aspectRatio: "16 / 9",
    backgroundColor: "#0a0a0a",
    overflow: "hidden",
  }}
>
  {/* Background image layer */}
  <img
    src="/ui/northchild-gate-clean.png"
    alt=""
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "contain",
      objectPosition: "center",
      pointerEvents: "none",
    }}
  />
        {/* Rows */}
        {(Object.keys(layout) as AnimalKey[]).map((k) => renderRow(k))}

        {/* Center counter (temporary; your art already contains this) */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "Viking, serif",
            fontSize: "22px",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.75)",
            userSelect: "none",
            display: alignMode ? "none" : "block",
          }}
        >
          {remaining} REMAIN
        </div>

        {/* Bottom inscription (temporary) */}
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "14px 28px",
            fontFamily: "Viking, serif",
            fontSize: "18px",
            letterSpacing: "0.1em",
            border: "1px solid rgba(255,255,255,0.3)",
            color: isReady ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.30)",
            backgroundColor: isReady
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.02)",
            transition: "all 0.25s ease",
            userSelect: "none",
            display: alignMode ? "none" : "block",
          }}
        >
          AND THUS THE NORTH SHALL KNOW ITS CHILD
        </div>

        {/* Alignment HUD */}
        <div
          style={{
            position: "absolute",
            top: "2%",
            left: "2%",
            padding: "10px 12px",
            backgroundColor: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "10px",
            color: "rgba(255,255,255,0.85)",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: 1.35,
            userSelect: "none",
          }}
        >
          <div>ALIGN MODE: {alignMode ? "ON" : "OFF"} (press A)</div>
          <div>Selected: {selected}</div>
          <div>
            x: {layout[selected].x}% | y: {layout[selected].y}%
          </div>
          <div>Arrow keys nudge (Shift = bigger step)</div>
          <div>When aligned: press A to test clicking again</div>
        </div>
      </div>
    </main>
  );
}