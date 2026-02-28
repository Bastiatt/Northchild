"use client";

import { useMemo, useState } from "react";
import {
  computeNorthchildResult,
  getResultImagePath,
  type NorthchildResult,
  type AnimalKey,
  type Animals
} from "./lib/northchildMechanics";

// Layout and logic constants
const maxPerAnimal = 4;
const maxTotal = 15;
const animalOrder: AnimalKey[] = ["bear", "owl", "serpent", "eagle", "wolf", "orca", "elk", "raven"];
const numberWords: Record<number, string> = { 0: "None", 1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten", 11: "Eleven", 12: "Twelve", 13: "Thirteen", 14: "Fourteen", 15: "Fifteen" };

const layout: Record<AnimalKey, { x: number; y: number }> = {
  wolf: { x: 47.6, y: 69.3 }, raven: { x: 73.5, y: 84.2 }, orca: { x: 73.4, y: 69.5 },
  elk: { x: 47.6, y: 84.4 }, eagle: { x: 73.5, y: 27.7 }, serpent: { x: 73.5, y: 42.2 },
  owl: { x: 47.6, y: 42.1 }, bear: { x: 47.6, y: 27.5 },
};

// Individually sized and positioned augmentation pips
const HF_POS = [
  { x: 32, y: 76.3, size: 34 },
  { x: 26.95, y: 68.9, size: 40 },
  { x: 23.71, y: 58.8, size: 46 },
  { x: 26.5, y: 49.3, size: 56 },
  { x: 31.25, y: 39.2, size: 80 },
];

const GS_POS = [
  { x: 86.8, y: 39.2, size: 34 },
  { x: 91.25, y: 45.65, size: 40 },
  { x: 93.96, y: 56.05, size: 46 },
  { x: 91.75, y: 65.6, size: 56 },
  { x: 88.1, y: 76.4, size: 80 },
];

function Pip({ active, rune, size = 28 }: { active: boolean; rune: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src={`/ui/runes/${rune}.svg`} alt="" style={{ width: "100%", height: "100%", opacity: active ? 0.92 : 0.32, filter: active ? "contrast(120%) brightness(65%)" : "contrast(70%) brightness(120%)", transition: "all 0.15s ease", pointerEvents: "none" }} />
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<1 | 2>(1);
  const [animals, setAnimals] = useState<Animals>({ wolf: 0, orca: 0, serpent: 0, raven: 0, owl: 0, eagle: 0, elk: 0, bear: 0 });
  const [hfCount, setHfCount] = useState(0);
  const [gsCount, setGsCount] = useState(0);
  const [fadePhase, setFadePhase] = useState<"none" | "toBlack" | "showResult">("none");
  const [computedResult, setComputedResult] = useState<NorthchildResult | null>(null);

  const totalAnimalPips = useMemo(() => Object.values(animals).reduce((a, b) => a + b, 0), [animals]);
  const toWord = (n: number) => numberWords[n] ?? String(n);

  const increment = (key: AnimalKey) => { if (step === 1 && totalAnimalPips < 15 && animals[key] < 4) setAnimals(prev => ({ ...prev, [key]: prev[key] + 1 })); };
  const decrement = (key: AnimalKey) => { if (step === 1 && animals[key] > 0) setAnimals(prev => ({ ...prev, [key]: prev[key] - 1 })); };

  const handleStepTransition = () => {
    if (totalAnimalPips !== 15) return;
    setFadePhase("toBlack");
    setTimeout(() => {
      setStep(2);
      setTimeout(() => { setFadePhase("none"); }, 100);
    }, 2200);
  };

  const sealFate = () => {
    const result = computeNorthchildResult(animals, hfCount, gsCount);
    setComputedResult(result);
    setFadePhase("toBlack");
    setTimeout(() => { setFadePhase("showResult"); }, 2500);
  };

  const renderMetaStack = (kind: "hf" | "gs") => {
    const coords = kind === "hf" ? HF_POS : GS_POS;
    const count = kind === "hf" ? hfCount : gsCount;
    const setCount = kind === "hf" ? setHfCount : setGsCount;
    const rune = kind === "hf" ? "highflame" : "gravesong";

    return coords.map((p, i) => (
      <div
        key={`${kind}-${i}`}
        onClick={() => setCount(i + 1)}
        onContextMenu={(e) => { e.preventDefault(); setCount(0); }}
        style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)", cursor: "pointer", zIndex: 2 }}
      >
        <Pip active={i < count} rune={rune} size={p.size} />
      </div>
    ));
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", backgroundColor: "#05070a", userSelect: "none", WebkitUserSelect: "none" }}>
      <div style={{ position: "relative", width: "1200px", aspectRatio: "16 / 9" }}>
        
        <img src={step === 1 ? "/ui/northchild1.webp" : "/ui/northchild2.webp"} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }} />

        {step === 1 && (
          <>
            {animalOrder.map((k) => (
              <div key={k} onClick={() => increment(k)} onContextMenu={(e) => { e.preventDefault(); decrement(k); }} style={{ position: "absolute", top: `${layout[k].y}%`, left: `${layout[k].x}%`, transform: "translate(-50%, -50%)", display: "flex", gap: 12, cursor: "pointer", zIndex: 2 }}>
                {[0, 1, 2, 3].map((i) => <Pip key={i} active={i < animals[k]} rune={k} />)}
              </div>
            ))}

            <div style={{ position: "absolute", left: "60%", top: "53.9%", transform: "translate(-50%, -50%)", fontFamily: "var(--font-viking)", fontSize: 16, letterSpacing: "0.075em", color: "#415662", textAlign: "center", lineHeight: 1.2, userSelect: "none", pointerEvents: "none", zIndex: 2 }}>
              <div>Fifteen spirits to name her fate</div>
              <div style={{ marginTop: 6 }}>
                {toWord(totalAnimalPips)} chosen&nbsp;&nbsp;&nbsp;
                {toWord(15 - totalAnimalPips)} remain
              </div>
            </div>

            <button onClick={handleStepTransition} style={{ position: "absolute", left: "60%", top: "91.8%", transform: "translateX(-50%)", opacity: totalAnimalPips === 15 ? 1 : 0.25, transition: "opacity 0.5s ease", background: "none", border: "none", cursor: "pointer", zIndex: 3 }}>
              <img src="/ui/button-invoke.png" alt="Invoke" style={{ width: 418 }} />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {renderMetaStack("hf")}
            {renderMetaStack("gs")}
            <button onClick={sealFate} style={{ position: "absolute", left: "60.2%", top: "90.1%", transform: "translateX(-50%)", background: "none", border: "none", cursor: "pointer", zIndex: 3 }}>
              <img src="/ui/hfgsbutton.webp" alt="Submit" style={{ width: 62 }} />
            </button>
          </>
        )}

        <div style={{ position: "fixed", inset: 0, background: "black", opacity: fadePhase === "toBlack" || fadePhase === "showResult" ? 1 : 0, transition: "opacity 2200ms ease", zIndex: 50, pointerEvents: fadePhase === "none" ? "none" : "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {computedResult && (
            <div style={{ opacity: fadePhase === "showResult" ? 1 : 0, transition: "opacity 2000ms ease" }}>
               <img src={getResultImagePath(computedResult.winner.id, computedResult.variant)} alt="Result" style={{ maxWidth: "92vw", maxHeight: "85vh", borderRadius: 12 }} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}