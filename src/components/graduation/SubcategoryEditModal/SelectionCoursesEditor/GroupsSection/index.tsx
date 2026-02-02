import Plus from "lucide-solid/icons/plus";
import { type Component, For, Show } from "solid-js";
import { reconcile, type SetStoreFunction } from "solid-js/store";
import { Button } from "~/components/ui/button";
import { generateGroupId } from "~/lib/id";
import type { RequirementGroup } from "~/types";
import { GroupEditor } from "./GroupEditor";

interface GroupsSectionProps {
  groups: RequirementGroup[];
  setGroups: SetStoreFunction<RequirementGroup[]>;
}

export const GroupsSection: Component<GroupsSectionProps> = (props) => {
  const updateGroup = (index: number, updates: Partial<RequirementGroup>) => {
    if ("minCredits" in updates) {
      props.setGroups(index, "minCredits", updates.minCredits ?? 0);
    }
    if ("maxCredits" in updates) {
      props.setGroups(index, "maxCredits", updates.maxCredits);
    }
    if ("includeRules" in updates) {
      props.setGroups(index, "includeRules", reconcile(updates.includeRules ?? {}));
    }
    if ("excludeRules" in updates) {
      props.setGroups(index, "excludeRules", reconcile(updates.excludeRules));
    }
  };

  const addGroup = () => {
    const newGroup: RequirementGroup = {
      id: generateGroupId(),
      minCredits: 0,
      includeRules: {},
    };
    props.setGroups((prev) => [...prev, newGroup]);
  };

  const removeGroup = (index: number) => {
    props.setGroups((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div class="space-y-3 pt-4 border-t">
      <For each={props.groups}>
        {(group, index) => (
          <GroupEditor
            group={group}
            onUpdate={(updates) => updateGroup(index(), updates)}
            onRemove={() => removeGroup(index())}
          />
        )}
      </For>

      <Show when={props.groups.length === 0}>
        <p class="text-sm text-muted-foreground text-center py-4">
          条件グループがありません。「グループを追加」ボタンで条件を追加してください。
        </p>
      </Show>

      <Button variant="outline" size="sm" onClick={addGroup} class="w-full">
        <Plus class="size-4 mr-1" />
        グループを追加
      </Button>
    </div>
  );
};
