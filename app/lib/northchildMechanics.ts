// app/lib/northchildMechanics.ts

export type AnimalKey =
  | "wolf"
  | "orca"
  | "serpent"
  | "raven"
  | "owl"
  | "eagle"
  | "elk"
  | "bear";

export type Animals = Record<AnimalKey, number>;

export type AxisKey =
  | "Kinship"
  | "Power"
  | "Endurance"
  | "Honor"
  | "Insight"
  | "Silence"
  | "Voyage"
  | "Trade"
  | "Strength"
  | "Hearth"
  | "Cunning"
  | "Omen"
  | "Glory"
  | "Law"
  | "Craft"
  | "Shadow";

export type FateVariant = "Base" | "HF" | "GS";

type AxisDef = {
  axis: AxisKey;
  primary: AnimalKey;
  secondary: AnimalKey;
};

type FateDef = {
  id: number;
  axisA: AxisKey;
  axisB: AxisKey;
  baseName: string;
  hfName: string;
  gsName: string;
};


export type NorthchildResult = {
  isValid: boolean;
  errors: string[];

  axisScores: Record<AxisKey, number>;
  adjustedAxisScores: Record<AxisKey, number>;
  topAxesRaw: { axis: AxisKey; score: number }[];

  topRaw: number;
  secondRaw: number;
  closeness: number;
  dampFactor: number;

  variant: FateVariant;

  winner: {
    baseName: string;
    displayName: string;
    score: number;
    composite: number;
    id: number;
  };

  runnerUp: {
    baseName: string;
    displayName: string;
    score: number;
    composite: number;
    id: number;
  };
};

const SECONDARY_WEIGHT = 0.5;

// Softcap params from Calc sheet
const SOFTCAP_BETA = 0.23;
const SOFTCAP_THRESHOLD = 0.75;

const AXES: AxisDef[] = [
  { axis: "Kinship", primary: "wolf", secondary: "orca" },
  { axis: "Power", primary: "wolf", secondary: "bear" },
  { axis: "Endurance", primary: "elk", secondary: "owl" },
  { axis: "Honor", primary: "elk", secondary: "eagle" },
  { axis: "Insight", primary: "owl", secondary: "serpent" },
  { axis: "Silence", primary: "owl", secondary: "raven" },
  { axis: "Voyage", primary: "orca", secondary: "wolf" },
  { axis: "Trade", primary: "orca", secondary: "raven" },
  { axis: "Strength", primary: "bear", secondary: "serpent" },
  { axis: "Hearth", primary: "bear", secondary: "elk" },
  { axis: "Cunning", primary: "raven", secondary: "eagle" },
  { axis: "Omen", primary: "raven", secondary: "owl" },
  { axis: "Glory", primary: "eagle", secondary: "bear" },
  { axis: "Law", primary: "eagle", secondary: "wolf" },
  { axis: "Craft", primary: "serpent", secondary: "raven" },
  { axis: "Shadow", primary: "serpent", secondary: "orca" },
];

