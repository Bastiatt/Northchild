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

type MetaKind = "hf" | "gs";
type MetaIndex = 0 | 1 | 2 | 3 | 4;
type MetaSel = { kind: MetaKind; i: MetaIndex };
  
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

// Locked, final alignment numbers you provided
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

function Pip({ active, rune, size = 28 }: { active: boolean; rune: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={`/ui/runes/${rune}.svg`}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          opacity: active ? 0.92 : 0.22,
          filter: active
            ? "contrast(120%) brightness(65%)"
            : "contrast(70%) brightness(120%)",
          transition: "all 0.15s ease",
          pointerEvents: "none",
          userSelect: "none",
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

  const [metaAdjustMode, setMetaAdjustMode] = useState(false);
  const [metaSelected, setMetaSelected] = useState<MetaSel>({ kind: "hf", i: 0 });

// Starting guesses. You will nudge these onto the printed arc marks.
const [hfPos, setHfPos] = useState<{ x: number; y: number }[]>([
  { x: 93.6, y: 22.6 },
  { x: 96.1, y: 28.0 },
  { x: 97.6, y: 34.0 },
  { x: 96.2, y: 39.4 },
  { x: 93.7, y: 44.4 },
]);

const [gsPos, setGsPos] = useState<{ x: number; y: number }[]>([
  { x: 86.1, y: 67.1 },
  { x: 83.6, y: 72.6 },
  { x: 82.2, y: 78.2 },
  { x: 83.7, y: 83.9 },
  { x: 86.1, y: 89.0 },
]);

  const [isSealed, setIsSealed] = useState(false);
  const [fadePhase, setFadePhase] = useState<"none" | "toBlack" | "showResult">(
    "none"
  );

  const total = useMemo(
    () => Object.values(animals).reduce((a, b) => a + b, 0),
    [animals]
  );

  const remaining = maxTotal - total;
  const isReady = total === maxTotal;

  const increment = (key: AnimalKey) => {
    if (isSealed) return;
    if (total >= maxTotal) return;
    if (animals[key] >= maxPerAnimal) return;
    setAnimals((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const decrement = (key: AnimalKey) => {
    if (isSealed) return;
    if (animals[key] <= 0) return;
    setAnimals((prev) => ({ ...prev, [key]: prev[key] - 1 }));
  };

  const sealFate = () => {
    if (!isReady) return;
    if (isSealed) return;

    setIsSealed(true);
    setFadePhase("toBlack");

    window.setTimeout(() => {
      setFadePhase("showResult");
    }, 1900);
  };

  useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();

    // Toggle meta adjust mode
    if (k === "m") {
      setMetaAdjustMode((v) => !v);
      return;
    }

    // Export positions
    if (k === "e") {
      if (!metaAdjustMode) return;
      console.log("HF_POS =", JSON.stringify(hfPos, null, 2));
      console.log("GS_POS =", JSON.stringify(gsPos, null, 2));
      alert("HF/GS positions printed to console.");
      return;
    }

    if (!metaAdjustMode) return;

    const step = e.shiftKey ? 1 : 0.1;

    if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
      e.preventDefault();

      const bump = (setArr: any) => {
        setArr((prev: { x: number; y: number }[]) => {
          const next = prev.map((p) => ({ ...p }));
          const idx = metaSelected.i;
          let { x, y } = next[idx];

          if (k === "arrowup") y -= step;
          if (k === "arrowdown") y += step;
          if (k === "arrowleft") x -= step;
          if (k === "arrowright") x += step;

          next[idx] = {
            x: Math.max(0, Math.min(100, Number(x.toFixed(2)))),
            y: Math.max(0, Math.min(100, Number(y.toFixed(2)))),
          };
          return next;
        });
      };

      if (metaSelected.kind === "hf") bump(setHfPos);
      else bump(setGsPos);
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [metaAdjustMode, metaSelected, hfPos, gsPos]);

  const renderRow = (key: AnimalKey) => {
    const count = animals[key];
    const pos = layout[key];

    return (
      <div
        key={key}
        onClick={() => increment(key)}
        onContextMenu={(e) => {
          e.preventDefault();
          decrement(key);
        }}
        title="Left click adds, right click removes."
        style={{
          position: "absolute",
          top: `${pos.y}%`,
          left: `${pos.x}%`,
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: 12,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Pip key={i} active={i < count} rune={runeFile[key]} />
        ))}
      </div>
    );
  };

  const renderStack = (kind: "hf" | "gs") => {
    const coords = kind === "hf" ? hfPos : gsPos;
    const count = kind === "hf" ? hfCount : gsCount;
    const setCount = kind === "hf" ? setHfCount : setGsCount;
    const rune = kind === "hf" ? metaRuneFile.hf : metaRuneFile.gs;

    return coords.map((pos, i) => (
      <div
        key={`${kind}-${i}`}
        onClick={() => {
          if (isSealed) return;
          // Toggle logic: click the current max to decrease, click higher to increase
          setCount(i + 1 === count ? i : i + 1);
        }}
        onMouseEnter={() => {
          if (metaAdjustMode) setMetaSelected({ kind, i: i as MetaIndex });
        }}
        style={{
          position: "absolute",
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: "translate(-50%, -50%)",
          cursor: "pointer",
          zIndex: metaAdjustMode && metaSelected.kind === kind && metaSelected.i === i ? 10 : 1,
          outline: metaAdjustMode && metaSelected.kind === kind && metaSelected.i === i 
            ? "2px solid cyan" 
            : "none",
        }}
      >
        <Pip active={i < count} rune={rune} size={32}
      />
      </div>
    ));
  };

  const animalOrder: AnimalKey[] = [
    "bear",
    "owl",
    "serpent",
    "eagle",
    "wolf",
    "orca",
    "elk",
    "raven",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        backgroundColor: "#05070a",
        padding: 24,
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
            userSelect: "none",
          }}
        />

        {/* Animal rows */}
        {animalOrder.map((k) => renderRow(k))}

        {/* HF / GS pips (temporary vertical stack) */}
        {renderStack("hf")}    
        {renderStack("gs")}

        {/* Center counter (temporary; your art already contains this) */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            fontFamily: "Viking, serif",
            fontSize: 22,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 2px 10px rgba(0,0,0,0.55)",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {remaining} REMAIN
        </div>

        {/* Bottom seal button */}
        <button
          onClick={sealFate}
          disabled={!isReady || isSealed}
          style={{
            position: "absolute",
            bottom: "7.5%",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "14px 28px",
            fontFamily: "Viking, serif",
            fontSize: 18,
            letterSpacing: "0.1em",
            borderRadius: 10,
            border: isReady
              ? "1px solid rgba(180,210,255,0.55)"
              : "1px solid rgba(255,255,255,0.22)",
            color: isReady
              ? "rgba(215,235,255,0.95)"
              : "rgba(255,255,255,0.28)",
            background: isReady
              ? "linear-gradient(180deg, rgba(35,70,115,0.55), rgba(20,40,70,0.55))"
              : "rgba(255,255,255,0.03)",
            boxShadow: isReady
              ? "inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 18px rgba(0,0,0,0.35)"
              : "inset 0 1px 0 rgba(255,255,255,0.06)",
            cursor: isReady && !isSealed ? "pointer" : "default",
            transition: "all 0.25s ease",
            userSelect: "none",
          }}
        >
          AND THUS THE NORTH SHALL KNOW ITS CHILD
        </button>

        {/* Fade overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#000",
            opacity: fadePhase === "toBlack" ? 1 : 0,
            transition: "opacity 0.7s ease",
            pointerEvents: fadePhase === "none" ? "none" : "auto",
          }}
        />

        {/* Placeholder result reveal */}
        {fadePhase === "showResult" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.9)",
              fontFamily: "Viking, serif",
              letterSpacing: "0.1em",
              fontSize: 26,
              backgroundColor: "#000",
            }}
          >
            RESULT WILL APPEAR HERE
          </div>
        )}
      </div>
    </div>
  );
}