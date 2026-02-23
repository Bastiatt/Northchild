"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeNorthchildResult,
  getResultImagePath,
  type NorthchildResult
} from "./lib/northchildMechanics";

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
  
type Animals = Record<AnimalKey, number>;
 
type BuildSnapshot = {
  animals: Animals;
  hf: number;
  gs: number;
};

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

  const numberWords: Record<number, string> = {
  0: "None",
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
  10: "Ten",
  11: "Eleven",
  12: "Twelve",
  13: "Thirteen",
  14: "Fourteen",
  15: "Fifteen",
};

// state hooks should live together
const [computedResult, setComputedResult] = useState<NorthchildResult | null>(null);

const resetBuild = () => {
  setIsSealed(false);
  setFadePhase("none");
  setComputedResult(null);
  setSubmittedBuild(null); // if you have this state
  setHfCount(0);
  setGsCount(0);
  setAnimals({
    wolf: 0, orca: 0, serpent: 0, raven: 0,
    owl: 0, eagle: 0, elk: 0, bear: 0,
  });
};

const toWord = (n: number) => numberWords[n] ?? String(n);
  
  const [hfCount, setHfCount] = useState(0);
  const [gsCount, setGsCount] = useState(0);

  const [metaAdjustMode, setMetaAdjustMode] = useState(false);
  const [metaSelected, setMetaSelected] = useState<MetaSel>({ kind: "hf", i: 0 });

  const [submittedBuild, setSubmittedBuild] = useState<BuildSnapshot | null>(null);

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

  const REQUIRED_ANIMAL_PIPS = maxTotal; // keep using your existing 15 for now

  const totalAnimalPips = useMemo(
  () => Object.values(animals).reduce((a, b) => a + b, 0),
  [animals]
  );

  const remainingAnimalPips = Math.max(0, REQUIRED_ANIMAL_PIPS - totalAnimalPips);

  const isAnimalQuotaMet = totalAnimalPips === REQUIRED_ANIMAL_PIPS;

  const increment = (key: AnimalKey) => {
    if (isSealed) return;
    if (totalAnimalPips >= maxTotal) return;
    if (animals[key] >= maxPerAnimal) return;
    setAnimals((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const decrement = (key: AnimalKey) => {
    if (isSealed) return;
    if (animals[key] <= 0) return;
    setAnimals((prev) => ({ ...prev, [key]: prev[key] - 1 }));
  };

  const sealFate = () => {
    console.log("clicked");

    try {
      // 1) Compute first (no state changes yet)
      const result = computeNorthchildResult(animals, hfCount, gsCount);

      // 2) If invalid, do NOT seal. Just log and exit.
      if (!result.isValid) {
        console.warn("Invalid build:", result.errors);
        return;
      }

      // 3) Persist the result, then seal, then fade
      setComputedResult(result);
      setIsSealed(true);

      setFadePhase("toBlack");
      window.setTimeout(() => {
        setFadePhase("showResult");
      }, 700);
    } catch (err) {
      console.error("sealFate failed:", err);
    }
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

  const inc = () => {
    if (isSealed) return;
    setCount((c: number) => Math.min(5, c + 1));
  };

  const dec = () => {
    if (isSealed) return;
    setCount((c: number) => Math.max(0, c - 1));
  };

  return coords.map((pos, i) => (
    <div
      key={`${kind}-${i}`}
      onClick={(e) => {
        if (metaAdjustMode) return; // in adjust mode, do not change counts
        inc();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (metaAdjustMode) return;
        dec();
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
        zIndex:
          metaAdjustMode && metaSelected.kind === kind && metaSelected.i === i
            ? 10
            : 1,
        outline:
          metaAdjustMode && metaSelected.kind === kind && metaSelected.i === i
            ? "2px solid cyan"
            : "none",
        userSelect: "none",
      }}
      title="Left click adds, right click removes."
    >
      <Pip active={i < count} rune={rune} size={32} />
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
          width: "1200px",
          maxWidth: "100%",
          aspectRatio: "16 / 9",
          margin: "0 auto",
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
            top: "54.3%",
            transform: "translate(-50%, -50%)",
            fontFamily: "var(--font-viking)",
            fontSize: 15.0,
            letterSpacing: "0.05em",
            color: "#415662",
            textAlign: "center",
            lineHeight: 1.5,
            userSelect: "none",
            pointerEvents: "none",
        }}
>
  <div>Fifteen spirits to name her fate</div>

  <div style={{ marginTop: 6 }}>
    {toWord(totalAnimalPips)} chosen&nbsp;&nbsp;&nbsp;
    {toWord(remainingAnimalPips)} remain
  </div>
</div>

        {/* Bottom seal button */}
        <button
          onClick={() => {
          console.log("CLICKED");
          sealFate();
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: "95.6%",                // your tuned position
            transform: "translate(-50%, -50%)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: isAnimalQuotaMet ? "pointer" : "default",
            opacity: isAnimalQuotaMet ? 1 : 0.15,
            transition: "opacity 0.2s ease",
          }}
          aria-label="And thus the North shall know its child"
        >
          <img
            src="/ui/button-invoke.png"
            alt=""
            style={{
              display: "block",
              width: 450,              // set to your designed pixel width
              height: "auto",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        </button>

        {fadePhase === "showResult" && computedResult && (
          <div style={{ textAlign: "center" }}>
            <img
              src={getResultImagePath(
                computedResult.winner.id,
                computedResult.variant
              )}
              alt={computedResult.winner.displayName}
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: 12,
              }}
            />

            <button
              onClick={resetBuild}
              style={{
                marginTop: 28,
                padding: "12px 18px",
                fontSize: 16,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.10)",
                color: "white",
                cursor: "pointer",
              }}
            >
              New Build
            </button>
          </div>
        )}
      </div>
    </div>
  );
}