import { Plus } from "lucide-solid";
import { type Accessor, type Component, For, type Setter, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import type { RequirementRule } from "~/lib/types";
import { RuleEditor } from "./RuleEditor";

interface RulesSectionProps {
  rules: Accessor<RequirementRule[]>;
  setRules: Setter<RequirementRule[]>;
}

export const RulesSection: Component<RulesSectionProps> = (props) => {
  const updateRule = (index: number, updates: Partial<RequirementRule>) => {
    props.setRules((prev) =>
      prev.map((rule, i) => {
        if (i !== index) return rule;
        const merged = { ...rule, ...updates };
        // 型の整合性を保証する
        if (merged.type === "specific") {
          return {
            id: merged.id,
            description: merged.description,
            minCredits: merged.minCredits,
            type: "specific",
            courseIds: "courseIds" in merged ? (merged.courseIds as string[]) : [],
          } satisfies RequirementRule;
        }
        return {
          id: merged.id,
          description: merged.description,
          minCredits: merged.minCredits,
          type: "pattern",
          courseIdPattern: "courseIdPattern" in merged ? (merged.courseIdPattern as string) : "",
        } satisfies RequirementRule;
      }),
    );
  };

  const addRule = () => {
    const newRule: RequirementRule = {
      id: `rule-${Date.now()}`,
      type: "pattern",
      description: "",
      courseIdPattern: "",
    };
    props.setRules((prev) => [...prev, newRule]);
  };

  const removeRule = (index: number) => {
    props.setRules((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div class="space-y-3 pt-4 border-t">
      <div class="flex items-center justify-between">
        <Label class="text-base font-semibold">条件</Label>
        <Button variant="outline" size="sm" onClick={addRule}>
          <Plus class="size-4 mr-1" />
          追加
        </Button>
      </div>

      <For each={props.rules()}>
        {(rule, index) => (
          <RuleEditor
            rule={rule}
            onUpdate={(updates) => updateRule(index(), updates)}
            onRemove={() => removeRule(index())}
          />
        )}
      </For>

      <Show when={props.rules().length === 0}>
        <p class="text-sm text-muted-foreground text-center py-4">
          条件がありません。「追加」ボタンで条件を追加してください。
        </p>
      </Show>
    </div>
  );
};
