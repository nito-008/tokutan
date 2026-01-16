import { db } from './index';
import type { GraduationRequirements } from '../types';

// 全要件を取得
export async function getAllRequirements(): Promise<GraduationRequirements[]> {
  return db.requirements.toArray();
}

// 要件を取得
export async function getRequirements(id: string): Promise<GraduationRequirements | undefined> {
  return db.requirements.get(id);
}

// デフォルト要件を取得
export async function getDefaultRequirements(): Promise<GraduationRequirements | undefined> {
  return db.requirements.where('isDefault').equals(1).first();
}

// 年度と学類で要件を取得
export async function getRequirementsByYearAndDepartment(
  year: number,
  department: string
): Promise<GraduationRequirements | undefined> {
  return db.requirements
    .where('[year+department]')
    .equals([year, department])
    .first()
    .catch(() => {
      // インデックスがない場合はフィルタで検索
      return db.requirements
        .filter(r => r.year === year && r.department === department)
        .first();
    });
}

// 要件を保存
export async function saveRequirements(requirements: GraduationRequirements): Promise<string> {
  const now = new Date().toISOString();
  const data: GraduationRequirements = {
    ...requirements,
    updatedAt: now,
    createdAt: requirements.createdAt || now
  };
  await db.requirements.put(data);
  return data.id;
}

// 要件を削除
export async function deleteRequirements(id: string): Promise<void> {
  await db.requirements.delete(id);
}

// デフォルト要件を設定
export async function setDefaultRequirements(id: string): Promise<void> {
  await db.transaction('rw', db.requirements, async () => {
    // 既存のデフォルトを解除
    const current = await getDefaultRequirements();
    if (current) {
      await db.requirements.update(current.id, { isDefault: false });
    }
    // 新しいデフォルトを設定
    await db.requirements.update(id, { isDefault: true });
  });
}

// 要件をコピー
export async function copyRequirements(
  id: string,
  newName: string
): Promise<GraduationRequirements> {
  const original = await getRequirements(id);
  if (!original) {
    throw new Error('Original requirements not found');
  }

  const now = new Date().toISOString();
  const copy: GraduationRequirements = {
    ...original,
    id: `req-${Date.now()}`,
    name: newName,
    isDefault: false,
    createdAt: now,
    updatedAt: now
  };

  await db.requirements.add(copy);
  return copy;
}

// 要件が存在するか確認
export async function hasRequirements(): Promise<boolean> {
  const count = await db.requirements.count();
  return count > 0;
}
