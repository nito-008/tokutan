import * as v from "valibot";
import { IdSchema } from "../common";
import { RequirementSubcategorySchema } from "./subcategory";

/**
 * 要件カテゴリ
 * 卒業要件の大分類（例：専門科目、基礎科目、共通科目など）
 */
export const RequirementCategorySchema = v.object({
  id: IdSchema,
  name: v.pipe(v.string(), v.minLength(1)),
  subcategories: v.array(RequirementSubcategorySchema),
});

export type RequirementCategory = v.InferOutput<typeof RequirementCategorySchema>;
