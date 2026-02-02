import Plus from "lucide-solid/icons/plus";
import { type Component, For, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { Button } from "~/components/ui/button";
import { generateGroupId } from "~/lib/id";
import type { RequirementGroup } from "~/types";
import { RequiredGroupRow } from "./RequiredGroupRow";

interface RequiredGroupsEditorProps {
  groups: RequirementGroup[];
  setGroups: SetStoreFunction<RequirementGroup[]>;
}

export const RequiredGroupsEditor: Component<RequiredGroupsEditorProps> = (props) => {
  const categoryGroups = () =>
    props.groups
      .map((group, index) => ({ group, originalIndex: index }))
      .filter(({ group }) => (group.includeRules?.categories?.length ?? 0) > 0);

  const handleAddGroup = () => {
    const newGroup: RequirementGroup = {
      id: generateGroupId(),
      requiredCredits: 0,
      includeRules: {
        categories: [{ majorCategory: "" }],
      },
    };

    props.setGroups((prev) => [...prev, newGroup]);
  };

  const handleUpdateGroup = (index: number, updates: Partial<RequirementGroup>) => {
    if ("requiredCredits" in updates) {
      props.setGroups(index, "requiredCredits", updates.requiredCredits ?? 0);
    }
    if ("minCredits" in updates) {
      props.setGroups(index, "minCredits", updates.minCredits ?? 0);
    }
    if ("maxCredits" in updates) {
      props.setGroups(index, "maxCredits", updates.maxCredits);
    }
    if ("includeRules" in updates && updates.includeRules) {
      props.setGroups(index, "includeRules", updates.includeRules);
    }
    if ("excludeRules" in updates) {
      props.setGroups(index, "excludeRules", updates.excludeRules);
    }
  };

  const handleRemoveGroup = (index: number) => {
    props.setGroups((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
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
    </>
  );
};
