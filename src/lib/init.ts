import { ensureDefaultProfile, getActiveProfile } from './db/profiles';
import { getDefaultRequirements, saveRequirements, hasRequirements } from './db/requirements';
import { getEnrollment } from './db/enrollment';
import { defaultRequirements } from '~/data/default-requirements';
import type { UserProfile, GraduationRequirements, EnrollmentData } from './types';

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
  }

  // 要件を取得（プロファイルに紐づくものがあればそれを、なければデフォルト）
  let requirements: GraduationRequirements | null = null;
  if (profile.selectedRequirementsId) {
    const { getRequirements } = await import('./db/requirements');
    requirements = await getRequirements(profile.selectedRequirementsId) || null;
  }
  if (!requirements) {
    requirements = await getDefaultRequirements() || null;
  }

  // 履修データを取得
  const enrollment = await getEnrollment(profile.id) || null;

  return {
    profile,
    requirements,
    enrollment
  };
}
