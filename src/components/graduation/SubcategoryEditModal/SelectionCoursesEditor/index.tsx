import type { Accessor, Component, Setter } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { RequirementGroup } from "~/types";
import { GroupsSection } from "./GroupsSection";

interface SelectionCoursesEditorProps {
  minCredits: Accessor<number>;
  setMinCredits: Setter<number>;
  maxCredits: Accessor<number | undefined>;
  setMaxCredits: Setter<number | undefined>;
  groups: RequirementGroup[];
  setGroups: SetStoreFunction<RequirementGroup[]>;
}

export const SelectionCoursesEditor: Component<SelectionCoursesEditorProps> = (props) => {
  return (
    <>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="sub-min-credits">最小単位数</Label>
          <Input
            id="sub-min-credits"
            type="number"
            min="0"
            value={props.minCredits()}
            onInput={(e) => {
              const val = e.currentTarget.value;
              props.setMinCredits(val ? Number.parseInt(val, 10) : 0);
            }}
          />
        </div>

        <div class="space-y-2">
          <Label for="sub-max-credits">最大単位数</Label>
          <Input
            id="sub-max-credits"
            type="number"
            min="0"
            value={props.maxCredits() ?? ""}
            onInput={(e) => {
              const val = e.currentTarget.value;
              props.setMaxCredits(val ? Number.parseInt(val, 10) : undefined);
            }}
          />
        </div>
      </div>

      <GroupsSection groups={props.groups} setGroups={props.setGroups} />
    </>
  );
};
