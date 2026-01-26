import { createSortable } from "@thisbeyond/solid-dnd";
import type { Component } from "solid-js";
import type { GroupRule } from "~/lib/types";
import { RuleRow } from "../RuleRow";

interface SortableRuleRowProps {
  rule: GroupRule;
  index: number;
  onUpdate: (updates: Partial<GroupRule>) => void;
  onRemove: () => void;
}

export const SortableRuleRow: Component<SortableRuleRowProps> = (props) => {
  const sortable = createSortable(props.rule.id);

  return (
    <RuleRow
      rule={props.rule}
      onUpdate={props.onUpdate}
      onRemove={props.onRemove}
      sortableRef={sortable.ref}
      sortableTransform={sortable.transform}
      isActiveDraggable={sortable.isActiveDraggable}
      dragActivators={sortable.dragActivators}
    />
  );
};
