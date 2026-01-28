import { GripVertical, Trash2 } from "lucide-solid";
import { type Component, type JSX, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { ExcludeRule, IncludeRule } from "~/types";
import { CategoryRuleEditor } from "../CategoryRuleEditor";
import { CourseNamesInput } from "../CourseNamesInput";

interface RuleRowProps {
  rule: IncludeRule | ExcludeRule;
  onUpdate: (updates: Partial<IncludeRule | ExcludeRule>) => void;
  onRemove: () => void;
  index: number;
  sortableCount: number;
  sortableRef?: (el: HTMLElement) => void;
  sortableTransform?: { x: number; y: number } | null;
  isActiveDraggable?: boolean;
  dragActivators?: JSX.HTMLAttributes<HTMLElement>;
}

const ruleTypeLabel = (rule: IncludeRule | ExcludeRule) => {
  switch (rule.type) {
    case "courses":
      return "特定科目";
    case "prefix":
      return "プレフィックス";
    case "category":
      return "科目区分";
    case "matchAll":
      return "すべての科目";
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
        <Show when={props.rule.type === "courses"}>
          <CourseNamesInput
            courseNames={
              (props.rule as Extract<IncludeRule | ExcludeRule, { type: "courses" }>).courseNames ??
              []
            }
            onUpdate={(courseNames) =>
              props.onUpdate({ courseNames } satisfies Partial<IncludeRule | ExcludeRule>)
            }
          />
        </Show>
        <Show when={props.rule.type === "prefix"}>
          <Input
            class="h-8"
            value={
              (props.rule as Extract<IncludeRule | ExcludeRule, { type: "prefix" }>).prefixes.join(
                ", ",
              ) ?? ""
            }
            onInput={(e) => {
              const value = e.currentTarget.value.trim();
              const prefixes = value
                ? value
                    .split(",")
                    .map((p) => p.trim())
                    .filter((p) => p)
                : [""];
              props.onUpdate({ prefixes } satisfies Partial<IncludeRule | ExcludeRule>);
            }}
            placeholder="プレフィックス (例: FG, FA, GB)"
          />
        </Show>
        <Show when={props.rule.type === "category"}>
          <CategoryRuleEditor
            majorCategory={
              (props.rule as Extract<IncludeRule | ExcludeRule, { type: "category" }>).majorCategory
            }
            middleCategory={
              (props.rule as Extract<IncludeRule | ExcludeRule, { type: "category" }>)
                .middleCategory
            }
            minorCategory={
              (props.rule as Extract<IncludeRule | ExcludeRule, { type: "category" }>).minorCategory
            }
            onUpdate={(updates) => props.onUpdate(updates as Partial<IncludeRule | ExcludeRule>)}
          />
        </Show>
        <Show when={props.rule.type === "matchAll"}>
          <div class="h-8 flex items-center text-sm text-muted-foreground">
            すべての科目が対象になります
          </div>
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
