"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeNorthchildResult,
  getResultImagePath,
  type NorthchildResult,
  type AnimalKey,
  type Animals
} from "./lib/northchildMechanics";

const maxPerAnimal = 4;
const maxTotal = 15;

const runeFile: Record<AnimalKey, string> = {
  wolf: "wolf", orca: "orca", serpent: "serpent", raven: "raven",
  owl: "owl", eagle: "eagle", elk: "elk", bear: "bear",
};

const metaRuneFile = { hf: "highflame", gs: "gravesong" } as const;

const layout: Record<AnimalKey, { x: number; y: number }> = {
  wolf: { x: 47.6, y: 69.3 }, raven: { x: 73.5, y: 84.2 }, orca: { x: 73.4, y: 69.5 },
  elk: { x: 47.6, y: 84.4 }, eagle: { x: 73.5, y: 27.7 }, serpent: { x: 73.5, y: 42.2 },
  owl: { x: 47.6, y: 42.1 }, bear: { x: 47.6, y: 27.5 },
};

const HF_POS = [ { x: 93.6, y: 22.6 }, { x: 96.1, y: 28.0 }, { x: 97.6, y: 34.0 }, { x: 96.2, y: 39.4 }, { x: 93.7, y: 44.4 } ];
const GS_POS = [ { x: 86.1, y: 67.1 }, { x: 83.6, y: 72.6 }, { x: 82.2, y: 78.2 }, { x: 83.7, y: 83.9 }, { x: 86.1, y: 89.0 } ];

function Pip({ active, rune, size = 30 }: { active: boolean; rune: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img
        src={`/ui/runes/${rune}.svg`}
        alt=""
        style={{
          width: "100%", height: "100%",
          opacity: active ? 0.92 : 0.22,
          filter: active ? "contrast(120%) brightness(65%)" : "contrast(70%) brightness(120%)",
          transition: "all 0.15s ease",
          pointerEvents: "none", userSelect: "none",
        }}
      />
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<1 | 2>(1);
  const [animals, setAnimals] = useState<Animals>({
    wolf: 0, orca: 0, serpent: 0, raven: 0, owl: 0, eagle: 0, elk: 0, bear: 0,
  });
  const [hfCount, setHfCount] = useState(0);
  const [gsCount, setGsCount] = useState(0);
  const [isSealed, setIsSealed] = useState(false);
  const [computedResult, setComputedResult] = useState<NorthchildResult | null>(null);
  const [resultImgReady, setResultImgReady] = useState(false);
  const [fadePhase, setFadePhase] = useState<"none" | "toBlack" | "showResult">("none");

  const totalAnimalPips = useMemo(() => Object.values(animals).reduce((a, b) => a + b, 0), [animals]);
  const isAnimalQuotaMet = totalAnimalPips === 15;

  const increment = (key: AnimalKey) => {
    if (step !== 1 || totalAnimalPips >= 15 || animals[key] >= 4) return;
    setAnimals((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const decrement = (key: AnimalKey) => {
    if (step !== 1 || animals[key] <= 0) return;
    setAnimals((prev) => ({ ...prev, [key]: prev[key] - 1 }));
  };

  const sealFate = () => {
    if (isSealed) return;
    const result = computeNorthchildResult(animals, hfCount, gsCount);
    setComputedResult(result);
    setIsSealed(true);
    setFadePhase("toBlack");

    const src = getResultImagePath(result.winner.id, result.variant);
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setTimeout(() => {
        setResultImgReady(true);
        setFadePhase("showResult");
      }, 2700);
    };
  };

  const renderRow = (key: AnimalKey) => {
    const pos = layout[key];
    return (
      <div
        key={key}
        onClick={() => increment(key)}
        onContextMenu={(e) => { e.preventDefault(); decrement(key); }}
        style={{
          position: "absolute", top: `${pos.y}%`, left: `${pos.x}%`,
          transform: "translate(-50%, -50%)", display: "flex", gap: 14.2,
          cursor: step === 1 ? "pointer" : "default", zIndex: 2,
        }}
      >
        {[0, 1, 2, 3].map((i) => <Pip key={i} active={i < animals[key]} rune={runeFile[key]} />)}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", backgroundColor: "#05070a" }}>
      <div style={{ position: "relative", width: "1200px", aspectRatio: "16 / 9" }}>
        
        {/* Background Swaps based on Step */}
        <img
          src={step === 1 ? "/ui/northchild1.webp" : "/ui/northchild2.webp"}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 0 }}
        />

        {step === 1 && (
          <>
            {Object.keys(layout).map((k) => renderRow(k as AnimalKey))}
            <button
              onClick={() => setStep(2)}
              style={{
                position: "absolute", left: "59.7%", top: "91.8%", transform: "translateX(-50%)",
                opacity: isAnimalQuotaMet ? 1 : 0.2, pointerEvents: isAnimalQuotaMet ? "auto" : "none",
                transition: "opacity 0.8s ease", background: "none", border: "none", cursor: "pointer", zIndex: 3
              }}
            >
              <img src="/ui/button-invoke.png" alt="And thus the North shall know its child" style={{ width: 418 }} />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Meta Stacks for HF/GS */}
            {HF_POS.map((p, i) => (
              <div key={i} onClick={() => setHfCount(i + 1)} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)", zIndex: 2, cursor: "pointer" }}>
                <Pip active={i < hfCount} rune="highflame" />
              </div>
            ))}
            {GS_POS.map((p, i) => (
              <div key={i} onClick={() => setGsCount(i + 1)} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)", zIndex: 2, cursor: "pointer" }}>
                <Pip active={i < gsCount} rune="gravesong" />
              </div>
            ))}

            <button
              onClick={sealFate}
              style={{
                position: "absolute", left: "50%", top: "95.6%", transform: "translateX(-50%)",
                background: "none", border: "none", cursor: "pointer", zIndex: 3
              }}
            >
              <img src="/ui/hfgsbutton.webp" alt="Submit" style={{ width: 418 }} />
            </button>
          </>
        )}

        {/* Fade/Result Overlay (Keep original overlay logic) */}
        <div style={{ position: "fixed", inset: 0, background: "black", opacity: fadePhase === "none" ? 0 : 1, transition: "opacity 2200ms ease", zIndex: 50, pointerEvents: fadePhase === "none" ? "none" : "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
           {computedResult && resultImgReady && (
             <img src={getResultImagePath(computedResult.winner.id, computedResult.variant)} alt="Result" style={{ maxWidth: "92vw", maxHeight: "85vh", borderRadius: 12 }} />
           )}
        </div>
      </div>
    </div>
  );
}
