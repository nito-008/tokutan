import { defaultRequirements } from "~/data/default-requirements";
import { mockRequirements } from "~/data/mock-requirements";
import { getEnrollment } from "./db/enrollment";
import { ensureDefaultProfile } from "./db/profiles";
import {
  getDefaultRequirements,
  getRequirements,
  hasRequirements,
  saveRequirements,
} from "./db/requirements";
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
    await saveRequirements(defaultRequirements);

    // モック要件も追加
    for (const req of mockRequirements) {
      await saveRequirements(req);
    }
  } else {
    // 既に要件が存在する場合でも、モック要件が存在しない場合は追加
    for (const req of mockRequirements) {
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
