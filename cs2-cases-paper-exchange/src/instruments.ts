export const CS2_CASE_INSTRUMENTS = [
  "CS2 Weapon Case",
  "Operation Bravo Case",
  "CS:GO Weapon Case 2",
  "CS:GO Weapon Case 3",
  "Winter Offensive Weapon Case",
  "eSports 2013 Case",
  "eSports 2013 Winter Case",
  "Operation Phoenix Weapon Case",
  "Huntsman Weapon Case",
  "Operation Breakout Weapon Case",
  "Falchion Case",
  "Shadow Case",
  "Revolver Case",
  "Operation Wildfire Case",
  "Chroma Case",
  "Chroma 2 Case",
  "Chroma 3 Case",
  "Gamma Case",
  "Gamma 2 Case",
  "Spectrum Case",
  "Spectrum 2 Case",
  "Glove Case",
  "Clutch Case",
  "Prisma Case",
  "Prisma 2 Case",
  "Danger Zone Case",
  "Horizon Case",
  "Operation Hydra Case",
  "Shattered Web Case",
  "Fracture Case",
  "Snakebite Case",
  "Operation Broken Fang Case",
  "Operation Riptide Case",
  "Dreams & Nightmares Case",
  "Recoil Case",
  "Revolution Case",
  "Kilowatt Case",
  "CS20 Case",
  "Gallery Case"
] as const;

export function toSymbol(name: string) {
  return (
    "CASE_" +
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  );
}
