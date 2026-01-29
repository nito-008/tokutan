import * as v from "valibot";
import { IdSchema } from "../common";
import { ExcludeRulesSchema, IncludeRulesSchema } from "./group-rule";

/**
 * 要件グループ
 * 選択科目・自由科目の単位要件を定義するグループ
 * includeRulesで対象科目を定義し、excludeRulesで除外条件を定義する
 * 必修科目の場合はrequiredCreditsを使用し、選択科目の場合はminCredits/maxCreditsを使用する
 */
export const RequirementGroupSchema = v.object({
  id: IdSchema,
  requiredCredits: v.optional(v.pipe(v.number(), v.minValue(0))),
  minCredits: v.optional(v.pipe(v.number(), v.minValue(0))),
  maxCredits: v.optional(v.pipe(v.number(), v.minValue(0))),
  includeRules: v.optional(IncludeRulesSchema),
  excludeRules: v.optional(ExcludeRulesSchema),
});

export type RequirementGroup = v.InferOutput<typeof RequirementGroupSchema>;
