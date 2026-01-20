import { Check, Plus, Trash2 } from "lucide-solid";
import { type Component, createEffect, createSignal, For, Index, onCleanup, Show } from "solid-js";
import { toast } from "solid-sonner";
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
import { getCoursesByIds, searchKdb } from "~/lib/db/kdb";
import type { Course, RequirementRule, RequirementSubcategory } from "~/lib/types";

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
  const [isCourseLookupLoading, setIsCourseLookupLoading] = createSignal(false);
  const [focusedCourseIndex, setFocusedCourseIndex] = createSignal<number | null>(null);
  const [courseSuggestions, setCourseSuggestions] = createSignal<Course[]>([]);
  const [isSuggestionLoading, setIsSuggestionLoading] = createSignal(false);
  const [suggestionIndex, setSuggestionIndex] = createSignal<number | null>(null);
  const [suggestionQuery, setSuggestionQuery] = createSignal("");
  const [hasActiveSearch, setHasActiveSearch] = createSignal(false);
  const parseCourseGroup = (value: string) =>
    value
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);
  const uniqueCourseIds = (ids: string[]) => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      result.push(id);
    }
    return result;
  };
  const formatCourseGroup = (ids: string[]) => ids.join(", ");
  const normalizeCourseGroup = (value: string) =>
    formatCourseGroup(uniqueCourseIds(parseCourseGroup(value)));
  const extractSuggestionToken = (value: string) => {
    const parts = value.split(",");
    return (parts[parts.length - 1] ?? "").trim();
  };
  const dropSearchToken = (value: string) => {
    const parts = value.split(",").map((part) => part.trim());
    const lastToken = parts[parts.length - 1] ?? "";
    if (lastToken) {
      parts.pop();
    }
    return parts.filter((part) => part);
  };
  const getGroupName = (ids: string[]) => {
    for (const id of ids) {
      const name = requiredCourseNames().get(id);
      if (name) return name;
    }
    return undefined;
  };
  const formatCourseLabel = (courseId: string) => {
    const name = requiredCourseNames().get(courseId);
    return name ? `${courseId}（${name}）` : courseId;
  };
  const formatCourseGroupLabel = (value: string) => {
    const ids = parseCourseGroup(value);
    if (ids.length === 0) return "";
    return ids
      .map((courseId) => {
        const label = formatCourseLabel(courseId);
        if (label !== courseId) return label;
        if (isCourseLookupLoading()) return courseId;
        return `${courseId}: 科目が見つかりません`;
      })
      .join(", ");
  };
  const normalizeCourseIds = (ids: string[]) => {
    const normalized = ids.map((id) => id.trim());
    while (normalized.length > 0 && normalized[normalized.length - 1] === "") {
      normalized.pop();
    }
    normalized.push("");
    return normalized;
  };
  let suggestionTimeout: number | null = null;
  let suggestionRequestId = 0;

  const resetSuggestionQuery = () => {
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
      suggestionTimeout = null;
    }
    suggestionRequestId += 1;
    setIsSuggestionLoading(false);
    setSuggestionQuery("");
  };
  const clearSuggestions = () => {
    resetSuggestionQuery();
    setCourseSuggestions([]);
    setSuggestionIndex(null);
    setHasActiveSearch(false);
  };

  const requestSuggestions = (index: number, value: string) => {
    const normalizedValue = value.trim();
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
      suggestionTimeout = null;
    }
    setSuggestionIndex(index);
    setSuggestionQuery(normalizedValue);
    if (normalizedValue.length < 2) {
      setCourseSuggestions([]);
      setIsSuggestionLoading(false);
      return;
    }
    const requestId = ++suggestionRequestId;
    suggestionTimeout = window.setTimeout(async () => {
      setIsSuggestionLoading(true);
      try {
        const found = await searchKdb(normalizedValue);
        if (requestId !== suggestionRequestId) return;
        if (focusedCourseIndex() !== index) return;
        setCourseSuggestions(found);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        if (requestId === suggestionRequestId) {
          setIsSuggestionLoading(false);
        }
      }
    }, 250);
  };

  onCleanup(() => {
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
    }
    suggestionRequestId += 1;
  });

  createEffect(() => {
    if (props.subcategory) {
      setName(props.subcategory.name);
      setType(props.subcategory.type);
      if (props.subcategory.type === "required") {
        setCourseIds(
          normalizeCourseIds(
            [...(props.subcategory.courseIds ?? [])].map((id) => id.trim()).filter((id) => id),
          ),
        );
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
      setIsCourseLookupLoading(false);
      setFocusedCourseIndex(null);
      clearSuggestions();
      return;
    }

    const ids = uniqueCourseIds(courseIds().flatMap((value) => parseCourseGroup(value)));
    if (ids.length === 0) {
      setRequiredCourseNames(new Map());
      setIsCourseLookupLoading(false);
      return;
    }

    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    void (async () => {
      setIsCourseLookupLoading(true);
      const courses = await getCoursesByIds(ids);
      if (cancelled) return;
      const nameMap = new Map<string, string>();
      for (const course of courses) {
        nameMap.set(course.id, course.name);
      }
      setRequiredCourseNames(nameMap);
      setIsCourseLookupLoading(false);
    })();
  });

  const handleSave = () => {
    const updates: Partial<RequirementSubcategory> =
      type() === "required"
        ? {
            name: name(),
            type: type(),
            courseIds: courseIds()
              .map((value) => normalizeCourseGroup(value))
              .filter((value) => value),
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

  const handleTypeChange = (
    val: { value: "required" | "elective" | "free"; label: string } | null,
  ) => {
    if (!val) return;
    setType(val.value);
    if (val.value === "required") {
      setCourseIds((prev) => normalizeCourseIds(prev));
    }
  };

  const updateCourseId = (index: number, value: string, options?: { skipSuggest?: boolean }) => {
    setCourseIds((prev) => normalizeCourseIds(prev.map((id, i) => (i === index ? value : id))));
    if (!options?.skipSuggest) {
      requestSuggestions(index, extractSuggestionToken(value));
    }
  };

  const toggleSuggestionSelect = (index: number, course: Course) => {
    const currentValue = courseIds()[index] ?? "";
    const baseIds = hasActiveSearch()
      ? dropSearchToken(currentValue)
      : parseCourseGroup(currentValue);
    const currentIds = uniqueCourseIds(baseIds);
    const currentName = getGroupName(currentIds);
    if (currentName && currentName !== course.name) {
      toast.error("同じ科目名のものしか選択できません");
      return;
    }
    const nextIds = currentIds.includes(course.id)
      ? currentIds.filter((id) => id !== course.id)
      : [...currentIds, course.id];
    setRequiredCourseNames((prev) => {
      const next = new Map(prev);
      next.set(course.id, course.name);
      return next;
    });
    updateCourseId(index, formatCourseGroup(nextIds), { skipSuggest: true });
    resetSuggestionQuery();
    setHasActiveSearch(false);
  };

  const removeCourseId = (index: number) => {
    setCourseIds((prev) => normalizeCourseIds(prev.filter((_, i) => i !== index)));
  };

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
              onChange={handleTypeChange}
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
              <Label>科目番号（カンマ区切り）</Label>
              <div class="space-y-2">
                <Index each={courseIds()}>
                  {(id, index) => {
                    const isPlaceholderRow = () => index === courseIds().length - 1;
                    const isFocused = () => focusedCourseIndex() === index;
                    const groupIds = () => uniqueCourseIds(parseCourseGroup(id()));
                    const selectedIds = () => new Set(groupIds());
                    const isMissingCourse = () =>
                      groupIds().length > 0 &&
                      !isFocused() &&
                      !isPlaceholderRow() &&
                      !isCourseLookupLoading() &&
                      groupIds().some((courseId) => !requiredCourseNames().has(courseId));
                    return (
                      <div class="flex items-start gap-2">
                        <div class="flex-1 space-y-1">
                          {(() => {
                            let blurTarget: HTMLDivElement | undefined;
                            const setBlurTarget = (el: HTMLDivElement) => {
                              blurTarget = el;
                            };
                            return (
                              <div class="relative">
                                <Input
                                  classList={{
                                    "text-transparent caret-foreground": !isFocused(),
                                    "border-destructive focus-visible:ring-destructive":
                                      isMissingCourse(),
                                  }}
                                  value={id()}
                                  onInput={(e) => {
                                    setHasActiveSearch(true);
                                    updateCourseId(index, e.currentTarget.value);
                                  }}
                                  onFocus={() => {
                                    setFocusedCourseIndex(index);
                                    requestSuggestions(index, extractSuggestionToken(id()));
                                  }}
                                  onBlur={() => {
                                    if (focusedCourseIndex() === index) {
                                      setFocusedCourseIndex(null);
                                      clearSuggestions();
                                    }
                                    setHasActiveSearch(false);
                                    updateCourseId(index, normalizeCourseGroup(id()), {
                                      skipSuggest: true,
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      setFocusedCourseIndex(null);
                                      clearSuggestions();
                                      blurTarget?.focus();
                                    }
                                  }}
                                  placeholder={
                                    isPlaceholderRow() ? "科目番号を追加" : "例: FG20204"
                                  }
                                />
                                <Show when={groupIds().length > 0 && !isFocused()}>
                                  <div
                                    class={`pointer-events-none absolute inset-y-0 left-3 right-3 flex items-center text-sm truncate ${isMissingCourse() ? "text-destructive" : "text-foreground"}`}
                                  >
                                    {isMissingCourse()
                                      ? `${id()}（科目が見つかりません）`
                                      : formatCourseGroupLabel(id())}
                                  </div>
                                </Show>
                                <div
                                  ref={setBlurTarget}
                                  tabIndex={-1}
                                  class="sr-only"
                                  aria-hidden="true"
                                />
                                <Show
                                  when={
                                    isFocused() &&
                                    suggestionIndex() === index &&
                                    (isSuggestionLoading() ||
                                      courseSuggestions().length > 0 ||
                                      suggestionQuery().length >= 2)
                                  }
                                >
                                  <div class="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border bg-background shadow">
                                    <Show when={isSuggestionLoading()}>
                                      <div class="px-3 py-2 text-xs text-muted-foreground">
                                        検索中...
                                      </div>
                                    </Show>
                                    <Show
                                      when={
                                        !isSuggestionLoading() && courseSuggestions().length > 0
                                      }
                                    >
                                      <div class="divide-y">
                                        <For each={courseSuggestions()}>
                                          {(course) => (
                                            <button
                                              type="button"
                                              class="w-full px-3 py-2 text-left hover:bg-muted"
                                              classList={{
                                                "bg-muted": selectedIds().has(course.id),
                                              }}
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                toggleSuggestionSelect(index, course);
                                              }}
                                            >
                                              <div class="flex items-center justify-between">
                                                <span class="text-sm font-medium">
                                                  {course.name}
                                                </span>
                                                <span class="text-xs text-muted-foreground">
                                                  <Show when={selectedIds().has(course.id)}>
                                                    <Check class="mr-1 inline-block size-4 text-primary" />
                                                  </Show>
                                                  {course.credits}単位
                                                </span>
                                              </div>
                                              <div class="text-xs text-muted-foreground">
                                                {course.id} / {course.semester} {course.schedule}
                                              </div>
                                            </button>
                                          )}
                                        </For>
                                      </div>
                                    </Show>
                                    <Show
                                      when={
                                        !isSuggestionLoading() &&
                                        suggestionQuery().length >= 2 &&
                                        courseSuggestions().length === 0
                                      }
                                    >
                                      <div class="px-3 py-2 text-xs text-muted-foreground">
                                        該当する科目が見つかりません
                                      </div>
                                    </Show>
                                  </div>
                                </Show>
                              </div>
                            );
                          })()}
                        </div>
                        <Show when={!isPlaceholderRow()}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            class="mt-1 text-muted-foreground hover:text-foreground"
                            onClick={() => removeCourseId(index)}
                          >
                            <Trash2 class="size-4" />
                          </Button>
                        </Show>
                      </div>
                    );
                  }}
                </Index>
              </div>
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

  // 科目番号から科目名を取得
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