const FATES: FateDef[] = [
  { id: 1, axisA: "Craft", axisB: "Glory", baseName: "Lore-Carver", hfName: "Stone-Canon", gsName: "Grudge-Carver" },
  { id: 2, axisA: "Cunning", axisB: "Kinship", baseName: "First-Sister", hfName: "Ring-Mother", gsName: "Poison-Needle" },
  { id: 3, axisA: "Silence", axisB: "Kinship", baseName: "Stone-Abbess", hfName: "The Still Mother", gsName: "The Oubliette" },
  { id: 4, axisA: "Glory", axisB: "Voyage", baseName: "Storm-Chaser", hfName: "Storm-Bride", gsName: "Storm-Widow" },
  { id: 5, axisA: "Law", axisB: "Craft", baseName: "Runespeaker", hfName: "The Long Memory", gsName: "The Short Knife" },
  { id: 6, axisA: "Honor", axisB: "Kinship", baseName: "Way-Bearer", hfName: "Road-Warden", gsName: "Way-Taker" },
  { id: 7, axisA: "Omen", axisB: "Strength", baseName: "Sun-Vowed", hfName: "The North-Called", gsName: "The Sun-Scorned" },
  { id: 8, axisA: "Trade", axisB: "Hearth", baseName: "Grain-Mother", hfName: "Harvest-Queen", gsName: "Faminekeeper" },
  { id: 9, axisA: "Craft", axisB: "Endurance", baseName: "Forge-Daughter", hfName: "The Iron-Wife", gsName: "The Rust-Wife" },
  { id: 10, axisA: "Voyage", axisB: "Insight", baseName: "Tide-Broker", hfName: "Wave-Reader", gsName: "Tide-Usurer" },
  { id: 11, axisA: "Hearth", axisB: "Voyage", baseName: "Harbor-Matron", hfName: "The Harbor-Saint", gsName: "The Harbor-Scourge" },
  { id: 12, axisA: "Honor", axisB: "Trade", baseName: "Crown-Keeper", hfName: "The Uncrowned", gsName: "The Final Say" },
  { id: 13, axisA: "Kinship", axisB: "Insight", baseName: "Hall-Singer", hfName: "Hearth-Voice", gsName: "Song-Thief" },
  { id: 14, axisA: "Strength", axisB: "Endurance", baseName: "Stone-Matron", hfName: "Stone-Crown", gsName: "Stone-Ruin" },
  { id: 15, axisA: "Silence", axisB: "Honor", baseName: "Wind-Wife", hfName: "Sky-Mother", gsName: "Wind-Hag" },
  { id: 16, axisA: "Glory", axisB: "Kinship", baseName: "Wolf-Fang", hfName: "Hunt-Mistress", gsName: "Red-Fang" },
  { id: 17, axisA: "Trade", axisB: "Cunning", baseName: "Salt-Raven", hfName: "Sea Queen", gsName: "The Black Keel" },
  { id: 18, axisA: "Voyage", axisB: "Cunning", baseName: "Winter Broker", hfName: "Cold Steward", gsName: "Hunger-Wife" },
  { id: 19, axisA: "Honor", axisB: "Shadow", baseName: "Grave-Speaker", hfName: "Cairn-Speaker", gsName: "Grave-Witch" },
  { id: 20, axisA: "Shadow", axisB: "Insight", baseName: "Silent-Wing", hfName: "Night-Warden", gsName: "The Hollow Flight" },
  { id: 21, axisA: "Strength", axisB: "Glory", baseName: "Wild Huntress", hfName: "The Wild-Queen", gsName: "The Blood Hunt" },
  { id: 22, axisA: "Law", axisB: "Honor", baseName: "Scale-Bearer", hfName: "The White Balance", gsName: "The Iron Scale" },
  { id: 23, axisA: "Insight", axisB: "Silence", baseName: "Storm-Seeker", hfName: "The Ice-Oracle", gsName: "The Rime-Sighted" },
  { id: 24, axisA: "Power", axisB: "Law", baseName: "Winter-Regent", hfName: "Ice Queen", gsName: "The Cold-Tyrant" },
  { id: 25, axisA: "Law", axisB: "Cunning", baseName: "The Half-Law", hfName: "The Whole Law", gsName: "The Broken Law" },
  { id: 26, axisA: "Omen", axisB: "Insight", baseName: "Frost-Augur", hfName: "The Deep-Watcher", gsName: "The Ill-Prophet" },
  { id: 27, axisA: "Silence", axisB: "Omen", baseName: "Grove-Keeper", hfName: "The Grove-Singer", gsName: "The Grove-Blight" },
  { id: 28, axisA: "Endurance", axisB: "Hearth", baseName: "Life-Binder", hfName: "Winter-Mother", gsName: "Hearth-Fallen" },
  { id: 29, axisA: "Strength", axisB: "Shadow", baseName: "Thorn-Sister", hfName: "Thorn-Mother", gsName: "Cut-Wife" },
  { id: 30, axisA: "Power", axisB: "Strength", baseName: "Shield-Breaker", hfName: "First-Spear", gsName: "War-Fury" },
];

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
export function computeNorthchildResult(
  animals: Animals,
  hfCount: number,
  gsCount: number
): NorthchildResult {

  const errors: string[] = [];

  // Validation
  const values = Object.values(animals);
  const total = values.reduce((a, b) => a + b, 0);
  if (total !== 15) errors.push(`Total points must be 15. Currently ${total}.`);
  (Object.entries(animals) as [AnimalKey, number][]).forEach(([k, v]) => {
    if (!Number.isFinite(v) || v < 0) errors.push(`${k} must be >= 0.`);
    if (v > 4) errors.push(`${k} must be <= 4.`);
  });

  const variant: FateVariant = hfCount === 5 ? "HF" : gsCount === 5 ? "GS" : "Base";

  // Axis scores (raw)
  const axisScores = {} as Record<AxisKey, number>;
  const axisPrimaryAnimal = {} as Record<AxisKey, AnimalKey>;
  for (const def of AXES) {
    axisPrimaryAnimal[def.axis] = def.primary;
    const primary = animals[def.primary] ?? 0;
    const secondary = animals[def.secondary] ?? 0;
    axisScores[def.axis] = round3(primary + secondary * SECONDARY_WEIGHT);
  }

  // Determine top and second (raw)
  const sortedRaw = (Object.entries(axisScores) as [AxisKey, number][])
    .map(([axis, score]) => ({ axis, score }))
    .sort((a, b) => b.score - a.score);

  const topRaw = sortedRaw[0]?.score ?? 0;
  const secondRaw = sortedRaw[1]?.score ?? 0;

  const closeness = topRaw === 0 ? 0 : secondRaw / topRaw;
  const dampFactor =
    closeness >= SOFTCAP_THRESHOLD ? 1 - SOFTCAP_BETA * closeness : 1;

  // Adjusted axis scores: damp anything tied for top
  const adjustedAxisScores = {} as Record<AxisKey, number>;
  for (const { axis, score } of sortedRaw) {
    const adj = score === topRaw ? score * dampFactor : score;
    adjustedAxisScores[axis] = round3(adj);
  }

  // Fate scores + composite tie-breaker
  const fateRows = FATES.map((f) => {
    const fateScore =
      (adjustedAxisScores[f.axisA] ?? 0) + (adjustedAxisScores[f.axisB] ?? 0);

    // PrimaryMaxPoints is max(points in primary animal of axisA, primary animal of axisB)
    const pA = axisPrimaryAnimal[f.axisA];
    const pB = axisPrimaryAnimal[f.axisB];
    const primaryMaxPoints = Math.max(animals[pA] ?? 0, animals[pB] ?? 0);

    const composite =
      fateScore * 1000 + primaryMaxPoints * 10 + (31 - f.id) / 1000;
  
      return {
      ...f,
      fateScore: round3(fateScore),
      primaryMaxPoints,
      composite: round3(composite),
    };
  }).sort((a, b) => b.composite - a.composite);

  const winner = fateRows[0];
  const runnerUp = fateRows[1];

  const pickTitle = (f: FateDef | undefined) => {
    if (!f) return "";
    if (variant === "HF") return f.hfName?.trim() || f.baseName;
    if (variant === "GS") return f.gsName?.trim() || f.baseName;
    return f.baseName;
  };
 
  return {
    isValid: errors.length === 0,
    errors,

    axisScores,
    adjustedAxisScores,
    topAxesRaw: sortedRaw,

    topRaw,
    secondRaw,
    closeness: round3(closeness),
    dampFactor: round3(dampFactor),
    variant,

    winner: {
        baseName: winner?.baseName ?? "INVALID BUILD",
        displayName: pickTitle(winner),
        score: winner?.fateScore ?? 0,
        composite: winner?.composite ?? 0,
        id: winner?.id ?? 0,
    },
    runnerUp: {
        baseName: runnerUp?.baseName ?? "",
        displayName: pickTitle(runnerUp),
        score: runnerUp?.fateScore ?? 0,
        composite: runnerUp?.composite ?? 0,
        id: runnerUp?.id ?? 0,
    },
  };
}

export function getResultImagePath(id: number, variant: FateVariant) {
  const padded = id.toString().padStart(2, "0");

  const folder =
    variant === "HF" ? "highflame" : variant === "GS" ? "gravesong" : "base";

  return `/results/${folder}/${padded}.webp`;
}
