import Plus from "lucide-solid/icons/plus";
import Trash2 from "lucide-solid/icons/trash-2";
import { type Component, For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { CategoryEntry, RequirementGroup } from "~/types";
import { CategoryRuleEditor } from "../../SelectionCoursesEditor/GroupsSection/GroupEditor/RuleList/CategoryRuleEditor";

interface RequiredGroupRowProps {
  group: RequirementGroup;
  onUpdate: (updates: Partial<RequirementGroup>) => void;
  onRemove: () => void;
}

export const RequiredGroupRow: Component<RequiredGroupRowProps> = (props) => {
  const categories = () => props.group.includeRules.categories ?? [];

  const handleAddCategoryRule = () => {
    const current = props.group.includeRules.categories ?? [];
    props.onUpdate({
      includeRules: {
        ...props.group.includeRules,
        categories: [...current, { majorCategory: "" }],
      },
    });
  };

  const handleUpdateRule = (index: number, updates: Partial<CategoryEntry>) => {
    const current = [...categories()];
    const cat = current[index];
    if (!cat) return;
    current[index] = {
      ...cat,
      majorCategory: updates.majorCategory ?? cat.majorCategory,
      middleCategory:
        updates.middleCategory !== undefined ? updates.middleCategory : cat.middleCategory,
      minorCategory:
        updates.minorCategory !== undefined ? updates.minorCategory : cat.minorCategory,
    };
    props.onUpdate({
      includeRules: { ...props.group.includeRules, categories: current },
    });
  };

  const handleRemoveRule = (index: number) => {
    const current = categories().filter((_, i) => i !== index);
    props.onUpdate({
      includeRules: {
        ...props.group.includeRules,
        categories: current.length > 0 ? current : undefined,
      },
    });
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
            <For each={categories()}>
              {(cat, index) => (
                <div class="flex items-start gap-2">
                  <div class="flex-1">
                    <CategoryRuleEditor
                      majorCategory={cat.majorCategory ?? ""}
                      middleCategory={cat.middleCategory}
                      minorCategory={cat.minorCategory}
                      onUpdate={(updates) => handleUpdateRule(index(), updates)}
                    />
                  </div>
                  <Show when={categories().length > 1}>
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
              )}
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
