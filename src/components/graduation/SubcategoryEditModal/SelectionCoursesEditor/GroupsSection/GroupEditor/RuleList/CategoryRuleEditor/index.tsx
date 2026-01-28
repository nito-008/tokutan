import { type Component, createEffect, createSignal, Show } from "solid-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  type CourseTypeMasterNode,
  getCourseIdsFromCategory,
  getCourseTypeMaster,
  getMajorCategories,
  getMiddleCategories,
  getMinorCategories,
} from "~/lib/db/courseTypeMaster";
import { getCachedKdb } from "~/lib/db/kdb";

interface CategoryRuleEditorProps {
  majorCategory: string;
  middleCategory?: string;
  minorCategory?: string;
  onUpdate: (updates: {
    majorCategory?: string;
    middleCategory?: string;
    minorCategory?: string;
  }) => void;
}

export const CategoryRuleEditor: Component<CategoryRuleEditorProps> = (props) => {
  const [masterData, setMasterData] = createSignal<CourseTypeMasterNode[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [courseCount, setCourseCount] = createSignal(0);

  createEffect(() => {
    getCourseTypeMaster()
      .then((data) => {
        setMasterData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load course type master:", error);
        setLoading(false);
      });
  });

  createEffect(() => {
    const master = masterData();
    if (master.length === 0) return;

    const categoryIds = getCourseIdsFromCategory(
      master,
      props.majorCategory,
      props.middleCategory,
      props.minorCategory,
    );

    // KDBから全科目を取得し、前方一致でマッチする科目数をカウント
    getCachedKdb().then((courses) => {
      const matchCount = courses.filter((course) =>
        categoryIds.some((id) => course.id.startsWith(id)),
      ).length;
      setCourseCount(matchCount);
    });
  });

  const majorCategories = () => {
    const master = masterData();
    if (master.length === 0) return [];
    return getMajorCategories(master);
  };

  const middleCategories = () => {
    const master = masterData();
    if (master.length === 0 || !props.majorCategory) return [];
    return getMiddleCategories(master, props.majorCategory);
  };

  const minorCategories = () => {
    const master = masterData();
    if (master.length === 0 || !props.majorCategory || !props.middleCategory) return [];
    return getMinorCategories(master, props.majorCategory, props.middleCategory);
  };

  return (
    <div class="space-y-2">
      <Show when={!loading()} fallback={<div class="text-sm text-muted-foreground">読込中...</div>}>
        <div class="flex gap-2">
          <Select
            value={props.majorCategory || "すべて"}
            onChange={(value) => {
              if (value == null) return;
              const normalizedMajor = value === "すべて" ? "" : value;
              props.onUpdate({
                majorCategory: normalizedMajor,
                middleCategory: undefined,
                minorCategory: undefined,
              });
            }}
            options={["すべて", ...majorCategories()]}
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
            )}
          >
            <SelectTrigger class="h-8">
              <SelectValue<string>>
                {(state) => {
                  const selected = state.selectedOption() as string | undefined;
                  return selected ?? "すべて";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>

          <Show when={props.majorCategory && middleCategories().length > 0}>
            <Select
              value={props.middleCategory ?? "すべて"}
              onChange={(value) => {
                const normalizedMiddle = value === "すべて" ? undefined : value || undefined;
                props.onUpdate({
                  middleCategory: normalizedMiddle,
                  minorCategory: undefined,
                });
              }}
              options={["すべて", ...middleCategories()]}
              itemComponent={(props) => (
                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
              )}
            >
              <SelectTrigger class="h-8">
                <SelectValue<string>>
                  {(state) => {
                    const selected = state.selectedOption() as string | undefined;
                    return selected ?? "すべて";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </Show>

          <Show when={props.majorCategory && props.middleCategory && minorCategories().length > 0}>
            <Select
              value={props.minorCategory ?? "すべて"}
              onChange={(value) => {
                props.onUpdate({
                  minorCategory: value === "すべて" ? undefined : value || undefined,
                });
              }}
              options={["すべて", ...minorCategories()]}
              itemComponent={(props) => (
                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
              )}
            >
              <SelectTrigger class="h-8">
                <SelectValue<string>>
                  {(state) => {
                    const selected = state.selectedOption() as string | undefined;
                    return selected ?? "すべて";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </Show>
        </div>

        <Show when={props.majorCategory}>
          <div class="text-xs text-muted-foreground">該当科目数: {courseCount()}件</div>
        </Show>
      </Show>
    </div>
  );
};
