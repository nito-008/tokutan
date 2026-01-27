import { Plus } from "lucide-solid";
import { type Component, For, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { Button } from "~/components/ui/button";
import type { RequirementGroup } from "~/lib/types";
import { RequiredGroupRow } from "./RequiredGroupRow";
import { createCategoryRule, createGroupId } from "./utils";

const createRequirementGroup = (): RequirementGroup => ({
  id: createGroupId(),
  minCredits: 0,
  rules: [createCategoryRule()],
});

interface RequiredGroupsEditorProps {
  groups: RequirementGroup[];
  setGroups: SetStoreFunction<RequirementGroup[]>;
}

/**
 * 必修科目のグループ要件を編集するエリア。
 */
export const RequiredGroupsEditor: Component<RequiredGroupsEditorProps> = (props) => {
  const updateGroup = (index: number, updates: Partial<RequirementGroup>) => {
    if ("minCredits" in updates) {
      props.setGroups(index, "minCredits", updates.minCredits ?? 0);
    }
    if ("rules" in updates) {
      props.setGroups(index, "rules", updates.rules ?? []);
    }
  };

  const addGroup = () => {
    props.setGroups((prev) => [...prev, createRequirementGroup()]);
  };

  const removeGroup = (index: number) => {
    props.setGroups((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div class="space-y-3 pt-4 border-t">
      <p class="text-sm font-semibold text-foreground">必修グループ</p>
      <For each={props.groups}>
        {(group, index) => (
          <RequiredGroupRow
            group={group}
            onUpdate={(updates) => updateGroup(index(), updates)}
            onRemove={() => removeGroup(index())}
          />
        )}
      </For>
      <Show when={props.groups.length === 0}>
        <p class="text-sm text-muted-foreground text-center py-3">
          必修科目に追加条件がない場合はここからグループを定義できます。
        </p>
      </Show>
      <Button variant="outline" size="sm" class="w-full" onClick={addGroup}>
        <Plus class="size-4 mr-1" />
        グループを追加
      </Button>
    </div>
  );
};
