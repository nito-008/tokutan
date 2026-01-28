import { Plus, Trash2 } from "lucide-solid";
import type { Component } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { GroupRule, RequirementGroup } from "~/types";
import { RuleList } from "./RuleList";

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
      if (rule.type === "specific") {
        return {
          id: rule.id,
          type: "specific",
          courseIds: "courseIds" in merged ? (merged.courseIds as string[]) : rule.courseIds,
          courseNames:
            "courseNames" in merged
              ? (merged.courseNames as string[] | undefined)
              : rule.courseNames,
        } satisfies GroupRule;
      }
      if (rule.type === "exclude") {
        return {
          id: rule.id,
          type: "exclude",
          courseIds: "courseIds" in merged ? (merged.courseIds as string[]) : rule.courseIds,
        } satisfies GroupRule;
      }
      if (rule.type === "category") {
        return {
          id: rule.id,
          type: "category",
          majorCategory:
            "majorCategory" in merged ? (merged.majorCategory as string) : rule.majorCategory,
          middleCategory:
            "middleCategory" in merged
              ? (merged.middleCategory as string | undefined)
              : rule.middleCategory,
          minorCategory:
            "minorCategory" in merged
              ? (merged.minorCategory as string | undefined)
              : rule.minorCategory,
        } satisfies GroupRule;
      }
      return {
        id: rule.id,
        type: "prefix",
        prefix: "prefix" in merged ? (merged.prefix as string) : rule.prefix,
      } satisfies GroupRule;
    });
    props.onUpdate({ rules: newRules });
  };

  const addSpecificRule = () => {
    const newRule: GroupRule = {
      id: `rule-${Date.now()}`,
      type: "specific",
      courseIds: [],
      courseNames: [],
    };
    props.onUpdate({ rules: [...props.group.rules, newRule] });
  };

  const addPrefixRule = () => {
    const newRule: GroupRule = {
      id: `rule-${Date.now()}`,
      type: "prefix",
      prefix: "",
    };
    props.onUpdate({ rules: [...props.group.rules, newRule] });
  };

  const addExcludeRule = () => {
    const newRule: GroupRule = {
      id: `rule-${Date.now()}`,
      type: "exclude",
      courseIds: [],
    };
    props.onUpdate({ rules: [...props.group.rules, newRule] });
  };

  const addCategoryRule = () => {
    const newRule: GroupRule = {
      id: `rule-${Date.now()}`,
      type: "category",
      majorCategory: "",
    };
    props.onUpdate({ rules: [...props.group.rules, newRule] });
  };

  const removeRule = (index: number) => {
    props.onUpdate({ rules: props.group.rules.filter((_, i) => i !== index) });
  };

  const moveRule = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const nextRules = [...props.group.rules];
    const [moved] = nextRules.splice(fromIndex, 1);
    nextRules.splice(toIndex, 0, moved);
    props.onUpdate({ rules: nextRules });
  };

  return (
    <div class="border rounded-lg p-4 space-y-6">
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

      <RuleList
        rules={props.group.rules}
        onUpdateRule={updateRule}
        onRemoveRule={removeRule}
        onMoveRule={moveRule}
      />

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="ghost" size="sm" onClick={addSpecificRule} class="h-8">
          <Plus class="size-4 mr-1" />
          特定科目の追加
        </Button>
        <Button variant="ghost" size="sm" onClick={addPrefixRule} class="h-8">
          <Plus class="size-4 mr-1" />
          ～で始まる科目の追加
        </Button>
        <Button variant="ghost" size="sm" onClick={addCategoryRule} class="h-8">
          <Plus class="size-4 mr-1" />
          科目区分から追加
        </Button>
        <Button variant="ghost" size="sm" onClick={addExcludeRule} class="h-8">
          <Plus class="size-4 mr-1" />
          除外科目の追加
        </Button>
      </div>
    </div>
  );
};
