import { Plus, Trash2 } from "lucide-solid";
import { type Component, createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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
import type { RequirementRule, RequirementSubcategory } from "~/lib/types";

interface SubcategoryEditModalProps {
  open: boolean;
  subcategory: RequirementSubcategory | null;
  categoryId: string;
  onClose: () => void;
  onSave: (
    categoryId: string,
    subcategoryId: string | null,
    updates: Partial<RequirementSubcategory>,
  ) => void;
}

const typeOptions: { value: "required" | "elective" | "free"; label: string }[] = [
  { value: "required", label: "必修" },
  { value: "elective", label: "選択" },
  { value: "free", label: "自由" },
];

const ruleTypeOptions: { value: "specific" | "pattern"; label: string }[] = [
  { value: "specific", label: "特定科目" },
  { value: "pattern", label: "パターン" },
];

export const SubcategoryEditModal: Component<SubcategoryEditModalProps> = (props) => {
  const [name, setName] = createSignal("");
  const [type, setType] = createSignal<"required" | "elective" | "free">("required");
  const [courseIds, setCourseIds] = createSignal<string[]>([]);
  const [minCredits, setMinCredits] = createSignal(0);
  const [maxCredits, setMaxCredits] = createSignal<number | undefined>(undefined);
  const [rules, setRules] = createSignal<RequirementRule[]>([]);
  const [requiredCourseNames, setRequiredCourseNames] = createSignal<Map<string, string>>(
    new Map(),
  );

  createEffect(() => {
    if (props.subcategory) {
      setName(props.subcategory.name);
      setType(props.subcategory.type);
      if (props.subcategory.type === "required") {
        setCourseIds([...(props.subcategory.courseIds ?? [])]);
        setMinCredits(0);
        setMaxCredits(undefined);
        setRules([]);
      } else {
        setCourseIds([]);
        setMinCredits(props.subcategory.minCredits);
        setMaxCredits(props.subcategory.maxCredits);
        setRules(JSON.parse(JSON.stringify(props.subcategory.rules)));
      }
    } else if (props.open) {
      setName("");
      setType("elective");
      setCourseIds([]);
      setMinCredits(0);
      setMaxCredits(undefined);
      setRules([]);
    }
  });

  createEffect(() => {
    if (type() !== "required") {
      setRequiredCourseNames(new Map());
      return;
    }

    const ids = courseIds();
    if (ids.length === 0) {
      setRequiredCourseNames(new Map());
      return;
    }

    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    void (async () => {
      const courses = await getCoursesByIds(ids);
      if (cancelled) return;
      const nameMap = new Map<string, string>();
      for (const course of courses) {
        nameMap.set(course.id, course.name);
      }
      setRequiredCourseNames(nameMap);
    })();
  });

  const handleSave = () => {
    const updates: Partial<RequirementSubcategory> =
      type() === "required"
        ? {
            name: name(),
            type: type(),
            courseIds: courseIds(),
          }
        : {
            name: name(),
            type: type(),
            minCredits: minCredits(),
            maxCredits: maxCredits(),
            rules: rules(),
          };

    props.onSave(props.categoryId, props.subcategory?.id ?? null, updates);
    props.onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose();
    }
  };

  const selectedType = () => typeOptions.find((opt) => opt.value === type());

  const updateRule = (index: number, updates: Partial<RequirementRule>) => {
    setRules((prev) =>
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
        } else {
          return {
            id: merged.id,
            description: merged.description,
            minCredits: merged.minCredits,
            type: "pattern",
            courseIdPattern: "courseIdPattern" in merged ? (merged.courseIdPattern as string) : "",
          } satisfies RequirementRule;
        }
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
    setRules((prev) => [...prev, newRule]);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {props.subcategory ? "サブカテゴリを編集" : "サブカテゴリを追加"}
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="subcategory-name">名前</Label>
            <Input
              id="subcategory-name"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
            />
          </div>

          <div class="space-y-2">
            <Label>科目タイプ</Label>
            <Select
              value={selectedType()}
              onChange={(val) => val && setType(val.value)}
              options={typeOptions}
              optionValue="value"
              optionTextValue="label"
              placeholder="科目タイプを選択"
              disabled={props.subcategory !== null}
              itemComponent={(itemProps) => (
                <SelectItem item={itemProps.item}>{itemProps.item.rawValue.label}</SelectItem>
              )}
            >
              <SelectTrigger>
                <SelectValue<{ value: string; label: string }>>
                  {(state) => state.selectedOption().label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          <Show when={type() === "required"}>
            <div class="space-y-2">
              <Label for="sub-course-ids">必修科目ID（カンマ区切り）</Label>
              <Input
                id="sub-course-ids"
                value={courseIds().join(", ")}
                onInput={(e) => {
                  const ids = e.currentTarget.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s);
                  setCourseIds(ids);
                }}
                placeholder="例: FG20204, FG20214"
              />
              <Show when={courseIds().length > 0}>
                <div class="text-xs text-muted-foreground mt-1">
                  <For each={courseIds()}>
                    {(id, index) => (
                      <>
                        <Show when={index() > 0}>, </Show>
                        <span>
                          {id}
                          <Show when={requiredCourseNames().get(id)}>
                            {" "}
                            ({requiredCourseNames().get(id)})
                          </Show>
                        </span>
                      </>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={type() !== "required"}>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="sub-min-credits">最小単位数</Label>
                <Input
                  id="sub-min-credits"
                  type="number"
                  min="0"
                  value={minCredits()}
                  onInput={(e) => {
                    const val = e.currentTarget.value;
                    setMinCredits(val ? Number.parseInt(val, 10) : 0);
                  }}
                />
              </div>

              <div class="space-y-2">
                <Label for="sub-max-credits">最大単位数</Label>
                <Input
                  id="sub-max-credits"
                  type="number"
                  min="0"
                  value={maxCredits() ?? ""}
                  onInput={(e) => {
                    const val = e.currentTarget.value;
                    setMaxCredits(val ? Number.parseInt(val, 10) : undefined);
                  }}
                />
              </div>
            </div>

            {/* ルール編集セクション */}
            <div class="space-y-3 pt-4 border-t">
              <div class="flex items-center justify-between">
                <Label class="text-base font-semibold">条件</Label>
                <Button variant="outline" size="sm" onClick={addRule}>
                  <Plus class="size-4 mr-1" />
                  追加
                </Button>
              </div>

              <For each={rules()}>
                {(rule, index) => (
                  <RuleEditor
                    rule={rule}
                    onUpdate={(updates) => updateRule(index(), updates)}
                    onRemove={() => removeRule(index())}
                  />
                )}
              </For>

              <Show when={rules().length === 0}>
                <p class="text-sm text-muted-foreground text-center py-4">
                  条件がありません。「追加」ボタンで条件を追加してください。
                </p>
              </Show>
            </div>
          </Show>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RuleEditor: Component<{
  rule: RequirementRule;
  onUpdate: (updates: Partial<RequirementRule>) => void;
  onRemove: () => void;
}> = (props) => {
  const selectedRuleType = () => ruleTypeOptions.find((opt) => opt.value === props.rule.type);
  const [courseNames, setCourseNames] = createSignal<Map<string, string>>(new Map());

  // 科目IDから科目名を取得
  createEffect(() => {
    const courseIds = props.rule.type === "specific" ? props.rule.courseIds : [];

    if (!courseIds || courseIds.length === 0) {
      setCourseNames(new Map());
      return;
    }

    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    void (async () => {
      const courses = await getCoursesByIds(courseIds);
      if (cancelled) return;
      const nameMap = new Map<string, string>();
      for (const course of courses) {
        nameMap.set(course.id, course.name);
      }
      setCourseNames(nameMap);
    })();
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
                  <SelectValue<{ value: string; label: string }>>
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

          {/* タイプ別の入力フィールド */}
          <Show when={props.rule.type === "specific"}>
            {(() => {
              const rule = props.rule as Extract<RequirementRule, { type: "specific" }>;
              return (
                <div class="space-y-1">
                  <Label class="text-xs">科目ID（カンマ区切り）</Label>
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
                  <Label class="text-xs">科目IDパターン（正規表現）</Label>
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
