import type { GroupRule } from "~/lib/types";

const generateId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

/**
 * 新しいグループIDを生成する。
 */
export const createGroupId = () => generateId("group");

/**
 * 新しいルールIDを生成する。
 */
export const createRuleId = () => generateId("rule");

/**
 * カテゴリルール空状態を生成する。
 */
export const createCategoryRule = (): Extract<GroupRule, { type: "category" }> => ({
  id: createRuleId(),
  type: "category",
  majorCategory: "",
});
