import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "src/app/components/SeasonalCrops.tsx");
const lines = fs.readFileSync(src, "utf8").split(/\r?\n/);
const crops = lines.slice(66, 364).join("\n");
const tail = lines.slice(365, 376).join("\n");

const out = `export type SeasonalCropRow = {
  imageFile: string;
  nameEn: string;
  nameAr: string;
  plantingEn: string;
  plantingAr: string;
  growthEn: string;
  growthAr: string;
  difficultyEn: string;
  difficultyAr: string;
  difficultyLevel: 1 | 2 | 3;
};

export function cropAssetUrl(imageFile: string) {
  return \`/assets/crops/\${imageFile
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/")}\`;
}

export function resolveCropImageSrc(imageFile: string): string {
  if (/^(data:|blob:|https?:\\/\\/)/i.test(imageFile)) return imageFile;
  return cropAssetUrl(imageFile);
}

${crops}

${tail}

export function difficultyTextClass(level: 1 | 2 | 3) {
  if (level === 1) return "text-green-600 dark:text-green-500";
  if (level === 2) return "text-amber-600 dark:text-amber-500";
  return "text-red-600 dark:text-red-500";
}
`;

const dest = path.join(root, "src/app/data/seasonalCropsData.ts");
fs.writeFileSync(dest, out, "utf8");
console.log("Wrote", dest);
