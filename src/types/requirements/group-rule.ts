import * as v from "valibot";
import { IdSchema } from "../common";

/**
 * グループルール基底スキーマ
 */
const GroupRuleBaseSchema = v.object({
  id: IdSchema,
});

/**
 * 科目名指定ルール
 * 指定された科目名のリストから選択
 */
const CoursesRuleSchema = v.object({
  ...GroupRuleBaseSchema.entries,
  type: v.literal("courses"),
  courseNames: v.array(v.string()),
});

/**
 * @deprecated "courses"に名称変更されました。CoursesRuleSchemaを使用してください
 */
const SpecificRuleSchema = CoursesRuleSchema;

/**
 * プレフィックスルール
 * 科目番号が指定されたプレフィックスのいずれかで始まる科目が対象
 */
const PrefixRuleSchema = v.object({
  ...GroupRuleBaseSchema.entries,
  type: v.literal("prefix"),
  prefixes: v.pipe(v.array(v.string()), v.minLength(1)),
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
 * IncludeRule（対象科目を定義）
 * グループの対象となる科目を定義するルール
 */
export const IncludeRuleSchema = v.variant("type", [
  CoursesRuleSchema,
  PrefixRuleSchema,
  CategoryRuleSchema,
]);

/**
 * ExcludeRule（除外条件を定義）
 * 対象科目から除外する条件を定義するルール
 * matchAllは含まない（すべて除外する意味がないため）
 */
export const ExcludeRuleSchema = v.variant("type", [
  CoursesRuleSchema,
  PrefixRuleSchema,
  CategoryRuleSchema,
]);

/**
 * グループルール（後方互換性のため残す）
 * @deprecated includeRules/excludeRulesを使用してください
 */
export const GroupRuleSchema = v.variant("type", [
  CoursesRuleSchema,
  PrefixRuleSchema,
  CategoryRuleSchema,
]);

export type IncludeRule = v.InferOutput<typeof IncludeRuleSchema>;
export type ExcludeRule = v.InferOutput<typeof ExcludeRuleSchema>;
export type GroupRule = v.InferOutput<typeof GroupRuleSchema>;
export type CoursesRule = v.InferOutput<typeof CoursesRuleSchema>;
/**
 * @deprecated CoursesRuleを使用してください
 */
export type SpecificRule = CoursesRule;
export type PrefixRule = v.InferOutput<typeof PrefixRuleSchema>;
export type CategoryRule = v.InferOutput<typeof CategoryRuleSchema>;
