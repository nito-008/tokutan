import Minus from "lucide-solid/icons/minus";
import Plus from "lucide-solid/icons/plus";
import Trash2 from "lucide-solid/icons/trash-2";
import { type Component, For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { CategoryEntry, ExcludeRules, IncludeRules, RequirementGroup } from "~/types";
import { CategoryRuleEditor } from "./RuleList/CategoryRuleEditor";
import { CourseNamesInput } from "./RuleList/CourseNamesInput";
import { PrefixInput } from "./RuleList/PrefixInput";

interface GroupEditorProps {
  group: RequirementGroup;
  onUpdate: (updates: Partial<RequirementGroup>) => void;
  onRemove: () => void;
}

export const GroupEditor: Component<GroupEditorProps> = (props) => {
  const updateIncludeField = <K extends keyof IncludeRules>(field: K, value: IncludeRules[K]) => {
    props.onUpdate({
      includeRules: { ...props.group.includeRules, [field]: value },
    });
  };

  const updateExcludeField = <K extends keyof ExcludeRules>(field: K, value: ExcludeRules[K]) => {
    const current = props.group.excludeRules ?? {};
    const updated = { ...current, [field]: value };
    const hasContent =
      (updated.courseNames && updated.courseNames.length > 0) ||
      (updated.prefixes && updated.prefixes.length > 0) ||
      (updated.categories && updated.categories.length > 0);
    props.onUpdate({ excludeRules: hasContent ? updated : undefined });
  };

  const addField = (field: string) => {
    const isExclude = field.endsWith("-exclude");
    const baseField = isExclude ? field.replace("-exclude", "") : field;

    if (baseField === "courseNames") {
      if (isExclude) {
        updateExcludeField("courseNames", [...(props.group.excludeRules?.courseNames ?? [])]);
      } else {
        updateIncludeField("courseNames", [...(props.group.includeRules.courseNames ?? [])]);
      }
    } else if (baseField === "prefixes") {
      if (isExclude) {
        updateExcludeField("prefixes", [...(props.group.excludeRules?.prefixes ?? []), ""]);
      } else {
        updateIncludeField("prefixes", [...(props.group.includeRules.prefixes ?? []), ""]);
      }
    } else if (baseField === "categories") {
      const newEntry: CategoryEntry = { majorCategory: "" };
      if (isExclude) {
        updateExcludeField("categories", [
          ...(props.group.excludeRules?.categories ?? []),
          newEntry,
        ]);
      } else {
        updateIncludeField("categories", [
          ...(props.group.includeRules.categories ?? []),
          newEntry,
        ]);
      }
    }
  };

  const removeIncludeField = (field: keyof IncludeRules) => {
    const updated = { ...props.group.includeRules };
    delete updated[field];
    props.onUpdate({ includeRules: updated });
  };

  const removeExcludeField = (field: keyof ExcludeRules) => {
    const current = props.group.excludeRules;
    if (!current) return;
    const updated = { ...current };
    delete updated[field];
    const hasContent =
      (updated.courseNames && updated.courseNames.length > 0) ||
      (updated.prefixes && updated.prefixes.length > 0) ||
      (updated.categories && updated.categories.length > 0);
    props.onUpdate({ excludeRules: hasContent ? updated : undefined });
  };

  const updateCategory = (
    categories: CategoryEntry[],
    index: number,
    updates: Partial<CategoryEntry>,
    isExclude: boolean,
  ) => {
    const newCats = [...categories];
    newCats[index] = { ...newCats[index], ...updates };
    if (isExclude) {
      updateExcludeField("categories", newCats);
    } else {
      updateIncludeField("categories", newCats);
    }
  };

  const removeCategory = (categories: CategoryEntry[], index: number, isExclude: boolean) => {
    const newCats = categories.filter((_, i) => i !== index);
    if (isExclude) {
      if (newCats.length > 0) {
        updateExcludeField("categories", newCats);
      } else {
        removeExcludeField("categories");
      }
    } else {
      if (newCats.length > 0) {
        updateIncludeField("categories", newCats);
      } else {
        removeIncludeField("categories");
      }
    }
  };

  const hasExcludeRules = () => {
    const ex = props.group.excludeRules;
    if (!ex) return false;
    return (
      (ex.courseNames && ex.courseNames.length > 0) ||
      (ex.prefixes && ex.prefixes.length > 0) ||
      (ex.categories && ex.categories.length > 0)
    );
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
      </div>

      <div class="space-y-4">
        <div class="space-y-2">
          {/* Include: courseNames */}
          <Show when={props.group.includeRules.courseNames}>
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  特定科目
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeIncludeField("courseNames")}
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
              <CourseNamesInput
                courseNames={props.group.includeRules.courseNames ?? []}
                onUpdate={(courseNames) => updateIncludeField("courseNames", courseNames)}
              />
            </div>
          </Show>

          {/* Include: prefixes */}
          <Show when={props.group.includeRules.prefixes}>
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  で始まる科目
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeIncludeField("prefixes")}
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
              <PrefixInput
                prefixes={props.group.includeRules.prefixes ?? []}
                onUpdate={(prefixes) => updateIncludeField("prefixes", prefixes)}
              />
            </div>
          </Show>

          {/* Include: categories */}
          <Show when={props.group.includeRules.categories}>
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  科目区分
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeIncludeField("categories")}
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
              <For each={props.group.includeRules.categories}>
                {(cat, index) => (
                  <div class="flex items-start gap-2">
                    <div class="flex-1">
                      <CategoryRuleEditor
                        majorCategory={cat.majorCategory}
                        middleCategory={cat.middleCategory}
                        minorCategory={cat.minorCategory}
                        onUpdate={(updates) =>
                          updateCategory(
                            props.group.includeRules.categories ?? [],
                            index(),
                            updates,
                            false,
                          )
                        }
                      />
                    </div>
                    <Show when={(props.group.includeRules.categories?.length ?? 0) > 1}>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          removeCategory(props.group.includeRules.categories ?? [], index(), false)
                        }
                      >
                        <Trash2 class="size-4" />
                      </Button>
                    </Show>
                  </div>
                )}
              </For>
              <Button
                variant="outline"
                size="sm"
                class="h-7 text-xs"
                onClick={() => addField("categories")}
              >
                <Plus class="size-3 mr-1" />
                科目区分を追加
              </Button>
            </div>
          </Show>

          {/* Exclude rules */}
          <Show when={hasExcludeRules()}>
            <div class="border-l-4 border-destructive/30 pl-3 space-y-2">
              <Label class="text-xs font-medium">除外</Label>

              {/* Exclude: courseNames */}
              <Show when={props.group.excludeRules?.courseNames}>
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                      特定科目
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeExcludeField("courseNames")}
                    >
                      <Trash2 class="size-4" />
                    </Button>
                  </div>
                  <CourseNamesInput
                    courseNames={props.group.excludeRules?.courseNames ?? []}
                    onUpdate={(courseNames) => updateExcludeField("courseNames", courseNames)}
                  />
                </div>
              </Show>

              {/* Exclude: prefixes */}
              <Show when={props.group.excludeRules?.prefixes}>
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                      で始まる科目
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeExcludeField("prefixes")}
                    >
                      <Trash2 class="size-4" />
                    </Button>
                  </div>
                  <PrefixInput
                    prefixes={props.group.excludeRules?.prefixes ?? []}
                    onUpdate={(prefixes) => updateExcludeField("prefixes", prefixes)}
                  />
                </div>
              </Show>

              {/* Exclude: categories */}
              <Show when={props.group.excludeRules?.categories}>
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                      科目区分
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeExcludeField("categories")}
                    >
                      <Trash2 class="size-4" />
                    </Button>
                  </div>
                  <For each={props.group.excludeRules?.categories}>
                    {(cat, index) => (
                      <div class="flex items-start gap-2">
                        <div class="flex-1">
                          <CategoryRuleEditor
                            majorCategory={cat.majorCategory}
                            middleCategory={cat.middleCategory}
                            minorCategory={cat.minorCategory}
                            onUpdate={(updates) =>
                              updateCategory(
                                props.group.excludeRules?.categories ?? [],
                                index(),
                                updates,
                                true,
                              )
                            }
                          />
                        </div>
                        <Show when={(props.group.excludeRules?.categories?.length ?? 0) > 1}>
                          <Button
                            variant="ghost"
                            size="sm"
                            class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              removeCategory(
                                props.group.excludeRules?.categories ?? [],
                                index(),
                                true,
                              )
                            }
                          >
                            <Trash2 class="size-4" />
                          </Button>
                        </Show>
                      </div>
                    )}
                  </For>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-7 text-xs"
                    onClick={() => addField("categories-exclude")}
                  >
                    <Plus class="size-3 mr-1" />
                    科目区分を追加
                  </Button>
                </div>
              </Show>
            </div>
          </Show>

          <div class="flex justify-between gap-2">
            <div class="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger as={Button} variant="outline" size="sm" class="h-8">
                  <Plus class="size-4 mr-1" />
                  条件を追加
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => addField("courseNames")}>
                    特定科目
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => addField("prefixes")}>
                    ～で始まる科目
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => addField("categories")}>
                    科目区分
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  as={Button}
                  variant="outline"
                  size="sm"
                  class="h-8 text-destructive hover:text-destructive"
                >
                  <Minus class="size-4 mr-1" />
                  除外条件を追加
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => addField("courseNames-exclude")}>
                    特定科目
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => addField("prefixes-exclude")}>
                    ～で始まる科目
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => addField("categories-exclude")}>
                    科目区分
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={props.onRemove}
            >
              <Trash2 class="size-4 mr-1" />
              グループを削除
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
