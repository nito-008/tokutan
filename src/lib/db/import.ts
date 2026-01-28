import type { GraduationRequirements } from "~/types";
import { db } from "./index";

// ファイルからJSONを読み込み
function readJsonFile<T>(file: File): Promise<T> {
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
