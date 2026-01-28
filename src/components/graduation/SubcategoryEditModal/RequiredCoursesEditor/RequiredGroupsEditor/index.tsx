import Plus from "lucide-solid/icons/plus";
import { type Component, For, Show } from "solid-js";
import { reconcile, type SetStoreFunction } from "solid-js/store";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import type { IncludeRule, RequirementGroup } from "~/types";
import { RequiredGroupRow } from "./RequiredGroupRow";

interface RequiredGroupsEditorProps {
  groups: RequirementGroup[];
  setGroups: SetStoreFunction<RequirementGroup[]>;
}

export const RequiredGroupsEditor: Component<RequiredGroupsEditorProps> = (props) => {
  const categoryGroups = () =>
    props.groups
      .map((group, index) => ({ group, originalIndex: index }))
      .filter(({ group }) => group.includeRules[0]?.type === "category");

  const handleAddGroup = () => {
    const newGroup: RequirementGroup = {
      id: `group-${Date.now()}`,
      minCredits: 0,
      includeRules: [
        {
          id: `rule-${Date.now()}`,
          type: "category",
          majorCategory: "",
        } satisfies IncludeRule,
      ],
    };

    props.setGroups((prev) => [...prev, newGroup]);
  };

  const handleUpdateGroup = (index: number, updates: Partial<RequirementGroup>) => {
    if ("minCredits" in updates) {
      props.setGroups(index, "minCredits", updates.minCredits ?? 0);
    }
    if ("maxCredits" in updates) {
      props.setGroups(index, "maxCredits", updates.maxCredits);
    }
    if ("includeRules" in updates) {
      props.setGroups(
        index,
        "includeRules",
        reconcile(updates.includeRules ?? [], {
          key: "id",
        }),
      );
    }
    if ("excludeRules" in updates) {
      props.setGroups(
        index,
        "excludeRules",
        reconcile(updates.excludeRules ?? [], {
          key: "id",
        }),
      );
    }
  };

  const handleRemoveGroup = (index: number) => {
    props.setGroups((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div class="space-y-4">
      <Label>科目区分グループ</Label>
      <Show when={categoryGroups().length > 0}>
        <div class="space-y-2">
          <For each={categoryGroups()}>
            {({ group, originalIndex }) => (
              <RequiredGroupRow
                group={group}
                onUpdate={(updates) => handleUpdateGroup(originalIndex, updates)}
                onRemove={() => handleRemoveGroup(originalIndex)}
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
