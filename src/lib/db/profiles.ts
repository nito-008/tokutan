import type { UserProfile } from "~/types";
import { db } from "./index";
import { getSetting, SettingKeys, setSetting } from "./settings";

// 全プロファイルを取得
export async function getAllProfiles(): Promise<UserProfile[]> {
  return db.profiles.toArray();
}

// プロファイルを取得
export async function getProfile(id: string): Promise<UserProfile | undefined> {
  return db.profiles.get(id);
}

// アクティブなプロファイルを取得
export async function getActiveProfile(): Promise<UserProfile | undefined> {
  const activeId = await getSetting<string>(SettingKeys.ACTIVE_PROFILE_ID);
  if (!activeId) return undefined;
  return getProfile(activeId);
}

// アクティブなプロファイルを設定
export async function setActiveProfile(id: string): Promise<void> {
  await setSetting(SettingKeys.ACTIVE_PROFILE_ID, id);
}

// プロファイルを保存
export async function saveProfile(profile: UserProfile): Promise<string> {
  const now = new Date().toISOString();
  const data: UserProfile = {
    ...profile,
    updatedAt: now,
    createdAt: profile.createdAt || now,
  };
  await db.profiles.put(data);
  return data.id;
}

// プロファイルを作成
export async function createProfile(
  name: string,
  enrollmentYear: number,
  department: string,
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const profile: UserProfile = {
    id: `profile-${Date.now()}`,
    name,
    enrollmentYear,
    department,
    createdAt: now,
    updatedAt: now,
  };
  await db.profiles.add(profile);
  return profile;
}

// プロファイルを削除
export async function deleteProfile(id: string): Promise<void> {
  // 関連データも削除
  await db.transaction("rw", [db.profiles, db.enrollment, db.coursePlans], async () => {
    await db.profiles.delete(id);
    await db.enrollment.where("profileId").equals(id).delete();
    await db.coursePlans.where("profileId").equals(id).delete();
  });

  // アクティブプロファイルの場合はクリア
  const activeId = await getSetting<string>(SettingKeys.ACTIVE_PROFILE_ID);
  if (activeId === id) {
    const remaining = await db.profiles.toArray();
    if (remaining.length > 0) {
      await setActiveProfile(remaining[0].id);
    } else {
      await setSetting(SettingKeys.ACTIVE_PROFILE_ID, null);
    }
  }
}

// 選択中の卒業要件を更新
export async function updateSelectedRequirements(
  profileId: string,
  requirementsId: string,
): Promise<void> {
  await db.profiles.update(profileId, {
    selectedRequirementsId: requirementsId,
    updatedAt: new Date().toISOString(),
  });
}

// デフォルトプロファイルを作成（初回起動時）
export async function ensureDefaultProfile(): Promise<UserProfile> {
  const profiles = await getAllProfiles();
  if (profiles.length > 0) {
    // 既存のプロファイルがあればアクティブを確認
    const active = await getActiveProfile();
    if (active) return active;
    await setActiveProfile(profiles[0].id);
    return profiles[0];
  }

  // 新規作成
  const profile = await createProfile("デフォルト", new Date().getFullYear(), "工学システム学類");
  await setActiveProfile(profile.id);
  return profile;
}
