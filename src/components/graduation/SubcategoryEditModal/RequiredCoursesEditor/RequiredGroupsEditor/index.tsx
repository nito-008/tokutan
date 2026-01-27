import { Plus } from "lucide-solid";
import { type Component, For, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import type { GroupRule, RequirementGroup } from "~/lib/types";
import { RequiredGroupRow } from "./RequiredGroupRow";

interface RequiredGroupsEditorProps {
  groups: RequirementGroup[];
  setGroups: SetStoreFunction<RequirementGroup[]>;
}

export const RequiredGroupsEditor: Component<RequiredGroupsEditorProps> = (props) => {
  const handleAddGroup = () => {
    const newGroup: RequirementGroup = {
      id: `group-${Date.now()}`,
      minCredits: 0,
      rules: [
        {
          id: `rule-${Date.now()}`,
          type: "category",
          majorCategory: "",
        } satisfies GroupRule,
      ],
    };

    props.setGroups((prev) => [...prev, newGroup]);
  };

  const handleUpdateGroup = (index: number, updates: Partial<RequirementGroup>) => {
    props.setGroups(index, updates);
  };

  const handleRemoveGroup = (index: number) => {
    props.setGroups((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div class="space-y-2">
      <Label>科目区分グループ</Label>

      <Show
        when={props.groups.length > 0}
        fallback={
          <div class="text-sm text-muted-foreground border rounded-lg p-4 text-center">
            グループが設定されていません
          </div>
        }
      >
        <div class="space-y-2">
          <For each={props.groups}>
            {(group, index) => (
              <RequiredGroupRow
                group={group}
                onUpdate={(updates) => handleUpdateGroup(index(), updates)}
                onRemove={() => handleRemoveGroup(index())}
              />
            )}
          </For>
        </div>
      </Show>

      <Button variant="outline" size="sm" onClick={handleAddGroup} class="w-full">
        <Plus class="size-4 mr-1" />
        グループを追加
      </Button>
    </div>
  );
};
