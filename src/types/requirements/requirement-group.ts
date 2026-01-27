import * as v from "valibot";
import { IdSchema } from "../common";
import { GroupRuleSchema } from "./group-rule";

/**
 * 要件グループ
 * 選択科目・自由科目の単位要件を定義するグループ
 */
export const RequirementGroupSchema = v.object({
  id: IdSchema,
  minCredits: v.pipe(v.number(), v.minValue(0)),
  maxCredits: v.optional(v.pipe(v.number(), v.minValue(0))),
  rules: v.array(GroupRuleSchema),
});

export type RequirementGroup = v.InferOutput<typeof RequirementGroupSchema>;
