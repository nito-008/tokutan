import { Trash2 } from "lucide-solid";
import { type Component, createEffect, createSignal, For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getCoursesByIds } from "~/lib/db/kdb";
import type { GroupRule } from "~/lib/types";

type RuleTypeOption = { value: "specific" | "prefix"; label: string };

const ruleTypeOptions: RuleTypeOption[] = [
  { value: "specific", label: "特定科目" },
  { value: "prefix", label: "～で始まる科目" },
];

interface RuleEditorProps {
  rule: GroupRule;
  onUpdate: (updates: Partial<GroupRule>) => void;
  onRemove: () => void;
}

export const RuleEditor: Component<RuleEditorProps> = (props) => {
  const selectedRuleType = () => ruleTypeOptions.find((opt) => opt.value === props.rule.type);
  const [courseNames, setCourseNames] = createSignal<Map<string, string>>(new Map());

  createEffect(() => {
    const courseIds = props.rule.type === "specific" ? props.rule.courseIds : [];

    if (!courseIds || courseIds.length === 0) {
      setCourseNames(new Map());
      return;
    }

    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };

    void (async () => {
      const courses = await getCoursesByIds(courseIds);
      if (cancelled) return;
      const nameMap = new Map<string, string>();
      for (const course of courses) {
        nameMap.set(course.id, course.name);
      }
      setCourseNames(nameMap);
    })();

    return cancel;
  });

  return (
    <div class="flex items-start gap-2 p-2 bg-background rounded border">
      <div class="flex-1 grid grid-cols-[120px_1fr] gap-2 items-start">
        <Select
          value={selectedRuleType()}
          onChange={(val) => {
            if (!val) return;
            if (val.value === "specific") {
              props.onUpdate({ type: "specific", courseIds: [] });
            } else {
              props.onUpdate({ type: "prefix", prefix: "" });
            }
          }}
          options={ruleTypeOptions}
          optionValue="value"
          optionTextValue="label"
          placeholder="タイプ"
          itemComponent={(itemProps) => (
            <SelectItem item={itemProps.item}>{itemProps.item.rawValue.label}</SelectItem>
          )}
        >
          <SelectTrigger class="h-8">
            <SelectValue<RuleTypeOption>>{(state) => state.selectedOption().label}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <Show when={props.rule.type === "specific"}>
          {(() => {
            const rule = props.rule as Extract<GroupRule, { type: "specific" }>;
            return (
              <div class="space-y-1">
                <Input
                  class="h-8"
                  value={rule.courseIds.join(", ")}
                  onInput={(e) => {
                    const ids = e.currentTarget.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s);
                    props.onUpdate({ type: "specific", courseIds: ids });
                  }}
                  placeholder="科目番号（カンマ区切り）"
                />
                <Show when={rule.courseIds.length > 0}>
                  <div class="text-xs text-muted-foreground">
                    <For each={rule.courseIds}>
                      {(id, index) => (
                        <>
                          <Show when={index() > 0}>, </Show>
                          <span>
                            {id}
                            <Show when={courseNames().get(id)}> ({courseNames().get(id)})</Show>
                          </span>
                        </>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            );
          })()}
        </Show>

        <Show when={props.rule.type === "prefix"}>
          {(() => {
            const rule = props.rule as Extract<GroupRule, { type: "prefix" }>;
            return (
              <Input
                class="h-8"
                value={rule.prefix}
                onInput={(e) => props.onUpdate({ type: "prefix", prefix: e.currentTarget.value })}
                placeholder="プレフィックス（例: FG）"
              />
            );
          })()}
        </Show>
      </div>

      <Button
        variant="ghost"
        size="sm"
        class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
        onClick={props.onRemove}
      >
        <Trash2 class="size-4" />
      </Button>
    </div>
  );
};
