import { Plus, Trash2 } from "lucide-solid";
import { type Component, For } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { GroupRule, RequirementGroup } from "~/lib/types";
import { RuleEditor } from "./RuleEditor";

interface GroupEditorProps {
  group: RequirementGroup;
  onUpdate: (updates: Partial<RequirementGroup>) => void;
  onRemove: () => void;
}

export const GroupEditor: Component<GroupEditorProps> = (props) => {
  const updateRule = (index: number, updates: Partial<GroupRule>) => {
    const newRules = props.group.rules.map((rule, i) => {
      if (i !== index) return rule;
      const merged = { ...rule, ...updates };
      // 型の整合性を保証する
      if (merged.type === "specific") {
        return {
          id: merged.id,
          type: "specific",
          courseIds: "courseIds" in merged ? (merged.courseIds as string[]) : [],
        } satisfies GroupRule;
      }
      return {
        id: merged.id,
        type: "prefix",
        prefix: "prefix" in merged ? (merged.prefix as string) : "",
      } satisfies GroupRule;
    });
    props.onUpdate({ rules: newRules });
  };

  const addRule = () => {
    const newRule: GroupRule = {
      id: `rule-${Date.now()}`,
      type: "prefix",
      prefix: "",
    };
    props.onUpdate({ rules: [...props.group.rules, newRule] });
  };

  const removeRule = (index: number) => {
    props.onUpdate({ rules: props.group.rules.filter((_, i) => i !== index) });
  };

  return (
    <div class="border rounded-lg p-4 space-y-4 bg-muted/30">
      <div class="flex items-start gap-2">
        <div class="flex-1 grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <Label class="text-xs">最小単位数</Label>
            <Input
              class="h-8"
              type="number"
              min="0"
              value={props.group.minCredits}
              onInput={(e) => {
                const val = e.currentTarget.value;
                props.onUpdate({ minCredits: val ? Number.parseInt(val, 10) : 0 });
              }}
            />
          </div>
          <div class="space-y-1">
            <Label class="text-xs">最大単位数（任意）</Label>
            <Input
              class="h-8"
              type="number"
              min="0"
              value={props.group.maxCredits ?? ""}
              onInput={(e) => {
                const val = e.currentTarget.value;
                props.onUpdate({ maxCredits: val ? Number.parseInt(val, 10) : undefined });
              }}
            />
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

      <div class="space-y-2">
        <For each={props.group.rules}>
          {(rule, index) => (
            <RuleEditor
              rule={rule}
              onUpdate={(updates) => updateRule(index(), updates)}
              onRemove={() => removeRule(index())}
            />
          )}
        </For>

        <Button variant="ghost" size="sm" onClick={addRule} class="w-full h-8">
          <Plus class="size-4 mr-1" />
          ルールを追加
        </Button>
      </div>
    </div>
  );
};
