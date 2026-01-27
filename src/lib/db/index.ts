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

// 科目区分マスターデータのキャッシュ
export interface CourseTypeMasterCache {
  id: "master";
  data: unknown;
  cachedAt: string;
}

// Dexie DBクラス定義
export class TokutanDB extends Dexie {
  requirements!: EntityTable<GraduationRequirements, "id">;
  enrollment!: EntityTable<EnrollmentData, "id">;
  profiles!: EntityTable<UserProfile, "id">;
  coursePlans!: EntityTable<CoursePlan, "id">;
  kdbCache!: EntityTable<Course, "id">;
  settings!: EntityTable<Setting, "key">;
  courseTypeMaster!: EntityTable<CourseTypeMasterCache, "id">;

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

    this.version(2).stores({
      requirements:
        "id, year, department, major, isDefault, [year+department], [year+department+major]",
      enrollment: "id, profileId",
      profiles: "id, name, enrollmentYear",
      coursePlans: "id, profileId",
      kdbCache: "id, name",
      settings: "key",
    });

    this.version(3).stores({
      requirements:
        "id, year, department, major, isDefault, [year+department], [year+department+major]",
      enrollment: "id, profileId",
      profiles: "id, name, enrollmentYear",
      coursePlans: "id, profileId",
      kdbCache: "id, name",
      settings: "key",
      courseTypeMaster: "id",
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
