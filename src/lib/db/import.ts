import type { GraduationRequirements } from "../types";
import type { ExportData } from "./export";
import { db } from "./index";

export interface ImportResult {
  success: boolean;
  message: string;
  imported: {
    profiles: number;
    requirements: number;
    enrollment: number;
    coursePlans: number;
  };
}

// ファイルからJSONを読み込み
export function readJsonFile<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (_error) {
        reject(new Error("JSONの解析に失敗しました"));
      }
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsText(file);
  });
}

// 全データをインポート
export async function importAllData(file: File): Promise<ImportResult> {
  const data = await readJsonFile<ExportData>(file);

  // バージョンチェック
  if (!data.version) {
    throw new Error("無効なバックアップファイルです");
  }

  const result: ImportResult = {
    success: true,
    message: "インポートが完了しました",
    imported: {
      profiles: 0,
      requirements: 0,
      enrollment: 0,
      coursePlans: 0,
    },
  };

  await db.transaction(
    "rw",
    [db.profiles, db.requirements, db.enrollment, db.coursePlans],
    async () => {
      // プロファイル
      if (data.profiles?.length) {
        for (const profile of data.profiles) {
          await db.profiles.put(profile);
          result.imported.profiles++;
        }
      }

      // 要件
      if (data.requirements?.length) {
        for (const req of data.requirements) {
          await db.requirements.put(req);
          result.imported.requirements++;
        }
      }

      // 履修データ
      if (data.enrollment?.length) {
        for (const enr of data.enrollment) {
          await db.enrollment.put(enr);
          result.imported.enrollment++;
        }
      }

      // 履修計画
      if (data.coursePlans?.length) {
        for (const plan of data.coursePlans) {
          await db.coursePlans.put(plan);
          result.imported.coursePlans++;
        }
      }
    },
  );

  return result;
}

// 要件のみインポート
export async function importRequirements(file: File): Promise<GraduationRequirements> {
  const data = await readJsonFile<GraduationRequirements>(file);

  // バリデーション
  if (!data.id || !data.year || !data.department || !data.categories) {
    throw new Error("無効な要件ファイルです");
  }

  // 新しいIDを生成（重複回避）
  const now = new Date().toISOString();
  const imported: GraduationRequirements = {
    ...data,
    id: `req-imported-${Date.now()}`,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.requirements.add(imported);
  return imported;
}

// データを上書きでインポート（既存データを削除）
export async function importAllDataWithOverwrite(file: File): Promise<ImportResult> {
  const data = await readJsonFile<ExportData>(file);

  if (!data.version) {
    throw new Error("無効なバックアップファイルです");
  }

  const result: ImportResult = {
    success: true,
    message: "インポートが完了しました（既存データは削除されました）",
    imported: {
      profiles: 0,
      requirements: 0,
      enrollment: 0,
      coursePlans: 0,
    },
  };

  await db.transaction(
    "rw",
    [db.profiles, db.requirements, db.enrollment, db.coursePlans],
    async () => {
      // 既存データを削除
      await db.profiles.clear();
      await db.requirements.clear();
      await db.enrollment.clear();
      await db.coursePlans.clear();

      // プロファイル
      if (data.profiles?.length) {
        await db.profiles.bulkAdd(data.profiles);
        result.imported.profiles = data.profiles.length;
      }

      // 要件
      if (data.requirements?.length) {
        await db.requirements.bulkAdd(data.requirements);
        result.imported.requirements = data.requirements.length;
      }

      // 履修データ
      if (data.enrollment?.length) {
        await db.enrollment.bulkAdd(data.enrollment);
        result.imported.enrollment = data.enrollment.length;
      }

      // 履修計画
      if (data.coursePlans?.length) {
        await db.coursePlans.bulkAdd(data.coursePlans);
        result.imported.coursePlans = data.coursePlans.length;
      }
    },
  );

  return result;
}
