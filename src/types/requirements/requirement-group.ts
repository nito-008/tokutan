import * as v from "valibot";
import { IdSchema } from "../common";
import { ExcludeRuleSchema, IncludeRuleSchema } from "./group-rule";

/**
 * 要件グループ
 * 選択科目・自由科目の単位要件を定義するグループ
 * includeRulesで対象科目を定義し、excludeRulesで除外条件を定義する
 * 必修科目の場合はminCreditsを省略可能
 */
export const RequirementGroupSchema = v.object({
  id: IdSchema,
  minCredits: v.optional(v.pipe(v.number(), v.minValue(0))),
  maxCredits: v.optional(v.pipe(v.number(), v.minValue(0))),
  includeRules: v.array(IncludeRuleSchema),
  excludeRules: v.optional(v.array(ExcludeRuleSchema)),
});

export type RequirementGroup = v.InferOutput<typeof RequirementGroupSchema>;
