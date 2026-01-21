import { Trash2 } from "lucide-solid";
import { type Component, createEffect, createSignal, For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getCoursesByIds } from "~/lib/db/kdb";
import type { RequirementRule } from "~/lib/types";

type RuleTypeOption = { value: "specific" | "pattern"; label: string };

const ruleTypeOptions: RuleTypeOption[] = [
  { value: "specific", label: "特定科目" },
  { value: "pattern", label: "パターン" },
];

interface RuleEditorProps {
  rule: RequirementRule;
  onUpdate: (updates: Partial<RequirementRule>) => void;
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
    <div class="border rounded-lg p-3 space-y-3 bg-muted/30">
      <div class="flex items-start gap-2">
        <div class="flex-1 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label class="text-xs">ルールタイプ</Label>
              <Select
                value={selectedRuleType()}
                onChange={(val) => {
                  if (!val) return;
                  if (val.value === "specific") {
                    props.onUpdate({ type: "specific", courseIds: [] });
                  } else {
                    props.onUpdate({ type: "pattern", courseIdPattern: "" });
                  }
                }}
                options={ruleTypeOptions}
                optionValue="value"
                optionTextValue="label"
                placeholder="タイプを選択"
                itemComponent={(itemProps) => (
                  <SelectItem item={itemProps.item}>{itemProps.item.rawValue.label}</SelectItem>
                )}
              >
                <SelectTrigger class="h-8">
                  <SelectValue<RuleTypeOption>>
                    {(state) => state.selectedOption().label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>

            <div class="space-y-1">
              <Label class="text-xs">説明</Label>
              <Input
                class="h-8"
                value={props.rule.description}
                onInput={(e) => props.onUpdate({ description: e.currentTarget.value })}
                placeholder="例: プログラミング序論"
              />
            </div>
          </div>

          <Show when={props.rule.type === "specific"}>
            {(() => {
              const rule = props.rule as Extract<RequirementRule, { type: "specific" }>;
              return (
                <div class="space-y-1">
                  <Label class="text-xs">科目番号（カンマ区切り）</Label>
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
                    placeholder="例: FG20204, FG20214"
                  />
                  <Show when={rule.courseIds.length > 0}>
                    <div class="text-xs text-muted-foreground mt-1">
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

          <Show when={props.rule.type === "pattern"}>
            {(() => {
              const rule = props.rule as Extract<RequirementRule, { type: "pattern" }>;
              return (
                <div class="space-y-1">
                  <Label class="text-xs">科目番号パターン（正規表現）</Label>
                  <Input
                    class="h-8"
                    value={rule.courseIdPattern}
                    onInput={(e) =>
                      props.onUpdate({ type: "pattern", courseIdPattern: e.currentTarget.value })
                    }
                    placeholder="例: ^FG(17|24|25)"
                  />
                </div>
              );
            })()}
          </Show>

          <div class="grid grid-cols-1 gap-2">
            <div class="space-y-1">
              <Label class="text-xs">最小単位</Label>
              <Input
                class="h-8"
                type="number"
                min="0"
                value={props.rule.minCredits ?? ""}
                onInput={(e) => {
                  const val = e.currentTarget.value;
                  props.onUpdate({ minCredits: val ? Number.parseInt(val, 10) : undefined });
                }}
              />
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          class="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={props.onRemove}
        >
          <Trash2 class="size-4" />
        </Button>
      </div>
    </div>
  );
};
