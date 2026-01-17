import { Plus, Trash2 } from "lucide-solid";
import { type Component, createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { getCoursesByIds } from "~/lib/db/kdb";
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

const ruleTypeOptions: { value: "specific" | "pattern" | "group"; label: string }[] = [
  { value: "specific", label: "特定科目" },
  { value: "pattern", label: "パターン" },
  { value: "group", label: "グループ" },
];

export const SubcategoryEditModal: Component<SubcategoryEditModalProps> = (props) => {
  const [name, setName] = createSignal("");
  const [type, setType] = createSignal<"required" | "elective" | "free">("required");
  const [minCredits, setMinCredits] = createSignal(0);
  const [maxCredits, setMaxCredits] = createSignal<number | undefined>(undefined);
  const [notes, setNotes] = createSignal<string | undefined>(undefined);
  const [rules, setRules] = createSignal<RequirementRule[]>([]);

  createEffect(() => {
    if (props.subcategory) {
      setName(props.subcategory.name);
      setType(props.subcategory.type);
      setMinCredits(props.subcategory.minCredits);
      setMaxCredits(props.subcategory.maxCredits);
      setNotes(props.subcategory.notes);
      setRules(JSON.parse(JSON.stringify(props.subcategory.rules)));
    } else if (props.open) {
      setName("");
      setType("elective");
      setMinCredits(0);
      setMaxCredits(undefined);
      setNotes(undefined);
      setRules([]);
    }
  });

  const handleSave = () => {
    const updates: Partial<RequirementSubcategory> = {
      name: name(),
      type: type(),
      minCredits: minCredits(),
      maxCredits: maxCredits(),
      notes: notes(),
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
    setRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, ...updates } : rule)));
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
          <DialogTitle>{props.subcategory ? "サブカテゴリを編集" : "サブカテゴリを追加"}</DialogTitle>
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
              <Label>タイプ</Label>
              <Select
                value={selectedType()}
                onChange={(val) => val && setType(val.value)}
                options={typeOptions}
                optionValue="value"
                optionTextValue="label"
                placeholder="タイプを選択"
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

            <div class="space-y-2">
              <Label for="subcategory-notes">メモ</Label>
              <Input
                id="subcategory-notes"
                value={notes() ?? ""}
                onInput={(e) => {
                  const val = e.currentTarget.value;
                  setNotes(val || undefined);
                }}
                placeholder="任意"
              />
            </div>

            {/* ルール編集セクション */}
            <div class="space-y-3 pt-4 border-t">
              <div class="flex items-center justify-between">
                <Label class="text-base font-semibold">条件（ルール）</Label>
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
                  ルールがありません。「追加」ボタンでルールを追加してください。
                </p>
              </Show>
            </div>
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
    const courseIds = props.rule.type === "specific"
      ? props.rule.courseIds
      : props.rule.type === "group"
        ? props.rule.groupCourseIds
        : undefined;

    if (!courseIds || courseIds.length === 0) {
      setCourseNames(new Map());
      return;
    }

    let cancelled = false;
    onCleanup(() => { cancelled = true; });

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
                onChange={(val) => val && props.onUpdate({ type: val.value })}
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
                value={props.rule.description ?? ""}
                onInput={(e) => props.onUpdate({ description: e.currentTarget.value || undefined })}
                placeholder="例: プログラミング序論"
              />
            </div>
          </div>

          {/* タイプ別の入力フィールド */}
          <Show when={props.rule.type === "specific"}>
            <div class="space-y-1">
              <Label class="text-xs">科目ID（カンマ区切り）</Label>
              <Input
                class="h-8"
                value={props.rule.courseIds?.join(", ") ?? ""}
                onInput={(e) => {
                  const ids = e.currentTarget.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s);
                  props.onUpdate({ courseIds: ids.length > 0 ? ids : undefined });
                }}
                placeholder="例: FG20204, FG20214"
              />
              <Show when={props.rule.courseIds && props.rule.courseIds.length > 0}>
                <div class="text-xs text-muted-foreground mt-1">
                  <For each={props.rule.courseIds}>
                    {(id, index) => (
                      <>
                        <Show when={index() > 0}>, </Show>
                        <span>
                          {id}
                          <Show when={courseNames().get(id)}>
                            {" "}({courseNames().get(id)})
                          </Show>
                        </span>
                      </>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={props.rule.type === "pattern"}>
            <div class="space-y-1">
              <Label class="text-xs">科目IDパターン（正規表現）</Label>
              <Input
                class="h-8"
                value={props.rule.courseIdPattern ?? ""}
                onInput={(e) =>
                  props.onUpdate({ courseIdPattern: e.currentTarget.value || undefined })
                }
                placeholder="例: ^FG(17|24|25)"
              />
            </div>
          </Show>

          <Show when={props.rule.type === "group"}>
            <div class="space-y-2">
              <div class="space-y-1">
                <Label class="text-xs">グループ名</Label>
                <Input
                  class="h-8"
                  value={props.rule.groupName ?? ""}
                  onInput={(e) => props.onUpdate({ groupName: e.currentTarget.value || undefined })}
                  placeholder="例: 数学系科目"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">科目ID（カンマ区切り）</Label>
                <Input
                  class="h-8"
                  value={props.rule.groupCourseIds?.join(", ") ?? ""}
                  onInput={(e) => {
                    const ids = e.currentTarget.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s);
                    props.onUpdate({ groupCourseIds: ids.length > 0 ? ids : undefined });
                  }}
                  placeholder="例: GA15111, GA15121"
                />
                <Show when={props.rule.groupCourseIds && props.rule.groupCourseIds.length > 0}>
                  <div class="text-xs text-muted-foreground mt-1">
                    <For each={props.rule.groupCourseIds}>
                      {(id, index) => (
                        <>
                          <Show when={index() > 0}>, </Show>
                          <span>
                            {id}
                            <Show when={courseNames().get(id)}>
                              {" "}({courseNames().get(id)})
                            </Show>
                          </span>
                        </>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          <div class="grid grid-cols-3 gap-2">
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
            <div class="space-y-1">
              <Label class="text-xs">最大単位</Label>
              <Input
                class="h-8"
                type="number"
                min="0"
                value={props.rule.maxCredits ?? ""}
                onInput={(e) => {
                  const val = e.currentTarget.value;
                  props.onUpdate({ maxCredits: val ? Number.parseInt(val, 10) : undefined });
                }}
              />
            </div>
            <div class="space-y-1 flex items-end">
              <label class="flex items-center gap-2 text-xs h-8">
                <input
                  type="checkbox"
                  checked={props.rule.required ?? false}
                  onChange={(e) => props.onUpdate({ required: e.currentTarget.checked })}
                  class="rounded"
                />
                必須
              </label>
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
