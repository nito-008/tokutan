import { getEnrollment } from "./db/enrollment";
import { ensureDefaultProfile } from "./db/profiles";
import {
  getDefaultRequirements,
  getRequirements,
  hasRequirements,
  saveRequirements,
} from "./db/requirements";
import { loadAllRequirements } from "./db/requirements-loader";
import type { EnrollmentData, GraduationRequirements, UserProfile } from "./types";

export interface AppState {
  profile: UserProfile;
  requirements: GraduationRequirements | null;
  enrollment: EnrollmentData | null;
}

// アプリ初期化
export async function initializeApp(): Promise<AppState> {
  // プロファイルを確保
  const profile = await ensureDefaultProfile();

  // デフォルト要件がなければ追加
  if (!(await hasRequirements())) {
    const allRequirements = await loadAllRequirements();
    for (const req of allRequirements) {
      await saveRequirements(req);
    }
  } else {
    // 既に要件が存在する場合でも、存在しない要件は追加
    const allRequirements = await loadAllRequirements();
    for (const req of allRequirements) {
      const exists = await getRequirements(req.id);
      if (!exists) {
        await saveRequirements(req);
      }
    }
  }

  // 要件を取得（プロファイルに紐づくものがあればそれを、なければデフォルト）
  let requirements: GraduationRequirements | null = null;
  if (profile.selectedRequirementsId) {
    requirements = (await getRequirements(profile.selectedRequirementsId)) || null;
  }
  if (!requirements) {
    requirements = (await getDefaultRequirements()) || null;
  }

  // 履修データを取得
  const enrollment = (await getEnrollment(profile.id)) || null;

  return {
    profile,
    requirements,
    enrollment,
  };
}
