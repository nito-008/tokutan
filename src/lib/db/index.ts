import Dexie, { type EntityTable } from "dexie";
import type {
  Course,
  CoursePlan,
  EnrollmentData,
  GraduationRequirements,
  UserProfile,
} from "../types";

// 設定の型
export interface Setting {
  key: string;
  value: unknown;
}

// Dexie DBクラス定義
export class TokutanDB extends Dexie {
  requirements!: EntityTable<GraduationRequirements, "id">;
  enrollment!: EntityTable<EnrollmentData, "id">;
  profiles!: EntityTable<UserProfile, "id">;
  coursePlans!: EntityTable<CoursePlan, "id">;
  kdbCache!: EntityTable<Course, "id">;
  settings!: EntityTable<Setting, "key">;

  constructor() {
    super("tokutan");

    this.version(1).stores({
      requirements: "id, name, year, department, isDefault",
      enrollment: "id, profileId",
      profiles: "id, name, enrollmentYear",
      coursePlans: "id, profileId",
      kdbCache: "id, name",
      settings: "key",
    });
  }
}

// DBインスタンス
export const db = new TokutanDB();

// DB初期化（リセット用）
export async function resetDatabase(): Promise<void> {
  await db.delete();
  await db.open();
}
