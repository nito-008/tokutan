#!/usr/bin/env tsx

/**
 * JSONスキーマ生成スクリプト
 * ValibotスキーマからJSONスキーマを生成してschema/ディレクトリに出力
 */

import { toJsonSchema } from "@valibot/to-json-schema";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { CoursePlanSchema } from "../src/types/enrollment/course-plan";
import { EnrollmentDataSchema } from "../src/types/enrollment/enrollment-data";
import { UserProfileSchema } from "../src/types/enrollment/user-profile";
import { GraduationRequirementsSchema } from "../src/types/requirements/graduation";
import { RequirementStatusSchema } from "../src/types/requirements/status";

// schema/ディレクトリが存在することを確認
const schemaDir = join(process.cwd(), "schema");
mkdirSync(schemaDir, { recursive: true });

/**
 * スキーマをJSONファイルとして書き出す
 */
function writeSchema(name: string, schema: any, description?: string) {
  const jsonSchema = toJsonSchema(schema);

  // 説明を追加
  if (description) {
    jsonSchema.description = description;
  }

  const filePath = join(schemaDir, `${name}.json`);
  writeFileSync(filePath, JSON.stringify(jsonSchema, null, 2), "utf-8");
  console.log(`✓ Generated: ${filePath}`);
}

console.log("Generating JSON schemas...\n");

// 卒業要件スキーマ
writeSchema(
  "requirements",
  GraduationRequirementsSchema,
  "卒業要件の定義スキーマ（学年・学科・専攻ごとの単位要件）",
);

// 要件充足状況スキーマ
writeSchema(
  "requirement_status",
  RequirementStatusSchema,
  "卒業要件の充足状況スキーマ（計算結果）",
);

// ユーザープロファイルスキーマ
writeSchema("user_profile", UserProfileSchema, "ユーザープロファイルスキーマ（学生基本情報）");

// 履修データスキーマ
writeSchema(
  "enrollment_data",
  EnrollmentDataSchema,
  "履修データスキーマ（TWINSから取り込んだ成績情報）",
);

// 履修計画スキーマ
writeSchema("course_plan", CoursePlanSchema, "履修計画スキーマ（将来の履修予定）");

console.log("\n✓ All schemas generated successfully!");
console.log(`Output directory: ${schemaDir}`);
