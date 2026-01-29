import * as v from "valibot";

/**
 * カテゴリエントリ
 * TWINSのカテゴリ（大・中・小分類）で科目を指定する1エントリ
 */
export const CategoryEntrySchema = v.object({
  majorCategory: v.string(),
  middleCategory: v.optional(v.string()),
  minorCategory: v.optional(v.string()),
});

/**
 * IncludeRules（対象科目を定義）
 * グループの対象となる科目を定義するルールオブジェクト
 * 各フィールドはオプショナルで、指定されたフィールドの条件はOR結合される
 */
export const IncludeRulesSchema = v.object({
  courseNames: v.optional(v.array(v.string())),
  prefixes: v.optional(v.array(v.string())),
  categories: v.optional(v.array(CategoryEntrySchema)),
});

/**
 * ExcludeRules（除外条件を定義）
 * 対象科目から除外する条件を定義するルールオブジェクト
 */
export const ExcludeRulesSchema = v.object({
  courseNames: v.optional(v.array(v.string())),
  prefixes: v.optional(v.array(v.string())),
  categories: v.optional(v.array(CategoryEntrySchema)),
});

export type IncludeRules = v.InferOutput<typeof IncludeRulesSchema>;
export type ExcludeRules = v.InferOutput<typeof ExcludeRulesSchema>;
export type CategoryEntry = v.InferOutput<typeof CategoryEntrySchema>;
