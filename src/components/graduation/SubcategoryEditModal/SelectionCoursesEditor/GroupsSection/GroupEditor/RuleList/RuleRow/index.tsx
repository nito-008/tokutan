import { GripVertical, Trash2 } from "lucide-solid";
import { type Component, type JSX, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { GroupRule } from "~/types";
import { CategoryRuleEditor } from "../CategoryRuleEditor";
import { CourseNamesInput } from "../CourseNamesInput";

interface RuleRowProps {
  rule: GroupRule;
  onUpdate: (updates: Partial<GroupRule>) => void;
  onRemove: () => void;
  index: number;
  sortableCount: number;
  sortableRef?: (el: HTMLElement) => void;
  sortableTransform?: { x: number; y: number } | null;
  isActiveDraggable?: boolean;
  dragActivators?: JSX.HTMLAttributes<HTMLElement>;
}

const ruleTypeLabel = (rule: GroupRule) => {
  switch (rule.type) {
    case "specific":
      return "特定科目";
    case "prefix":
      return "で始まる科目";
    case "exclude":
      return "を除外";
    case "category":
      return "科目区分";
  }
};
const ROW_HEIGHT = 56;

const clampY = (y: number, currentIndex: number, sortableCount: number): number => {
  const minY = -currentIndex * ROW_HEIGHT;
  const maxY = (sortableCount - 1 - currentIndex) * ROW_HEIGHT;
  return Math.max(minY, Math.min(maxY, y));
};

const clampX = (x: number): number => Math.max(0, Math.min(0, x));

export const RuleRow: Component<RuleRowProps> = (props) => {
  return (
    <div
      ref={props.sortableRef}
      class="flex items-start gap-2 bg-background"
      classList={{
        "opacity-50": props.isActiveDraggable,
        "transition-transform": !props.isActiveDraggable,
      }}
      style={
        props.sortableTransform
          ? {
              transform: `translate3d(${
                props.isActiveDraggable
                  ? clampX(props.sortableTransform.x)
                  : props.sortableTransform.x
              }px, ${
                props.isActiveDraggable
                  ? clampY(props.sortableTransform.y, props.index, props.sortableCount)
                  : props.sortableTransform.y
              }px, 0)`,
            }
          : undefined
      }
    >
      <div
        {...(props.dragActivators as unknown as JSX.HTMLAttributes<HTMLDivElement>)}
        class="mt-2.5 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical class="size-4" />
      </div>

      <div class="flex-1">
        <Show when={props.rule.type === "specific"}>
          <CourseNamesInput
            courseNames={(props.rule as Extract<GroupRule, { type: "specific" }>).courseNames ?? []}
            onUpdate={(courseNames) => props.onUpdate({ courseNames } satisfies Partial<GroupRule>)}
          />
        </Show>
        <Show when={props.rule.type === "exclude"}>
          <Input
            class="h-8"
            value={(props.rule as Extract<GroupRule, { type: "exclude" }>).courseIds[0] ?? ""}
            onInput={(e) => {
              const value = e.currentTarget.value.trim();
              props.onUpdate({ courseIds: value ? [value] : [] } satisfies Partial<GroupRule>);
            }}
            placeholder="除外科目 (例: FG10101)"
          />
        </Show>
        <Show when={props.rule.type === "prefix"}>
          <Input
            class="h-8"
            value={(props.rule as Extract<GroupRule, { type: "prefix" }>).prefix}
            onInput={(e) =>
              props.onUpdate({ prefix: e.currentTarget.value } satisfies Partial<GroupRule>)
            }
            placeholder="科目の最初の文字列 (例: FG)"
          />
        </Show>
        <Show when={props.rule.type === "category"}>
          <CategoryRuleEditor
            majorCategory={(props.rule as Extract<GroupRule, { type: "category" }>).majorCategory}
            middleCategory={(props.rule as Extract<GroupRule, { type: "category" }>).middleCategory}
            minorCategory={(props.rule as Extract<GroupRule, { type: "category" }>).minorCategory}
            onUpdate={(updates) => props.onUpdate(updates as Partial<GroupRule>)}
          />
        </Show>
      </div>

      <div class="flex items-center gap-2">
        <span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
          {ruleTypeLabel(props.rule)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={props.onRemove}
        >
          <Trash2 class="size-4" />
        </Button>
      </div>
    </div>
  );
};
