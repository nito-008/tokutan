import {
  closestCenter,
  DragDropProvider,
  DragDropSensors,
  type DragEvent,
  SortableProvider,
} from "@thisbeyond/solid-dnd";
import { type Component, For } from "solid-js";
import type { GroupRule } from "~/lib/types";
import { SortableRuleRow } from "./SortableRuleRow";

interface RuleListProps {
  rules: GroupRule[];
  onUpdateRule: (index: number, updates: Partial<GroupRule>) => void;
  onRemoveRule: (index: number) => void;
  onMoveRule: (fromIndex: number, toIndex: number) => void;
}

export const RuleList: Component<RuleListProps> = (props) => {
  const sortableIds = () => props.rules.map((rule) => rule.id);

  const handleDragEnd = (event: DragEvent) => {
    const { draggable, droppable } = event;
    if (!draggable || !droppable) return;
    const fromIndex = props.rules.findIndex((rule) => rule.id === String(draggable.id));
    const toIndex = props.rules.findIndex((rule) => rule.id === String(droppable.id));
    if (fromIndex < 0 || toIndex < 0) return;
    props.onMoveRule(fromIndex, toIndex);
  };

  return (
    <DragDropProvider collisionDetector={closestCenter} onDragEnd={handleDragEnd}>
      <DragDropSensors />
      <SortableProvider ids={sortableIds()}>
        <div class="space-y-2">
          <For each={props.rules}>
            {(rule, index) => (
              <SortableRuleRow
                rule={rule}
                index={index()}
                sortableCount={sortableIds().length}
                onUpdate={(updates) => props.onUpdateRule(index(), updates)}
                onRemove={() => props.onRemoveRule(index())}
              />
            )}
          </For>
        </div>
      </SortableProvider>
    </DragDropProvider>
  );
};
