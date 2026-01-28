import * as v from "valibot";
import { IdSchema } from "../common";
import { RequirementGroupSchema } from "./requirement-group";

/**
 * サブカテゴリ種別
 */
export const SubcategoryTypeSchema = v.picklist(["required", "elective", "free"]);
export type SubcategoryType = v.InferOutput<typeof SubcategoryTypeSchema>;

/**
 * サブカテゴリ基底スキーマ
 */
const RequirementSubcategoryBaseSchema = v.object({
  id: IdSchema,
  notes: v.optional(v.string()),
});

/**
 * 必修サブカテゴリ
 * 指定された全科目の履修が必須
 */
const RequiredSubcategorySchema = v.object({
  ...RequirementSubcategoryBaseSchema.entries,
  type: v.literal("required"),
  courseNames: v.array(v.string()),
  groups: v.optional(v.array(RequirementGroupSchema)),
});

/**
 * 選択サブカテゴリ
 * 指定された単位数を取得する必要がある
 */
const ElectiveSubcategorySchema = v.object({
  ...RequirementSubcategoryBaseSchema.entries,
  type: v.literal("elective"),
  minCredits: v.pipe(v.number(), v.minValue(0)),
  maxCredits: v.optional(v.pipe(v.number(), v.minValue(0))),
  groups: v.array(RequirementGroupSchema),
});

/**
 * 自由サブカテゴリ
 * 指定された単位数を取得する必要がある
 */
const FreeSubcategorySchema = v.object({
  ...RequirementSubcategoryBaseSchema.entries,
  type: v.literal("free"),
  minCredits: v.pipe(v.number(), v.minValue(0)),
  maxCredits: v.optional(v.pipe(v.number(), v.minValue(0))),
  groups: v.array(RequirementGroupSchema),
});

/**
 * 要件サブカテゴリ（ユニオン型）
 * 必修・選択・自由の3種類
 */
export const RequirementSubcategorySchema = v.variant("type", [
  RequiredSubcategorySchema,
  ElectiveSubcategorySchema,
  FreeSubcategorySchema,
]);

export type RequirementSubcategory = v.InferOutput<typeof RequirementSubcategorySchema>;
export type RequiredSubcategory = v.InferOutput<typeof RequiredSubcategorySchema>;
export type ElectiveSubcategory = v.InferOutput<typeof ElectiveSubcategorySchema>;
export type FreeSubcategory = v.InferOutput<typeof FreeSubcategorySchema>;
