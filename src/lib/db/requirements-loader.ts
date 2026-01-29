import type { GraduationRequirements } from "~/types";

const requirementModules = import.meta.glob<GraduationRequirements>(
  "/public/data/requirements/*.json",
  { eager: true, import: "default" },
);

/**
 * 公開フォルダ内の要件JSONをすべて読み込む。
 * @returns 要件データの配列
 */
export async function loadAllRequirements(): Promise<GraduationRequirements[]> {
  return Object.entries(requirementModules)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, requirements]) => requirements);
}
