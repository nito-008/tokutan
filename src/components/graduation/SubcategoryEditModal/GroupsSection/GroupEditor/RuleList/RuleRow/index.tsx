import { GripVertical, Trash2 } from "lucide-solid";
import { type Component, type JSX, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { GroupRule } from "~/lib/types";
import { SelectionCoursesEditor } from "../SelectionCoursesEditor";

interface RuleRowProps {
  rule: GroupRule;
  onUpdate: (updates: Partial<GroupRule>) => void;
  onRemove: () => void;
  sortableRef?: (el: HTMLElement) => void;
  sortableTransform?: { x: number; y: number } | null;
  isActiveDraggable?: boolean;
  dragActivators?: JSX.HTMLAttributes<HTMLElement>;
}

const ruleTypeLabel = (rule: GroupRule) => (rule.type === "specific" ? "特定科目" : "で始まる科目");

export const RuleRow: Component<RuleRowProps> = (props) => {
  return (
    <div
      ref={props.sortableRef}
      class="flex items-start gap-2 rounded border bg-background p-2"
      classList={{
        "opacity-50": props.isActiveDraggable,
        "transition-transform": !props.isActiveDraggable,
      }}
      style={
        props.sortableTransform
          ? {
              transform: `translate3d(${props.sortableTransform.x}px, ${props.sortableTransform.y}px, 0)`,
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
        <Show
          when={props.rule.type === "specific"}
          fallback={
            <Input
              class="h-8"
              value={(props.rule as Extract<GroupRule, { type: "prefix" }>).prefix}
              onInput={(e) =>
                props.onUpdate({ prefix: e.currentTarget.value } satisfies Partial<GroupRule>)
              }
              placeholder="プレフィックス（例: FG）"
            />
          }
        >
          <SelectionCoursesEditor
            courseIds={(props.rule as Extract<GroupRule, { type: "specific" }>).courseIds}
            onUpdate={(courseIds) => props.onUpdate({ courseIds } satisfies Partial<GroupRule>)}
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
