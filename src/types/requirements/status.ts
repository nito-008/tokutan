import * as v from "valibot";
import { DateTimeSchema, IdSchema } from "../common";
import { SubcategoryTypeSchema } from "./subcategory";

/**
 * マッチした科目情報
 * 要件充足判定で各科目がどのように評価されたか
 */
export const MatchedCourseSchema = v.object({
  courseId: v.string(),
  courseName: v.string(),
  credits: v.pipe(v.number(), v.minValue(0)),
  grade: v.string(),
  isPassed: v.boolean(),
  isInProgress: v.boolean(),
  isUnregistered: v.optional(v.boolean()),
});

export type MatchedCourse = v.InferOutput<typeof MatchedCourseSchema>;

/**
 * グループの充足状況
 */
export const GroupStatusSchema = v.object({
  groupId: IdSchema,
  isSatisfied: v.boolean(),
  earnedCredits: v.pipe(v.number(), v.minValue(0)),
  inProgressCredits: v.pipe(v.number(), v.minValue(0)),
  requiredCredits: v.pipe(v.number(), v.minValue(0)),
  maxCredits: v.optional(v.pipe(v.number(), v.minValue(0))),
  matchedCourses: v.array(MatchedCourseSchema),
});

export type GroupStatus = v.InferOutput<typeof GroupStatusSchema>;

/**
 * サブカテゴリの充足状況
 */
export const SubcategoryStatusSchema = v.object({
  subcategoryId: IdSchema,
  subcategoryType: SubcategoryTypeSchema,
  earnedCredits: v.pipe(v.number(), v.minValue(0)),
  inProgressCredits: v.pipe(v.number(), v.minValue(0)),
  requiredCredits: v.pipe(v.number(), v.minValue(0)),
  maxCredits: v.optional(v.pipe(v.number(), v.minValue(0))),
  isSatisfied: v.boolean(),
  groupStatuses: v.array(GroupStatusSchema),
  matchedCourses: v.array(MatchedCourseSchema),
});

export type SubcategoryStatus = v.InferOutput<typeof SubcategoryStatusSchema>;

/**
 * カテゴリの充足状況
 */
export const CategoryStatusSchema = v.object({
  categoryId: IdSchema,
  categoryName: v.string(),
  earnedCredits: v.pipe(v.number(), v.minValue(0)),
  inProgressCredits: v.pipe(v.number(), v.minValue(0)),
  requiredCredits: v.pipe(v.number(), v.minValue(0)),
  isSatisfied: v.boolean(),
  subcategoryStatuses: v.array(SubcategoryStatusSchema),
});

export type CategoryStatus = v.InferOutput<typeof CategoryStatusSchema>;

/**
 * 卒業要件の充足状況（全体）
 */
export const RequirementStatusSchema = v.object({
  requirementsId: IdSchema,
  totalEarnedCredits: v.pipe(v.number(), v.minValue(0)),
  totalInProgressCredits: v.pipe(v.number(), v.minValue(0)),
  totalRequiredCredits: v.pipe(v.number(), v.minValue(0)),
  isGraduationEligible: v.boolean(),
  categoryStatuses: v.array(CategoryStatusSchema),
  unmatchedCourses: v.optional(v.array(MatchedCourseSchema)),
  calculatedAt: DateTimeSchema,
});

export type RequirementStatus = v.InferOutput<typeof RequirementStatusSchema>;
