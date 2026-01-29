import Plus from "lucide-solid/icons/plus";
import Trash2 from "lucide-solid/icons/trash-2";
import { type Component, For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { IncludeRule, RequirementGroup } from "~/types";
import { CategoryRuleEditor } from "../../SelectionCoursesEditor/GroupsSection/GroupEditor/RuleList/CategoryRuleEditor";

interface RequiredGroupRowProps {
  group: RequirementGroup;
  onUpdate: (updates: Partial<RequirementGroup>) => void;
  onRemove: () => void;
}

export const RequiredGroupRow: Component<RequiredGroupRowProps> = (props) => {
  const categoryRules = () => props.group.includeRules.filter((rule) => rule.type === "category");

  const handleAddCategoryRule = () => {
    const newRule: IncludeRule = {
      id: `rule-${Date.now()}`,
      type: "category",
      majorCategory: "",
    };
    props.onUpdate({
      includeRules: [...props.group.includeRules, newRule],
    });
  };

  const handleUpdateRule = (
    index: number,
    updates: {
      majorCategory?: string;
      middleCategory?: string;
      minorCategory?: string;
    },
  ) => {
    const updatedRules = [...props.group.includeRules];
    const currentRule = updatedRules[index];
    if (currentRule?.type === "category") {
      updatedRules[index] = {
        ...currentRule,
        majorCategory: updates.majorCategory ?? currentRule.majorCategory,
        middleCategory:
          updates.middleCategory !== undefined
            ? updates.middleCategory
            : currentRule.middleCategory,
        minorCategory:
          updates.minorCategory !== undefined ? updates.minorCategory : currentRule.minorCategory,
      };
      props.onUpdate({ includeRules: updatedRules });
    }
  };

  const handleRemoveRule = (index: number) => {
    const updatedRules = props.group.includeRules.filter((_, i) => i !== index);
    props.onUpdate({ includeRules: updatedRules });
  };

  return (
    <div class="border rounded-lg p-4 space-y-3">
      <div class="flex items-start gap-2">
        <div class="flex-1 space-y-3">
          <div class="space-y-1">
            <Label class="text-xs">必要単位数</Label>
            <Input
              class="h-8"
              type="number"
              min="0"
              value={props.group.requiredCredits}
              onInput={(e) => {
                const val = e.currentTarget.value;
                props.onUpdate({ requiredCredits: val ? Number.parseInt(val, 10) : 0 });
              }}
            />
          </div>

          <div class="space-y-2">
            <Label class="text-xs">科目区分</Label>
            <For each={props.group.includeRules}>
              {(rule, index) => {
                if (rule.type !== "category") return null;
                return (
                  <div class="flex items-start gap-2">
                    <div class="flex-1">
                      <CategoryRuleEditor
                        majorCategory={rule.majorCategory ?? ""}
                        middleCategory={rule.middleCategory}
                        minorCategory={rule.minorCategory}
                        onUpdate={(updates) => handleUpdateRule(index(), updates)}
                      />
                    </div>
                    <Show when={categoryRules().length > 1}>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveRule(index())}
                      >
                        <Trash2 class="size-4" />
                      </Button>
                    </Show>
                  </div>
                );
              }}
            </For>

            <div class="flex justify-between gap-2">
              <Button variant="outline" size="sm" onClick={handleAddCategoryRule}>
                <Plus class="size-4 mr-1" />
                科目区分を追加
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={props.onRemove}
              >
                <Trash2 class="size-4 mr-1" />
                グループを削除
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
