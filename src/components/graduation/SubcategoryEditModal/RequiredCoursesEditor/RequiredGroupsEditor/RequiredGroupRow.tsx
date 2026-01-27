import { Trash2 } from "lucide-solid";
import type { Component } from "solid-js";
import { CategoryRuleEditor } from "~/components/graduation/SubcategoryEditModal/SelectionCoursesEditor/GroupsSection/GroupEditor/RuleList/CategoryRuleEditor";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { GroupRule, RequirementGroup } from "~/lib/types";
import { createCategoryRule } from "./utils";

interface RequiredGroupRowProps {
  group: RequirementGroup;
  onUpdate: (updates: Partial<RequirementGroup>) => void;
  onRemove: () => void;
}

const findCategoryRule = (group: RequirementGroup): Extract<GroupRule, { type: "category" }> => {
  const existing = group.rules.find(
    (rule): rule is Extract<GroupRule, { type: "category" }> => rule.type === "category",
  );
  return existing ?? createCategoryRule();
};

/**
 * 単一ルールのカテゴリ選択と単位数で構成される必修グループ行。
 */
export const RequiredGroupRow: Component<RequiredGroupRowProps> = (props) => {
  const categoryRule = findCategoryRule(props.group);

  const handleCreditsUpdate = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    props.onUpdate({ minCredits: Number.isNaN(parsed) ? 0 : parsed });
  };

  const handleCategoryUpdate = (updates: {
    majorCategory?: string;
    middleCategory?: string;
    minorCategory?: string;
  }) => {
    props.onUpdate({
      rules: [
        {
          ...categoryRule,
          ...updates,
        },
      ],
    });
  };

  return (
    <div class="border rounded-lg p-4 space-y-4 bg-background">
      <div class="flex items-center gap-2">
        <div class="flex-1 space-y-1">
          <Label class="text-xs">単位数</Label>
          <Input
            class="h-8"
            type="number"
            min="0"
            value={props.group.minCredits}
            onInput={(e) => handleCreditsUpdate(e.currentTarget.value)}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
          onClick={props.onRemove}
        >
          <Trash2 class="size-4" />
        </Button>
      </div>

      <CategoryRuleEditor
        majorCategory={categoryRule.majorCategory}
        middleCategory={categoryRule.middleCategory}
        minorCategory={categoryRule.minorCategory}
        onUpdate={handleCategoryUpdate}
      />
    </div>
  );
};
