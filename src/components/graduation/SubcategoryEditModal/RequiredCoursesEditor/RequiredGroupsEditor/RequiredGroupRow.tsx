import { Trash2 } from "lucide-solid";
import type { Component } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { RequirementGroup } from "~/lib/types";
import { CategoryRuleEditor } from "../../SelectionCoursesEditor/GroupsSection/GroupEditor/RuleList/CategoryRuleEditor";

interface RequiredGroupRowProps {
  group: RequirementGroup;
  onUpdate: (updates: Partial<RequirementGroup>) => void;
  onRemove: () => void;
}

export const RequiredGroupRow: Component<RequiredGroupRowProps> = (props) => {
  const categoryRule = () => {
    const rule = props.group.rules[0];
    if (rule?.type === "category") {
      return rule;
    }
    return null;
  };

  return (
    <div class="border rounded-lg p-4 space-y-3">
      <div class="flex items-start gap-2">
        <div class="flex-1 space-y-3">
          <div class="space-y-1">
            <Label class="text-xs">単位数</Label>
            <Input
              class="h-8"
              type="number"
              min="0"
              value={props.group.minCredits}
              onInput={(e) => {
                const val = e.currentTarget.value;
                props.onUpdate({ minCredits: val ? Number.parseInt(val, 10) : 0 });
              }}
            />
          </div>

          <div class="space-y-1">
            <Label class="text-xs">科目区分</Label>
            <CategoryRuleEditor
              majorCategory={categoryRule()?.majorCategory ?? ""}
              middleCategory={categoryRule()?.middleCategory}
              minorCategory={categoryRule()?.minorCategory}
              onUpdate={(updates) => {
                const currentRule = categoryRule();
                if (!currentRule) return;

                const updatedRule = {
                  ...currentRule,
                  majorCategory: updates.majorCategory ?? currentRule.majorCategory,
                  middleCategory:
                    updates.middleCategory !== undefined
                      ? updates.middleCategory
                      : currentRule.middleCategory,
                  minorCategory:
                    updates.minorCategory !== undefined
                      ? updates.minorCategory
                      : currentRule.minorCategory,
                };

                console.log("update", updates, currentRule);

                props.onUpdate({ rules: [updatedRule] });
              }}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          class="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={props.onRemove}
        >
          <Trash2 class="size-4" />
        </Button>
      </div>
    </div>
  );
};
