import { getRequirementLabel } from "~/lib/requirements/label";
import type { CoursePlan, EnrollmentData, GraduationRequirements, UserProfile } from "~/types";
import { db } from "./index";

export interface ExportData {
  version: string;
  exportedAt: string;
  profiles: UserProfile[];
  requirements: GraduationRequirements[];
  enrollment: EnrollmentData[];
  coursePlans: CoursePlan[];
}

// JSONファイルとしてダウンロード
export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 要件のみエクスポート
export async function exportRequirements(id: string): Promise<GraduationRequirements | undefined> {
  return db.requirements.get(id);
}

// 要件をダウンロード
export async function exportRequirementsAndDownload(id: string): Promise<void> {
  const req = await exportRequirements(id);
  if (!req) {
    throw new Error("Requirements not found");
  }

  const label = getRequirementLabel(req).replace(/\s+/g, "-");
  const filename = `tokutan-requirements-${label}.json`;
  downloadJson(req, filename);
}
