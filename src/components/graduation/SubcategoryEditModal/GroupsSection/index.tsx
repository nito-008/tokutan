import { Plus } from "lucide-solid";
import { type Accessor, type Component, For, type Setter, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import type { RequirementGroup } from "~/lib/types";
import { GroupEditor } from "./GroupEditor";

interface GroupsSectionProps {
  groups: Accessor<RequirementGroup[]>;
  setGroups: Setter<RequirementGroup[]>;
}

export const GroupsSection: Component<GroupsSectionProps> = (props) => {
  const updateGroup = (index: number, updates: Partial<RequirementGroup>) => {
    props.setGroups((prev) =>
      prev.map((group, i) => {
        if (i !== index) return group;
        return { ...group, ...updates };
      }),
    );
  };

  const addGroup = () => {
    const newGroup: RequirementGroup = {
      id: `group-${Date.now()}`,
      minCredits: 0,
      rules: [],
    };
    props.setGroups((prev) => [...prev, newGroup]);
  };

  const removeGroup = (index: number) => {
    props.setGroups((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div class="space-y-3 pt-4 border-t">
      <For each={props.groups()}>
        {(group, index) => (
          <GroupEditor
            group={group}
            onUpdate={(updates) => updateGroup(index(), updates)}
            onRemove={() => removeGroup(index())}
          />
        )}
      </For>

      <Show when={props.groups().length === 0}>
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
