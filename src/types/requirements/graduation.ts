import * as v from "valibot";
import { DateTimeSchema, IdSchema, VersionSchema, YearSchema } from "../common";
import { RequirementCategorySchema } from "./category";

/**
 * 卒業要件全体
 * 特定の学年・学科・専攻に適用される卒業要件の定義
 */
export const GraduationRequirementsSchema = v.object({
  id: IdSchema,
  year: YearSchema,
  department: v.pipe(v.string(), v.minLength(1)),
  major: v.optional(v.string()),
  totalCredits: v.pipe(v.number(), v.minValue(0)),
  categories: v.array(RequirementCategorySchema),
  version: VersionSchema,
  isDefault: v.optional(v.boolean()),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type GraduationRequirements = v.InferOutput<typeof GraduationRequirementsSchema>;
