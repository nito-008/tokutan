import { type Component, createEffect, createSignal, For, Show } from "solid-js";
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

    const ids = getCourseIdsFromCategory(
      master,
      props.majorCategory,
      props.middleCategory,
      props.minorCategory,
    );
    setCourseCount(ids.length);
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
            value={props.majorCategory}
            onChange={(value) => {
              if (value) {
                props.onUpdate({
                  majorCategory: value,
                  middleCategory: undefined,
                  minorCategory: undefined,
                });
              }
            }}
            options={majorCategories()}
            placeholder="大項目を選択"
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
            )}
          >
            <SelectTrigger class="h-8">
              <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>

          <Show when={props.majorCategory && middleCategories().length > 0}>
            <Select
              value={props.middleCategory}
              onChange={(value) => {
                props.onUpdate({
                  middleCategory: value || undefined,
                  minorCategory: undefined,
                });
              }}
              options={["すべて", ...middleCategories()]}
              placeholder="中項目を選択"
              itemComponent={(props) => (
                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
              )}
            >
              <SelectTrigger class="h-8">
                <SelectValue<string>>{(state) => state.selectedOption() || "すべて"}</SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </Show>

          <Show when={props.majorCategory && props.middleCategory && minorCategories().length > 0}>
            <Select
              value={props.minorCategory}
              onChange={(value) => {
                props.onUpdate({
                  minorCategory: value || undefined,
                });
              }}
              options={["すべて", ...minorCategories()]}
              placeholder="小項目を選択"
              itemComponent={(props) => (
                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
              )}
            >
              <SelectTrigger class="h-8">
                <SelectValue<string>>{(state) => state.selectedOption() || "すべて"}</SelectValue>
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
