import Plus from "lucide-solid/icons/plus";
import Trash2 from "lucide-solid/icons/trash-2";
import type { Component } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { ExcludeRule, IncludeRule, RequirementGroup } from "~/types";
import { RuleList } from "./RuleList";

interface GroupEditorProps {
  group: RequirementGroup;
  onUpdate: (updates: Partial<RequirementGroup>) => void;
  onRemove: () => void;
}

export const GroupEditor: Component<GroupEditorProps> = (props) => {
  const updateIncludeRule = (index: number, updates: Partial<IncludeRule>) => {
    const newRules = props.group.includeRules.map((rule, i) => {
      if (i !== index) return rule;
      const merged = { ...rule, ...updates };
      if (rule.type === "courses") {
        return {
          id: rule.id,
          type: "courses",
          courseNames:
            "courseNames" in merged ? (merged.courseNames as string[]) : rule.courseNames,
        } satisfies IncludeRule;
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
        } satisfies IncludeRule;
      }
      return {
        id: rule.id,
        type: "prefix",
        prefixes: "prefixes" in merged ? (merged.prefixes as string[]) : rule.prefixes,
      } satisfies IncludeRule;
    });
    props.onUpdate({ includeRules: newRules });
  };

  const updateExcludeRule = (index: number, updates: Partial<ExcludeRule>) => {
    const newRules = (props.group.excludeRules ?? []).map((rule, i) => {
      if (i !== index) return rule;
      const merged = { ...rule, ...updates };
      if (rule.type === "courses") {
        return {
          id: rule.id,
          type: "courses",
          courseNames:
            "courseNames" in merged ? (merged.courseNames as string[]) : rule.courseNames,
        } satisfies ExcludeRule;
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
        } satisfies ExcludeRule;
      }
      return {
        id: rule.id,
        type: "prefix",
        prefixes: "prefixes" in merged ? (merged.prefixes as string[]) : rule.prefixes,
      } satisfies ExcludeRule;
    });
    props.onUpdate({ excludeRules: newRules });
  };

  const addSpecificIncludeRule = () => {
    const newRule: IncludeRule = {
      id: `rule-${Date.now()}`,
      type: "courses",
      courseNames: [],
    };
    props.onUpdate({ includeRules: [...props.group.includeRules, newRule] });
  };

  const addPrefixIncludeRule = () => {
    const newRule: IncludeRule = {
      id: `rule-${Date.now()}`,
      type: "prefix",
      prefixes: [""],
    };
    props.onUpdate({ includeRules: [...props.group.includeRules, newRule] });
  };

  const addCategoryIncludeRule = () => {
    const newRule: IncludeRule = {
      id: `rule-${Date.now()}`,
      type: "category",
      majorCategory: "",
    };
    props.onUpdate({ includeRules: [...props.group.includeRules, newRule] });
  };

  const addSpecificExcludeRule = () => {
    const newRule: ExcludeRule = {
      id: `rule-${Date.now()}`,
      type: "courses",
      courseNames: [],
    };
    props.onUpdate({ excludeRules: [...(props.group.excludeRules ?? []), newRule] });
  };

  const addPrefixExcludeRule = () => {
    const newRule: ExcludeRule = {
      id: `rule-${Date.now()}`,
      type: "prefix",
      prefixes: [""],
    };
    props.onUpdate({ excludeRules: [...(props.group.excludeRules ?? []), newRule] });
  };

  const addCategoryExcludeRule = () => {
    const newRule: ExcludeRule = {
      id: `rule-${Date.now()}`,
      type: "category",
      majorCategory: "",
    };
    props.onUpdate({ excludeRules: [...(props.group.excludeRules ?? []), newRule] });
  };

  const removeIncludeRule = (index: number) => {
    props.onUpdate({ includeRules: props.group.includeRules.filter((_, i) => i !== index) });
  };

  const removeExcludeRule = (index: number) => {
    const newRules = (props.group.excludeRules ?? []).filter((_, i) => i !== index);
    props.onUpdate({ excludeRules: newRules.length > 0 ? newRules : undefined });
  };

  const moveIncludeRule = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const nextRules = [...props.group.includeRules];
    const [moved] = nextRules.splice(fromIndex, 1);
    nextRules.splice(toIndex, 0, moved);
    props.onUpdate({ includeRules: nextRules });
  };

  const moveExcludeRule = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const nextRules = [...(props.group.excludeRules ?? [])];
    const [moved] = nextRules.splice(fromIndex, 1);
    nextRules.splice(toIndex, 0, moved);
    props.onUpdate({ excludeRules: nextRules });
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

      <div class="space-y-4">
        <div class="space-y-2">
          <Label class="text-sm font-semibold">対象科目</Label>
          <RuleList
            rules={props.group.includeRules}
            onUpdateRule={updateIncludeRule}
            onRemoveRule={removeIncludeRule}
            onMoveRule={moveIncludeRule}
          />
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="ghost" size="sm" onClick={addSpecificIncludeRule} class="h-8">
              <Plus class="size-4 mr-1" />
              特定科目
            </Button>
            <Button variant="ghost" size="sm" onClick={addPrefixIncludeRule} class="h-8">
              <Plus class="size-4 mr-1" />
              ～で始まる科目
            </Button>
            <Button variant="ghost" size="sm" onClick={addCategoryIncludeRule} class="h-8">
              <Plus class="size-4 mr-1" />
              科目区分
            </Button>
          </div>
        </div>

        <div class="space-y-2">
          <Label class="text-sm font-semibold">除外条件</Label>
          <RuleList
            rules={props.group.excludeRules ?? []}
            onUpdateRule={
              updateExcludeRule as (
                index: number,
                updates: Partial<IncludeRule | ExcludeRule>,
              ) => void
            }
            onRemoveRule={removeExcludeRule}
            onMoveRule={moveExcludeRule}
          />
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="ghost" size="sm" onClick={addSpecificExcludeRule} class="h-8">
              <Plus class="size-4 mr-1" />
              特定科目を除外
            </Button>
            <Button variant="ghost" size="sm" onClick={addPrefixExcludeRule} class="h-8">
              <Plus class="size-4 mr-1" />
              ～で始まる科目を除外
            </Button>
            <Button variant="ghost" size="sm" onClick={addCategoryExcludeRule} class="h-8">
              <Plus class="size-4 mr-1" />
              科目区分を除外
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
