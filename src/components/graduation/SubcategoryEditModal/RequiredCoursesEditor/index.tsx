import {
  closestCenter,
  DragDropProvider,
  DragDropSensors,
  type DragEvent,
  SortableProvider,
} from "@thisbeyond/solid-dnd";
import { type Component, createEffect, For, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { Label } from "~/components/ui/label";
import type { RequirementGroup } from "~/types";
import { normalizeCourseIds } from "../utils/courseGroup";
import { CourseIdRowContent } from "./CourseIdRow/CourseIdRowContent";
import { SortableCourseIdRow } from "./CourseIdRow/SortableCourseIdRow";
import { RequiredGroupsEditor } from "./RequiredGroupsEditor";

interface RequiredCoursesEditorProps {
  groups: RequirementGroup[];
  setGroups: SetStoreFunction<RequirementGroup[]>;
}

export const RequiredCoursesEditor: Component<RequiredCoursesEditorProps> = (props) => {
  // 必修科目用のグループとルールを初期化
  createEffect(() => {
    if (props.groups.length === 0) {
      props.setGroups([
        {
          id: "required-courses",
          includeRules: [
            {
              id: "required-courses-rule",
              type: "courses",
              courseNames: [""],
            },
          ],
        },
      ]);
    } else if (
      props.groups[0] &&
      (!props.groups[0].includeRules ||
        props.groups[0].includeRules.length === 0 ||
        props.groups[0].includeRules[0]?.type !== "courses")
    ) {
      props.setGroups(0, "includeRules", [
        {
          id: "required-courses-rule",
          type: "courses",
          courseNames: [""],
        },
      ]);
    }
  });

  const courseNames = () => {
    const group = props.groups[0];
    if (!group || !group.includeRules || group.includeRules.length === 0) return [""];
    const rule = group.includeRules[0];
    if (rule?.type !== "courses") return [""];
    return rule.courseNames.length > 0 ? rule.courseNames : [""];
  };

  // ソート対象のID（プレースホルダー除外）
  const sortableIds = () => {
    const ids = courseNames();
    return ids.length > 1 ? ids.slice(0, -1) : [];
  };

  // ドラッグ終了時の並べ替え処理
  const handleDragEnd = (event: DragEvent) => {
    const { draggable, droppable } = event;
    if (!draggable || !droppable) return;
    const ids = courseNames();
    const fromIndex = ids.findIndex((id) => id === String(draggable.id));
    const toIndex = ids.findIndex((id) => id === String(droppable.id));
    if (fromIndex < 0 || toIndex < 0) return;
    if (fromIndex !== toIndex) {
      const items = [...ids];
      const sortable = items.slice(0, -1);
      const [moved] = sortable.splice(fromIndex, 1);
      sortable.splice(toIndex, 0, moved);
      const rule = props.groups[0]?.includeRules[0];
      if (rule && rule.type === "courses") {
        props.setGroups(0, "includeRules", 0, { ...rule, courseNames: [...sortable, ""] });
      }
    }
  };

  const handleUpdateCourseId = (index: number, value: string, skipNormalize = false) => {
    const updated = courseNames().map((id, i) => (i === index ? value : id));
    const normalized = skipNormalize ? updated : normalizeCourseIds(updated);
    const rule = props.groups[0]?.includeRules[0];
    if (rule && rule.type === "courses") {
      props.setGroups(0, "includeRules", 0, { ...rule, courseNames: normalized });
    }
  };

  const handleRemoveCourseId = (index: number) => {
    const filtered = courseNames().filter((_, i) => i !== index);
    const rule = props.groups[0]?.includeRules[0];
    if (rule && rule.type === "courses") {
      props.setGroups(0, "includeRules", 0, { ...rule, courseNames: normalizeCourseIds(filtered) });
    }
  };

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <Label>科目名</Label>
        <DragDropProvider collisionDetector={closestCenter} onDragEnd={handleDragEnd}>
          <DragDropSensors />
          <SortableProvider ids={sortableIds()}>
            <div class="space-y-2">
              <For each={courseNames()}>
                {(id, index) => {
                  const isPlaceholder = () => index() === courseNames().length - 1;
                  return (
                    <Show
                      when={!isPlaceholder()}
                      fallback={
                        <CourseIdRowContent
                          id={id}
                          index={index()}
                          isPlaceholder={true}
                          onUpdateCourseId={handleUpdateCourseId}
                          onRemoveCourseId={handleRemoveCourseId}
                        />
                      }
                    >
                      <SortableCourseIdRow
                        id={id}
                        index={index()}
                        sortableCount={sortableIds().length}
                        onUpdateCourseId={handleUpdateCourseId}
                        onRemoveCourseId={handleRemoveCourseId}
                      />
                    </Show>
                  );
                }}
              </For>
            </div>
          </SortableProvider>
        </DragDropProvider>
      </div>

      <RequiredGroupsEditor groups={props.groups} setGroups={props.setGroups} />
    </div>
  );
};
