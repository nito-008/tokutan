import { createSortable } from "@thisbeyond/solid-dnd";
import type { Component } from "solid-js";
import type { ExcludeRule, IncludeRule } from "~/types";
import { RuleRow } from "../RuleRow";

interface SortableRuleRowProps {
  rule: IncludeRule | ExcludeRule;
  index: number;
  sortableCount: number;
  onUpdate: (updates: Partial<IncludeRule | ExcludeRule>) => void;
  onRemove: () => void;
}

export const SortableRuleRow: Component<SortableRuleRowProps> = (props) => {
  const sortable = createSortable(props.rule.id);

  return (
    <RuleRow
      rule={props.rule}
      index={props.index}
      sortableCount={props.sortableCount}
      onUpdate={props.onUpdate}
      onRemove={props.onRemove}
      sortableRef={sortable.ref}
      sortableTransform={sortable.transform}
      isActiveDraggable={sortable.isActiveDraggable}
      dragActivators={sortable.dragActivators}
    />
  );
};
