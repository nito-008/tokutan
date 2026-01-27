import * as v from "valibot";
import { IdSchema } from "../common";

/**
 * グループルール基底スキーマ
 */
const GroupRuleBaseSchema = v.object({
  id: IdSchema,
});

/**
 * 特定科目指定ルール
 * 指定された科目IDのリストから選択
 */
const SpecificRuleSchema = v.object({
  ...GroupRuleBaseSchema.entries,
  type: v.literal("specific"),
  courseIds: v.array(v.string()),
  courseNames: v.optional(v.array(v.string())),
});

/**
 * プレフィックスルール
 * 科目番号がプレフィックスで始まる科目が対象
 */
const PrefixRuleSchema = v.object({
  ...GroupRuleBaseSchema.entries,
  type: v.literal("prefix"),
  prefix: v.pipe(v.string(), v.minLength(1)),
});

/**
 * 除外ルール
 * 指定された科目IDを除外
 */
const ExcludeRuleSchema = v.object({
  ...GroupRuleBaseSchema.entries,
  type: v.literal("exclude"),
  courseIds: v.array(v.string()),
});

/**
 * カテゴリルール
 * TWINSのカテゴリ（大・中・小分類）で科目を選択
 */
const CategoryRuleSchema = v.object({
  ...GroupRuleBaseSchema.entries,
  type: v.literal("category"),
  majorCategory: v.string(),
  middleCategory: v.optional(v.string()),
  minorCategory: v.optional(v.string()),
});

/**
 * グループルール（ユニオン型）
 * 4種類のルールのいずれか
 */
export const GroupRuleSchema = v.variant("type", [
  SpecificRuleSchema,
  PrefixRuleSchema,
  ExcludeRuleSchema,
  CategoryRuleSchema,
]);

export type GroupRule = v.InferOutput<typeof GroupRuleSchema>;
export type SpecificRule = v.InferOutput<typeof SpecificRuleSchema>;
export type PrefixRule = v.InferOutput<typeof PrefixRuleSchema>;
export type ExcludeRule = v.InferOutput<typeof ExcludeRuleSchema>;
export type CategoryRule = v.InferOutput<typeof CategoryRuleSchema>;
