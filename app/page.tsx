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
  // ---------- state ----------
  const [animals, setAnimals] = useState<Animals>({
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

  const [isSealed, setIsSealed] = useState(false);

  const [computedResult, setComputedResult] = useState<NorthchildResult | null>(
    null
  );
  const [resultImgReady, setResultImgReady] = useState(false);

  const [fadePhase, setFadePhase] = useState<"none" | "toBlack" | "showResult">(
    "none"
  );

  // ---------- constants ----------
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

  const toWord = (n: number) => numberWords[n] ?? String(n);

  // Fade timing (tweak here)
  const BLACK_FADE_MS = 2200;
  const BLACK_HOLD_MS = 500;
  const IMAGE_FADE_MS = 2200;

  // Fixed HF/GS positions (no meta-adjust mode)
  const HF_POS: { x: number; y: number }[] = [
    { x: 93.6, y: 22.6 },
    { x: 96.1, y: 28.0 },
    { x: 97.6, y: 34.0 },
    { x: 96.2, y: 39.4 },
    { x: 93.7, y: 44.4 },
  ];

  const GS_POS: { x: number; y: number }[] = [
    { x: 86.1, y: 67.1 },
    { x: 83.6, y: 72.6 },
    { x: 82.2, y: 78.2 },
    { x: 83.7, y: 83.9 },
    { x: 86.1, y: 89.0 },
  ];

  // ---------- derived ----------
  const totalAnimalPips = useMemo(
    () => Object.values(animals).reduce((a, b) => a + b, 0),
    [animals]
  );

  const remainingAnimalPips = Math.max(0, maxTotal - totalAnimalPips);
  const isAnimalQuotaMet = totalAnimalPips === maxTotal;

  // ---------- actions ----------
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

  const resetBuild = () => {
    setIsSealed(false);
    setFadePhase("none");
    setComputedResult(null);
    setResultImgReady(false);

    setHfCount(0);
    setGsCount(0);

    setAnimals({
      wolf: 0,
      orca: 0,
      serpent: 0,
      raven: 0,
      owl: 0,
      eagle: 0,
      elk: 0,
      bear: 0,
    });
  };

  const sealFate = () => {
    if (isSealed) return;

    const result = computeNorthchildResult(animals, hfCount, gsCount);
    if (!result.isValid) return;

    setComputedResult(result);
    setIsSealed(true);
    setResultImgReady(false);

    // start fade to black
    setFadePhase("toBlack");

    // preload result image while black is happening
    const src = getResultImagePath(result.winner.id, result.variant);
    const img = new Image();
    img.src = src;

    let imgLoaded = false;
    let minBlackElapsed = false;

    const maybeReveal = () => {
      if (imgLoaded && minBlackElapsed) {
        setResultImgReady(true);
        setFadePhase("showResult");
      }
    };

    img.onload = () => {
      imgLoaded = true;
      maybeReveal();
    };

    window.setTimeout(() => {
      minBlackElapsed = true;
      maybeReveal();
    }, BLACK_FADE_MS + BLACK_HOLD_MS);
  };

  // ---------- render helpers ----------
  const renderRow = (key: AnimalKey) => {
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
          cursor: isSealed ? "default" : "pointer",
          userSelect: "none",
          zIndex: 2,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Pip key={i} active={i < animals[key]} rune={runeFile[key]} />
        ))}
      </div>
    );
  };

  const renderMetaStack = (kind: "hf" | "gs") => {
    const coords = kind === "hf" ? HF_POS : GS_POS;
    const count = kind === "hf" ? hfCount : gsCount;
    const setCount = kind === "hf" ? setHfCount : setGsCount;
    const rune = kind === "hf" ? metaRuneFile.hf : metaRuneFile.gs;

    const inc = () => {
      if (isSealed) return;
      setCount((c) => Math.min(5, c + 1));
    };

    const dec = () => {
      if (isSealed) return;
      setCount((c) => Math.max(0, c - 1));
    };

    return coords.map((p, i) => (
      <div
        key={`${kind}-${i}`}
        onClick={inc}
        onContextMenu={(e) => {
          e.preventDefault();
          dec();
        }}
        style={{
          position: "absolute",
          left: `${p.x}%`,
          top: `${p.y}%`,
          transform: "translate(-50%, -50%)",
          cursor: isSealed ? "default" : "pointer",
          userSelect: "none",
          zIndex: 2,
        }}
        title="Left click adds, right click removes."
      >
        <Pip active={i < count} rune={rune} />
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

  // ---------- UI ----------
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
            zIndex: 0,
          }}
        />

        {/* Animal rows */}
        {animalOrder.map((k) => renderRow(k))}

        {/* HF / GS stacks */}
        {renderMetaStack("hf")}
        {renderMetaStack("gs")}

        {/* Center counter */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "54.3%",
            transform: "translate(-50%, -50%)",
            fontFamily: "var(--font-viking)",
            fontSize: 15,
            letterSpacing: "0.05em",
            color: "#415662",
            textAlign: "center",
            lineHeight: 1.5,
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 2,
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
          onClick={sealFate}
          style={{
            position: "absolute",
            left: "50%",
            top: "95.6%",
            transform: "translate(-50%, -50%)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: isAnimalQuotaMet && !isSealed ? "pointer" : "default",
            opacity: isAnimalQuotaMet ? 1 : 0.15,
            transition: "opacity 0.2s ease",
            pointerEvents: isSealed ? "none" : "auto",
            zIndex: 3,
          }}
          aria-label="And thus the North shall know its child"
        >
          <img
            src="/ui/button-invoke.png"
            alt=""
            style={{ width: 418, height: "auto", display: "block" }}
          />
        </button>

        {/* Overlay: always mounted so opacity can animate */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "black",
            opacity: fadePhase === "none" ? 0 : 1,
            transition: `opacity ${BLACK_FADE_MS}ms ease`,
            zIndex: 50,
            pointerEvents: fadePhase === "none" ? "none" : "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Result container fades in only when ready */}
          <div
            style={{
              textAlign: "center",
              opacity:
                fadePhase === "showResult" && computedResult && resultImgReady
                  ? 1
                  : 0,
              transition: `opacity ${IMAGE_FADE_MS}ms ease`,
            }}
          >
            {computedResult && (
              <>
                <img
                  src={getResultImagePath(
                    computedResult.winner.id,
                    computedResult.variant
                  )}
                  alt=""
                  style={{
                    maxWidth: "92%",
                    height: "auto",
                    borderRadius: 12,
                    display: "block",
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}