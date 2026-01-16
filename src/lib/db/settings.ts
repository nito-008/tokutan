import { db } from './index';

// 設定を取得
export async function getSetting<T>(key: string): Promise<T | undefined> {
  const setting = await db.settings.get(key);
  return setting?.value as T | undefined;
}

// 設定を保存
export async function setSetting<T>(key: string, value: T): Promise<void> {
  await db.settings.put({ key, value });
}

// 設定を削除
export async function deleteSetting(key: string): Promise<void> {
  await db.settings.delete(key);
}

// 全設定を取得
export async function getAllSettings(): Promise<Record<string, unknown>> {
  const settings = await db.settings.toArray();
  return Object.fromEntries(settings.map(s => [s.key, s.value]));
}

// デフォルト設定キー
export const SettingKeys = {
  ACTIVE_PROFILE_ID: 'activeProfileId',
  KDB_CACHED_AT: 'kdbCachedAt',
  LAST_IMPORT_DATE: 'lastImportDate',
  THEME: 'theme'
} as const;
